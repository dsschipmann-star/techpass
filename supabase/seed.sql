-- TechPass Premium - dados de demonstração opcionais

insert into empresas (id, nome, categoria, beneficio, status)
values
  ('emp-techsoft', 'TechSoft', 'Assistência técnica e acessórios', '30% OFF em mão de obra, 15% OFF em acessórios, cashback e benefícios exclusivos.', 'ativa'),
  ('emp-super-geeks', 'Super Geeks', 'Educação e tecnologia', 'Benefícios exclusivos para alunos e famílias parceiras.', 'ativa'),
  ('emp-fight-core', 'Fight Core', 'Academia de luta', 'Condições especiais para membros TechPass.', 'ativa')
on conflict (id) do update set
  nome = excluded.nome,
  categoria = excluded.categoria,
  beneficio = excluded.beneficio,
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

insert into techpass (id, serial, codigo_fisico, empresa_id, cliente_id, status, qr_code_url, codigo_usado, activated_at, expires_at, peliculas_restantes, cashback_saldo, codigo_indicacao)
values
  ('tp-sg-000001', 'TP-SG-000001', 'SG-7K2P', 'emp-super-geeks', null, 'DISPONIVEL', '/techpass/TP-SG-000001', false, null, null, 6, 0, null),
  ('tp-sg-000002', 'TP-SG-000002', 'SG-4M9Q', 'emp-super-geeks', 'cli-maria', 'ATIVO', '/techpass/TP-SG-000002', true, now() - interval '2 months', now() + interval '10 months', 4, 30, 'TP-SG-000002-IND'),
  ('tp-fc-000001', 'TP-FC-000001', 'FC-5R6X', 'emp-fight-core', null, 'DISPONIVEL', '/techpass/TP-FC-000001', false, null, null, 6, 0, null),
  ('tp-fc-000002', 'TP-FC-000002', 'FC-2N4B', 'emp-fight-core', null, 'CANCELADO', '/techpass/TP-FC-000002', false, null, null, 6, 0, null)
on conflict (id) do update set
  serial = excluded.serial,
  codigo_fisico = excluded.codigo_fisico,
  empresa_id = excluded.empresa_id,
  cliente_id = excluded.cliente_id,
  status = excluded.status,
  qr_code_url = excluded.qr_code_url,
  codigo_usado = excluded.codigo_usado,
  activated_at = excluded.activated_at,
  expires_at = excluded.expires_at,
  peliculas_restantes = excluded.peliculas_restantes,
  cashback_saldo = excluded.cashback_saldo,
  codigo_indicacao = excluded.codigo_indicacao;
