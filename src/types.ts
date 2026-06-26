export type EmpresaStatus = 'ativa' | 'inativa';

export type TechPassStatus =
  | 'AGUARDANDO_ATIVACAO'
  | 'PRE_CADASTRADO'
  | 'ATIVO'
  | 'SUSPENSO'
  | 'CANCELADO'
  | 'EXPIRADO';

export type CashbackTipo = 'credito' | 'debito';

export type IndicacaoStatus = 'pendente' | 'aprovado' | 'recusado';

export type RecompensaTipo = 'desconto' | 'cashback' | 'brinde';

export interface Empresa {
  id: string;
  nome: string;
  responsavel: string;
  telefone: string;
  email: string;
  status: EmpresaStatus;
  created_at: string;
}

export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  codigo_indicacao: string;
  created_at: string;
}

export interface TechPass {
  id: string;
  serial: string;
  empresa_id: string;
  cliente_id: string | null;
  status: TechPassStatus;
  qr_code_url: string;
  secret_code: string;
  pre_registered_at: string | null;
  activated_at: string | null;
  expires_at: string | null;
  peliculas_restantes: number;
  created_at: string;
}

export interface CashbackMovement {
  id: string;
  cliente_id: string;
  techpass_id: string;
  tipo: CashbackTipo;
  valor: number;
  descricao: string;
  created_at: string;
}

export interface Indicacao {
  id: string;
  cliente_indicador_id: string;
  nome_indicado: string;
  telefone_indicado: string;
  valor_servico: number;
  status: IndicacaoStatus;
  recompensa: RecompensaTipo;
  observacao: string;
  created_at: string;
}

export interface Utilizacao {
  id: string;
  cliente_id: string;
  techpass_id: string;
  beneficio: string;
  observacao: string;
  created_at: string;
}

export interface AppState {
  empresas: Empresa[];
  clientes: Cliente[];
  techpasses: TechPass[];
  cashback_movements: CashbackMovement[];
  indicacoes: Indicacao[];
  utilizacoes: Utilizacao[];
}
