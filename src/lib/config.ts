import { createClient } from "@supabase/supabase-js";
export function supabase(privileged = false) {
  const url = process.env.SUPABASE_URL;
  const key = privileged
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase ainda não configurado.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export const adminAllowed = (email: string) =>
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .includes(email.toLowerCase());
export function configuration() {
  return {
    database: !!process.env.DATABASE_URL,
    auth: !!(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY),
    storage: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    email: !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM),
    secrets: !!(
      process.env.TOKEN_SECRET &&
      process.env.OUTBOX_ENCRYPTION_KEY &&
      process.env.CRON_SECRET
    ),
    webhook: !!process.env.RESEND_WEBHOOK_SECRET,
  };
}
