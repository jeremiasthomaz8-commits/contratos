import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { query, transaction } from "./db";
import { emptyDetails, draftSchema, renderContract } from "./domain";
import { contractSource, logo } from "./content";
import {
  ContractRow,
  settingsSchema,
  settingsFor,
  LEGACY_CODE,
} from "./contract-settings";
export async function normalizeClientLogo(value: string | null) {
  if (!value) return null;
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(
    value,
  );
  if (!match) throw new Error("Use um logo PNG, JPG ou WebP.");
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > 1000000) throw new Error("O logo deve ter até 1 MB.");
  const image = sharp(bytes, { limitInputPixels: 16000000, animated: false });
  const meta = await image.metadata();
  if (!["png", "jpeg", "webp"].includes(meta.format || ""))
    throw new Error("Imagem inválida.");
  const output = await image
    .rotate()
    .resize({
      width: 800,
      height: 800,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();
  if (output.length > 1000000)
    throw new Error("Use um logo com dimensões menores.");
  return "data:image/png;base64," + output.toString("base64");
}
export async function agreementLogos(a: ContractRow) {
  const settings = settingsFor(a);
  return {
    scalup:
      settings.clientLogo ||
      (a.code === LEGACY_CODE ? await logo("scalup") : null),
    jeremias: await logo("jeremias"),
  };
}
export async function agreementText(a: ContractRow) {
  const settings = settingsFor(a);
  return renderContract(
    settings.source || (await contractSource()),
    draftSchema.parse(a.draft),
    settings.clientName,
  );
}
export async function createAgreement(input: unknown, actor: string) {
  const settings = settingsSchema.parse(input);
  settings.clientLogo = await normalizeClientLogo(settings.clientLogo);
  const code = "JT-" + randomUUID().slice(0, 8).toUpperCase();
  return transaction(async (db) => {
    const provider = (
      await db.query(
        "select draft->>'contractorAddress' as address from ctr_agreements where code=$1",
        [LEGACY_CODE],
      )
    ).rows[0];
    const draft = {
      ...emptyDetails,
      contractorAddress: provider?.address || "",
      _contract: settings,
    };
    await db.query("insert into ctr_agreements(code,draft) values($1,$2)", [
      code,
      draft,
    ]);
    await db.query(
      "insert into ctr_audit(event,actor,details) values('contrato_criado',$1,$2)",
      [actor, { agreement: code }],
    );
    return { code };
  });
}
export async function listAgreements() {
  return (
    await query(`select a.code,a.status,a.current_version,a.created_at,
 coalesce(a.draft->'_contract'->>'title','Design e edição de vídeos') as title,
 coalesce(a.draft->'_contract'->>'clientName',case when a.code='SCALUP-JT-001' then 'SCALUP' else a.draft->>'companyName' end,'Cliente') as client_name,
 coalesce(a.draft->'_contract'->>'clientEmail','contato@scalupagencia.com') as client_email,
 (a.draft->'_contract'->>'clientLogo' is not null or a.code='SCALUP-JT-001') as has_logo,
 (select count(*)::int from ctr_signatures where version_id=a.current_version) as signatures
 from ctr_agreements a order by a.created_at desc`)
  ).rows;
}
