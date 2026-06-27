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

insert into beneficios_servicos (id, nome, tipo, empresa_id, categoria, descricao, valor_normal, valor_desconto, percentual_desconto, limite_uso, status, regras_uso)
values
  ('bs-pelicula', 'Troca de película TechSoft', 'beneficio', 'emp-techsoft', 'Películas', 'Troca de película inclusa para membros TechPass.', 35, 0, 100, 6, 'ativo', 'Ao concluir, reduz uma película do saldo.'),
  ('bs-limpeza-gratis', 'Limpeza gratuita', 'beneficio', 'emp-techsoft', 'Manutenção', 'Limpeza gratuita de alto-falantes, conectores e microfones.', 30, 0, 100, 1, 'ativo', 'Válido para avaliação rápida no balcão.'),
  ('bs-consultoria-gamer', 'Consultoria gamer', 'beneficio', 'emp-techsoft', 'Videogames', 'Orientação para configuração e cuidados com videogames.', 80, 0, 100, 1, 'ativo', 'Mediante agendamento.'),
  ('bs-tela', 'Troca de tela', 'servico_desconto', 'emp-techsoft', 'Manutenção de celular', 'Troca de tela com condição especial para membros.', 220, 176, 20, null, 'ativo', 'Aguardar confirmação da empresa responsável.'),
  ('bs-bateria', 'Troca de bateria', 'servico_desconto', 'emp-techsoft', 'Manutenção de celular', 'Substituição de bateria com diagnóstico.', 180, 144, 20, null, 'ativo', 'Aguardar confirmação da empresa responsável.'),
  ('bs-formatacao', 'Formatação', 'servico_desconto', 'emp-techsoft', 'Computadores', 'Formatação com instalação básica e otimização.', 150, 105, 30, null, 'ativo', 'Aguardar confirmação da empresa responsável.'),
  ('bs-super-geeks-aula', 'Aula experimental', 'beneficio', 'emp-super-geeks', 'Educação', 'Aula experimental para conhecer a metodologia Super Geeks.', 120, 0, 100, 1, 'ativo', 'Sujeito à agenda da unidade parceira.'),
  ('bs-fight-core-aula', 'Aula experimental Fight Core', 'beneficio', 'emp-fight-core', 'Lutas', 'Aula experimental ou avaliação inicial na Fight Core.', 80, 0, 100, 1, 'ativo', 'Solicitar horário e aguardar confirmação.')
on conflict (id) do update set
  nome = excluded.nome,
  tipo = excluded.tipo,
  empresa_id = excluded.empresa_id,
  categoria = excluded.categoria,
  descricao = excluded.descricao,
  valor_normal = excluded.valor_normal,
  valor_desconto = excluded.valor_desconto,
  percentual_desconto = excluded.percentual_desconto,
  limite_uso = excluded.limite_uso,
  status = excluded.status,
  regras_uso = excluded.regras_uso;

insert into cashback_movements (id, cliente_id, techpass_id, tipo, valor, descricao)
values
  ('cash-maria-1', 'cli-maria', 'tp-sg-000002', 'credito', 45, 'Cashback de boas-vindas TechPass')
on conflict (id) do update set
  tipo = excluded.tipo,
  valor = excluded.valor,
  descricao = excluded.descricao;

insert into solicitacoes (id, cliente_id, techpass_id, empresa_id, beneficio_servico_id, tipo, data_preferida, horario_preferido, observacao, status)
values
  ('sol-maria-1', 'cli-maria', 'tp-sg-000002', 'emp-techsoft', 'bs-formatacao', 'servico_desconto', current_date, '14:00', 'Cliente deseja avaliar o notebook.', 'nova')
on conflict (id) do update set
  status = excluded.status,
  observacao = excluded.observacao,
  horario_preferido = excluded.horario_preferido;

insert into utilizacoes (id, cliente_id, techpass_id, empresa_id, solicitacao_id, beneficio, status, observacao, funcionario_responsavel, completed_at)
values
  ('uti-maria-1', 'cli-maria', 'tp-sg-000002', 'emp-techsoft', null, 'Troca de película', 'concluida', 'Película aplicada no balcão TechSoft.', 'Atendimento TechSoft', now() - interval '1 month')
on conflict (id) do update set
  beneficio = excluded.beneficio,
  status = excluded.status,
  observacao = excluded.observacao,
  funcionario_responsavel = excluded.funcionario_responsavel,
  completed_at = excluded.completed_at;

