export type EmpresaStatus = 'ativa' | 'inativa';

export type OfertaStatus = 'ativo' | 'inativo' | 'PENDENTE_APROVACAO' | 'REPROVADA' | 'AJUSTE_SOLICITADO';

export type TechPassStatus =
  | 'DISPONIVEL'
  | 'PENDENTE_ATIVACAO'
  | 'ATIVO'
  | 'CANCELADO'
  | 'EXPIRADO';

export type CashbackTipo = 'credito' | 'debito';
export type CashbackCalculoTipo = 'valor_fixo' | 'percentual' | 'proporcional' | 'oferta_especifica';
export type OfertaCashbackTipo = 'sem_cashback' | 'valor_fixo' | 'percentual' | 'proporcional' | 'mensalidade';
export type CashbackTransactionTipo = 'credito' | 'debito' | 'ajuste' | 'cancelamento';
export type CashbackTransactionStatus = 'pendente' | 'disponivel' | 'usado' | 'cancelado';

export type IndicacaoStatus = 'pendente' | 'aprovado' | 'recusado';

export type RecompensaTipo = 'desconto' | 'cashback' | 'brinde';

export type BeneficioServicoTipo = 'beneficio' | 'servico_desconto' | 'brinde' | 'cashback' | 'indicacao';

export type OfertaTipo = 'plano' | 'aula_gratis' | 'servico' | 'brinde' | 'desconto' | 'cashback' | 'indicacao' | 'renovacao';

export type LeadStatus = 'novo' | 'contato_realizado' | 'negociacao' | 'fechado' | 'perdido' | 'cancelado';

export type IndicacaoFightCoreStatus = 'enviada' | 'em_contato' | 'fechou_plano' | 'nao_fechou' | 'bonus_liberado';
export type IndicacaoTechSoftStatus = 'enviada' | 'em_contato' | 'comprou_fechou' | 'nao_converteu' | 'brinde_liberado' | 'brinde_retirado';

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
  telefone?: string;
  whatsapp?: string;
  email?: string;
  endereco?: string;
  descricao?: string;
  instagram?: string;
  logo_url?: string;
  created_at: string;
}

export interface ParceiroUsuario {
  id: string;
  nome: string;
  email: string;
  senha: string;
  empresa_id: string;
  tipo_acesso: 'parceiro';
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

export interface OfertaParceiro {
  id: string;
  empresa_id: string;
  nome: string;
  tipo: OfertaTipo;
  preco_normal: string;
  preco_techpass: string;
  economia: string;
  descricao: string;
  regras: string;
  beneficio_extra: string;
  status: OfertaStatus;
  cta: string;
  descricao_completa: string;
  validade: string | null;
  origem: 'admin' | 'parceiro';
  cashback_ativo: boolean;
  cashback_tipo: OfertaCashbackTipo;
  cashback_valor: number | null;
  cashback_limite: number | null;
  cashback_regras: string;
  cashback_descricao_cliente: string;
  created_at: string;
}

export interface LeadParceiro {
  id: string;
  cliente_id: string;
  techpass_id: string;
  empresa_id: string;
  oferta_id: string;
  oferta_nome: string;
  telefone_cliente: string;
  status: LeadStatus;
  observacao: string;
  created_at: string;
}

export interface IndicacaoFightCore {
  id: string;
  cliente_id: string;
  techpass_id: string;
  nome_indicado: string;
  telefone_indicado: string;
  observacao: string;
  status: IndicacaoFightCoreStatus;
  created_at: string;
}

export interface IndicacaoTechSoft {
  id: string;
  cliente_id: string;
  techpass_id: string;
  nome_indicado: string;
  telefone_indicado: string;
  observacao: string;
  status: IndicacaoTechSoftStatus;
  valor_compra: number;
  gerou_brinde: boolean;
  created_at: string;
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

export interface CashbackSetting {
  id: string;
  empresa_id: string;
  ativo: boolean;
  valor_minimo: number;
  tipo_calculo: CashbackCalculoTipo;
  limite_maximo: number;
  regras_uso: string;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}

export interface CashbackBalance {
  id: string;
  cliente_id: string;
  empresa_id: string;
  saldo_disponivel: number;
  saldo_pendente: number;
  limite_maximo: number;
  updated_at: string;
}

export interface CashbackTransaction {
  id: string;
  cliente_id: string;
  techpass_id: string;
  empresa_id: string;
  oferta_id: string | null;
  lead_id: string | null;
  tipo: CashbackTransactionTipo;
  valor: number;
  status: CashbackTransactionStatus;
  descricao: string;
  valor_compra: number;
  created_at: string;
}

export interface AppState {
  empresas: Empresa[];
  parceiro_usuarios: ParceiroUsuario[];
  clientes: Cliente[];
  techpasses: TechPass[];
  pending_activations: PendingActivation[];
  cashback_movements: CashbackMovement[];
  cashback_settings: CashbackSetting[];
  cashback_balances: CashbackBalance[];
  cashback_transactions: CashbackTransaction[];
  indicacoes: Indicacao[];
  utilizacoes: Utilizacao[];
  beneficios_servicos: BeneficioServico[];
  solicitacoes: Solicitacao[];
  ofertas: OfertaParceiro[];
  leads: LeadParceiro[];
  fight_core_indicacoes: IndicacaoFightCore[];
  techsoft_indicacoes: IndicacaoTechSoft[];
}
