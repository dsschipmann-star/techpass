-- TechPass Premium - Supabase schema
-- Execute este arquivo no SQL Editor do Supabase.

create extension if not exists pgcrypto;

do $$ begin
  create type empresa_status as enum ('ativa', 'inativa');
exception when duplicate_object then null; end $$;

do $$ begin
  create type techpass_status as enum ('AGUARDANDO_ATIVACAO', 'PRE_CADASTRADO', 'ATIVO', 'SUSPENSO', 'CANCELADO', 'EXPIRADO');
exception when duplicate_object then null; end $$;

alter type techpass_status add value if not exists 'PRE_CADASTRADO';

do $$ begin
  create type cashback_tipo as enum ('credito', 'debito');
exception when duplicate_object then null; end $$;

do $$ begin
  create type indicacao_status as enum ('pendente', 'aprovado', 'recusado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type recompensa_tipo as enum ('desconto', 'cashback', 'brinde');
exception when duplicate_object then null; end $$;

create table if not exists empresas (
  id text primary key default gen_random_uuid()::text,
  nome text not null,
  responsavel text not null,
  telefone text not null,
  email text not null,
  status empresa_status not null default 'ativa',
  created_at timestamptz not null default now()
);

create table if not exists clientes (
  id text primary key default gen_random_uuid()::text,
  nome text not null,
  cpf text not null unique,
  telefone text not null,
  email text not null,
  codigo_indicacao text unique,
  created_at timestamptz not null default now()
);

create table if not exists techpass (
  id text primary key default gen_random_uuid()::text,
  serial text not null unique,
  empresa_id text not null references empresas(id) on delete restrict,
  cliente_id text references clientes(id) on delete set null,
  status techpass_status not null default 'AGUARDANDO_ATIVACAO',
  qr_code_url text not null,
  secret_code text not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  pre_registered_at timestamptz,
  activated_at timestamptz,
  expires_at timestamptz,
  peliculas_restantes integer not null default 6 check (peliculas_restantes >= 0),
  created_at timestamptz not null default now()
);

alter table techpass add column if not exists secret_code text not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
alter table techpass add column if not exists pre_registered_at timestamptz;
create unique index if not exists techpass_secret_code_unique on techpass(secret_code);

create unique index if not exists techpass_cliente_ativo_unique
  on techpass(cliente_id)
  where cliente_id is not null and status = 'ATIVO';

create table if not exists cashback_movements (
  id text primary key default gen_random_uuid()::text,
  cliente_id text not null references clientes(id) on delete cascade,
  techpass_id text not null references techpass(id) on delete cascade,
  tipo cashback_tipo not null,
  valor numeric(10,2) not null check (valor > 0),
  descricao text not null,
  created_at timestamptz not null default now()
);

create table if not exists indicacoes (
  id text primary key default gen_random_uuid()::text,
  cliente_indicador_id text not null references clientes(id) on delete cascade,
  nome_indicado text not null,
  telefone_indicado text not null,
  valor_servico numeric(10,2) not null default 0 check (valor_servico >= 0),
  status indicacao_status not null default 'pendente',
  recompensa recompensa_tipo not null,
  observacao text,
  created_at timestamptz not null default now(),
  constraint indicacao_aprovada_minimo check (status <> 'aprovado' or valor_servico >= 350)
);

create table if not exists utilizacoes (
  id text primary key default gen_random_uuid()::text,
  cliente_id text not null references clientes(id) on delete cascade,
  techpass_id text not null references techpass(id) on delete cascade,
  beneficio text not null,
  observacao text,
  created_at timestamptz not null default now()
);

create index if not exists idx_empresas_status on empresas(status);
create index if not exists idx_clientes_cpf on clientes(cpf);
create index if not exists idx_techpass_serial on techpass(serial);
create index if not exists idx_techpass_status on techpass(status);
create index if not exists idx_techpass_empresa on techpass(empresa_id);
create index if not exists idx_cashback_cliente on cashback_movements(cliente_id);
create index if not exists idx_indicacoes_status on indicacoes(status);

create or replace function suspend_techpass_when_empresa_inativa()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'inativa' and old.status is distinct from new.status then
    update techpass
      set status = 'SUSPENSO'
      where empresa_id = new.id
        and status in ('AGUARDANDO_ATIVACAO', 'PRE_CADASTRADO', 'ATIVO');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_suspend_techpass_when_empresa_inativa on empresas;

create trigger trg_suspend_techpass_when_empresa_inativa
after update of status on empresas
for each row
execute function suspend_techpass_when_empresa_inativa();

-- MVP interno: por padrão o Supabase deixa RLS desabilitado em tabelas novas.
-- Antes de produção, habilite autenticação, RLS e políticas separando painel admin da página pública.
