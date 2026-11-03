import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { supabase, configuration, adminAllowed } from "@/lib/config";
import { query, transaction } from "@/lib/db";
import {
  Fault,
  limit,
  release,
  invite,
  challenge,
  verify,
  signedView,
  sign,
  session,
  audit,
} from "@/lib/service";
import { draftSchema, detailsSchema } from "@/lib/domain";
import { logos, contractSource } from "@/lib/content";
import { sha256 } from "@/lib/crypto";
import { makePdf } from "@/lib/pdf";
import { work } from "@/lib/worker";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 3600,
};
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const secretSchema = z
  .string()
  .min(40)
  .max(100)
  .regex(/^[A-Za-z0-9_-]+$/);
async function admin(req: NextRequest) {
  const value = req.cookies.get("admin_session")?.value;
  if (!value) throw new Fault("Entre na área administrativa.", 401);
  const { data, error } = await supabase().auth.getUser(value);
  if (error || !data.user?.email || !adminAllowed(data.user.email))
    throw new Fault("Acesso administrativo não autorizado.", 403);
  return data.user.email;
}
const signingCookie = (req: NextRequest) => {
  const value = req.cookies.get("signing_session")?.value;
  if (!value) throw new Fault("Confirme sua identidade para continuar.", 401);
  return value;
};
function origin(req: NextRequest) {
  if (
    req.headers.get("origin") !==
    new URL(process.env.APP_URL || "http://localhost:3000").origin
  )
    throw new Fault("Origem da solicitação não autorizada.", 403);
}
const ip = (req: NextRequest) =>
  process.env.TRUSTED_IP_HEADER
    ? req.headers
        .get(process.env.TRUSTED_IP_HEADER)
        ?.split(",")[0]
        .trim()
        .slice(0, 100) || null
    : null;
