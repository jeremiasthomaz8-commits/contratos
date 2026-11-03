export type SignatureStatus = {
  status: string;
  released: boolean;
  contratante: boolean;
  contratado: boolean;
};
// Apenas estado e papéis da versão atual; nenhum identificador, e-mail ou evidência.
export const signatureStatusSql = `
select a.status, a.current_version is not null as released,
  exists(select 1 from ctr_signers s join ctr_signatures sig on sig.signer_id=s.id and sig.version_id=s.version_id where s.version_id=a.current_version and s.role='contratante') as contratante,
  exists(select 1 from ctr_signers s join ctr_signatures sig on sig.signer_id=s.id and sig.version_id=s.version_id where s.version_id=a.current_version and s.role='contratado') as contratado
from ctr_agreements a where a.code='SCALUP-JT-001'
`;
