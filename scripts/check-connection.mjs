import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { Pool } from "pg";
loadEnvConfig(process.cwd());
const db = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  const r = await db.query(
    "select current_user, count(*)::int as agreements from ctr_agreements group by current_user",
  );
  console.log(r.rows);
  const permissions = await db.query(
    "select has_table_privilege(current_user,'public.ctr_signatures','UPDATE') as can_edit_signature, has_table_privilege(current_user,'public.ctr_versions','DELETE') as can_delete_version, has_schema_privilege(current_user,'public','CREATE') as can_create_tables",
  );
  console.log(permissions.rows);
} finally {
  await db.end();
}
