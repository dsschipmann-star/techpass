-- TechPass Premium - dados de demonstração opcionais

insert into empresas (id, nome, responsavel, telefone, email, status)
values
  ('emp-super-geeks', 'Super Geeks', 'Camila Ribeiro', '(11) 98888-0101', 'parcerias@supergeeks.com.br', 'ativa'),
  ('emp-fight-core', 'Fight Core', 'Renato Lima', '(11) 97777-0202', 'contato@fightcore.com.br', 'ativa')
on conflict (id) do update set
  nome = excluded.nome,
  responsavel = excluded.responsavel,
  telefone = excluded.telefone,
  email = excluded.email,
  status = excluded.status;

insert into clientes (id, nome, cpf, telefone, email, codigo_indicacao)
values
  ('cli-maria', 'Maria Eduarda Alves', '123.456.789-10', '(11) 99999-1111', 'maria@email.com', 'TP-SG-000002-IND')
on conflict (id) do update set
  nome = excluded.nome,
  cpf = excluded.cpf,
  telefone = excluded.telefone,
  email = excluded.email,
  codigo_indicacao = excluded.codigo_indicacao;

insert into techpass (id, serial, empresa_id, cliente_id, status, qr_code_url, secret_code, pre_registered_at, activated_at, expires_at, peliculas_restantes)
values
  ('tp-sg-000001', 'TP-SG-000001', 'emp-super-geeks', null, 'AGUARDANDO_ATIVACAO', '/techpass/TP-SG-000001', 'SG-7K2P', null, null, null, 6),
  ('tp-sg-000002', 'TP-SG-000002', 'emp-super-geeks', 'cli-maria', 'ATIVO', '/techpass/TP-SG-000002', 'SG-4M9Q', now() - interval '2 months', now() - interval '2 months', now() + interval '10 months', 4),
  ('tp-sg-000003', 'TP-SG-000003', 'emp-super-geeks', null, 'SUSPENSO', '/techpass/TP-SG-000003', 'SG-8T1Z', null, null, null, 6),
  ('tp-fc-000001', 'TP-FC-000001', 'emp-fight-core', null, 'AGUARDANDO_ATIVACAO', '/techpass/TP-FC-000001', 'FC-5R6X', null, null, null, 6),
  ('tp-fc-000002', 'TP-FC-000002', 'emp-fight-core', null, 'CANCELADO', '/techpass/TP-FC-000002', 'FC-2N4B', null, null, null, 6)
on conflict (id) do update set
  serial = excluded.serial,
  empresa_id = excluded.empresa_id,
  cliente_id = excluded.cliente_id,
  status = excluded.status,
  qr_code_url = excluded.qr_code_url,
  secret_code = excluded.secret_code,
  pre_registered_at = excluded.pre_registered_at,
  activated_at = excluded.activated_at,
  expires_at = excluded.expires_at,
  peliculas_restantes = excluded.peliculas_restantes;

insert into cashback_movements (id, cliente_id, techpass_id, tipo, valor, descricao)
values
  ('cash-1', 'cli-maria', 'tp-sg-000002', 'credito', 40, 'Cashback de compra em acessórios'),
  ('cash-2', 'cli-maria', 'tp-sg-000002', 'debito', 10, 'Uso parcial de cashback')
on conflict (id) do update set
  cliente_id = excluded.cliente_id,
  techpass_id = excluded.techpass_id,
  tipo = excluded.tipo,
  valor = excluded.valor,
  descricao = excluded.descricao;

insert into indicacoes (id, cliente_indicador_id, nome_indicado, telefone_indicado, valor_servico, status, recompensa, observacao)
values
  ('ind-1', 'cli-maria', 'Lucas Pereira', '(11) 96666-3333', 420, 'pendente', 'cashback', 'Aguardando fechamento do serviço.')
on conflict (id) do update set
  cliente_indicador_id = excluded.cliente_indicador_id,
  nome_indicado = excluded.nome_indicado,
  telefone_indicado = excluded.telefone_indicado,
  valor_servico = excluded.valor_servico,
  status = excluded.status,
  recompensa = excluded.recompensa,
  observacao = excluded.observacao;
