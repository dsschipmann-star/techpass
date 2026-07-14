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

do $$ begin
  create type oferta_tipo as enum ('plano', 'aula_gratis', 'servico', 'brinde', 'desconto', 'cashback', 'indicacao', 'renovacao');
exception when duplicate_object then null; end $$;

alter type oferta_tipo add value if not exists 'desconto';
alter type oferta_tipo add value if not exists 'cashback';

do $$ begin
  create type lead_status as enum ('novo', 'contato_realizado', 'negociacao', 'fechado', 'perdido', 'cancelado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fight_core_indicacao_status as enum ('enviada', 'em_contato', 'fechou_plano', 'nao_fechou', 'bonus_liberado');
exception when duplicate_object then null; end $$;

create table if not exists empresas (
  id text primary key default gen_random_uuid()::text,
  nome text not null,
  categoria text not null,
  beneficio text not null,
  status empresa_status not null default 'ativa',
  telefone text,
  whatsapp text,
  email text,
  endereco text,
  descricao text,
  instagram text,
  logo_url text,
  created_at timestamptz not null default now()
);

alter table empresas add column if not exists telefone text;
alter table empresas add column if not exists whatsapp text;
alter table empresas add column if not exists email text;
alter table empresas add column if not exists endereco text;
alter table empresas add column if not exists descricao text;
alter table empresas add column if not exists instagram text;
alter table empresas add column if not exists logo_url text;

create table if not exists parceiro_usuarios (
  id text primary key default gen_random_uuid()::text,
  nome text not null,
  email text not null unique,
  senha text not null,
  empresa_id text not null references empresas(id) on delete cascade,
  tipo_acesso text not null default 'parceiro' check (tipo_acesso = 'parceiro'),
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

create table if not exists cashback_settings (
  id text primary key default gen_random_uuid()::text,
  empresa_id text not null references empresas(id) on delete cascade,
  ativo boolean not null default false,
  valor_minimo numeric(10,2) not null default 0,
  tipo_calculo text not null default 'oferta_especifica' check (tipo_calculo in ('valor_fixo', 'percentual', 'proporcional', 'oferta_especifica')),
  limite_maximo numeric(10,2) not null default 0,
  regras_uso text not null default '',
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cashback_balances (
  id text primary key default gen_random_uuid()::text,
  cliente_id text not null references clientes(id) on delete cascade,
  empresa_id text not null references empresas(id) on delete cascade,
  saldo_disponivel numeric(10,2) not null default 0 check (saldo_disponivel >= 0),
  saldo_pendente numeric(10,2) not null default 0 check (saldo_pendente >= 0),
  limite_maximo numeric(10,2) not null default 0,
  updated_at timestamptz not null default now(),
  unique (cliente_id, empresa_id)
);

create table if not exists cashback_transactions (
  id text primary key default gen_random_uuid()::text,
  cliente_id text not null references clientes(id) on delete cascade,
  techpass_id text not null references techpass(id) on delete cascade,
  empresa_id text not null references empresas(id) on delete cascade,
  oferta_id text,
  lead_id text,
  tipo text not null check (tipo in ('credito', 'debito', 'ajuste', 'cancelamento')),
  valor numeric(10,2) not null default 0 check (valor >= 0),
  status text not null default 'pendente' check (status in ('pendente', 'disponivel', 'usado', 'cancelado')),
  descricao text not null default '',
  valor_compra numeric(10,2) not null default 0,
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

create table if not exists ofertas (
  id text primary key default gen_random_uuid()::text,
  empresa_id text not null references empresas(id) on delete restrict,
  nome text not null,
  tipo oferta_tipo not null,
  preco_normal text not null default '',
  preco_techpass text not null default '',
  economia text not null default '',
  descricao text not null default '',
  descricao_completa text not null default '',
  regras text not null default '',
  beneficio_extra text not null default '',
  validade date,
  status text not null default 'ativo' check (status in ('ativo', 'inativo', 'PENDENTE_APROVACAO', 'REPROVADA', 'AJUSTE_SOLICITADO')),
  cta text not null default 'Tenho interesse',
  origem text not null default 'admin' check (origem in ('admin', 'parceiro')),
  cashback_ativo boolean not null default false,
  cashback_tipo text not null default 'sem_cashback' check (cashback_tipo in ('sem_cashback', 'valor_fixo', 'percentual', 'proporcional', 'mensalidade')),
  cashback_valor numeric(10,2),
  cashback_limite numeric(10,2),
  cashback_regras text not null default '',
  cashback_descricao_cliente text not null default '',
  created_at timestamptz not null default now()
);

alter table ofertas add column if not exists descricao_completa text not null default '';
alter table ofertas add column if not exists validade date;
alter table ofertas add column if not exists origem text not null default 'admin';
alter table ofertas add column if not exists cashback_ativo boolean not null default false;
alter table ofertas add column if not exists cashback_tipo text not null default 'sem_cashback';
alter table ofertas add column if not exists cashback_valor numeric(10,2);
alter table ofertas add column if not exists cashback_limite numeric(10,2);
alter table ofertas add column if not exists cashback_regras text not null default '';
alter table ofertas add column if not exists cashback_descricao_cliente text not null default '';
alter table ofertas drop constraint if exists ofertas_status_check;
alter table ofertas add constraint ofertas_status_check check (status in ('ativo', 'inativo', 'PENDENTE_APROVACAO', 'REPROVADA', 'AJUSTE_SOLICITADO'));
alter table ofertas drop constraint if exists ofertas_origem_check;
alter table ofertas add constraint ofertas_origem_check check (origem in ('admin', 'parceiro'));
alter table ofertas drop constraint if exists ofertas_cashback_tipo_check;
alter table ofertas add constraint ofertas_cashback_tipo_check check (cashback_tipo in ('sem_cashback', 'valor_fixo', 'percentual', 'proporcional', 'mensalidade'));

create table if not exists leads (
  id text primary key default gen_random_uuid()::text,
  cliente_id text not null references clientes(id) on delete cascade,
  techpass_id text not null references techpass(id) on delete cascade,
  empresa_id text not null references empresas(id) on delete restrict,
  oferta_id text not null references ofertas(id) on delete restrict,
  oferta_nome text not null,
  telefone_cliente text not null,
  status lead_status not null default 'novo',
  observacao text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists fight_core_indicacoes (
  id text primary key default gen_random_uuid()::text,
  cliente_id text not null references clientes(id) on delete cascade,
  techpass_id text not null references techpass(id) on delete cascade,
  nome_indicado text not null,
  telefone_indicado text not null,
  observacao text not null default '',
  status fight_core_indicacao_status not null default 'enviada',
  created_at timestamptz not null default now()
);

create table if not exists techsoft_indicacoes (
  id text primary key default gen_random_uuid()::text,
  cliente_id text not null references clientes(id) on delete cascade,
  techpass_id text not null references techpass(id) on delete cascade,
  nome_indicado text not null,
  telefone_indicado text not null,
  observacao text not null default '',
  status text not null default 'enviada' check (status in ('enviada', 'em_contato', 'comprou_fechou', 'nao_converteu', 'brinde_liberado', 'brinde_retirado')),
  valor_compra numeric(10,2) not null default 0,
  gerou_brinde boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id text primary key default gen_random_uuid()::text,
  user_id text,
  empresa_id text references empresas(id) on delete set null,
  tipo_usuario text not null check (tipo_usuario in ('admin', 'parceiro', 'cliente')),
  titulo text not null,
  descricao text not null default '',
  tipo text not null check (tipo in ('informacao', 'sucesso', 'alerta', 'erro')),
  url text not null default '',
  lida boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists system_logs (
  id text primary key default gen_random_uuid()::text,
  nivel text not null check (nivel in ('info', 'warning', 'error', 'critical')),
  usuario text not null default '',
  empresa text not null default '',
  pagina text not null default '',
  descricao text not null default '',
  stacktrace text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists budgets (
  id text primary key default gen_random_uuid()::text,
  numero text not null unique,
  data_orcamento date not null default current_date,
  previsao_entrega date,
  tecnico_responsavel text not null default '',
  aos_cuidados_de text not null default '',
  cliente_nome text not null default '',
  cliente_documento text not null default '',
  cliente_endereco text not null default '',
  cliente_cep text not null default '',
  cliente_cidade text not null default '',
  cliente_estado text not null default '',
  cliente_telefone text not null default '',
  cliente_email text not null default '',
  device_id text not null default '',
  device_modelo text not null default '',
  device_serial text not null default '',
  device_specs text not null default '',
  device_image_url text not null default '',
  public_notes text not null default '',
  garantia_texto text not null default '',
  subtotal numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  status text not null default 'rascunho' check (status in ('rascunho', 'enviado', 'aprovado', 'recusado', 'concluido')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists budget_items (
  id text primary key default gen_random_uuid()::text,
  budget_id text not null references budgets(id) on delete cascade,
  item_numero integer not null,
  nome text not null default '',
  quantidade numeric(10,2) not null default 0,
  valor_unitario numeric(10,2) not null default 0,
  subtotal numeric(10,2) not null default 0,
  tipo text not null default 'servico' check (tipo in ('servico', 'peca')),
  disponibilidade text not null default 'pronta_entrega' check (disponibilidade in ('pronta_entrega', 'encomenda', 'mercado_livre')),
  fornecedor_url text not null default '',
  created_at timestamptz not null default now()
);

alter table budgets add column if not exists device_id text not null default '';
alter table budgets add column if not exists device_modelo text not null default '';
alter table budgets add column if not exists device_serial text not null default '';
alter table budgets add column if not exists device_specs text not null default '';
alter table budgets add column if not exists device_image_url text not null default '';
alter table budgets add column if not exists public_notes text not null default '';
alter table budget_items add column if not exists tipo text not null default 'servico';
alter table budget_items add column if not exists disponibilidade text not null default 'pronta_entrega';
alter table budget_items add column if not exists fornecedor_url text not null default '';

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
create index if not exists idx_cashback_settings_empresa on cashback_settings(empresa_id);
create index if not exists idx_cashback_balances_cliente_empresa on cashback_balances(cliente_id, empresa_id);
create index if not exists idx_cashback_transactions_empresa on cashback_transactions(empresa_id);
create index if not exists idx_cashback_transactions_cliente on cashback_transactions(cliente_id);
create index if not exists idx_beneficios_empresa on beneficios_servicos(empresa_id);
create index if not exists idx_solicitacoes_empresa on solicitacoes(empresa_id);
create index if not exists idx_solicitacoes_cliente on solicitacoes(cliente_id);
create index if not exists idx_solicitacoes_status on solicitacoes(status);
create index if not exists idx_utilizacoes_cliente on utilizacoes(cliente_id);
create index if not exists idx_ofertas_empresa on ofertas(empresa_id);
create index if not exists idx_leads_empresa on leads(empresa_id);
create index if not exists idx_leads_cliente on leads(cliente_id);
create index if not exists idx_fight_indicacoes_cliente on fight_core_indicacoes(cliente_id);
create index if not exists idx_techsoft_indicacoes_cliente on techsoft_indicacoes(cliente_id);
create index if not exists idx_techsoft_indicacoes_status on techsoft_indicacoes(status);
create index if not exists idx_notifications_tipo_usuario on notifications(tipo_usuario);
create index if not exists idx_notifications_user on notifications(user_id);
create index if not exists idx_notifications_empresa on notifications(empresa_id);
create index if not exists idx_notifications_lida on notifications(lida);
create index if not exists idx_system_logs_nivel on system_logs(nivel);
create index if not exists idx_system_logs_created_at on system_logs(created_at);
create index if not exists idx_budgets_numero on budgets(numero);
create index if not exists idx_budgets_status on budgets(status);
create index if not exists idx_budgets_created_at on budgets(created_at);
create index if not exists idx_budget_items_budget on budget_items(budget_id);

-- MVP: por padrão, RLS pode ficar desabilitado durante testes.
-- Antes de produção, habilite Supabase Auth, RLS e políticas separando página pública e painel administrativo.
