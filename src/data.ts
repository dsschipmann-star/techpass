import type { AppState } from './types';

export const BENEFICIOS_PADRAO = [
  '30% OFF em mão de obra',
  '15% OFF em acessórios',
  '6 trocas de película durante 12 meses',
  'Cashback exclusivo',
  'Programa Indique e Ganhe',
  'Consultoria gamer gratuita',
  'Limpeza gratuita de alto-falantes e microfones',
];

export const SERVICOS_TECHSOFT = [
  { title: 'Celulares', description: 'Troca de tela, bateria, conector de carga, tampa traseira, câmera, limpeza e diagnóstico.' },
  { title: 'Computadores e Notebooks', description: 'Formatação, upgrade de SSD, memória RAM, limpeza interna, manutenção e diagnóstico.' },
  { title: 'Videogames', description: 'Limpeza preventiva, manutenção, troca de analógicos, HDMI, superaquecimento e reparos.' },
  { title: 'Acessórios', description: 'Capinhas, películas, carregadores, cabos, fontes, fones e itens para proteção do seu aparelho.' },
];

export const STATUS_LABEL: Record<string, string> = {
  DISPONIVEL: 'AGUARDANDO CADASTRO',
  PENDENTE_ATIVACAO: 'PENDENTE DE ATIVAÇÃO',
  ATIVO: 'ATIVO',
  CANCELADO: 'CANCELADO',
  EXPIRADO: 'EXPIRADO',
};

export const STATUS_STYLE: Record<string, string> = {
  DISPONIVEL: 'border-yellow-300/30 bg-yellow-300/10 text-yellow-100',
  PENDENTE_ATIVACAO: 'border-sky-300/30 bg-sky-300/10 text-sky-100',
  ATIVO: 'border-tech-neon/40 bg-tech-neon/10 text-tech-neon',
  CANCELADO: 'border-red-300/30 bg-red-300/10 text-red-100',
  EXPIRADO: 'border-zinc-300/30 bg-zinc-300/10 text-zinc-100',
};

export const EMPTY_STATE: AppState = {
  empresas: [],
  clientes: [],
  techpasses: [],
  pending_activations: [],
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
        id: 'emp-techsoft',
        nome: 'TechSoft',
        categoria: 'Assistência técnica e acessórios',
        beneficio: '30% OFF em mão de obra, 15% OFF em acessórios, cashback e benefícios exclusivos.',
        status: 'ativa',
        created_at: now,
      },
      {
        id: 'emp-super-geeks',
        nome: 'Super Geeks',
        categoria: 'Educação e tecnologia',
        beneficio: 'Benefícios exclusivos para alunos e famílias parceiras.',
        status: 'ativa',
        created_at: now,
      },
      {
        id: 'emp-fight-core',
        nome: 'Fight Core',
        categoria: 'Academia de luta',
        beneficio: 'Condições especiais para membros TechPass.',
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
        status: 'DISPONIVEL',
        qr_code_url: '/techpass/TP-SG-000001',
        codigo_fisico: 'SG-7K2P',
        codigo_usado: false,
        activated_at: null,
        expires_at: null,
        peliculas_restantes: 6,
        cashback_saldo: 0,
        codigo_indicacao: null,
        created_at: now,
      },
      {
        id: 'tp-sg-000002',
        serial: 'TP-SG-000002',
        empresa_id: 'emp-super-geeks',
        cliente_id: 'cli-maria',
        status: 'ATIVO',
        qr_code_url: '/techpass/TP-SG-000002',
        codigo_fisico: 'SG-4M9Q',
        codigo_usado: true,
        activated_at: activatedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        peliculas_restantes: 4,
        cashback_saldo: 30,
        codigo_indicacao: 'TP-SG-000002-IND',
        created_at: now,
      },
      {
        id: 'tp-fc-000001',
        serial: 'TP-FC-000001',
        empresa_id: 'emp-fight-core',
        cliente_id: null,
        status: 'DISPONIVEL',
        qr_code_url: '/techpass/TP-FC-000001',
        codigo_fisico: 'FC-5R6X',
        codigo_usado: false,
        activated_at: null,
        expires_at: null,
        peliculas_restantes: 6,
        cashback_saldo: 0,
        codigo_indicacao: null,
        created_at: now,
      },
      {
        id: 'tp-fc-000002',
        serial: 'TP-FC-000002',
        empresa_id: 'emp-fight-core',
        cliente_id: null,
        status: 'CANCELADO',
        qr_code_url: '/techpass/TP-FC-000002',
        codigo_fisico: 'FC-2N4B',
        codigo_usado: false,
        activated_at: null,
        expires_at: null,
        peliculas_restantes: 6,
        cashback_saldo: 0,
        codigo_indicacao: null,
        created_at: now,
      },
    ],
    pending_activations: [],
    cashback_movements: [],
    indicacoes: [],
    utilizacoes: [],
  };
}