insert into ofertas (id, empresa_id, nome, tipo, preco_normal, preco_techpass, economia, descricao, regras, beneficio_extra, status, cta)
values
  ('of-fc-mensal', 'emp-fight-core', 'Plano Mensal Fight Core', 'plano', 'R$199/mês', 'R$179/mês', 'R$20 por mês', 'Condição especial para membros TechPass treinarem na Fight Core.', 'Válido para membros TechPass ativos.', 'Condição especial para membros TechPass', 'ativo', 'Tenho interesse'),
  ('of-fc-semestral', 'emp-fight-core', 'Plano Semestral Fight Core', 'plano', 'R$1.194', 'R$999', 'R$195', 'Plano semestral com economia direta para membros TechPass.', 'Pagamento e contratação definidos pela Fight Core.', 'Condição especial para membros TechPass', 'ativo', 'Tenho interesse'),
  ('of-fc-anual', 'emp-fight-core', 'Plano Anual Fight Core', 'plano', 'R$2.388', 'R$1.908', 'R$480', 'Plano anual com desconto exclusivo para membros TechPass.', 'Pode liberar bônus de 6 meses se indicar 15 contatos e ao menos 1 fechar plano.', 'Possibilidade de ganhar bônus de 6 meses com indicações', 'ativo', 'Quero esta condição'),
  ('of-fc-aula-muay-thai', 'emp-fight-core', 'Aula Grátis Muay Thai', 'aula_gratis', 'Aula experimental', 'Grátis', 'Experiência sem custo', 'Experimente uma aula de Muay Thai na Fight Core.', 'Sujeito à disponibilidade de agenda.', 'Lead direcionado para a modalidade escolhida', 'ativo', 'Solicitar aula'),
  ('of-fc-aula-mma', 'emp-fight-core', 'Aula Grátis MMA', 'aula_gratis', 'Aula experimental', 'Grátis', 'Experiência sem custo', 'Experimente uma aula de MMA na Fight Core.', 'Sujeito à disponibilidade de agenda.', 'Lead direcionado para a modalidade escolhida', 'ativo', 'Solicitar aula'),
  ('of-fc-aula-jiu-jitsu', 'emp-fight-core', 'Aula Grátis Jiu Jitsu', 'aula_gratis', 'Aula experimental', 'Grátis', 'Experiência sem custo', 'Experimente uma aula de Jiu Jitsu adulto na Fight Core.', 'Sujeito à disponibilidade de agenda.', 'Lead direcionado para a modalidade escolhida', 'ativo', 'Solicitar aula'),
  ('of-fc-aula-jiu-jitsu-kids', 'emp-fight-core', 'Aula Grátis Jiu Jitsu Kids', 'aula_gratis', 'Aula experimental', 'Grátis', 'Experiência sem custo', 'Aula experimental para crianças.', 'Sujeito à disponibilidade de agenda.', 'Lead direcionado para a modalidade escolhida', 'ativo', 'Solicitar aula'),
  ('of-sg-anual', 'emp-super-geeks', 'Plano Anual Super Geeks', 'plano', 'R$340/mês', 'R$299/mês', 'R$492 por ano', 'Condição especial para membros TechPass em plano anual Super Geeks.', 'Válido para novas contratações pela Rede TechPass.', 'Condição especial para membros TechPass', 'ativo', 'Quero esta condição'),
  ('of-sg-renovacao', 'emp-super-geeks', 'Renovação Super Geeks', 'renovacao', 'Condição padrão', 'Condição especial', 'Renovação TechPass por 12 meses', 'Clientes que fecharem plano anual pela Rede TechPass ganham desconto garantido na próxima renovação.', 'Benefício aplicado conforme confirmação da Super Geeks.', 'Desconto na próxima renovação e TechPass renovado', 'ativo', 'Solicitar condição de renovação')
on conflict (id) do update set
  empresa_id = excluded.empresa_id,
  nome = excluded.nome,
  tipo = excluded.tipo,
  preco_normal = excluded.preco_normal,
  preco_techpass = excluded.preco_techpass,
  economia = excluded.economia,
  descricao = excluded.descricao,
  regras = excluded.regras,
  beneficio_extra = excluded.beneficio_extra,
  status = excluded.status,
  cta = excluded.cta;

insert into leads (id, cliente_id, techpass_id, empresa_id, oferta_id, oferta_nome, telefone_cliente, status, observacao)
values
  ('lead-maria-fc', 'cli-maria', 'tp-sg-000002', 'emp-fight-core', 'of-fc-anual', 'Plano Anual Fight Core', '(11) 99999-1111', 'novo', 'Cliente demonstrou interesse pelo plano anual.')
on conflict (id) do update set
  status = excluded.status,
  observacao = excluded.observacao;
