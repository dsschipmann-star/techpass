-- TechPass Premium - dados de demonstração opcionais

insert into empresas (id, nome, categoria, beneficio, status, telefone, whatsapp, email, endereco, descricao, instagram, logo_url)
values
  ('emp-techsoft', 'TechSoft', 'Assistência técnica e acessórios', '30% OFF em mão de obra, 15% OFF em acessórios, cashback e benefícios exclusivos.', 'ativa', '(11) 3000-1000', '(11) 93000-1000', 'contato@techsoft.com.br', 'Loja TechSoft', 'Assistência técnica, acessórios e central de ativação TechPass.', '', ''),
  ('emp-super-geeks', 'Super Geeks', 'Educação e tecnologia', 'Benefícios exclusivos para alunos e famílias parceiras.', 'ativa', '(11) 3000-2000', '(11) 93000-2000', 'parcerias@supergeeks.com.br', 'Unidade parceira Super Geeks', 'Educação, programação e tecnologia para famílias parceiras.', '', ''),
  ('emp-fight-core', 'Fight Core', 'Academia de luta', 'Condições especiais para membros TechPass.', 'ativa', '(11) 3000-3000', '(11) 93000-3000', 'contato@fightcore.com.br', 'Academia Fight Core', 'Muay Thai, Jiu Jitsu, MMA e planos especiais para membros TechPass.', '', '')
on conflict (id) do update set
  nome = excluded.nome,
  categoria = excluded.categoria,
  beneficio = excluded.beneficio,
  status = excluded.status,
  telefone = excluded.telefone,
  whatsapp = excluded.whatsapp,
  email = excluded.email,
  endereco = excluded.endereco,
  descricao = excluded.descricao,
  instagram = excluded.instagram,
  logo_url = excluded.logo_url;

insert into parceiro_usuarios (id, nome, email, senha, empresa_id, tipo_acesso)
values
  ('par-techsoft', 'Equipe TechSoft', 'techsoft@parceiro.com', '123456', 'emp-techsoft', 'parceiro'),
  ('par-super-geeks', 'Equipe Super Geeks', 'supergeeks@parceiro.com', '123456', 'emp-super-geeks', 'parceiro'),
  ('par-fight-core', 'Equipe Fight Core', 'fightcore@parceiro.com', '123456', 'emp-fight-core', 'parceiro')
on conflict (id) do update set
  nome = excluded.nome,
  email = excluded.email,
  senha = excluded.senha,
  empresa_id = excluded.empresa_id,
  tipo_acesso = excluded.tipo_acesso;

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

insert into cashback_settings (id, empresa_id, ativo, valor_minimo, tipo_calculo, limite_maximo, regras_uso, status)
values
  ('cashset-techsoft', 'emp-techsoft', true, 250, 'percentual', 100, 'Compras acima de R$250 geram cashback cumulativo até R$100. Não pode ser convertido em dinheiro.', 'ativo'),
  ('cashset-fight-core', 'emp-fight-core', true, 0, 'oferta_especifica', 178, 'Planos Fight Core podem gerar cashback por oferta, inclusive equivalente a 1 mensalidade.', 'ativo'),
  ('cashset-super-geeks', 'emp-super-geeks', true, 0, 'oferta_especifica', 299, 'Cashback apenas no plano anual ou benefício equivalente definido pela Super Geeks.', 'ativo')
on conflict (id) do update set
  ativo = excluded.ativo,
  valor_minimo = excluded.valor_minimo,
  tipo_calculo = excluded.tipo_calculo,
  limite_maximo = excluded.limite_maximo,
  regras_uso = excluded.regras_uso,
  status = excluded.status,
  updated_at = now();

insert into cashback_balances (id, cliente_id, empresa_id, saldo_disponivel, saldo_pendente, limite_maximo)
values
  ('cashbal-maria-techsoft', 'cli-maria', 'emp-techsoft', 68.50, 0, 100),
  ('cashbal-maria-fc', 'cli-maria', 'emp-fight-core', 0, 178, 178)
on conflict (cliente_id, empresa_id) do update set
  saldo_disponivel = excluded.saldo_disponivel,
  saldo_pendente = excluded.saldo_pendente,
  limite_maximo = excluded.limite_maximo,
  updated_at = now();

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

