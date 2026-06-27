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

do $$ begin
  create type cashback_tipo as enum ('credito', 'debito');
exception when duplicate_object then null; end $$;

do $$ begin
  create type indicacao_status as enum ('pendente', 'aprovado', 'recusado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type recompensa_tipo as enum ('desconto', 'cashback', 'brinde');
exception when duplicate_object then null; end $$;

do $$ begin
  create type beneficio_servico_tipo as enum ('beneficio', 'servico_desconto', 'brinde', 'cashback', 'indicacao');
exception when duplicate_object then null; end $$;

do $$ begin
  create type solicitacao_status as enum ('nova', 'analise', 'confirmada', 'atendimento', 'concluida', 'cancelada');
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

create table if not exists cashback_movements (
  id text primary key default gen_random_uuid()::text,
  cliente_id text not null references clientes(id) on delete cascade,
  techpass_id text not null references techpass(id) on delete cascade,
  tipo cashback_tipo not null,
  valor numeric(10,2) not null check (valor >= 0),
  descricao text not null,
  created_at timestamptz not null default now()
);

create table if not exists indicacoes (
  id text primary key default gen_random_uuid()::text,
  cliente_indicador_id text not null references clientes(id) on delete cascade,
  nome_indicado text not null,
  telefone_indicado text not null,
  valor_servico numeric(10,2) not null default 0,
  status indicacao_status not null default 'pendente',
  recompensa recompensa_tipo not null default 'cashback',
  observacao text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists beneficios_servicos (
  id text primary key default gen_random_uuid()::text,
  nome text not null,
  tipo beneficio_servico_tipo not null,
  empresa_id text not null references empresas(id) on delete restrict,
  categoria text not null default '',
  descricao text not null default '',
  valor_normal numeric(10,2),
  valor_desconto numeric(10,2),
  percentual_desconto numeric(5,2),
  limite_uso integer,
  validade date,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  regras_uso text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists solicitacoes (
  id text primary key default gen_random_uuid()::text,
  cliente_id text not null references clientes(id) on delete cascade,
  techpass_id text not null references techpass(id) on delete cascade,
  empresa_id text not null references empresas(id) on delete restrict,
  beneficio_servico_id text not null references beneficios_servicos(id) on delete restrict,
  tipo beneficio_servico_tipo not null,
  data_preferida date,
  horario_preferido text not null default '',
  observacao text not null default '',
  status solicitacao_status not null default 'nova',
  funcionario_responsavel text not null default '',
  data_solicitacao timestamptz not null default now(),
  data_conclusao timestamptz,
  observacao_empresa text not null default ''
);

create table if not exists utilizacoes (
  id text primary key default gen_random_uuid()::text,
  cliente_id text not null references clientes(id) on delete cascade,
  techpass_id text not null references techpass(id) on delete cascade,
  empresa_id text not null references empresas(id) on delete restrict,
  solicitacao_id text references solicitacoes(id) on delete set null,
  beneficio text not null,
  status text not null default 'concluida',
  observacao text not null default '',
  funcionario_responsavel text not null default '',
  created_at timestamptz not null default now(),
  completed_at timestamptz
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
create index if not exists idx_beneficios_empresa on beneficios_servicos(empresa_id);
create index if not exists idx_solicitacoes_empresa on solicitacoes(empresa_id);
create index if not exists idx_solicitacoes_cliente on solicitacoes(cliente_id);
create index if not exists idx_solicitacoes_status on solicitacoes(status);
create index if not exists idx_utilizacoes_cliente on utilizacoes(cliente_id);

-- MVP: por padrão, RLS pode ficar desabilitado durante testes.
-- Antes de produção, habilite Supabase Auth, RLS e políticas separando página pública e painel administrativo.
