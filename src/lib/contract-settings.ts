import { z } from "zod";
export const LEGACY_CODE = "SCALUP-JT-001";
export const providerEmail = "jeremiasthomaz8@gmail.com";
export const settingsSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    clientName: z.string().trim().min(2).max(120),
    clientEmail: z
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    clientLogo: z.string().max(1500000).nullable().default(null),
    source: z.string().min(50).max(60000).nullable().default(null),
  })
  .strict();
export type ContractSettings = z.infer<typeof settingsSchema>;
export type ContractRow = {
  code: string;
  status: string;
  current_version: string | null;
  draft: Record<string, unknown>;
  id: string;
};
export function settingsFor(
  a: Pick<ContractRow, "code" | "draft">,
): ContractSettings {
  if (a.draft._contract) return settingsSchema.parse(a.draft._contract);
  if (a.code !== LEGACY_CODE)
    throw new Error("Configuração do contrato ausente.");
  return {
    title: "Design e edição de vídeos",
    clientName: "SCALUP",
    clientEmail: "contato@scalupagencia.com",
    clientLogo: null,
    source: null,
  };
}
