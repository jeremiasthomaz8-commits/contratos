import { z } from "zod";
import knownDetails from "../../content/known-details.json";
export const CONSENT =
  "Declaro que li, compreendi e concordo com os termos deste contrato e autorizo a utilização da assinatura eletrônica para sua formalização.";
export const parties = [
  { role: "contratante", name: "SCALUP", email: "contato@scalupagencia.com" },
  {
    role: "contratado",
    name: "Jeremias Thomaz",
    email: "jeremiasthomaz8@gmail.com",
  },
] as const;
export const fields = [
  ["companyName", "Razão social da SCALUP"],
  ["companyCnpj", "CNPJ da SCALUP"],
  ["companyAddress", "Endereço completo da SCALUP"],
  ["representative", "Representante legal da SCALUP"],
  ["authority", "Cargo ou poderes de representação"],
  ["contractorAddress", "Endereço completo do contratado"],
  ["startDate", "Data de início"],
  ["place", "Local de assinatura"],
  ["executionDate", "Data de celebração"],
  ["venue", "Foro (sujeito à revisão jurídica)"],
  ["revisions", "Limites de revisões acordados"],
  ["adaptations", "Quantidade e formatos dos desdobramentos"],
] as const;
export type Details = Record<(typeof fields)[number][0], string>;
export const emptyDetails = Object.fromEntries(
  fields.map(([k]) => [k, ""]),
) as Details;
export const defaultDetails: Details = { ...emptyDetails, ...knownDetails };
export function validCnpj(value: string) {
  // Receita Federal: DV alfanumérico usa código ASCII menos 48.
  // https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/documentos-tecnicos/cnpj
  const n = value.replace(/[.\/\-\s]/g, "").toUpperCase();
  if (!/^[A-Z0-9]{12}[0-9]{2}$/.test(n) || /^(\d)\1+$/.test(n)) return false;
  const digit = (s: string) => {
    let sum = 0;
    let w = s.length - 7;
    for (const c of s) {
      sum += (c.charCodeAt(0) - 48) * w--;
      if (w < 2) w = 9;
    }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return (
    digit(n.slice(0, 12)) === Number(n[12]) &&
    digit(n.slice(0, 13)) === Number(n[13])
  );
}
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.")
  .refine((v) => {
    const d = new Date(v);
    return !isNaN(+d) && d.toISOString().slice(0, 10) === v;
  }, "Data inválida.");
const text = z.string().trim().min(2, "Preencha este campo.").max(1000);
export const detailsSchema = z
  .object({
    companyName: text,
    companyCnpj: z.string().refine(validCnpj, "CNPJ inválido."),
    companyAddress: text,
    representative: text,
    authority: text,
    contractorAddress: text,
    startDate: date,
    place: text,
    executionDate: date,
    venue: text,
    revisions: text,
    adaptations: text,
  })
  .strict();
export const draftSchema = z.object(
  Object.fromEntries(fields.map(([k]) => [k, z.string().max(1000)])),
) as unknown as z.ZodType<Details>;
export const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  missing: "Aguardando informações",
  ready: "Pronto para assinatura",
  awaiting: "Aguardando assinaturas",
  partial: "Parcialmente assinado",
  signed: "Totalmente assinado",
  cancelled: "Cancelado",
  superseded: "Substituído por nova versão",
};
export type Snapshot = {
  text: string;
  details: Details;
  logos: { scalup: string | null; jeremias: string | null };
  releasedAt: string;
};
export function renderContract(source: string, d: Details) {
  const safe = (v: string) =>
    (v || "").replace(/[\r\n*#`_<>\[\]\\]/g, " ").trim();
  const day = (v: string) => v.split("-").reverse().join("/");
  // A fonte original fica arquivada; a versão atual usa apenas o fluxo eletrônico.
  let result = source.split(/\n---\s*\n\*\*CONTRATANTE\*\*/)[0].trim();
  const replaceIf = (value: string, from: string, to: string) => {
    if (value) result = result.replace(from, to);
  };
  replaceIf(
    d.companyName,
    "SCALUP, pessoa jurídica",
    safe(d.companyName) + " (SCALUP), pessoa jurídica",
  );
  replaceIf(
    d.companyCnpj,
    "CNPJ sob nº ____________________",
    "CNPJ sob nº " + safe(d.companyCnpj),
  );
  replaceIf(
    d.companyAddress,
    "com sede em ____________________",
    "com sede em " + safe(d.companyAddress),
  );
  replaceIf(
    d.representative,
    "representada por ____________________",
    "representada por " +
      safe(d.representative) +
      (d.authority ? ", " + safe(d.authority) : ""),
  );
  replaceIf(
    d.contractorAddress,
    "endereço completo ____________________",
    "endereço completo " + safe(d.contractorAddress),
  );
  replaceIf(d.startDate, "__/__/________", day(d.startDate));
  replaceIf(
    d.venue,
    "comarca de ____________________",
    "comarca de " + safe(d.venue),
  );
  if (d.place && d.executionDate)
    result = result.replace(
      "**Local e data:** ____________________________________",
      "**Local e data:** " + safe(d.place) + ", " + day(d.executionDate),
    );
  const scope = [];
  if (d.revisions)
    scope.push("**Revisões (cláusula 5.4):** " + safe(d.revisions));
  if (d.adaptations)
    scope.push("**Desdobramentos (cláusula 2.4):** " + safe(d.adaptations));
  if (scope.length)
    result +=
      "\n\n## ALINHAMENTOS COMPLEMENTARES DO ESCOPO\n\n" +
      scope.join("\n\n") +
      "\n";
  return result;
}