async function body(req: NextRequest) {
  const raw = await req.text();
  if (raw.length > 20000) throw new Fault("Solicitação muito grande.", 413);
  try {
    return JSON.parse(raw);
  } catch {
    throw new Fault("Dados inválidos.");
  }
}
function schedule() {
  after(async () => {
    try {
      await work();
    } catch {
      console.error("Fila indisponível; o agendador tentará novamente.");
    }
  });
}
async function handle(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  try {
    const path = (await ctx.params).path.join("/");
    if (path === "health" && req.method === "GET") {
      if (
        !process.env.CRON_SECRET ||
        req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
      )
        throw new Fault("Não autorizado.", 401);
      const checks = configuration();
      const [database, storage] = await Promise.allSettled([
        query("select 1"),
        Promise.resolve().then(() =>
          supabase(true).storage.getBucket("contracts"),
        ),
      ]);
      const databaseConnected = database.status === "fulfilled";
      const privateStorageAccessible =
        storage.status === "fulfilled" &&
        !storage.value.error &&
        storage.value.data?.public === false;
      const ready =
        Object.values(checks).every(Boolean) &&
        databaseConnected &&
        privateStorageAccessible;
      return json(
        {
          ready,
          configuration: checks,
          databaseConnected,
          privateStorageAccessible,
        },
        ready ? 200 : 503,
      );
    }
    if (path === "cron" && req.method === "POST") {
      if (
        !process.env.CRON_SECRET ||
        req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
      )
        throw new Fault("Não autorizado.", 401);
      return json(await work());
    }
    if (path === "webhook" && req.method === "POST") {
      if (!process.env.RESEND_WEBHOOK_SECRET)
        throw new Fault("Webhook não configurado.", 503);
      const raw = await req.text();
      if (raw.length > 100000)
        throw new Fault("Solicitação muito grande.", 413);
      let event;
      try {
        event = new Resend(process.env.RESEND_API_KEY).webhooks.verify({
          payload: raw,
          headers: {
            id: req.headers.get("svix-id") || "",
            timestamp: req.headers.get("svix-timestamp") || "",
            signature: req.headers.get("svix-signature") || "",
          },
          webhookSecret: process.env.RESEND_WEBHOOK_SECRET,
        });
      } catch {
        throw new Fault("Evento não autenticado.", 403);
      }
      await transaction(async (db) => {
        const id = req.headers.get("svix-id");
        const inserted = await db.query(
          "insert into ctr_webhooks(id,event,provider_id,delivery_status) values($1,$2,$3,$4) on conflict do nothing returning id",
          [
            id,
            event.type,
            "email_id" in event.data ? event.data.email_id : null,
            (
              {
                "email.delivered": "delivered",
                "email.bounced": "bounced",
                "email.complained": "complained",
                "email.failed": "failed",
              } as Record<string, string>
            )[event.type] || null,
          ],
        );
        if (!inserted.rowCount) return;
        const status =
          event.type === "email.delivered"
            ? "delivered"
            : event.type === "email.bounced"
              ? "bounced"
              : event.type === "email.complained"
                ? "complained"
                : event.type === "email.failed"
                  ? "failed"
                  : null;
        if (status && "email_id" in event.data)
          await db.query(
            "update ctr_outbox set status=$1 where provider_id=$2 and status not in ('bounced','complained')",
            [status, event.data.email_id],
          );
      });
      return json({ ok: true });
    }
    if (req.method === "POST") origin(req);
    if (path === "auth/login" && req.method === "POST") {
      const data = z
        .object({ email: z.email(), password: z.string().min(8).max(200) })
        .parse(await body(req));
      await limit(`login-global:${ip(req) || "global"}`, 30, 15);
      await limit(`login:${data.email.toLowerCase()}`, 8, 15);
      const result = await supabase().auth.signInWithPassword(data);
      if (
        result.error ||
        !result.data.user?.email ||
        !adminAllowed(result.data.user.email)
      )
        throw new Fault(
          "E-mail ou senha inválidos, ou acesso não autorizado.",
          401,
        );
      const response = json({ ok: true });
      response.cookies.set(
        "admin_session",
        result.data.session!.access_token,
        cookieOptions,
      );
      return response;
    }
    if (path === "auth/logout" && req.method === "POST") {
      const response = json({ ok: true });
      response.cookies.set("admin_session", "", {
        ...cookieOptions,
        maxAge: 0,
      });
      response.cookies.set("signing_session", "", {
        ...cookieOptions,
        maxAge: 0,
      });
      return response;
    }
    if (path === "admin" && req.method === "GET") {
      await admin(req);
      const a = (
        await query("select * from ctr_agreements where code=$1", [
          "SCALUP-JT-001",
        ])
      ).rows[0];
      const versions = (
        await query(
          `select v.id,v.number,v.created_at,v.document_hash,(select count(*)::int from ctr_signatures s where s.version_id=v.id) signatures from ctr_versions v where agreement_id=$1 order by number desc`,
          [a.id],
        )
      ).rows;
      const signatures = (
        await query(
          "select name,email,signed_at,version_id from ctr_signatures order by signed_at desc",
        )
      ).rows;
      const emails = (
        await query(
          "select id,recipient,status,error,created_at from ctr_outbox order by created_at desc limit 50",
        )
      ).rows;
      const jobs = (
        await query(
          "select id,status,error from ctr_jobs order by next_at desc",
        )
      ).rows;
      return json({
        agreement: a,
        versions,
        signatures,
        emails,
        jobs,
        config: configuration(),
        logos: await logos(),
      });
    }
    if (path === "admin/draft" && req.method === "POST") {
      const who = await admin(req);
      const data = draftSchema.parse(await body(req));
      await transaction(async (db) => {
        const a = (
          await db.query(
            "select * from ctr_agreements where code=$1 for update",
            ["SCALUP-JT-001"],
          )
        ).rows[0];
        await db.query(
          "update ctr_agreements set draft=$1,status=case when current_version is null then $2 else status end where id=$3",
          [
            data,
            detailsSchema.safeParse(data).success ? "ready" : "missing",
            a.id,
          ],
        );
        await audit(db, a.current_version, "rascunho_salvo", who);
      });
      return json({
        message: "Rascunho salvo. Versões já liberadas permanecem intactas.",
      });
    }
    if (path === "admin/release" && req.method === "POST") {
      const who = await admin(req);
      const v = await release(who);
      return json({
        message: `Versão ${v.number} liberada. Ambas as partes deverão assiná-la.`,
        version: v.number,
      });
    }
    if (path === "admin/invite" && req.method === "POST") {
      const who = await admin(req);
      const { role } = z
        .object({ role: z.enum(["contratante", "contratado"]) })
        .parse(await body(req));
      await limit(`invite:${who}:${role}`, 5, 60);
      const result = await invite(role, who);
      schedule();
      return json(result);
    }
    if (path === "admin/cancel" && req.method === "POST") {
      const who = await admin(req);
      await transaction(async (db) => {
        const a = (
          await db.query(
            "select * from ctr_agreements where code=$1 for update",
            ["SCALUP-JT-001"],
          )
        ).rows[0];
        if (a.status === "signed")
          throw new Fault(
            "Uma versão totalmente assinada não pode ser cancelada por este fluxo.",
          );
        await db.query(
          "update ctr_agreements set status='cancelled' where id=$1",
          [a.id],
        );
        await db.query(
          "update ctr_invitations set revoked_at=now() where signer_id in (select id from ctr_signers where version_id=$1)",
          [a.current_version],
        );
        await audit(db, a.current_version, "convites_cancelados", who);
      });
      return json({
        message: "Convites cancelados. O histórico foi preservado.",
      });
    }
    if (path === "admin/process" && req.method === "POST") {
      await admin(req);
      const result = await work();
      return json({
        message: `Fila processada: ${result.processed} item(ns).`,
      });
    }
    if (path === "admin/audit" && req.method === "GET") {
      await admin(req);
      return json(
        (
          await query(
            "select * from ctr_audit order by created_at desc limit 500",
          )
        ).rows,
      );
    }
    if (path === "admin/preview" && req.method === "GET") {
      await admin(req);
      const a = (
        await query("select draft from ctr_agreements where code=$1", [
          "SCALUP-JT-001",
        ])
      ).rows[0];
      const { renderContract } = await import("@/lib/domain");
      return json({ text: renderContract(await contractSource(), a.draft) });
    }
    if (path === "sign/challenge" && req.method === "POST") {
      const { token } = z
        .object({ token: secretSchema })
        .parse(await body(req));
      await limit(`challenge:${ip(req) || "global"}`, 30, 60);
      const result = await challenge(token);
      schedule();
      return json(result);
    }
    if (path === "sign/verify" && req.method === "POST") {
      const data = z
        .object({ token: secretSchema, code: z.string().regex(/^\d{8}$/) })
        .parse(await body(req));
      await limit(`verify:${data.token}`, 15, 15);
      const session = await verify(data.token, data.code);
      const response = json({ ok: true });
      response.cookies.set("signing_session", session, cookieOptions);
      return response;
    }
    if (path === "sign/session" && req.method === "GET")
      return json(await signedView(signingCookie(req)));
    if (path === "sign/confirm" && req.method === "POST") {
      const data = z
        .object({
          consent: z.literal(true),
          hash: z.string().regex(/^[a-f0-9]{64}$/),
        })
        .parse(await body(req));
      const result = await sign(
        signingCookie(req),
        data.consent,
        data.hash,
        ip(req),
        req.headers.get("user-agent") || "",
      );
      schedule();
      return json({ id: result.id, signedAt: result.signed_at });
    }
    if (path === "document" && req.method === "GET") {
      let versionId: string;
      if (req.nextUrl.searchParams.get("version")) {
        await admin(req);
        versionId = z.uuid().parse(req.nextUrl.searchParams.get("version"));
      } else {
        const credential = signingCookie(req);
        versionId = await transaction(
          async (db) => (await session(db, credential)).version_id,
        );
      }
      const v = (
        await query("select * from ctr_versions where id=$1", [versionId])
      ).rows[0];
      if (!v) throw new Fault("Versão não encontrada.", 404);
      if (req.nextUrl.searchParams.get("format") === "evidence") {
        const evidence = (
          await query(
            "select id,name,email,consent,document_hash,method,signed_at from ctr_signatures where version_id=$1",
            [versionId],
          )
        ).rows;
        return json({
          agreement: "SCALUP-JT-001",
          version: v.number,
          hash: v.document_hash,
          snapshot: v.snapshot,
          evidence,
        });
      }
      if (req.nextUrl.searchParams.get("draft") === "1") {
        const pdf = await makePdf(v.snapshot, v.number, v.document_hash, []);
        return new NextResponse(new Uint8Array(pdf), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition":
              'attachment; filename="contrato-para-revisao.pdf"',
            "Cache-Control": "no-store",
          },
        });
      }
      const file = (
        await query("select * from ctr_files where version_id=$1", [versionId])
      ).rows[0];
      if (!file)
        throw new Fault(
          "O PDF final ainda está sendo preparado. Tente novamente em instantes.",
          409,
        );
      const { data, error } = await supabase(true)
        .storage.from("contracts")
        .download(file.path);
      if (error || !data)
        throw new Fault("Não foi possível acessar o PDF agora.", 503);
      const bytes = new Uint8Array(await data.arrayBuffer());
      if (sha256(Buffer.from(bytes)) !== file.sha256)
        throw new Fault(
          "A integridade do arquivo não pôde ser confirmada.",
          503,
        );
      return new NextResponse(bytes, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="contrato-assinado.pdf"',
          "Cache-Control": "no-store",
        },
      });
    }
    throw new Fault("Recurso não encontrado.", 404);
  } catch (e) {
    if (e instanceof z.ZodError)
      return json(
        {
          error: "Confira os dados informados.",
          fields: e.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
        400,
      );
    if (e instanceof Fault) return json({ error: e.message }, e.status);
    console.error(
      "Operação não concluída:",
      e instanceof Error ? e.name : "Erro",
    );
    return json(
      {
        error:
          "Serviço indisponível. A operação não foi confirmada. Verifique a configuração ou tente novamente.",
      },
      503,
    );
  }
}
export const GET = handle;
export const POST = handle;
