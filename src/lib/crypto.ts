import {
  createHash,
  createHmac,
  randomBytes,
  createCipheriv,
  createDecipheriv,
} from "node:crypto";
export const token = () => randomBytes(32).toString("base64url");
export const sha256 = (s: string | Buffer) =>
  createHash("sha256").update(s).digest("hex");
export function digest(s: string) {
  const key = process.env.TOKEN_SECRET;
  if (!key || key.length < 32) throw new Error("TOKEN_SECRET não configurado.");
  return createHmac("sha256", key).update(s).digest("hex");
}
export function seal(value: unknown) {
  const key = Buffer.from(process.env.OUTBOX_ENCRYPTION_KEY || "", "hex");
  if (key.length !== 32)
    throw new Error("Chave de proteção da fila não configurada.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64");
}
export function unseal(value: string) {
  const b = Buffer.from(value, "base64");
  const c = createDecipheriv(
    "aes-256-gcm",
    Buffer.from(process.env.OUTBOX_ENCRYPTION_KEY!, "hex"),
    b.subarray(0, 12),
  );
  c.setAuthTag(b.subarray(12, 28));
  return JSON.parse(
    Buffer.concat([c.update(b.subarray(28)), c.final()]).toString(),
  );
}
export function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  return (
    "{" +
    Object.entries(value)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => JSON.stringify(k) + ":" + canonical(v))
      .join(",") +
    "}"
  );
}
