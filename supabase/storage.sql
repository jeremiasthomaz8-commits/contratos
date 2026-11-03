-- Supabase: nenhum acesso aos contratos pela Data API pública.
do $$ declare t text; begin
 foreach t in array array['ctr_agreements','ctr_versions','ctr_signers','ctr_invitations','ctr_challenges','ctr_sessions','ctr_signatures','ctr_audit','ctr_files','ctr_jobs','ctr_outbox','ctr_webhooks','ctr_limits'] loop
 execute format('revoke all on public.%I from anon, authenticated',t);
 end loop;
end $$;
revoke execute on function public.ctr_immutable() from public, anon, authenticated;
revoke execute on function public.ctr_guard_signature() from public, anon, authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('contracts','contracts',false,10485760,array['application/pdf']) on conflict(id) do nothing;
