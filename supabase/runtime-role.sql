-- Credencial de execução aplicada com autorização explícita do usuário.
-- Arquivo parametrizado de referência; não reaplicar em um projeto já provisionado.
-- Substituir SCRAM_VERIFIER pelo verificador SCRAM-SHA-256 gerado localmente.
-- A senha original fica apenas em .env.local, nunca no SQL enviado.
create role ctr_runtime login password 'SCRAM_VERIFIER'
 nosuperuser nocreatedb nocreaterole noinherit nobypassrls;
grant usage on schema public to ctr_runtime;
grant select, insert on public.ctr_versions, public.ctr_signers, public.ctr_sessions,
 public.ctr_signatures, public.ctr_audit, public.ctr_files, public.ctr_webhooks to ctr_runtime;
grant select, insert, update on public.ctr_agreements, public.ctr_invitations,
 public.ctr_challenges, public.ctr_jobs, public.ctr_outbox, public.ctr_limits to ctr_runtime;
alter role ctr_runtime set search_path = public;
alter role ctr_runtime set statement_timeout = '30s';
alter role ctr_runtime set idle_in_transaction_session_timeout = '60s';
do $$ declare t text; begin
 foreach t in array array['ctr_agreements','ctr_versions','ctr_signers','ctr_invitations','ctr_challenges','ctr_sessions','ctr_signatures','ctr_audit','ctr_files','ctr_jobs','ctr_outbox','ctr_webhooks','ctr_limits'] loop
 execute format('create policy runtime_server on public.%I to ctr_runtime using (true) with check (true)',t);
 end loop;
end $$;
-- Sem DELETE, CREATE, ALTER, acesso a auth/storage ou permissão de administração.
-- A identidade dos signatários, versões, assinaturas, auditoria e arquivos são append-only.
