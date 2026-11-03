import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  detailsSchema,
  emptyDetails,
  renderContract,
  CONSENT,
} from "../src/lib/domain";
import { canonical, digest, sha256, seal, unseal } from "../src/lib/crypto";
import { sign, verify, challenge, signedView } from "../src/lib/service";
import { work } from "../src/lib/worker";
import { makePdf } from "../src/lib/pdf";
process.env.TOKEN_SECRET = "a".repeat(64);
process.env.OUTBOX_ENCRYPTION_KEY = "b".repeat(64);
process.env.DATABASE_URL = "test-only";
process.env.RESEND_API_KEY = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";
const details = {
  companyName: "Empresa de teste LTDA",
  companyCnpj: "11.222.333/0001-81",
  companyAddress: "Endereço exclusivamente de teste",
  representative: "Representante de teste",
  authority: "Administrador",
  contractorAddress: "Endereço exclusivamente de teste",
  startDate: "2026-11-03",
  place: "Jundiaí",
  executionDate: "2026-11-03",
  venue: "Jundiaí",
  revisions: "Limite definido exclusivamente para teste",
  adaptations: "Formatos definidos exclusivamente para teste",
};
test("validação bloqueia campos ausentes, CNPJ incorreto e datas impossíveis", () => {
  assert.equal(detailsSchema.safeParse(emptyDetails).success, false);
  assert.equal(
    detailsSchema.safeParse({ ...details, companyCnpj: "00.000.000/0000-00" })
      .success,
    false,
  );
  assert.equal(
    detailsSchema.safeParse({ ...details, startDate: "2026-02-31" }).success,
    false,
  );
  assert.equal(detailsSchema.safeParse(details).success, true);
  assert.equal(
    detailsSchema.safeParse({ ...details, companyCnpj: "00.000.000/E08G-12" })
      .success,
    true,
  );
});
test("fonte oficial e todas as subcláusulas são preservadas", async () => {
  const brief = await readFile("content/brief.md", "utf8");
  const source = await readFile("content/contract.md", "utf8");
  assert.equal(
    source.trim(),
    brief
      .slice(brief.indexOf("# CONTRATO DE PRESTAÇÃO"), brief.indexOf("# 21."))
      .replace(/\r\n/g, "\n")
      .trim(),
  );
  assert.equal((source.match(/^## CLÁUSULA /gm) || []).length, 11);
  const rendered = renderContract(source, details);
  for (const match of source.matchAll(/\*\*(\d+\.\d+\.)\*\*/g))
    assert.ok(rendered.includes(match[0]));
  assert.ok(rendered.includes("**R$ 400,00 (quatrocentos reais)**"));
  assert.ok(rendered.includes("**30 (trinta) dias**"));
  assert.equal(rendered.includes("____________________"), true); // Linhas de assinatura continuam no texto original.
});
test("hash canônico independe da ordem JSON; fila autenticada detecta adulteração", () => {
  assert.equal(
    sha256(canonical({ b: 2, a: { z: 1, c: 3 } })),
    sha256(canonical({ a: { c: 3, z: 1 }, b: 2 })),
  );
  const s = seal({ code: "12345678" });
  assert.deepEqual(unseal(s), { code: "12345678" });
  const bad = Buffer.from(s, "base64");
  bad[30] ^= 1;
  assert.throws(() => unseal(bad.toString("base64")));
});
test("fluxo real de serviço em PostgreSQL embutido: verificação, replay, concorrência, assinatura e imutabilidade", async () => {
  const db = new PGlite();
  await db.exec(await readFile("supabase/schema.sql", "utf8"));
  let lock = Promise.resolve();
  const adapt = {
    query: async (sql: string, args: unknown[] = []) => {
      const r = await db.query(sql, args);
      return { ...r, rowCount: r.affectedRows ?? r.rows.length };
    },
    connect: async () => {
      const previous = lock;
      let unlock!: () => void;
      lock = new Promise<void>((r) => {
        unlock = r;
      });
      await previous;
      return { query: adapt.query, release: unlock };
    },
  };
  (globalThis as unknown as { contractPool: unknown }).contractPool = adapt;
  const q = adapt.query;
  const source = await readFile("content/contract.md", "utf8");
  const snapshot = {
    text: renderContract(source, details),
    details,
    logos: { scalup: null, jeremias: null },
    releasedAt: new Date().toISOString(),
  };
  const hash = sha256(canonical(snapshot));
  const a = (await q("select id from ctr_agreements")).rows[0] as {
    id: string;
  };
  const v = (
    await q(
      "insert into ctr_versions(agreement_id,number,snapshot,document_hash) values($1,1,$2,$3) returning id",
      [a.id, JSON.stringify(snapshot), hash],
    )
  ).rows[0] as { id: string };
  await q("update ctr_agreements set current_version=$1,status='awaiting'", [
    v.id,
  ]);
  const signerSessions: string[] = [];
  for (const [index, role] of ["contratante", "contratado"].entries()) {
    const s = (
      await q(
        "insert into ctr_signers(version_id,role,name,email) values($1,$2,$3,$4) returning id",
        [v.id, role, `Pessoa de teste ${index}`, `pessoa${index}@example.test`],
      )
    ).rows[0] as { id: string };
    const t = "test-invite-" + index;
    const inv = (
      await q(
        "insert into ctr_invitations(signer_id,token_hash,expires_at) values($1,$2,now()+interval '1 day') returning id",
        [s.id, digest(t)],
      )
    ).rows[0] as { id: string };
    if (index === 0) {
      const expired = "expired-invite";
      await q(
        "insert into ctr_invitations(signer_id,token_hash,expires_at) values($1,$2,now()-interval '1 minute')",
        [s.id, digest(expired)],
      );
      await assert.rejects(() => challenge(expired), /Convite inválido/);
      const locked = "locked-invite";
      await q(
        "insert into ctr_invitations(signer_id,token_hash,expires_at) values($1,$2,now()+interval '1 day')",
        [s.id, digest(locked)],
      );
      await challenge(locked);
      for (let n = 0; n < 5; n++)
        await assert.rejects(
          () => verify(locked, "00000000"),
          /Código inválido/,
        );
      await assert.rejects(() => verify(locked, "12345678"), /Código inválido/);
      await q("update ctr_outbox set status='expired'");
      await challenge(t);
      await assert.rejects(() => challenge(t), /Aguarde/);
      const mail = (
        await q(
          "select payload from ctr_outbox where status='pending' order by created_at desc limit 1",
        )
      ).rows[0] as { payload: string };
      const code = unseal(mail.payload).text.match(/\d{8}/)[0];
      await assert.rejects(() => verify(t, "00000000"), /Código inválido/);
      assert.equal(
        (
          (
            await q(
              "select attempts from ctr_challenges order by created_at desc limit 1",
            )
          ).rows[0] as { attempts: number }
        ).attempts,
        1,
      );
      const ses = await verify(t, code);
      signerSessions.push(ses);
      await assert.rejects(() => verify(t, code), /Convite inválido/);
      await assert.rejects(() => challenge(t), /Convite inválido/);
    } else {
      await q("update ctr_invitations set consumed_at=now() where id=$1", [
        inv.id,
      ]);
      const ses = "second-verified-session";
      await q(
        "insert into ctr_sessions(invitation_id,token_hash,expires_at) values($1,$2,now()+interval '1 hour')",
        [inv.id, digest(ses)],
      );
      signerSessions.push(ses);
    }
  }
  await assert.rejects(
    () => sign("unauthorized", true, hash, null, "Teste"),
    /Sessão/,
  );
  await assert.rejects(
    () => sign(signerSessions[0], false, hash, null, "Teste"),
    /concordância/,
  );
  await assert.rejects(
    () => sign(signerSessions[0], true, "a".repeat(64), null, "Teste"),
    /versão revisada/,
  );
  const results = await Promise.all([
    sign(signerSessions[0], true, hash, null, "Teste"),
    sign(signerSessions[0], true, hash, null, "Teste"),
    sign(signerSessions[1], true, hash, null, "Teste"),
  ]);
  assert.equal(results[0].id, results[1].id);
  assert.equal((await q("select * from ctr_signatures")).rows.length, 2);
  assert.equal((await q("select * from ctr_jobs")).rows.length, 1);
  assert.equal(
    (
      (await q("select status from ctr_agreements")).rows[0] as {
        status: string;
      }
    ).status,
    "signed",
  );
  assert.equal(
    (await q("select * from ctr_outbox where dedupe_key like 'signature:%'"))
      .rows.length,
    2,
  );
  assert.equal((await signedView(signerSessions[0])).signatures.length, 2);
  await assert.rejects(
    () => q("update ctr_versions set snapshot='{}'"),
    /imutável/,
  );
  await assert.rejects(() => q("delete from ctr_signatures"), /imutável/);
  await assert.rejects(
    () => q("update ctr_signers set name='Outra pessoa'"),
    /imutável/,
  );
  await assert.rejects(() => q("delete from ctr_audit"), /imutável/);
  await work();
  assert.equal(
    ((await q("select status from ctr_jobs")).rows[0] as { status: string })
      .status,
    "retry",
  );
  assert.ok(
    (await q("select * from ctr_outbox where status='retry'")).rows.length > 0,
  );
  const emailRow = (
    await q("select id from ctr_outbox where status='retry' limit 1")
  ).rows[0] as { id: string };
  await q(
    "insert into ctr_webhooks(id,event,provider_id,delivery_status) values('early-event','email.delivered','provider-before-commit','delivered')",
  );
  await q(
    "update ctr_outbox set provider_id='provider-before-commit',status='sent' where id=$1",
    [emailRow.id],
  );
  await work();
  assert.equal(
    (
      (await q("select status from ctr_outbox where id=$1", [emailRow.id]))
        .rows[0] as { status: string }
    ).status,
    "delivered",
  );
  const signatures = (await q("select * from ctr_signatures")).rows;
  const pdf = await makePdf(
    snapshot,
    1,
    hash,
    signatures as Parameters<typeof makePdf>[3],
  );
  await mkdir("test-results", { recursive: true });
  await writeFile("test-results/contrato-teste.pdf", pdf);
  assert.ok(pdf.byteLength > 10000);
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const parsed = await pdfjs.getDocument({
    data: new Uint8Array(pdf),
    useSystemFonts: true,
  }).promise;
  let extracted = "";
  for (let i = 1; i <= parsed.numPages; i++) {
    const page = await parsed.getPage(i);
    extracted += (await page.getTextContent()).items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
  }
  for (let i = 1; i <= 11; i++) assert.ok(extracted.includes(`CLÁUSULA ${i} `));
  assert.ok(extracted.includes(CONSENT.slice(0, 30)));
  assert.ok(extracted.includes(hash));
  await q("update ctr_sessions set expires_at=now()-interval '1 minute'");
  await assert.rejects(() => signedView(signerSessions[0]), /Sessão/);
  await q("update ctr_agreements set status='cancelled'");
  await assert.rejects(() => signedView(signerSessions[0]), /Sessão/);
  await db.close();
  delete (globalThis as unknown as { contractPool?: unknown }).contractPool;
});
