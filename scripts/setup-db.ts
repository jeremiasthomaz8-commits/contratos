import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { loadEnvConfig } from "@next/env";
async function main() {
  loadEnvConfig(process.cwd());
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    await db.query(await readFile("supabase/schema.sql", "utf8"));
    await db.query(await readFile("supabase/storage.sql", "utf8"));
    await db.query("COMMIT");
    console.log("Estrutura criada.");
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  } finally {
    db.release();
    await pool.end();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
