
-- Enums
CREATE TYPE public.empresa_status AS ENUM ('ativa', 'inativa');
CREATE TYPE public.techpass_status AS ENUM ('AGUARDANDO_ATIVACAO','ATIVO','SUSPENSO','CANCELADO','EXPIRADO');
CREATE TYPE public.cashback_tipo AS ENUM ('credito','debito');
CREATE TYPE public.indicacao_status AS ENUM ('pendente','aprovado','recusado');
CREATE TYPE public.indicacao_recompensa AS ENUM ('desconto','cashback','brinde');

-- empresas
CREATE TABLE public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  responsavel TEXT,
  telefone TEXT,
  email TEXT,
  status public.empresa_status NOT NULL DEFAULT 'ativa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresas TO anon, authenticated;
GRANT ALL ON public.empresas TO service_role;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open empresas" ON public.empresas FOR ALL USING (true) WITH CHECK (true);

-- clientes
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  telefone TEXT,
  email TEXT,
  codigo_indicacao TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO anon, authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);

-- techpass
CREATE TABLE public.techpass (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial TEXT NOT NULL UNIQUE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE RESTRICT,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  status public.techpass_status NOT NULL DEFAULT 'AGUARDANDO_ATIVACAO',
  qr_code_url TEXT NOT NULL,
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  peliculas_restantes INT NOT NULL DEFAULT 6,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_techpass_empresa ON public.techpass(empresa_id);
CREATE INDEX idx_techpass_cliente ON public.techpass(cliente_id);
CREATE INDEX idx_techpass_status ON public.techpass(status);
-- Garante: mesmo CPF não pode ter dois TechPass ativos
CREATE UNIQUE INDEX uniq_cliente_ativo ON public.techpass(cliente_id) WHERE status = 'ATIVO';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.techpass TO anon, authenticated;
GRANT ALL ON public.techpass TO service_role;
ALTER TABLE public.techpass ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open techpass" ON public.techpass FOR ALL USING (true) WITH CHECK (true);

-- cashback_movements
CREATE TABLE public.cashback_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  techpass_id UUID NOT NULL REFERENCES public.techpass(id) ON DELETE CASCADE,
  tipo public.cashback_tipo NOT NULL,
  valor NUMERIC(10,2) NOT NULL CHECK (valor > 0),
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cashback_movements TO anon, authenticated;
GRANT ALL ON public.cashback_movements TO service_role;
ALTER TABLE public.cashback_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open cashback" ON public.cashback_movements FOR ALL USING (true) WITH CHECK (true);

-- indicacoes
CREATE TABLE public.indicacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_indicador_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nome_indicado TEXT NOT NULL,
  telefone_indicado TEXT,
  valor_servico NUMERIC(10,2),
  status public.indicacao_status NOT NULL DEFAULT 'pendente',
  recompensa public.indicacao_recompensa,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.indicacoes TO anon, authenticated;
GRANT ALL ON public.indicacoes TO service_role;
ALTER TABLE public.indicacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open indicacoes" ON public.indicacoes FOR ALL USING (true) WITH CHECK (true);

-- utilizacoes
CREATE TABLE public.utilizacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  techpass_id UUID NOT NULL REFERENCES public.techpass(id) ON DELETE CASCADE,
  beneficio TEXT NOT NULL,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.utilizacoes TO anon, authenticated;
GRANT ALL ON public.utilizacoes TO service_role;
ALTER TABLE public.utilizacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open utilizacoes" ON public.utilizacoes FOR ALL USING (true) WITH CHECK (true);

-- Seed empresas
INSERT INTO public.empresas (nome, responsavel, telefone, email, status) VALUES
('Super Geeks', 'João Silva', '(11) 99999-0001', 'contato@supergeeks.com', 'ativa'),
('Fight Core', 'Marcos Souza', '(11) 99999-0002', 'contato@fightcore.com', 'ativa');

-- Seed TechPass demo
DO $$
DECLARE
  v_sg UUID;
  v_fc UUID;
  v_cliente UUID;
  v_tp_ativo UUID;
BEGIN
  SELECT id INTO v_sg FROM public.empresas WHERE nome='Super Geeks';
  SELECT id INTO v_fc FROM public.empresas WHERE nome='Fight Core';

  -- TP-SG-000001 aguardando
  INSERT INTO public.techpass (serial, empresa_id, qr_code_url) VALUES
    ('TP-SG-000001', v_sg, '/techpass/TP-SG-000001');

  -- Cliente Maria Eduarda
  INSERT INTO public.clientes (nome, cpf, telefone, email, codigo_indicacao)
  VALUES ('Maria Eduarda Alves','123.456.789-10','(11) 98888-7777','maria@example.com','TP-SG-000002-IND')
  RETURNING id INTO v_cliente;

  -- TP-SG-000002 ativo vinculado
  INSERT INTO public.techpass (serial, empresa_id, cliente_id, status, qr_code_url, activated_at, expires_at, peliculas_restantes)
  VALUES ('TP-SG-000002', v_sg, v_cliente, 'ATIVO', '/techpass/TP-SG-000002', now(), now() + interval '12 months', 5)
  RETURNING id INTO v_tp_ativo;

  -- Mais alguns aguardando
  INSERT INTO public.techpass (serial, empresa_id, qr_code_url) VALUES
    ('TP-SG-000003', v_sg, '/techpass/TP-SG-000003'),
    ('TP-FC-000001', v_fc, '/techpass/TP-FC-000001'),
    ('TP-FC-000002', v_fc, '/techpass/TP-FC-000002');

  -- Cashback exemplo
  INSERT INTO public.cashback_movements (cliente_id, techpass_id, tipo, valor, descricao) VALUES
    (v_cliente, v_tp_ativo, 'credito', 50.00, 'Cashback de compra inicial'),
    (v_cliente, v_tp_ativo, 'credito', 25.00, 'Cashback de serviço'),
    (v_cliente, v_tp_ativo, 'debito', 15.00, 'Uso em acessório');

  -- Indicação exemplo
  INSERT INTO public.indicacoes (cliente_indicador_id, nome_indicado, telefone_indicado, valor_servico, status, observacao)
  VALUES (v_cliente, 'Carlos Pereira', '(11) 97777-6666', 420.00, 'pendente', 'Indicação para troca de tela');

  -- Utilização exemplo
  INSERT INTO public.utilizacoes (cliente_id, techpass_id, beneficio, observacao)
  VALUES (v_cliente, v_tp_ativo, 'Troca de película', 'Película premium aplicada');
END $$;
