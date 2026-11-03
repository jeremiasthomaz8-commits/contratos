import { PoolClient } from "pg";
import { randomInt } from "node:crypto";
import { transaction, query } from "./db";
import { digest, token, seal, sha256, canonical } from "./crypto";
import { CONSENT, detailsSchema, draftSchema, Snapshot } from "./domain";
import { agreementLogos, agreementText } from "./agreements";
import { LEGACY_CODE, providerEmail, settingsFor } from "./contract-settings";
import { configuration } from "./config";
export class Fault extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export async function audit(
  db: PoolClient,
  version: string | null,
  event: string,
  actor: string,
  details: unknown = {},
) {
  await db.query(
    "insert into ctr_audit(version_id,event,actor,details) values($1,$2,$3,$4)",
    [version, event, actor, details],
  );
}
export async function queueEmail(
  db: PoolClient,
  version: string,
  key: string,
  to: string,
  subject: string,
  text: string,
) {
  await db.query(
    "insert into ctr_outbox(version_id,dedupe_key,recipient,payload) values($1,$2,$3,$4) on conflict(dedupe_key) do nothing",
    [version, key, to, seal({ subject, text })],
  );
}
export async function limit(key: string, max = 10, minutes = 10) {
  const r = await query(
    `insert into ctr_limits(key,count,expires_at) values($1,1,now()+($2||' minutes')::interval) on conflict(key) do update set count=case when ctr_limits.expires_at<now() then 1 else ctr_limits.count+1 end, expires_at=case when ctr_limits.expires_at<now() then excluded.expires_at else ctr_limits.expires_at end returning count`,
    [digest(key), minutes],
  );
  if (r.rows[0].count > max)
    throw new Fault(
      "Muitas tentativas. Aguarde antes de tentar novamente.",
      429,
    );
}
export async function release(actor: string, code = LEGACY_CODE) {
  if (Object.values(configuration()).some((v) => !v))
    throw new Fault(
      "Configure banco, autenticação, armazenamento, e-mail, webhook e segredos antes da liberação.",
      503,
    );
  return transaction(async (db) => {
    const a = (
      await db.query("select * from ctr_agreements where code=$1 for update", [
        code,
      ])
    ).rows[0];
    if (!a) throw new Fault("Contrato não encontrado.", 404);
    const settings = settingsFor(a);
    const images = await agreementLogos(a);
    if (!images.scalup || !images.jeremias)
      throw new Fault(
        "Adicione o logo do cliente antes de liberar o contrato.",
      );
    const d = detailsSchema.parse(draftSchema.parse(a.draft));
    const snap: Snapshot = {
      code: a.code,
      title: settings.title,
      clientName: settings.clientName,
      text: await agreementText(a),
      details: d,
      logos: images,
      releasedAt: new Date().toISOString(),
    };
    const hash = sha256(canonical(snap));
    const n = (
      await db.query(
        "select coalesce(max(number),0)+1 n from ctr_versions where agreement_id=$1",
        [a.id],
      )
    ).rows[0].n;
    const v = (
      await db.query(
        "insert into ctr_versions(agreement_id,number,snapshot,document_hash) values($1,$2,$3,$4) returning *",
        [a.id, n, snap, hash],
      )
    ).rows[0];
    if (a.current_version) {
      await db.query(
        "update ctr_invitations set revoked_at=now() where signer_id in (select id from ctr_signers where version_id=$1)",
        [a.current_version],
      );
      await audit(db, a.current_version, "versao_substituida", actor, {
        newVersion: v.id,
      });
    }
    for (const p of [
      { role: "contratante", email: settings.clientEmail },
      { role: "contratado", email: providerEmail },
    ])
      await db.query(
        "insert into ctr_signers(version_id,role,name,email) values($1,$2,$3,$4)",
        [
          v.id,
          p.role,
          p.role === "contratante"
            ? d.representative
            : "Jeremias Vitor dos Anjos Thomaz",
          p.email,
        ],
      );
    await db.query(
      "update ctr_agreements set current_version=$1,status='awaiting' where id=$2",
      [v.id, a.id],
    );
    await audit(db, v.id, "versao_liberada", actor, { hash });
    return v;
  });
}
export async function invite(role: string, actor: string, code = LEGACY_CODE) {
  return transaction(async (db) => {
    const a = (
      await db.query("select * from ctr_agreements where code=$1 for update", [
        code,
      ])
    ).rows[0];
    if (!a) throw new Fault("Contrato não encontrado.", 404);
    if (!["awaiting", "partial", "signed"].includes(a.status))
      throw new Fault("Libere uma versão antes de enviar convites.");
    const s = (
      await db.query(
        "select * from ctr_signers where version_id=$1 and role=$2",
        [a.current_version, role],
      )
    ).rows[0];
    if (!s) throw new Fault("Parte inválida.");
    await db.query(
      "update ctr_invitations set revoked_at=now() where signer_id=$1 and revoked_at is null",
      [s.id],
    );
    const secret = token();
    const i = (
      await db.query(
        "insert into ctr_invitations(signer_id,token_hash,expires_at) values($1,$2,now()+interval '7 days') returning id",
        [s.id, digest(secret)],
      )
    ).rows[0];
    const url = `${process.env.APP_URL}/assinar#convite=${secret}`;
    await queueEmail(
      db,
      a.current_version,
      `invite:${i.id}`,
      s.email,
      `Seu contrato está pronto para revisão — ${settingsFor(a).clientName} × Jeremias`,
      `Olá, ${s.name}!\n\nRevise o contrato e confirme sua identidade pelo link individual abaixo. O acesso expira em 7 dias.\n\n${url}\n\nNão encaminhe este convite.\nSistema de Contratos`,
    );
    await audit(db, a.current_version, "convite_criado", actor, {
      invitation: i.id,
      role,
    });
    return {
      message:
        "Convite adicionado à fila de envio. A entrega será confirmada pelo provedor.",
    };
  });
}
async function invitation(db: PoolClient, secret: string) {
  const r = await db.query(
    `select i.*,s.name,s.email,s.role,s.version_id,s.id as signer_id,v.snapshot,v.document_hash,v.number,a.current_version,a.status from ctr_invitations i join ctr_signers s on s.id=i.signer_id join ctr_versions v on v.id=s.version_id join ctr_agreements a on a.id=v.agreement_id where i.token_hash=$1 for update of i`,
    [digest(secret)],
  );
  const i = r.rows[0];
  if (
    !i ||
    i.revoked_at ||
    i.consumed_at ||
    new Date(i.expires_at) <= new Date() ||
    i.current_version !== i.version_id ||
    !["awaiting", "partial", "signed"].includes(i.status)
  )
    throw new Fault(
      "Convite inválido, utilizado, expirado ou substituído. Solicite um novo convite.",
      403,
    );
  return i;
}
export async function challenge(secret: string) {
  return transaction(async (db) => {
    const i = await invitation(db, secret);
    const recent = (
      await db.query(
        "select count(*)::int n from ctr_challenges where invitation_id=$1 and created_at>now()-interval '1 hour'",
        [i.id],
      )
    ).rows[0].n;
    if (recent >= 5)
      throw new Fault(
        "Limite de códigos atingido. Tente novamente em uma hora.",
        429,
      );
    const latest = (
      await db.query(
        "select id from ctr_challenges where invitation_id=$1 and created_at>now()-interval '60 seconds'",
        [i.id],
      )
    ).rows[0];
    if (latest)
      throw new Fault("Aguarde um minuto para solicitar outro código.", 429);
    await db.query(
      "update ctr_challenges set consumed_at=now() where invitation_id=$1 and consumed_at is null",
      [i.id],
    );
    const code = String(randomInt(10000000, 100000000));
    const c = (
      await db.query(
        "insert into ctr_challenges(invitation_id,code_hash,expires_at) values($1,$2,now()+interval '10 minutes') returning id",
        [i.id, digest(`${i.id}:${code}`)],
      )
    ).rows[0];
    await queueEmail(
      db,
      i.version_id,
      `code:${c.id}`,
      i.email,
      "Seu código de verificação — Contratos Jeremias Thomaz",
      `Seu código é ${code}.\n\nEle expira em 10 minutos. Não compartilhe este código.\nSe você não solicitou o acesso, ignore esta mensagem.\nSistema de Contratos`,
    );
    return {
      message:
        "Código solicitado. Verifique a caixa de entrada do e-mail cadastrado.",
      challengeId: c.id,
    };
  });
}
export async function verify(secret: string, code: string) {
  const result = await transaction(async (db) => {
    const i = await invitation(db, secret);
    const c = (
      await db.query(
        "select * from ctr_challenges where invitation_id=$1 order by created_at desc limit 1 for update",
        [i.id],
      )
    ).rows[0];
    if (
      !c ||
      c.consumed_at ||
      new Date(c.expires_at) <= new Date() ||
      c.attempts >= 5
    )
      return { error: true };
    await db.query(
      "update ctr_challenges set attempts=attempts+1 where id=$1",
      [c.id],
    );
    if (c.code_hash !== digest(`${i.id}:${code}`)) {
      await audit(db, i.version_id, "codigo_invalido", i.signer_id);
      return { error: true };
    }
    await db.query("update ctr_challenges set consumed_at=now() where id=$1", [
      c.id,
    ]);
    await db.query("update ctr_invitations set consumed_at=now() where id=$1", [
      i.id,
    ]);
    const session = token();
    await db.query(
      "insert into ctr_sessions(invitation_id,token_hash,expires_at) values($1,$2,now()+interval '1 hour')",
      [i.id, digest(session)],
    );
    await audit(db, i.version_id, "email_verificado", i.signer_id);
    return { session };
  });
  if (result.error)
    throw new Fault(
      "Código inválido, expirado ou limite de tentativas atingido.",
      403,
    );
  return result.session!;
}
export async function session(db: PoolClient, secret: string) {
  const r = await db.query(
    `select se.id as session_id,i.id as invitation_id,i.revoked_at,s.*,v.snapshot,v.document_hash,v.number,a.current_version,a.status,a.id as agreement_id from ctr_sessions se join ctr_invitations i on i.id=se.invitation_id join ctr_signers s on s.id=i.signer_id join ctr_versions v on v.id=s.version_id join ctr_agreements a on a.id=v.agreement_id where se.token_hash=$1 and se.expires_at>now()`,
    [digest(secret)],
  );
  const s = r.rows[0];
  if (
    !s ||
    s.revoked_at ||
    s.current_version !== s.version_id ||
    !["awaiting", "partial", "signed"].includes(s.status)
  )
    throw new Fault(
      "Sessão expirada ou versão indisponível. Solicite novo acesso.",
      401,
    );
  return s;
}
export async function signedView(secret: string) {
  return transaction(async (db) => {
    const s = await session(db, secret);
    const signatures = (
      await db.query(
        "select id,name,email,signed_at,document_hash,method from ctr_signatures where version_id=$1 order by signed_at",
        [s.version_id],
      )
    ).rows;
    const file = (
      await db.query("select id from ctr_files where version_id=$1", [
        s.version_id,
      ])
    ).rows[0];
    return {
      snapshot: s.snapshot,
      hash: s.document_hash,
      version: s.number,
      versionId: s.version_id,
      name: s.name,
      role: s.role,
      email: s.email,
      signatures,
      status: s.status,
      fileReady: !!file,
    };
  });
}
export async function sign(
  secret: string,
  consent: boolean,
  hash: string,
  ip: string | null,
  ua: string,
) {
  if (consent !== true)
    throw new Fault("A concordância expressa é obrigatória.");
  return transaction(async (db) => {
    const s = await session(db, secret);
    const a = (
      await db.query("select * from ctr_agreements where id=$1 for update", [
        s.agreement_id,
      ])
    ).rows[0];
    if (
      a.current_version !== s.version_id ||
      !["awaiting", "partial", "signed"].includes(a.status)
    )
      throw new Fault("Esta versão não está mais disponível.", 409);
    if (hash !== s.document_hash)
      throw new Fault("A versão revisada não corresponde ao documento.", 409);
    const existing = (
      await db.query("select * from ctr_signatures where signer_id=$1", [s.id])
    ).rows[0];
    if (existing) return existing;
    // O convite é consumido na verificação; a sessão autenticada é a credencial de assinatura.
    const sig = (
      await db.query(
        `insert into ctr_signatures(version_id,signer_id,invitation_id,name,email,consent,document_hash,ip,user_agent) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *`,
        [
          s.version_id,
          s.id,
          s.invitation_id,
          s.name,
          s.email,
          CONSENT,
          s.document_hash,
          ip,
          ua.slice(0, 512),
        ],
      )
    ).rows[0];
    const count = (
      await db.query(
        "select count(*)::int n from ctr_signatures where version_id=$1",
        [s.version_id],
      )
    ).rows[0].n;
    await db.query("update ctr_agreements set status=$1 where id=$2", [
      count === 2 ? "signed" : "partial",
      s.agreement_id,
    ]);
    await audit(db, s.version_id, "assinatura_registrada", s.id, {
      signatureId: sig.id,
      hash: s.document_hash,
    });
    await queueEmail(
      db,
      s.version_id,
      `signature:${sig.id}`,
      s.email,
      "Assinatura registrada — Contratos Jeremias Thomaz",
      `Olá, ${s.name}!\n\nSua assinatura eletrônica foi registrada com sucesso.\nContrato: ${s.snapshot.title || "Prestação de Serviços de Design e Edição de Vídeos"}.\nStatus: Assinatura do ${s.role} concluída.\n\nAssim que ambas as partes finalizarem a assinatura, o contrato completo estará disponível para consulta e download.\n\nAtenciosamente,\nSistema de Contratos`,
    );
    if (count === 2)
      await db.query(
        "insert into ctr_jobs(version_id,kind) values($1,'pdf') on conflict do nothing",
        [s.version_id],
      );
    return sig;
  });
}
