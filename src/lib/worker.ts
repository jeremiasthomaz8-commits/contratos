import { Resend } from "resend";
import { transaction, query } from "./db";
import { unseal, sha256, token, digest } from "./crypto";
import { supabase } from "./config";
import { makePdf } from "./pdf";
import { audit, queueEmail } from "./service";
export async function work() {
  let processed = 0;
  // SKIP LOCKED impede dois workers de processarem o mesmo item simultaneamente.
  for (let n = 0; n < 5; n++)
    await transaction(async (db) => {
      const job = (
        await db.query(
          "select * from ctr_jobs where status in ('pending','retry') and next_at<=now() order by next_at limit 1 for update skip locked",
        )
      ).rows[0];
      if (!job) return;
      try {
        const v = (
          await db.query("select * from ctr_versions where id=$1", [
            job.version_id,
          ])
        ).rows[0];
        const signatures = (
          await db.query(
            "select * from ctr_signatures where version_id=$1 order by signed_at",
            [v.id],
          )
        ).rows;
        if (signatures.length !== 2)
          throw new Error("As duas assinaturas são necessárias.");
        const storage = supabase(true).storage.from("contracts");
        const path = `${v.id}/contrato-assinado.pdf`;
        let pdf: Buffer;
        const existing = await storage.download(path);
        if (existing.data) pdf = Buffer.from(await existing.data.arrayBuffer());
        else {
          pdf = await makePdf(
            v.snapshot,
            v.number,
            v.document_hash,
            signatures,
          );
          const upload = await storage.upload(path, pdf, {
            contentType: "application/pdf",
            upsert: false,
          });
          if (upload.error) throw upload.error;
        }
        await db.query(
          "insert into ctr_files(version_id,path,sha256) values($1,$2,$3) on conflict(version_id) do nothing",
          [v.id, path, sha256(pdf)],
        );
        // Links finais também exigem um novo código no e-mail registrado.
        for (const signer of (
          await db.query("select * from ctr_signers where version_id=$1", [
            v.id,
          ])
        ).rows) {
          const t = token();
          await db.query(
            "insert into ctr_invitations(signer_id,token_hash,expires_at) values($1,$2,now()+interval '7 days')",
            [signer.id, digest(t)],
          );
          await queueEmail(
            db,
            v.id,
            `final:${v.id}:${signer.id}`,
            signer.email,
            `Contrato finalizado — ${v.snapshot.clientName || "SCALUP"} × Jeremias Thomaz`,
            `Olá!\n\nO contrato ${v.snapshot.title || "de prestação de serviços"} foi assinado por ambas as partes.\nAs assinaturas eletrônicas foram registradas com sucesso.\nO contrato finalizado está disponível para consulta e download por meio do link seguro abaixo (válido por 7 dias, com verificação de e-mail):\n\n${process.env.APP_URL}/assinar#convite=${t}\n\nAgradecemos pela parceria!\nAtenciosamente,\nSistema de Contratos`,
          );
        }
        await db.query(
          "update ctr_jobs set status='done',error=null where id=$1",
          [job.id],
        );
        await audit(db, v.id, "pdf_preservado", "sistema", {
          path,
          sha256: sha256(pdf),
        });
        processed++;
      } catch {
        await db.query(
          "update ctr_jobs set status=case when attempts>=4 then 'failed' else 'retry' end,attempts=attempts+1,next_at=now()+interval '5 minutes',error='Falha ao gerar ou armazenar o PDF. Verifique as credenciais e o armazenamento.' where id=$1",
          [job.id],
        );
      }
    });
  for (let n = 0; n < 10; n++)
    await transaction(async (db) => {
      const mail = (
        await db.query(
          "select * from ctr_outbox where status in ('pending','retry') and next_at<=now() order by created_at limit 1 for update skip locked",
        )
      ).rows[0];
      if (!mail) return;
      if (
        mail.dedupe_key.startsWith("code:") &&
        Date.now() - new Date(mail.created_at).getTime() > 10 * 60_000
      ) {
        await db.query(
          "update ctr_outbox set status='expired',error='Código expirado antes do envio. Solicite outro código.' where id=$1",
          [mail.id],
        );
        return;
      }
      // O Resend mantém a idempotência por 24h; não repetir automaticamente fora dessa janela.
      if (Date.now() - new Date(mail.created_at).getTime() > 23 * 3600_000) {
        await db.query(
          "update ctr_outbox set status='review',error='Janela de idempotência encerrada. Verifique o provedor antes de reenviar.' where id=$1",
          [mail.id],
        );
        return;
      }
      try {
        if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM)
          throw new Error("E-mail não configurado.");
        const payload = unseal(mail.payload);
        const result = await new Resend(process.env.RESEND_API_KEY).emails.send(
          {
            from: process.env.RESEND_FROM,
            to: mail.recipient,
            subject: payload.subject,
            text: payload.text,
          },
          { idempotencyKey: mail.dedupe_key },
        );
        if (result.error || !result.data) throw new Error("Falha do provedor.");
        await db.query(
          "update ctr_outbox set status='sent',provider_id=$1,sent_at=now(),error=null where id=$2",
          [result.data.id, mail.id],
        );
        processed++;
      } catch {
        await db.query(
          "update ctr_outbox set status=case when attempts>=4 then 'failed' else 'retry' end,attempts=attempts+1,next_at=now()+interval '1 minute' * power(2,least(attempts,6)),error='O provedor não confirmou o envio. Nova tentativa programada quando aplicável.' where id=$1",
          [mail.id],
        );
      }
    });
  // Reconcilia eventos que chegaram antes do commit da resposta do provedor.
  await query(`update ctr_outbox m set status=e.delivery_status from
    (select distinct on (provider_id) provider_id,delivery_status from ctr_webhooks
     where provider_id is not null and delivery_status is not null
     order by provider_id, case delivery_status when 'complained' then 4 when 'bounced' then 3 when 'delivered' then 2 else 1 end desc,created_at desc) e
    where m.provider_id=e.provider_id and m.status not in ('bounced','complained')`);
  return { processed };
}
