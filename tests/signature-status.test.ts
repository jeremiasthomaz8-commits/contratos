import test from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { signatureStatusSql } from "../src/lib/signature-status";
test("status público expõe só papéis da versão atual e ignora assinaturas antigas", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create table ctr_agreements(code text,status text,current_version text);create table ctr_signers(id text,version_id text,role text);create table ctr_signatures(signer_id text,version_id text);insert into ctr_agreements values('SCALUP-JT-001','awaiting','v1');insert into ctr_signers values('s1','v1','contratante'),('s2','v1','contratado');`,
    );
    const state = async () => (await db.query(signatureStatusSql)).rows[0];
    assert.deepEqual(await state(), {
      status: "awaiting",
      released: true,
      contratante: false,
      contratado: false,
    });
    await db.exec(
      "insert into ctr_signatures values('s1','v1');update ctr_agreements set status='partial';",
    );
    assert.deepEqual(await state(), {
      status: "partial",
      released: true,
      contratante: true,
      contratado: false,
    });
    await db.exec(
      "insert into ctr_signatures values('s2','v1');update ctr_agreements set status='signed';",
    );
    assert.deepEqual(await state(), {
      status: "signed",
      released: true,
      contratante: true,
      contratado: true,
    });
    await db.exec(
      "update ctr_agreements set current_version='v2',status='awaiting';",
    );
    assert.deepEqual(await state(), {
      status: "awaiting",
      released: true,
      contratante: false,
      contratado: false,
    });
    await db.exec(
      "update ctr_agreements set current_version=null,status='draft';",
    );
    assert.deepEqual(await state(), {
      status: "draft",
      released: false,
      contratante: false,
      contratado: false,
    });
  } finally {
    await db.close();
  }
});
