-- TechPass Premium - Supabase schema
-- Execute este arquivo no SQL Editor do Supabase.

create extension if not exists pgcrypto;

do $$ begin
  create type empresa_status as enum ('ativa', 'inativa');
exception when duplicate_object then null; end $$;

do $$ begin
  create type techpass_status as enum ('DISPONIVEL', 'PENDENTE_ATIVACAO', 'ATIVO', 'CANCELADO', 'EXPIRADO');
exception when duplicate_object then null; end $$;

alter type techpass_status add value if not exists 'DISPONIVEL';
alter type techpass_status add value if not exists 'PENDENTE_ATIVACAO';

do $$ begin
  create type pending_activation_status as enum ('PENDENTE_ATIVACAO', 'ATIVADO', 'CANCELADO');
exception when duplicate_object then null; end $$;

create table if not exists empresas (
  id text primary key default gen_random_uuid()::text,
  nome text not null,
  categoria text not null,
  beneficio text not null,
  status empresa_status not null default 'ativa',
  created_at timestamptz not null default now()
);

create table if not exists clientes (
  id text primary key default gen_random_uuid()::text,
  nome text not null,
  cpf text not null unique,
  telefone text not null,
  email text not null,
  codigo_indicacao text,
  created_at timestamptz not null default now()
);

create table if not exists techpass (
  id text primary key default gen_random_uuid()::text,
  serial text not null unique,
  codigo_fisico text not null unique,
  empresa_id text not null references empresas(id) on delete restrict,
  cliente_id text references clientes(id) on delete set null,
  status techpass_status not null default 'DISPONIVEL',
  qr_code_url text not null,
  codigo_usado boolean not null default false,
  activated_at timestamptz,
  expires_at timestamptz,
  peliculas_restantes integer not null default 6 check (peliculas_restantes >= 0),
  cashback_saldo numeric(10,2) not null default 0 check (cashback_saldo >= 0),
  codigo_indicacao text,
  created_at timestamptz not null default now()
);

create table if not exists pending_activations (
  id text primary key default gen_random_uuid()::text,
  techpass_id text not null references techpass(id) on delete cascade,
  cliente_id text not null references clientes(id) on delete cascade,
  codigo_informado text not null,
  status pending_activation_status not null default 'PENDENTE_ATIVACAO',
  created_at timestamptz not null default now()
);

create unique index if not exists techpass_cliente_ativo_pendente_unique
  on techpass(cliente_id)
  where cliente_id is not null and status in ('ATIVO', 'PENDENTE_ATIVACAO');

create unique index if not exists pending_activations_open_unique
  on pending_activations(techpass_id)
  where status = 'PENDENTE_ATIVACAO';

create index if not exists idx_empresas_status on empresas(status);
create index if not exists idx_clientes_cpf on clientes(cpf);
create index if not exists idx_techpass_serial on techpass(serial);
create index if not exists idx_techpass_status on techpass(status);
create index if not exists idx_techpass_empresa on techpass(empresa_id);
create index if not exists idx_pending_status on pending_activations(status);

-- MVP: por padrão, RLS pode ficar desabilitado durante testes.
-- Antes de produção, habilite Supabase Auth, RLS e políticas separando página pública e painel administrativo.
