-- Executar uma única vez em um banco dedicado. Todas as tabelas são privadas.
create table public.ctr_agreements (
 id uuid primary key default gen_random_uuid(), code text unique not null,
 draft jsonb not null default '{}', status text not null default 'draft' check(status in ('draft','missing','ready','awaiting','partial','signed','cancelled','superseded')),
 current_version uuid, created_at timestamptz not null default now()
);
create table public.ctr_versions (
 id uuid primary key default gen_random_uuid(), agreement_id uuid not null references public.ctr_agreements(id),
 number integer not null, snapshot jsonb not null, document_hash text not null check(length(document_hash)=64),
 created_at timestamptz not null default now(), unique(agreement_id,number)
);
alter table public.ctr_agreements add foreign key(current_version) references public.ctr_versions(id);
create table public.ctr_signers (
 id uuid primary key default gen_random_uuid(), version_id uuid not null references public.ctr_versions(id),
 role text not null check(role in ('contratante','contratado')), name text not null, email text not null,
 unique(version_id,role)
);
create table public.ctr_invitations (
 id uuid primary key default gen_random_uuid(), signer_id uuid not null references public.ctr_signers(id), token_hash text unique not null,
 expires_at timestamptz not null, consumed_at timestamptz, revoked_at timestamptz, created_at timestamptz not null default now()
);
create table public.ctr_challenges (
 id uuid primary key default gen_random_uuid(), invitation_id uuid not null references public.ctr_invitations(id),
 code_hash text not null, expires_at timestamptz not null, attempts integer not null default 0, consumed_at timestamptz, created_at timestamptz not null default now()
);
create table public.ctr_sessions (
 id uuid primary key default gen_random_uuid(), invitation_id uuid not null references public.ctr_invitations(id),
 token_hash text unique not null, verified_at timestamptz not null default now(), expires_at timestamptz not null
);
create table public.ctr_signatures (
 id uuid primary key default gen_random_uuid(), version_id uuid not null references public.ctr_versions(id), signer_id uuid unique not null references public.ctr_signers(id),
 invitation_id uuid not null references public.ctr_invitations(id), name text not null, email text not null,
 consent text not null, document_hash text not null, method text not null default 'codigo_email',
 ip text, user_agent text, signed_at timestamptz not null default now(), unique(version_id,signer_id)
);
create table public.ctr_audit (
 id uuid primary key default gen_random_uuid(), version_id uuid references public.ctr_versions(id), event text not null,
 actor text not null, details jsonb not null default '{}', created_at timestamptz not null default now()
);
create table public.ctr_files (
 id uuid primary key default gen_random_uuid(), version_id uuid unique not null references public.ctr_versions(id),
 path text not null, sha256 text not null, created_at timestamptz not null default now()
);
create table public.ctr_jobs (
 id uuid primary key default gen_random_uuid(), version_id uuid not null references public.ctr_versions(id), kind text not null check(kind in ('pdf')),
 status text not null default 'pending', attempts integer not null default 0, next_at timestamptz not null default now(), error text, unique(version_id,kind)
);
create table public.ctr_outbox (
 id uuid primary key default gen_random_uuid(), version_id uuid references public.ctr_versions(id), dedupe_key text unique not null,
 recipient text not null, payload text not null, status text not null default 'pending', provider_id text unique,
 attempts integer not null default 0, next_at timestamptz not null default now(), error text,
 created_at timestamptz not null default now(), sent_at timestamptz
);
create table public.ctr_webhooks(id text primary key, event text not null, provider_id text, delivery_status text, created_at timestamptz not null default now());
create table public.ctr_limits(key text primary key, count integer not null, expires_at timestamptz not null);
create function public.ctr_immutable() returns trigger language plpgsql set search_path = '' as $$
begin raise exception 'Registro imutável: crie uma nova versão.'; end $$;
create trigger immutable_version before update or delete on public.ctr_versions for each row execute function public.ctr_immutable();
create trigger immutable_signature before update or delete on public.ctr_signatures for each row execute function public.ctr_immutable();
create trigger immutable_audit before update or delete on public.ctr_audit for each row execute function public.ctr_immutable();
create trigger immutable_file before update or delete on public.ctr_files for each row execute function public.ctr_immutable();
create function public.ctr_guard_signature() returns trigger language plpgsql set search_path = '' as $$
declare v public.ctr_versions; s public.ctr_signers; i public.ctr_invitations; a public.ctr_agreements;
begin
 select * into v from public.ctr_versions where id=new.version_id;
 select * into a from public.ctr_agreements where id=v.agreement_id for update;
 select * into s from public.ctr_signers where id=new.signer_id;
 select * into i from public.ctr_invitations where id=new.invitation_id;
 if a.current_version<>v.id or a.status not in ('awaiting','partial') or s.version_id<>v.id or i.signer_id<>s.id or i.revoked_at is not null or i.consumed_at is null or not exists (select 1 from public.ctr_sessions se where se.invitation_id=i.id and se.expires_at>now()) or i.expires_at<=now() or new.document_hash<>v.document_hash or new.email<>s.email or new.name<>s.name then raise exception 'Assinatura inválida para esta versão.'; end if;
 return new;
end $$;
create trigger guard_signature before insert on public.ctr_signatures for each row execute function public.ctr_guard_signature();
create index on public.ctr_signers(version_id);
create index on public.ctr_invitations(signer_id);
create index on public.ctr_challenges(invitation_id,created_at desc);
create index on public.ctr_sessions(invitation_id);
create index on public.ctr_audit(version_id);
create index on public.ctr_outbox(status,next_at);
create index on public.ctr_jobs(status,next_at);
do $$ declare t text; begin
 foreach t in array array['ctr_agreements','ctr_versions','ctr_signers','ctr_invitations','ctr_challenges','ctr_sessions','ctr_signatures','ctr_audit','ctr_files','ctr_jobs','ctr_outbox','ctr_webhooks','ctr_limits'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public',t);
 end loop;
end $$;
insert into public.ctr_agreements(code,draft) values ('SCALUP-JT-001','{"companyCnpj":"60.444.212/0001-90"}');

create trigger immutable_signer before update or delete on public.ctr_signers for each row execute function public.ctr_immutable();
create index ctr_webhooks_provider_idx on public.ctr_webhooks(provider_id);