insert into ofertas (id, empresa_id, nome, tipo, preco_normal, preco_techpass, economia, descricao, descricao_completa, regras, beneficio_extra, validade, status, cta, origem, cashback_ativo, cashback_tipo, cashback_valor, cashback_limite, cashback_regras, cashback_descricao_cliente)
values
  ('of-fc-mensal', 'emp-fight-core', 'Plano Mensal Fight Core', 'plano', 'R$199/mês', 'R$179/mês', 'R$20 por mês', 'Condição especial para membros TechPass treinarem na Fight Core.', 'Plano mensal Fight Core com preço reduzido para membros TechPass ativos.', 'Válido para membros TechPass ativos.', 'Condição especial para membros TechPass', null, 'ativo', 'Tenho interesse', 'admin', true, 'valor_fixo', 14.83, 178, 'Cashback proporcional ao plano mensal após confirmação da Fight Core.', 'Você pode ganhar R$14,83 em cashback nesta oferta.'),
  ('of-fc-semestral', 'emp-fight-core', 'Plano Semestral Fight Core', 'plano', 'R$1.194', 'R$999', 'R$195', 'Plano semestral com economia direta para membros TechPass.', 'Plano semestral Fight Core com economia estimada de R$195.', 'Pagamento e contratação definidos pela Fight Core.', 'Condição especial para membros TechPass', null, 'ativo', 'Tenho interesse', 'admin', true, 'proporcional', 89, 178, 'Cashback proporcional ao período contratado.', 'Cashback proporcional liberado após confirmação da contratação.'),
  ('of-fc-anual', 'emp-fight-core', 'Plano Anual Fight Core', 'plano', 'R$2.388', 'R$1.908', 'R$480', 'Plano anual com desconto exclusivo para membros TechPass.', 'Plano anual Fight Core com possibilidade de bônus de 6 meses via indicações qualificadas.', 'Pode liberar bônus de 6 meses se indicar 15 contatos e ao menos 1 fechar plano.', 'Possibilidade de ganhar bônus de 6 meses com indicações', null, 'ativo', 'Quero esta condição', 'admin', true, 'mensalidade', 178, 178, 'Equivalente a 1 mensalidade em benefícios após contratar o plano anual pela Rede TechPass.', 'Cashback TechPass: R$178, equivalente a 1 mês de mensalidade em benefícios.'),
  ('of-fc-aula-muay-thai', 'emp-fight-core', 'Aula Grátis Muay Thai', 'aula_gratis', 'Aula experimental', 'Grátis', 'Experiência sem custo', 'Experimente uma aula de Muay Thai na Fight Core.', 'Aula experimental de Muay Thai direcionada para a equipe Fight Core.', 'Sujeito à disponibilidade de agenda.', 'Lead direcionado para a modalidade escolhida', null, 'ativo', 'Solicitar aula', 'admin', false, 'sem_cashback', null, null, '', ''),
  ('of-fc-aula-mma', 'emp-fight-core', 'Aula Grátis MMA', 'aula_gratis', 'Aula experimental', 'Grátis', 'Experiência sem custo', 'Experimente uma aula de MMA na Fight Core.', 'Aula experimental de MMA direcionada para a equipe Fight Core.', 'Sujeito à disponibilidade de agenda.', 'Lead direcionado para a modalidade escolhida', null, 'ativo', 'Solicitar aula', 'admin', false, 'sem_cashback', null, null, '', ''),
  ('of-fc-aula-jiu-jitsu', 'emp-fight-core', 'Aula Grátis Jiu Jitsu', 'aula_gratis', 'Aula experimental', 'Grátis', 'Experiência sem custo', 'Experimente uma aula de Jiu Jitsu adulto na Fight Core.', 'Aula experimental de Jiu Jitsu adulto direcionada para a equipe Fight Core.', 'Sujeito à disponibilidade de agenda.', 'Lead direcionado para a modalidade escolhida', null, 'ativo', 'Solicitar aula', 'admin', false, 'sem_cashback', null, null, '', ''),
  ('of-fc-aula-jiu-jitsu-kids', 'emp-fight-core', 'Aula Grátis Jiu Jitsu Kids', 'aula_gratis', 'Aula experimental', 'Grátis', 'Experiência sem custo', 'Aula experimental para crianças.', 'Aula experimental de Jiu Jitsu Kids direcionada para a equipe Fight Core.', 'Sujeito à disponibilidade de agenda.', 'Lead direcionado para a modalidade escolhida', null, 'ativo', 'Solicitar aula', 'admin', false, 'sem_cashback', null, null, '', ''),
  ('of-sg-anual', 'emp-super-geeks', 'Plano Anual Super Geeks', 'plano', 'R$340/mês', 'R$299/mês', 'R$492 por ano', 'Condição especial para membros TechPass em plano anual Super Geeks.', 'Plano anual Super Geeks com economia estimada de R$492 por ano.', 'Válido para novas contratações pela Rede TechPass.', 'Condição especial para membros TechPass', null, 'ativo', 'Quero esta condição', 'admin', true, 'valor_fixo', 299, 299, 'Cashback configurável para plano anual Super Geeks após fechamento confirmado.', 'Cashback ou benefício equivalente a uma mensalidade, conforme regra da Super Geeks.'),
  ('of-sg-renovacao', 'emp-super-geeks', 'Renovação Super Geeks', 'renovacao', 'Condição padrão', 'Condição especial', 'Renovação TechPass por 12 meses', 'Clientes que fecharem plano anual pela Rede TechPass ganham desconto garantido na próxima renovação.', 'Condição de renovação Super Geeks com renovação gratuita do TechPass por mais 12 meses.', 'Benefício aplicado conforme confirmação da Super Geeks.', 'Desconto na próxima renovação e TechPass renovado', null, 'ativo', 'Solicitar condição de renovação', 'admin', false, 'sem_cashback', null, null, '', '')
