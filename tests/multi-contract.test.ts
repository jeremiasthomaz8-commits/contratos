import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  createAgreement,
  listAgreements,
  normalizeClientLogo,
  agreementText,
} from "../src/lib/agreements";
import { release, invite } from "../src/lib/service";
import { logo } from "../src/lib/content";
import { LEGACY_CODE, settingsFor } from "../src/lib/contract-settings";
import { unseal } from "../src/lib/crypto";
import { makePdf } from "../src/lib/pdf";
const details = {
  companyName: "Cliente Novo LTDA",
  companyCnpj: "11.222.333/0001-81",
  companyAddress: "Endereço de teste",
  representative: "Pessoa de teste",
  authority: "Titular",
  contractorAddress: "Endereço prestador teste",
  startDate: "2026-11-03",
  place: "Jundiaí",
  executionDate: "2026-11-03",
  venue: "Jundiaí",
  revisions: "10 revisões por peça",
  adaptations: "Formatos acordados no briefing",
};
test("múltiplos contratos preservam marca J, destinatários, versões e isolamento", async () => {
  for (const key of [
    "DATABASE_URL",
    "SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "RESEND_API_KEY",
    "RESEND_FROM",
    "RESEND_WEBHOOK_SECRET",
    "CRON_SECRET",
  ])
    process.env[key] = "test-only";
  process.env.TOKEN_SECRET = "a".repeat(64);
  process.env.OUTBOX_ENCRYPTION_KEY = "b".repeat(64);
  process.env.APP_URL = "https://example.test";
  const db = new PGlite();
  await db.exec(await readFile("supabase/schema.sql", "utf8"));
  const query = async (sql: string, args: unknown[] = []) => {
    const r = await db.query(sql, args);
    return { ...r, rowCount: r.affectedRows ?? r.rows.length };
  };
  const adapter = { query, connect: async () => ({ query, release() {} }) };
  (globalThis as unknown as { contractPool: unknown }).contractPool = adapter;
  try {
    const before = (await query("select * from ctr_agreements")).rows;
    const clientLogo = await logo("scalup");
    assert.ok(clientLogo);
    const input = {
      title: "Contrato cliente de teste",
      clientName: "Marca Nova",
      clientEmail: "cliente@example.test",
      clientLogo,
      source: null,
    };
    const created = await createAgreement(input, "teste");
    assert.notEqual(created.code, LEGACY_CODE);
    await assert.rejects(() => release("teste", created.code));
    await query(
      "update ctr_agreements set draft=draft || $1::jsonb where code=$2",
      [JSON.stringify(details), created.code],
    );
    const version = await release("teste", created.code);
    assert.equal(version.snapshot.clientName, "Marca Nova");
    assert.equal(version.snapshot.code, created.code);
    assert.equal(version.snapshot.logos.jeremias, await logo("jeremias"));
    assert.equal(
      version.snapshot.logos.scalup,
      await normalizeClientLogo(clientLogo),
    );
    assert.ok(!version.snapshot.text.includes("SCALUP"));
    const identities = (
      await query(
        "select role,email from ctr_signers where version_id=$1 order by role",
        [version.id],
      )
    ).rows;
    assert.deepEqual(identities, [
      { role: "contratado", email: "jeremiasthomaz8@gmail.com" },
      { role: "contratante", email: "cliente@example.test" },
    ]);
    await invite("contratante", "teste", created.code);
    const mail = (await query("select * from ctr_outbox")).rows[0] as {
      recipient: string;
      payload: string;
    };
    assert.equal(mail.recipient, "cliente@example.test");
    assert.ok(unseal(mail.payload).subject.includes("Marca Nova"));
    const second = await createAgreement(
      {
        ...input,
        title: "Outro contrato",
        clientName: "Outra Marca",
        clientEmail: "outra@example.test",
      },
      "teste",
    );
    await query(
      "update ctr_agreements set draft=draft || $1::jsonb where code=$2",
      [JSON.stringify(details), second.code],
    );
    const secondVersion = await release("teste", second.code);
    assert.notEqual(secondVersion.agreement_id, version.agreement_id);
    const current = (
      await query("select * from ctr_agreements where code=$1", [created.code])
    ).rows[0] as any;
    assert.equal(current.current_version, version.id);
    const rows = await listAgreements();
    assert.equal(rows.length, 3);
    assert.equal(
      rows.find((r) => r.code === created.code).client_email,
      "cliente@example.test",
    );
    assert.deepEqual(
      (await query("select * from ctr_agreements where code=$1", [LEGACY_CODE]))
        .rows,
      before,
    );
    await query(
      "update ctr_agreements set draft=jsonb_set(draft,'{_contract,clientName}','\"Marca Alterada\"') where code=$1",
      [created.code],
    );
    const preservedRow = (
      await query("select snapshot from ctr_versions where id=$1", [version.id])
    ).rows[0] as { snapshot: { clientName: string } };
    const preserved = preservedRow.snapshot;
    assert.equal(preserved.clientName, "Marca Nova");
    const pdf = await makePdf(
      version.snapshot,
      version.number,
      version.document_hash,
      [],
    );
    assert.ok(pdf.length > 1000);
    await assert.rejects(() =>
      normalizeClientLogo("data:image/svg+xml;base64,PHN2Zz4="),
    );
    await assert.rejects(() =>
      normalizeClientLogo("data:image/png;base64,PHN2Zz4="),
    );
    await assert.rejects(() =>
      createAgreement({ ...input, clientEmail: "invalido" }, "teste"),
    );
  } finally {
    await db.close();
    delete (globalThis as unknown as { contractPool?: unknown }).contractPool;
  }
});
