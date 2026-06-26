import type { AppState } from './types';

export const BENEFICIOS_PADRAO = [
  '30% OFF em mão de obra',
  '15% OFF em acessórios',
  '6 trocas de película durante 12 meses',
  'Consultoria gratuita para montagem de computador gamer',
  'Limpeza gratuita de alto-falantes e microfones de celulares',
  'Cashback exclusivo',
  'Programa Indique e Ganhe',
];

export const STATUS_LABEL: Record<string, string> = {
  AGUARDANDO_ATIVACAO: 'AGUARDANDO ATIVAÇÃO',
  ATIVO: 'ATIVO',
  SUSPENSO: 'SUSPENSO',
  CANCELADO: 'CANCELADO',
  EXPIRADO: 'EXPIRADO',
};

export const STATUS_STYLE: Record<string, string> = {
  AGUARDANDO_ATIVACAO: 'border-yellow-300/30 bg-yellow-300/10 text-yellow-100',
  ATIVO: 'border-tech-neon/40 bg-tech-neon/10 text-tech-neon',
  SUSPENSO: 'border-orange-300/30 bg-orange-300/10 text-orange-100',
  CANCELADO: 'border-red-300/30 bg-red-300/10 text-red-100',
  EXPIRADO: 'border-zinc-300/30 bg-zinc-300/10 text-zinc-100',
};

export const EMPTY_STATE: AppState = {
  empresas: [],
  clientes: [],
  techpasses: [],
  cashback_movements: [],
  indicacoes: [],
  utilizacoes: [],
};

export function createInitialState(): AppState {
  const now = new Date().toISOString();
  const activatedAt = new Date();
  activatedAt.setMonth(activatedAt.getMonth() - 2);
  const expiresAt = new Date(activatedAt);
  expiresAt.setMonth(expiresAt.getMonth() + 12);

  return {
    empresas: [
      {
        id: 'emp-super-geeks',
        nome: 'Super Geeks',
        responsavel: 'Camila Ribeiro',
        telefone: '(11) 98888-0101',
        email: 'parcerias@supergeeks.com.br',
        status: 'ativa',
        created_at: now,
      },
      {
        id: 'emp-fight-core',
        nome: 'Fight Core',
        responsavel: 'Renato Lima',
        telefone: '(11) 97777-0202',
        email: 'contato@fightcore.com.br',
        status: 'ativa',
        created_at: now,
      },
    ],
    clientes: [
      {
        id: 'cli-maria',
        nome: 'Maria Eduarda Alves',
        cpf: '123.456.789-10',
        telefone: '(11) 99999-1111',
        email: 'maria@email.com',
        codigo_indicacao: 'TP-SG-000002-IND',
        created_at: activatedAt.toISOString(),
      },
    ],
    techpasses: [
      {
        id: 'tp-sg-000001',
        serial: 'TP-SG-000001',
        empresa_id: 'emp-super-geeks',
        cliente_id: null,
        status: 'AGUARDANDO_ATIVACAO',
        qr_code_url: '/techpass/TP-SG-000001',
        activated_at: null,
        expires_at: null,
        peliculas_restantes: 6,
        created_at: now,
      },
      {
        id: 'tp-sg-000002',
        serial: 'TP-SG-000002',
        empresa_id: 'emp-super-geeks',
        cliente_id: 'cli-maria',
        status: 'ATIVO',
        qr_code_url: '/techpass/TP-SG-000002',
        activated_at: activatedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        peliculas_restantes: 4,
        created_at: now,
      },
      {
        id: 'tp-sg-000003',
        serial: 'TP-SG-000003',
        empresa_id: 'emp-super-geeks',
        cliente_id: null,
        status: 'SUSPENSO',
        qr_code_url: '/techpass/TP-SG-000003',
        activated_at: null,
        expires_at: null,
        peliculas_restantes: 6,
        created_at: now,
      },
      {
        id: 'tp-fc-000001',
        serial: 'TP-FC-000001',
        empresa_id: 'emp-fight-core',
        cliente_id: null,
        status: 'AGUARDANDO_ATIVACAO',
        qr_code_url: '/techpass/TP-FC-000001',
        activated_at: null,
        expires_at: null,
        peliculas_restantes: 6,
        created_at: now,
      },
      {
        id: 'tp-fc-000002',
        serial: 'TP-FC-000002',
        empresa_id: 'emp-fight-core',
        cliente_id: null,
        status: 'CANCELADO',
        qr_code_url: '/techpass/TP-FC-000002',
        activated_at: null,
        expires_at: null,
        peliculas_restantes: 6,
        created_at: now,
      },
    ],
    cashback_movements: [
      {
        id: 'cash-1',
        cliente_id: 'cli-maria',
        techpass_id: 'tp-sg-000002',
        tipo: 'credito',
        valor: 40,
        descricao: 'Cashback de compra em acessórios',
        created_at: activatedAt.toISOString(),
      },
      {
        id: 'cash-2',
        cliente_id: 'cli-maria',
        techpass_id: 'tp-sg-000002',
        tipo: 'debito',
        valor: 10,
        descricao: 'Uso parcial de cashback',
        created_at: now,
      },
    ],
    indicacoes: [
      {
        id: 'ind-1',
        cliente_indicador_id: 'cli-maria',
        nome_indicado: 'Lucas Pereira',
        telefone_indicado: '(11) 96666-3333',
        valor_servico: 420,
        status: 'pendente',
        recompensa: 'cashback',
        observacao: 'Aguardando fechamento do serviço.',
        created_at: now,
      },
    ],
    utilizacoes: [
      {
        id: 'uti-1',
        cliente_id: 'cli-maria',
        techpass_id: 'tp-sg-000002',
        beneficio: 'Troca de película',
        observacao: 'Primeira troca registrada no balcão.',
        created_at: activatedAt.toISOString(),
      },
      {
        id: 'uti-2',
        cliente_id: 'cli-maria',
        techpass_id: 'tp-sg-000002',
        beneficio: 'Troca de película',
        observacao: 'Segunda troca registrada no balcão.',
        created_at: now,
      },
    ],
  };
}
