import { Pool, PoolClient } from "pg";
const globalDb = globalThis as unknown as { contractPool?: Pool };
export function pool() {
  if (!process.env.DATABASE_URL)
    throw new Error("Banco de dados ainda não configurado.");
  return (globalDb.contractPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 10000,
  }));
}
export async function transaction<T>(fn: (db: PoolClient) => Promise<T>) {
  const db = await pool().connect();
  try {
    await db.query("BEGIN");
    const result = await fn(db);
    await db.query("COMMIT");
    return result;
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  } finally {
    db.release();
  }
}
export async function query(sql: string, args: unknown[] = []) {
  return pool().query(sql, args);
}
