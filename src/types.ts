export type EmpresaStatus = 'ativa' | 'inativa';

export type TechPassStatus =
  | 'DISPONIVEL'
  | 'PENDENTE_ATIVACAO'
  | 'ATIVO'
  | 'CANCELADO'
  | 'EXPIRADO';

export type CashbackTipo = 'credito' | 'debito';

export type IndicacaoStatus = 'pendente' | 'aprovado' | 'recusado';

export type RecompensaTipo = 'desconto' | 'cashback' | 'brinde';

export type BeneficioServicoTipo = 'beneficio' | 'servico_desconto' | 'brinde' | 'cashback' | 'indicacao';

export type SolicitacaoStatus =
  | 'nova'
  | 'analise'
  | 'confirmada'
  | 'atendimento'
  | 'concluida'
  | 'cancelada';

export interface Empresa {
  id: string;
  nome: string;
  categoria: string;
  beneficio: string;
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
  codigo_fisico: string;
  codigo_usado: boolean;
  activated_at: string | null;
  expires_at: string | null;
  peliculas_restantes: number;
  cashback_saldo: number;
  codigo_indicacao: string | null;
  created_at: string;
}

export interface PendingActivation {
  id: string;
  techpass_id: string;
  cliente_id: string;
  codigo_informado: string;
  status: 'PENDENTE_ATIVACAO' | 'ATIVADO' | 'CANCELADO';
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

export interface BeneficioServico {
  id: string;
  nome: string;
  tipo: BeneficioServicoTipo;
  empresa_id: string;
  categoria: string;
  descricao: string;
  valor_normal: number | null;
  valor_desconto: number | null;
  percentual_desconto: number | null;
  limite_uso: number | null;
  validade: string | null;
  status: 'ativo' | 'inativo';
  regras_uso: string;
  created_at: string;
}

export interface Solicitacao {
  id: string;
  cliente_id: string;
  techpass_id: string;
  empresa_id: string;
  beneficio_servico_id: string;
  tipo: BeneficioServicoTipo;
  data_preferida: string;
  horario_preferido: string;
  observacao: string;
  status: SolicitacaoStatus;
  funcionario_responsavel: string;
  data_solicitacao: string;
  data_conclusao: string | null;
  observacao_empresa: string;
}

export interface Utilizacao {
  id: string;
  cliente_id: string;
  techpass_id: string;
  empresa_id: string;
  solicitacao_id: string | null;
  beneficio: string;
  status: string;
  observacao: string;
  funcionario_responsavel: string;
  created_at: string;
  completed_at: string | null;
}

export interface AppState {
  empresas: Empresa[];
  clientes: Cliente[];
  techpasses: TechPass[];
  pending_activations: PendingActivation[];
  cashback_movements: CashbackMovement[];
  indicacoes: Indicacao[];
  utilizacoes: Utilizacao[];
  beneficios_servicos: BeneficioServico[];
  solicitacoes: Solicitacao[];
}