on conflict (id) do update set
  empresa_id = excluded.empresa_id,
  nome = excluded.nome,
  tipo = excluded.tipo,
  preco_normal = excluded.preco_normal,
  preco_techpass = excluded.preco_techpass,
  economia = excluded.economia,
  descricao = excluded.descricao,
  descricao_completa = excluded.descricao_completa,
  regras = excluded.regras,
  beneficio_extra = excluded.beneficio_extra,
  validade = excluded.validade,
  status = excluded.status,
  cta = excluded.cta,
  origem = excluded.origem,
  cashback_ativo = excluded.cashback_ativo,
  cashback_tipo = excluded.cashback_tipo,
  cashback_valor = excluded.cashback_valor,
  cashback_limite = excluded.cashback_limite,
  cashback_regras = excluded.cashback_regras,
  cashback_descricao_cliente = excluded.cashback_descricao_cliente;

insert into leads (id, cliente_id, techpass_id, empresa_id, oferta_id, oferta_nome, telefone_cliente, status, observacao)
values
  ('lead-maria-fc', 'cli-maria', 'tp-sg-000002', 'emp-fight-core', 'of-fc-anual', 'Plano Anual Fight Core', '(11) 99999-1111', 'novo', 'Cliente demonstrou interesse pelo plano anual.')
on conflict (id) do update set
  status = excluded.status,
  observacao = excluded.observacao;

insert into cashback_transactions (id, cliente_id, techpass_id, empresa_id, oferta_id, lead_id, tipo, valor, status, descricao, valor_compra)
values
  ('cashtx-maria-techsoft', 'cli-maria', 'tp-sg-000002', 'emp-techsoft', null, null, 'credito', 68.50, 'disponivel', 'TechCash TechSoft gerado em compra acima de R$250.', 685),
  ('cashtx-maria-fc', 'cli-maria', 'tp-sg-000002', 'emp-fight-core', 'of-fc-anual', 'lead-maria-fc', 'credito', 178, 'pendente', 'Cashback gerado pelo Plano Anual Fight Core.', 2268)
on conflict (id) do update set
  tipo = excluded.tipo,
  valor = excluded.valor,
  status = excluded.status,
  descricao = excluded.descricao,
  valor_compra = excluded.valor_compra;

insert into techsoft_indicacoes (id, cliente_id, techpass_id, nome_indicado, telefone_indicado, observacao, status, valor_compra, gerou_brinde)
values
  ('tsind-maria-1', 'cli-maria', 'tp-sg-000002', 'Carlos Henrique', '(11) 98888-2222', 'Interessado em película e capinha.', 'em_contato', 0, false)
on conflict (id) do update set
  nome_indicado = excluded.nome_indicado,
  telefone_indicado = excluded.telefone_indicado,
  observacao = excluded.observacao,
  status = excluded.status,
  valor_compra = excluded.valor_compra,
  gerou_brinde = excluded.gerou_brinde;

