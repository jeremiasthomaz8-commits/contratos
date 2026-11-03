import { loadEnvConfig } from "@next/env";
import { pool, transaction } from "../src/lib/db";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
async function main() {
  loadEnvConfig(process.cwd());
  // Nenhum dado de teste persiste: rollback obrigatório mesmo quando os testes passam.
  const db = await pool().connect();
  try {
    await db.query("BEGIN");
    const id = randomUUID();
    const a = (
      await db.query(
        "insert into ctr_agreements(code) values($1) returning id",
        [`TEST-${id}`],
      )
    ).rows[0];
    const v = (
      await db.query(
        "insert into ctr_versions(agreement_id,number,snapshot,document_hash) values($1,1,'{}',$2) returning id",
        [a.id, "a".repeat(64)],
      )
    ).rows[0];
    await db.query(
      "update ctr_agreements set current_version=$1,status='awaiting' where id=$2",
      [v.id, a.id],
    );
    const s = (
      await db.query(
        "insert into ctr_signers(version_id,role,name,email) values($1,$2,$3,$4) returning id",
        [v.id, "contratante", "Teste em transação", "teste@example.test"],
      )
    ).rows[0];
    const i = (
      await db.query(
        "insert into ctr_invitations(signer_id,token_hash,expires_at,consumed_at) values($1,$2,now()+interval '1 day',now()) returning id",
        [s.id, id],
      )
    ).rows[0];
    await db.query(
      "insert into ctr_sessions(invitation_id,token_hash,expires_at) values($1,$2,now()+interval '1 hour')",
      [i.id, randomUUID()],
    );
    await db.query(
      "insert into ctr_signatures(version_id,signer_id,invitation_id,name,email,consent,document_hash) values($1,$2,$3,'Teste em transação','teste@example.test','Declaração de teste',$4)",
      [v.id, s.id, i.id, "a".repeat(64)],
    );
    await db.query("SAVEPOINT duplicate");
    try {
      await db.query(
        "insert into ctr_signatures(version_id,signer_id,invitation_id,name,email,consent,document_hash) values($1,$2,$3,'Teste em transação','teste@example.test','Declaração de teste',$4)",
        [v.id, s.id, i.id, "a".repeat(64)],
      );
      assert.fail("Duplicação não foi bloqueada");
    } catch (e) {
      assert.equal((e as { code: string }).code, "23505");
      await db.query("ROLLBACK TO SAVEPOINT duplicate");
    }
    const tls = await db.query(
      "select ssl,version from pg_stat_ssl where pid=pg_backend_pid()",
    );
    assert.equal(tls.rows[0].ssl, true);
    console.log(
      "Banco hospedado: TLS, permissões do runtime, trigger de assinatura e unicidade validados. Todos os dados de teste serão revertidos.",
    );
  } finally {
    await db.query("ROLLBACK");
    db.release();
    await pool().end();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