insert into budgets (id, numero, data_orcamento, previsao_entrega, tecnico_responsavel, aos_cuidados_de, cliente_nome, cliente_documento, cliente_endereco, cliente_cep, cliente_cidade, cliente_estado, cliente_telefone, cliente_email, garantia_texto, subtotal, total, status)
values
  ('bud-0001', 'TS-2026-0001', current_date, null, 'Fabiano Oliveira / Matheus Schipmann', 'Maria Eduarda', 'Maria Eduarda', '123.456.789-10', 'Rua Exemplo, 100', '88101-000', 'Sao Jose', 'SC', '(48) 99999-0000', 'maria@email.com', 'Este servico possui garantia de 6 meses a partir da data de conclusao.

A garantia nao cobre danos causados por mau uso, quedas, oscilacoes eletricas, liquidos ou intervencao de terceiros.', 350, 350, 'rascunho')
on conflict (id) do update set
  numero = excluded.numero,
  data_orcamento = excluded.data_orcamento,
  previsao_entrega = excluded.previsao_entrega,
  tecnico_responsavel = excluded.tecnico_responsavel,
  aos_cuidados_de = excluded.aos_cuidados_de,
  cliente_nome = excluded.cliente_nome,
  cliente_documento = excluded.cliente_documento,
  cliente_endereco = excluded.cliente_endereco,
  cliente_cep = excluded.cliente_cep,
  cliente_cidade = excluded.cliente_cidade,
  cliente_estado = excluded.cliente_estado,
  cliente_telefone = excluded.cliente_telefone,
  cliente_email = excluded.cliente_email,
  garantia_texto = excluded.garantia_texto,
  subtotal = excluded.subtotal,
  total = excluded.total,
  status = excluded.status,
  updated_at = now();

insert into budget_items (id, budget_id, item_numero, nome, quantidade, valor_unitario, subtotal)
values
  ('bitem-0001', 'bud-0001', 1, 'Troca de tela iPhone - mao de obra e componente', 1, 350, 350)
on conflict (id) do update set
  budget_id = excluded.budget_id,
  item_numero = excluded.item_numero,
  nome = excluded.nome,
  quantidade = excluded.quantidade,
  valor_unitario = excluded.valor_unitario,
  subtotal = excluded.subtotal;

insert into notifications (id, user_id, empresa_id, tipo_usuario, titulo, descricao, tipo, url, lida)
values
  ('not-cli-ativado', 'cli-maria', null, 'cliente', 'TechPass ativado', 'Seu TechPass esta ativo e pronto para usar na Rede TechPass.', 'sucesso', '/cliente/dashboard', false),
  ('not-cli-oferta', 'cli-maria', 'emp-fight-core', 'cliente', 'Oferta Fight Core disponivel', 'Plano anual com economia estimada de R$480 e possibilidade de bonus por indicacao.', 'informacao', '/cliente/dashboard', false),
  ('not-cli-cashback', 'cli-maria', 'emp-techsoft', 'cliente', 'Cashback liberado', 'Voce tem TechCash disponivel para usar em beneficios TechSoft.', 'sucesso', '/cliente/dashboard', true),
  ('not-par-fc-lead', 'par-fight-core', 'emp-fight-core', 'parceiro', 'Novo lead recebido', 'Maria Eduarda demonstrou interesse no Plano Anual Fight Core.', 'informacao', '/parceiro/dashboard', false),
  ('not-par-techsoft-cashback', 'par-techsoft', 'emp-techsoft', 'parceiro', 'Cashback aguardando aprovacao', 'Revise as movimentacoes de TechCash pendentes da TechSoft.', 'alerta', '/parceiro/dashboard', false),
  ('not-admin-oferta', null, 'emp-fight-core', 'admin', 'Oferta aguardando aprovacao', 'Parceiros podem publicar ofertas que precisam de revisao do administrador.', 'alerta', '/admin', false),
  ('not-admin-log', null, null, 'admin', 'Backup concluido', 'Rotina de backup demo concluida sem erros.', 'sucesso', '/admin', true)
on conflict (id) do update set
  user_id = excluded.user_id,
  empresa_id = excluded.empresa_id,
  tipo_usuario = excluded.tipo_usuario,
  titulo = excluded.titulo,
  descricao = excluded.descricao,
  tipo = excluded.tipo,
  url = excluded.url,
  lida = excluded.lida;

insert into system_logs (id, nivel, usuario, empresa, pagina, descricao, stacktrace)
values
  ('log-backup', 'info', 'Sistema', 'TechPass', '/admin', 'Backup concluido com sucesso.', ''),
  ('log-auth-warning', 'warning', 'visitante', 'TechPass', '/login', 'Tentativa de login sem TechPass ativo correspondente.', ''),
  ('log-qrcode-error', 'error', 'Sistema', 'TechSoft', '/techpass/TP-INVALIDO', 'QR Code solicitado para serial inexistente.', 'NotFoundError: TechPass serial not found')
on conflict (id) do update set
  nivel = excluded.nivel,
  usuario = excluded.usuario,
  empresa = excluded.empresa,
  pagina = excluded.pagina,
  descricao = excluded.descricao,
  stacktrace = excluded.stacktrace;
