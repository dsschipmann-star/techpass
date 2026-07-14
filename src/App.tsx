import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Ban,
  Bell,
  Building2,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Film,
  FileText,
  FileWarning,
  Gift,
  Handshake,
  LockKeyhole,
  Plus,
  Printer,
  QrCode as QrCodeIcon,
  RefreshCw,
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
  X,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { BENEFICIOS_PADRAO, SERVICOS_TECHSOFT, STATUS_LABEL, STATUS_STYLE } from './data';
import { hasSupabaseConfig } from './lib/supabase';
import {
  formatDate,
  formatDateTime,
  formatMoney,
  getCashbackBalance,
  getClientName,
  getCompanyCashbackBalance,
  getEmpresaName,
  getTechPassSecret,
  normalizeSecretCode,
  useTechPassStore,
} from './lib/store';
import type { AppState, BeneficioServico, BeneficioServicoTipo, Budget, BudgetItem, BudgetStatus, CashbackCalculoTipo, CashbackTipo, IndicacaoFightCoreStatus, IndicacaoStatus, IndicacaoTechSoftStatus, LeadParceiro, LeadStatus, LogNivel, NotificationItem, NotificationTipo, OfertaCashbackTipo, OfertaParceiro, OfertaTipo, RecompensaTipo, Solicitacao, SolicitacaoStatus, TechPass, TechPassStatus } from './types';
import { Button, Card, Field, Input, Pill, Select, Stat, Textarea, cx } from './components/ui';
import { QrCode, createQrDataUrl } from './components/QrCode';
import fightCoreLogo from './assets/fight-core-logo.png';
import superGeeksLogo from './assets/super-geeks-logo.png';
import techsoftLogo from './assets/techsoft-logo.png';
import techpassVoucherMockup from './assets/techpass-voucher-mockup.png';

type AdminView = 'dashboard' | 'saude' | 'atendimento' | 'empresas' | 'techpass' | 'qrcodes' | 'pendentes' | 'ativar' | 'validar' | 'orcamentos' | 'cashback' | 'indicacoes' | 'solicitacoes' | 'beneficios' | 'ofertas' | 'clientes' | 'logs';

const ADMIN_NAV: Array<{ id: AdminView; label: string; icon: typeof Activity }> = [
  { id: 'dashboard', label: 'Dashboard', icon: Activity },
  { id: 'saude', label: 'Saude da Rede', icon: ShieldCheck },
  { id: 'atendimento', label: 'Atendimento na loja', icon: ScanLine },
  { id: 'empresas', label: 'Empresas parceiras', icon: Building2 },
  { id: 'techpass', label: 'Gerar TechPass', icon: CreditCard },
  { id: 'qrcodes', label: 'QR Codes', icon: QrCodeIcon },
  { id: 'pendentes', label: 'Cadastros pendentes', icon: UserCheck },
  { id: 'ativar', label: 'Ativar TechPass', icon: ShieldCheck },
  { id: 'validar', label: 'Validar TechPass', icon: BadgeCheck },
  { id: 'orcamentos', label: 'Orçamentos em PDF', icon: FileText },
  { id: 'cashback', label: 'Cashback', icon: Wallet },
  { id: 'indicacoes', label: 'Indique e Ganhe', icon: Gift },
  { id: 'solicitacoes', label: 'Solicitações', icon: Store },
  { id: 'beneficios', label: 'Benefícios e Serviços', icon: Sparkles },
  { id: 'ofertas', label: 'Editor de ofertas', icon: Handshake },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'logs', label: 'Logs do Sistema', icon: FileWarning },
];

const SOLICITACAO_LABEL: Record<SolicitacaoStatus, string> = {
  nova: 'Nova solicitação',
  analise: 'Em análise',
  confirmada: 'Confirmada',
  atendimento: 'Em atendimento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

const BUDGET_STATUS_LABEL: Record<BudgetStatus, string> = {
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
  concluido: 'Concluído',
};

const DEFAULT_WARRANTY_TEXT = 'Este serviço possui garantia de 6 meses a partir da data de conclusão.\n\nA garantia não cobre danos causados por mau uso, quedas, oscilações elétricas, líquidos ou intervenção de terceiros.';

const TECHSOFT_BUDGET_INFO = {
  nome: 'TechSoft Campinas',
  cnpj: '54.925.863/0001-07',
  email: 'techsoft.campinas@gmail.com',
  responsavel: 'Fabiano Oliveira / Matheus Schipmann',
  endereco: 'Rua Josué Di Bernardi, 221 - Campinas / São José - SC',
};

const BUDGET_SERVICE_PRESETS = [
  { id: 'iphone-11-screen-low', categoria: 'Celular', modelo: 'iPhone 11', peca: 'Tela compatível baixo custo', nome: 'Troca de tela iPhone 11 - peça compatível baixo custo', valor: 390 },
  { id: 'iphone-11-screen-mid', categoria: 'Celular', modelo: 'iPhone 11', peca: 'Tela compatível premium', nome: 'Troca de tela iPhone 11 - peça compatível premium', valor: 590 },
  { id: 'iphone-11-screen-high', categoria: 'Celular', modelo: 'iPhone 11', peca: 'Peça original/padrão autorizado', nome: 'Troca de tela iPhone 11 - peça original/premium', valor: 890 },
  { id: 'iphone-12-screen-low', categoria: 'Celular', modelo: 'iPhone 12/13', peca: 'Tela compatível baixo custo', nome: 'Troca de tela iPhone 12/13 - peça compatível baixo custo', valor: 590 },
  { id: 'iphone-12-screen-mid', categoria: 'Celular', modelo: 'iPhone 12/13', peca: 'Tela OLED compatível premium', nome: 'Troca de tela iPhone 12/13 - OLED compatível premium', valor: 890 },
  { id: 'iphone-12-screen-high', categoria: 'Celular', modelo: 'iPhone 12/13', peca: 'Peça original/padrão autorizado', nome: 'Troca de tela iPhone 12/13 - peça original/premium', valor: 1450 },
  { id: 'samsung-a-screen-low', categoria: 'Celular', modelo: 'Samsung linha A', peca: 'Display compatível baixo custo', nome: 'Troca de display Samsung linha A - compatível baixo custo', valor: 250 },
  { id: 'samsung-a-screen-mid', categoria: 'Celular', modelo: 'Samsung linha A', peca: 'Display compatível premium', nome: 'Troca de display Samsung linha A - compatível premium', valor: 390 },
  { id: 'samsung-a-screen-high', categoria: 'Celular', modelo: 'Samsung linha A', peca: 'Display original', nome: 'Troca de display Samsung linha A - peça original', valor: 650 },
  { id: 'samsung-s-screen-low', categoria: 'Celular', modelo: 'Samsung linha S', peca: 'Display compatível', nome: 'Troca de display Samsung linha S - compatível', valor: 650 },
  { id: 'samsung-s-screen-mid', categoria: 'Celular', modelo: 'Samsung linha S', peca: 'Display premium', nome: 'Troca de display Samsung linha S - premium', valor: 950 },
  { id: 'samsung-s-screen-high', categoria: 'Celular', modelo: 'Samsung linha S', peca: 'Display original', nome: 'Troca de display Samsung linha S - peça original', valor: 1500 },
  { id: 'iphone-battery-low', categoria: 'Celular', modelo: 'iPhone 11/12/13', peca: 'Bateria compatível', nome: 'Troca de bateria iPhone - compatível', valor: 220 },
  { id: 'iphone-battery-mid', categoria: 'Celular', modelo: 'iPhone 11/12/13', peca: 'Bateria premium', nome: 'Troca de bateria iPhone - premium', valor: 320 },
  { id: 'iphone-battery-high', categoria: 'Celular', modelo: 'iPhone 11/12/13', peca: 'Bateria original/padrão autorizado', nome: 'Troca de bateria iPhone - original/premium', valor: 490 },
  { id: 'connector-phone', categoria: 'Celular', modelo: 'iPhone / Samsung / Motorola', peca: 'Conector de carga', nome: 'Troca de conector de carga', valor: 240 },
  { id: 'diagnostic-phone', categoria: 'Celular', modelo: 'Smartphone', peca: 'Diagnóstico técnico', nome: 'Diagnóstico técnico de smartphone', valor: 60 },
  { id: 'format-pc', categoria: 'Computador', modelo: 'PC/Notebook', peca: 'Serviço técnico', nome: 'Formatação com backup básico e drivers', valor: 160 },
  { id: 'ssd-240-low', categoria: 'Computador', modelo: 'Notebook/PC', peca: 'SSD 240GB entrada', nome: 'Upgrade SSD 240GB - peça entrada + instalação', valor: 260 },
  { id: 'ssd-480-mid', categoria: 'Computador', modelo: 'Notebook/PC', peca: 'SSD 480/512GB intermediário', nome: 'Upgrade SSD 480/512GB - peça intermediária + instalação', valor: 430 },
  { id: 'ssd-1tb-high', categoria: 'Computador', modelo: 'Notebook/PC', peca: 'SSD 1TB premium', nome: 'Upgrade SSD 1TB - peça premium + instalação', valor: 720 },
  { id: 'ram-8gb', categoria: 'Computador', modelo: 'Notebook/PC', peca: 'Memória RAM 8GB', nome: 'Upgrade memória RAM 8GB + instalação', valor: 320 },
  { id: 'ram-16gb', categoria: 'Computador', modelo: 'Notebook/PC', peca: 'Memória RAM 16GB', nome: 'Upgrade memória RAM 16GB + instalação', valor: 520 },
  { id: 'notebook-clean', categoria: 'Computador', modelo: 'Notebook', peca: 'Limpeza interna', nome: 'Limpeza interna de notebook com troca de pasta térmica', valor: 220 },
  { id: 'console-clean', categoria: 'Videogame', modelo: 'PS4/PS5/Xbox', peca: 'Limpeza preventiva', nome: 'Limpeza preventiva de videogame', valor: 250 },
  { id: 'controller-analog', categoria: 'Videogame', modelo: 'Controle PS/Xbox', peca: 'Analógico compatível', nome: 'Troca de analógico de controle', valor: 180 },
];

const TIPO_LABEL: Record<BeneficioServicoTipo, string> = {
  beneficio: 'Benefício',
  servico_desconto: 'Serviço com desconto',
  brinde: 'Brinde',
  cashback: 'Cashback',
  indicacao: 'Indicação',
};

const OFERTA_TIPO_LABEL: Record<OfertaTipo, string> = {
  plano: 'Plano',
  aula_gratis: 'Aula grátis',
  servico: 'Serviço',
  brinde: 'Brinde',
  desconto: 'Desconto',
  cashback: 'Cashback',
  indicacao: 'Indicação',
  renovacao: 'Renovação',
};

const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  novo: 'Novo lead',
  contato_realizado: 'Contato realizado',
  negociacao: 'Em negociação',
  fechado: 'Fechado',
  perdido: 'Perdido',
  cancelado: 'Cancelado',
};

const FIGHT_CORE_INDICACAO_LABEL: Record<IndicacaoFightCoreStatus, string> = {
  enviada: 'Enviada',
  em_contato: 'Em contato',
  fechou_plano: 'Fechou plano',
  nao_fechou: 'Não fechou',
  bonus_liberado: 'Bônus liberado',
};

const TECHSOFT_INDICACAO_LABEL: Record<IndicacaoTechSoftStatus, string> = {
  enviada: 'Enviada',
  em_contato: 'Em contato',
  comprou_fechou: 'Comprou/fechou serviço',
  nao_converteu: 'Não converteu',
  brinde_liberado: 'Brinde liberado',
  brinde_retirado: 'Brinde retirado',
};

const CASHBACK_CALCULO_LABEL: Record<CashbackCalculoTipo, string> = {
  valor_fixo: 'Valor fixo',
  percentual: 'Percentual sobre a compra',
  proporcional: 'Proporcional ao plano',
  oferta_especifica: 'Por oferta específica',
};

const OFERTA_CASHBACK_LABEL: Record<OfertaCashbackTipo, string> = {
  sem_cashback: 'Sem cashback',
  valor_fixo: 'Valor fixo',
  percentual: 'Percentual',
  proporcional: 'Proporcional',
  mensalidade: 'Equivalente a mensalidade',
};

const NOTIFICATION_TYPE_LABEL: Record<NotificationTipo, string> = {
  informacao: 'Informação',
  sucesso: 'Sucesso',
  alerta: 'Alerta',
  erro: 'Erro',
};

const NOTIFICATION_TYPE_STYLE: Record<NotificationTipo, string> = {
  informacao: 'border-sky-300/30 bg-sky-400/10 text-sky-100',
  sucesso: 'border-tech-neon/40 bg-tech-neon/10 text-tech-neon',
  alerta: 'border-yellow-300/30 bg-yellow-400/10 text-yellow-100',
  erro: 'border-red-300/30 bg-red-400/10 text-red-100',
};

const LOG_LEVEL_STYLE: Record<LogNivel, string> = {
  info: 'border-sky-300/30 bg-sky-400/10 text-sky-100',
  warning: 'border-yellow-300/30 bg-yellow-400/10 text-yellow-100',
  error: 'border-red-300/30 bg-red-400/10 text-red-100',
  critical: 'border-red-500/50 bg-red-500/20 text-red-100',
};

const LANDING_PARTNERS = [
  {
    name: 'TechSoft',
    category: 'Assistência técnica e acessórios',
    benefit: '30% OFF em mão de obra, 15% OFF em acessórios, TechCash e serviços exclusivos.',
    offer: 'Cashback em compras acima de R$250 e vantagens em manutenção.',
    status: 'Parceiro ativo',
    icon: 'TS',
  },
  {
    name: 'Super Geeks',
    category: 'Educação e tecnologia',
    benefit: 'Condições especiais para alunos e famílias TechPass.',
    offer: 'Plano anual com condição especial e matrícula promocional.',
    status: 'Parceiro ativo',
    image: superGeeksLogo,
  },
  {
    name: 'Fight Core',
    category: 'Academia de luta',
    benefit: 'Aula experimental e condição especial para membros TechPass.',
    offer: 'Plano anual com desconto exclusivo.',
    status: 'Parceiro ativo',
    image: fightCoreLogo,
  },
  {
    name: 'Barbearia Prime',
    category: 'Barbearia',
    benefit: '15% OFF em corte ou combo barba + cabelo.',
    offer: 'Combo premium com brinde.',
    status: 'Exemplo de parceiro',
    icon: 'BP',
  },
  {
    name: 'Ótica Vision',
    category: 'Ótica',
    benefit: 'Desconto especial em armações selecionadas.',
    offer: 'Consulta ou ajuste gratuito.',
    status: 'Exemplo de parceiro',
    icon: 'OV',
  },
  {
    name: 'Café Central',
    category: 'Cafeteria',
    benefit: '10% OFF em combos selecionados.',
    offer: 'Café grátis em compras acima de valor definido.',
    status: 'Exemplo de parceiro',
    icon: 'CC',
  },
  {
    name: 'Auto Center Pro',
    category: 'Oficina automotiva',
    benefit: 'Check-up gratuito para membros TechPass.',
    offer: 'Desconto em troca de óleo ou revisão.',
    status: 'Exemplo de parceiro',
    icon: 'AC',
  },
  {
    name: 'Studio Fit',
    category: 'Saúde e bem-estar',
    benefit: 'Avaliação inicial gratuita.',
    offer: 'Condição especial em plano trimestral ou anual.',
    status: 'Exemplo de parceiro',
    icon: 'SF',
  },
];

const LANDING_OFFERS = [
  {
    company: 'Super Geeks',
    title: 'Plano Anual Programação',
    normal: 'R$ 340/mês',
    techpass: 'R$ 299/mês',
    saving: 'R$ 492 por ano',
    bonus: 'Matrícula promocional',
    cta: 'Quero esta condição',
  },
  {
    company: 'Fight Core',
    title: 'Plano Anual de Treinos',
    normal: 'R$ 199/mês',
    techpass: 'R$ 159/mês',
    saving: 'R$ 480 por ano',
    bonus: 'Aula experimental',
    cta: 'Tenho interesse',
  },
  {
    company: 'TechSoft',
    title: 'Troca de Tela',
    normal: 'R$ 1.190',
    techpass: 'R$ 899',
    saving: 'R$ 291',
    bonus: 'Orçamento prioritário',
    cta: 'Solicitar orçamento',
  },
];

const PARTNER_RECEIVES = [
  { icon: CreditCard, title: 'Vouchers TechPass para seus clientes', text: 'Venda, presenteie ou use TechPass como bônus em planos, serviços e campanhas locais.' },
  { icon: Building2, title: 'Divulgação na Rede TechPass', text: 'Sua marca aparece na landing, no painel do cliente e nas ofertas exclusivas.' },
  { icon: UserCheck, title: 'Leads qualificados', text: 'O cliente informa interesse e contexto antes de chamar no WhatsApp.' },
  { icon: Store, title: 'Agenda e solicitações pelo sistema', text: 'Receba pedidos de serviços, aulas, planos, brindes e benefícios pelo TechPass.' },
  { icon: Activity, title: 'Painel parceiro', text: 'Acompanhe solicitações, leads, métricas, ofertas e benefícios em um painel próprio.' },
  { icon: Sparkles, title: 'Ofertas exclusivas', text: 'Cadastre planos, descontos, brindes e condições especiais para membros TechPass.' },
];

const PARTNER_FLOW = [
  ['01', 'Sua empresa entra na Rede', 'Cadastramos sua empresa, logo, benefícios e ofertas.'],
  ['02', 'Você recebe TechPass', 'Os vouchers podem ser vendidos, dados como brinde ou usados em campanhas.'],
  ['03', 'O cliente ativa o benefício', 'Ele escaneia o QR Code, faz cadastro e ativa conforme as regras.'],
  ['04', 'Ele acessa ofertas e agenda serviços', 'O cliente visualiza benefícios da sua empresa e de outros parceiros.'],
  ['05', 'Você recebe leads prontos', 'A solicitação chega com pré-formulário e caminho para WhatsApp.'],
];

const PARTNER_ADVANTAGES = [
  'Aumenta o valor percebido dos seus planos e serviços',
  'Cria diferenciação frente aos concorrentes',
  'Ajuda a fechar planos maiores',
  'Gera indicação cruzada entre empresas',
  'Atrai clientes de outras marcas parceiras',
  'Organiza leads e solicitações',
  'Facilita o contato pelo WhatsApp',
  'Ajuda a medir clientes vindos pelo TechPass',
];

const PRE_FORM_EXAMPLES = [
  { niche: 'Assistência técnica', questions: ['Qual aparelho precisa de atendimento?', 'Qual o modelo?', 'Qual problema está acontecendo?', 'Tem urgência?'] },
  { niche: 'Academia', questions: ['Qual modalidade deseja conhecer?', 'Já treinou antes?', 'Qual seu objetivo?', 'Prefere manhã, tarde ou noite?'] },
  { niche: 'Escola de tecnologia', questions: ['Qual a idade do aluno?', 'Já teve contato com programação?', 'Interesse em games, robótica ou tecnologia?', 'Melhor horário para contato?'] },
  { niche: 'Barbearia', questions: ['Qual serviço deseja?', 'Corte, barba ou combo?', 'Data desejada?', 'Preferência de horário?'] },
];

const PARTNER_USE_CASES = [
  ['Super Geeks', 'Entrega TechPass como bônus para alunos do plano anual e recebe leads de famílias interessadas em tecnologia.'],
  ['Fight Core', 'Oferece aula experimental e planos com condição especial para atrair alunos vindos de parceiros da rede.'],
  ['TechSoft', 'Oferece benefícios em manutenção, acessórios, TechCash e indicação para gerar movimento na loja.'],
  ['Barbearia parceira', 'Oferece desconto ou brinde no combo premium e recebe clientes qualificados pelo pré-formulário.'],
];

const PARTNER_PLANS = [
  ['Parceiro Inicial', 'Ideal para testar a Rede TechPass.', 'Quantidade limitada de vouchers e divulgação básica.'],
  ['Parceiro Premium', 'Mais presença e mais campanhas.', 'Mais vouchers, destaque na landing, ofertas exclusivas e acesso ao painel.'],
  ['Parceiro Estratégico', 'Para ações conjuntas e recorrentes.', 'Campanhas personalizadas, destaque maior, integração de agenda e ações locais.'],
];

const PARTNER_OBJECTIONS = [
  ['Não quero dar mais desconto', 'O TechPass posiciona a vantagem como benefício de rede, não como desconto avulso. Você protege o preço principal e aumenta o valor percebido.'],
  ['Não tenho tempo para organizar leads', 'O cliente chega com oferta escolhida, respostas do pré-formulário e telefone. O painel concentra status, observações e histórico.'],
  ['Como sei que isso gera resultado?', 'Cada lead, solicitação, oferta e conversão pode ser acompanhado por empresa, campanha e status dentro do painel parceiro.'],
];

const PARTNER_FAQ = [
  ['Preciso criar backend ou login agora?', 'Não. Esta etapa é front-end para apresentar a parceria. O painel parceiro já existe no MVP para demonstrar o fluxo.'],
  ['Minha empresa pode escolher quais benefícios oferecer?', 'Sim. O parceiro pode cadastrar ofertas, benefícios, brindes, descontos, cashback ou regras de indicação.'],
  ['Ofertas aparecem direto para clientes?', 'Ofertas criadas por parceiros podem ficar pendentes de aprovação antes de aparecerem para membros TechPass.'],
  ['O cliente chama direto no WhatsApp?', 'Antes, ele pode responder um pré-formulário. Depois o botão abre o WhatsApp com uma mensagem estruturada para atendimento.'],
  ['Serve para empresas fora de tecnologia?', 'Sim. A página traz exemplos para academia, escola de tecnologia, barbearia, assistência técnica e outros segmentos locais.'],
];

function getSerialFromPath(pathname: string) {
  const match = pathname.match(/^\/techpass\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function getEffectiveStatus(techpass: TechPass): TechPassStatus {
  if (techpass.status === 'ATIVO' && techpass.expires_at && new Date(techpass.expires_at) < new Date()) {
    return 'EXPIRADO';
  }
  return techpass.status;
}

function parseMoneyText(value: string | null | undefined) {
  if (!value) return 0;
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  return Number(normalized) || 0;
}

function getOfferSavingsValue(oferta: OfertaParceiro) {
  const explicit = parseMoneyText(oferta.economia);
  if (explicit > 0) return explicit;
  const normal = parseMoneyText(oferta.preco_normal);
  const techpass = parseMoneyText(oferta.preco_techpass);
  return Math.max(normal - techpass, 0);
}

function getOfferScore(oferta: OfertaParceiro) {
  const savings = getOfferSavingsValue(oferta);
  const cashback = oferta.cashback_ativo ? oferta.cashback_valor ?? 35 : 0;
  const recurring = oferta.preco_techpass.toLowerCase().includes('mes') || oferta.preco_techpass.toLowerCase().includes('/m') ? 60 : 0;
  const activation = oferta.tipo === 'aula_gratis' || oferta.tipo === 'renovacao' ? 30 : 0;
  return savings + cashback + recurring + activation;
}

function getClientEconomy(state: AppState, clienteId: string, techpass: TechPass) {
  const companyBalances = state.cashback_balances.filter((item) => item.cliente_id === clienteId);
  const cashbackAvailable = companyBalances.reduce((sum, item) => sum + item.saldo_disponivel, 0);
  const cashbackPending = companyBalances.reduce((sum, item) => sum + item.saldo_pendente, 0);
  const filmsUsed = Math.max(6 - techpass.peliculas_restantes, 0);
  const filmsValue = filmsUsed * 35;
  const usageValue = state.utilizacoes.filter((item) => item.cliente_id === clienteId).reduce((sum, item) => sum + (item.beneficio.toLowerCase().includes('pelicula') ? 35 : 45), 0);
  const leadsValue = state.leads.filter((item) => item.cliente_id === clienteId && item.status === 'fechado').reduce((sum, lead) => {
    const offer = state.ofertas.find((item) => item.id === lead.oferta_id);
    return sum + (offer ? getOfferSavingsValue(offer) : 0);
  }, 0);
  const confirmedValue = Math.max(filmsValue, usageValue) + cashbackAvailable + leadsValue;
  const potentialValue = state.ofertas.filter((oferta) => oferta.status === 'ativo' && state.empresas.find((empresa) => empresa.id === oferta.empresa_id)?.status === 'ativa').reduce((sum, oferta) => sum + Math.min(getOfferSavingsValue(oferta), 500), 0);
  return { cashbackAvailable, cashbackPending, filmsUsed, filmsValue, usageValue, leadsValue, confirmedValue, potentialValue };
}

function StatusPill({ status }: { status: TechPassStatus }) {
  return <Pill className={STATUS_STYLE[status]}>{STATUS_LABEL[status]}</Pill>;
}

function EmptyMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-white/15 p-6 text-center">
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm text-zinc-400">{description}</p>
    </div>
  );
}

function notificationIcon(type: NotificationTipo) {
  if (type === 'sucesso') return CheckCircle2;
  if (type === 'alerta') return AlertTriangle;
  if (type === 'erro') return Ban;
  return Bell;
}

function NotificationBell({ notifications, actions, navigate, scope }: { notifications: NotificationItem[]; actions: ReturnType<typeof useTechPassStore>['actions']; navigate: (path: string) => void; scope?: { tipo_usuario?: 'admin' | 'parceiro' | 'cliente'; user_id?: string | null; empresa_id?: string | null } }) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((item) => !item.lida).length;
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(true)} className="relative inline-flex min-h-11 items-center gap-2 rounded-md border border-white/15 bg-white/[0.06] px-3 text-sm font-black text-white transition hover:border-tech-neon/50">
        <Bell className="h-4 w-4 text-tech-neon" />
        <span>{unread}</span>
        {unread > 0 && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-tech-neon shadow-neon" />}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <aside className="ml-auto grid h-full w-full max-w-md content-start gap-4 border-l border-white/10 bg-[#080808] p-5 text-tech-ink shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-tech-neon">Notificações</p>
                <h2 className="text-2xl font-black text-white">{unread} não lidas</h2>
              </div>
              <button type="button" className="rounded-md border border-white/10 p-2 text-zinc-300 hover:text-white" onClick={() => setOpen(false)}><X className="h-4 w-4" /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => actions.markAllNotificationsRead(scope)}>Marcar todas</Button>
              <Button variant="secondary" onClick={() => { setOpen(false); navigate('/notifications'); }}>Ver central</Button>
            </div>
            <div className="grid max-h-[calc(100vh-170px)] gap-3 overflow-auto pr-1">
              {notifications.slice(0, 8).map((item) => <NotificationRow key={item.id} item={item} actions={actions} navigate={navigate} compact />)}
              {notifications.length === 0 && <EmptyMessage title="Sem notificações" description="Novos eventos aparecerão aqui." />}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function NotificationRow({ item, actions, navigate, compact = false }: { item: NotificationItem; actions: ReturnType<typeof useTechPassStore>['actions']; navigate: (path: string) => void; compact?: boolean }) {
  const Icon = notificationIcon(item.tipo);
  return (
    <button type="button" onClick={() => { actions.markNotificationRead(item.id); if (item.url) navigate(item.url); }} className={cx('grid gap-3 rounded-lg border p-4 text-left transition hover:border-tech-neon/50', item.lida ? 'border-white/10 bg-white/[0.035]' : 'border-tech-neon/35 bg-tech-neon/10', compact ? '' : 'md:grid-cols-[auto_1fr_auto] md:items-start')}>
      <div className={cx('grid h-10 w-10 place-items-center rounded-md', NOTIFICATION_TYPE_STYLE[item.tipo])}><Icon className="h-5 w-5" /></div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-black text-white">{item.titulo}</p>
          {!item.lida && <span className="h-2 w-2 rounded-full bg-tech-neon" />}
        </div>
        <p className="mt-1 text-sm leading-6 text-zinc-400">{item.descricao}</p>
        <p className="mt-2 text-xs font-bold uppercase text-zinc-500">{NOTIFICATION_TYPE_LABEL[item.tipo]} · {formatDateTime(item.created_at)}</p>
      </div>
      {!compact && <Pill className={NOTIFICATION_TYPE_STYLE[item.tipo]}>{item.tipo_usuario}</Pill>}
    </button>
  );
}

function App() {
  const { state, actions } = useTechPassStore();
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const navigate = (target: string) => {
    window.history.pushState({}, '', target);
    setPath(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const publicSerial = getSerialFromPath(path);
  if (publicSerial) {
    return <PublicTechPassPage serial={publicSerial} state={state} actions={actions} />;
  }

  if (path.startsWith('/admin')) {
    return <AdminApp state={state} actions={actions} navigate={navigate} />;
  }

  if (path.startsWith('/notifications')) {
    return <NotificationsPage state={state} actions={actions} navigate={navigate} />;
  }

  if (path.startsWith('/login')) {
    return <ClientLogin state={state} navigate={navigate} />;
  }

  if (path.startsWith('/minha-economia')) {
    return <MyEconomyPage state={state} navigate={navigate} />;
  }

  if (path.startsWith('/cliente')) {
    return <ClientArea state={state} actions={actions} navigate={navigate} />;
  }

  if (path.startsWith('/parceiro/login')) {
    return <PartnerLogin state={state} navigate={navigate} />;
  }

  if (path.startsWith('/parceiro/dashboard')) {
    return <PartnerDashboard state={state} actions={actions} navigate={navigate} />;
  }

  if (path.startsWith('/parceiros') || path.startsWith('/seja-parceiro')) {
    return <PartnerLandingPage navigate={navigate} />;
  }

  if (path.startsWith('/empresa')) {
    return <PartnerArea state={state} actions={actions} navigate={navigate} />;
  }

  return <ShortLandingPage state={state} navigate={navigate} />;
}

function NotificationsPage({ state, actions, navigate }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions']; navigate: (path: string) => void }) {
  const [filter, setFilter] = useState<'todas' | 'nao_lidas' | NotificationTipo>('todas');
  const filtered = state.notifications.filter((item) => {
    if (filter === 'todas') return true;
    if (filter === 'nao_lidas') return !item.lida;
    return item.tipo === filter;
  });
  const filterOptions: Array<[typeof filter, string]> = [
    ['todas', 'Todas'],
    ['nao_lidas', 'Não lidas'],
    ['alerta', 'Alertas'],
    ['erro', 'Erros'],
    ['sucesso', 'Sucesso'],
    ['informacao', 'Informações'],
  ];
  return (
    <PublicShell>
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageTitle title="Central de notificações" subtitle="Acompanhe eventos do cliente, parceiro e administrador." />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => actions.markAllNotificationsRead()}>Marcar todas como lidas</Button>
            <Button variant="secondary" onClick={() => navigate('/')}>Voltar</Button>
          </div>
        </div>
        <Card className="flex flex-wrap gap-2">
          {filterOptions.map(([id, label]) => <button key={id} type="button" onClick={() => setFilter(id)} className={cx('rounded-md px-3 py-2 text-sm font-black transition', filter === id ? 'bg-tech-neon text-black' : 'border border-white/10 text-zinc-300 hover:text-white')}>{label}</button>)}
        </Card>
        <div className="grid gap-3">
          {filtered.map((item) => <NotificationRow key={item.id} item={item} actions={actions} navigate={navigate} />)}
          {filtered.length === 0 && <EmptyMessage title="Nenhuma notificação encontrada" description="Altere o filtro ou aguarde novos eventos do sistema." />}
        </div>
      </div>
    </PublicShell>
  );
}

function ShortLandingPage({ state, navigate }: { state: AppState; navigate: (path: string) => void }) {
  const activePartners = state.empresas.filter((empresa) => empresa.status === 'ativa');
  const steps = [
    ['1', 'Escaneie o QR Code', 'Use o QR do voucher ou acesse a tela de ativação pelo botão abaixo.'],
    ['2', 'Digite o código secreto', 'O código vem no voucher físico e libera o pré-cadastro do cliente.'],
    ['3', 'Escolha Gift ou Premium', 'Gift ganha 1 película. Premium libera benefícios anuais por R$59,90.'],
    ['4', 'Finalize na TechSoft', 'Compareça com documento para ativar e usar os benefícios com segurança.'],
  ];
  return (
    <div className="min-h-screen bg-[#050607] text-white">
      <header className="border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Brand />
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate('/login')}>Entrar</Button>
            <Button onClick={() => navigate('/techpass/TP-SG-000001')}>Ativar TechPass</Button>
          </div>
        </div>
      </header>
      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_420px] lg:items-center lg:py-20">
          <div>
            <Pill className="border-tech-neon/40 bg-tech-neon/10 text-tech-neon">TechSoft Campinas</Pill>
            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.95] text-white sm:text-7xl">Cadastre seu TechPass em poucos passos.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">Escolha Gift ou Premium, faça o cadastro pelo voucher e finalize a ativação presencialmente na TechSoft.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button className="min-h-12 rounded-full px-6 text-base" onClick={() => navigate('/techpass/TP-SG-000001')}>Começar cadastro <ArrowRight className="h-4 w-4" /></Button>
              <Button variant="secondary" className="min-h-12 rounded-full px-6 text-base" onClick={() => navigate('/login')}>Já tenho cadastro</Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-zinc-300">
              <Pill className="border-tech-neon/40 bg-tech-neon/10 text-tech-neon">Planos Gift e Premium</Pill>
              <Pill className="border-white/15 bg-white/[0.06] text-zinc-200">{activePartners.length || 3} empresas participantes</Pill>
              <Pill className="border-white/15 bg-white/[0.06] text-zinc-200">Ativação segura na loja</Pill>
              <Pill className="border-white/15 bg-white/[0.06] text-zinc-200">Dashboard do cliente</Pill>
            </div>
          </div>
          <Card className="border-tech-neon/30 bg-tech-neon/10 p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-tech-neon">Resumo rápido</p>
            <div className="mt-5 grid gap-3">
              {steps.map(([number, title, text]) => <div key={number} className="grid grid-cols-[40px_1fr] gap-4 rounded-lg border border-white/10 bg-black/30 p-4"><div className="grid h-10 w-10 place-items-center rounded-full bg-tech-neon font-black text-black">{number}</div><div><h3 className="font-black text-white">{title}</h3><p className="mt-1 text-sm leading-6 text-zinc-300">{text}</p></div></div>)}
            </div>
          </Card>
        </section>

        <section className="border-y border-white/10 bg-[#f5f7ef] text-[#10140f]">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-lg border border-black/10 bg-white p-6 shadow-sm">
                <p className="text-sm font-black uppercase text-zinc-500">Gift</p>
                <h2 className="mt-3 text-4xl font-black">Grátis</h2>
                <p className="mt-3 text-zinc-700">Para quem quer entrar no sistema TechPass e ganhar uma película ao concluir o cadastro.</p>
                <ul className="mt-6 grid gap-3 text-sm font-semibold text-zinc-800">
                  <li>1 película para cadastro concluído</li>
                  <li>Acesso ao dashboard do cliente</li>
                  <li>Ofertas públicas da rede</li>
                  <li>Ativação presencial na TechSoft</li>
                </ul>
                <Button className="mt-6" onClick={() => navigate('/techpass/TP-SG-000001')}>Cadastrar Gift</Button>
              </div>
              <div className="rounded-lg border border-tech-neon bg-[#071006] p-6 text-white shadow-[0_24px_70px_rgba(141,255,42,0.18)]">
                <p className="text-sm font-black uppercase text-tech-neon">Premium</p>
                <h2 className="mt-3 text-4xl font-black">R$59,90/ano</h2>
                <p className="mt-3 text-zinc-300">Para clientes que querem economizar em manutenção e participar das campanhas da Rede TechPass.</p>
                <ul className="mt-6 grid gap-3 text-sm font-semibold text-zinc-100">
                  <li>Garantia estendida conforme regra do serviço</li>
                  <li>Prêmios por indicações aprovadas</li>
                  <li>Cashback/benefícios em campanhas participantes</li>
                  <li>30% de desconto no valor da mão de obra</li>
                </ul>
                <Button className="mt-6" onClick={() => navigate('/techpass/TP-SG-000001')}>Ativar Premium</Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-tech-neon">Depois do cadastro</p>
              <h2 className="mt-3 text-4xl font-black">Você acompanha tudo pelo painel.</h2>
              <p className="mt-3 leading-7 text-zinc-400">Status do plano, benefícios, indicações, ofertas, solicitações e histórico ficam organizados no dashboard do cliente.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Info label="Benefício Gift" value="1 película" />
              <Info label="Premium anual" value="R$59,90" />
              <Info label="Mão de obra" value="30% OFF" />
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 px-4 py-8 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm text-zinc-400 md:flex-row md:items-center md:justify-between">
            <span>TechSoft Campinas · TechPass Premium</span>
            <Button variant="secondary" onClick={() => navigate('/parceiros')}>Seja parceiro</Button>
          </div>
        </footer>
      </main>
    </div>
  );
}

function LandingPage({ state, navigate }: { state: AppState; navigate: (path: string) => void }) {
  const activePartners = state.empresas.filter((empresa) => empresa.status === 'ativa');
  const activeOffers = state.ofertas.filter((oferta) => oferta.status === 'ativo').slice(0, 3);
  const partnerNames = activePartners.map((empresa) => empresa.nome);
  const faq = [
    ['O TechPass é um cartão de desconto?', 'Não. Ele é um voucher premium com QR Code, código secreto, painel do cliente, TechCash, ofertas exclusivas, indicações e benefícios controlados por status.'],
    ['Preciso ativar na loja?', 'Sim. O cadastro começa pelo QR Code, mas a liberação final acontece presencialmente para proteger o cliente, a empresa e os benefícios.'],
    ['Quanto posso economizar?', 'Depende do uso, mas a combinação de películas, TechCash, serviços com desconto e ofertas de parceiros pode passar de R$1.200 em valor percebido no ano.'],
    ['Consigo ver o benefício antes de chamar no WhatsApp?', 'Sim. As ofertas mostram preço normal, preço TechPass, economia estimada e regras antes do contato.'],
    ['O TechCash vira dinheiro?', 'Não. O saldo é usado em benefícios, descontos, brindes ou serviços participantes, conforme a regra da empresa parceira.'],
  ];

  return (
    <div className="landing-v2 min-h-screen overflow-hidden bg-[#050607] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050607]/78 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Brand />
          <nav className="hidden items-center gap-6 text-xs font-black uppercase tracking-[0.14em] text-zinc-400 lg:flex">
            <button className="transition hover:text-white" onClick={() => document.getElementById('economia')?.scrollIntoView({ behavior: 'smooth' })}>Economia</button>
            <button className="transition hover:text-white" onClick={() => document.getElementById('beneficios')?.scrollIntoView({ behavior: 'smooth' })}>Benefícios</button>
            <button className="transition hover:text-white" onClick={() => document.getElementById('empresas')?.scrollIntoView({ behavior: 'smooth' })}>Empresas</button>
            <button className="transition hover:text-white" onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}>Como funciona</button>
            <button className="transition hover:text-white" onClick={() => document.getElementById('faq-cliente')?.scrollIntoView({ behavior: 'smooth' })}>FAQ</button>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="hidden rounded-full sm:inline-flex" onClick={() => navigate('/login')}>Entrar</Button>
            <Button className="rounded-full px-5 shadow-[0_0_36px_rgba(141,255,42,0.2)]" onClick={() => navigate('/techpass/TP-SG-000001')}>Ativar TechPass</Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate mx-auto grid min-h-[calc(100vh-74px)] max-w-7xl gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:pb-24 lg:pt-20">
          <div className="premium-grid absolute inset-0 -z-20 opacity-70" />
          <div className="reveal-up">
            <Pill className="border-tech-neon/35 bg-tech-neon/10 px-3 py-1.5 text-tech-neon">Clube premium de vantagens locais</Pill>
            <h1 className="mt-7 max-w-5xl text-5xl font-black leading-[0.9] tracking-normal text-white sm:text-7xl lg:text-8xl">
              Um voucher. Dezenas de vantagens.
            </h1>
            <p className="mt-6 max-w-2xl text-xl font-semibold leading-8 text-zinc-300 sm:text-2xl">
              Economize antes mesmo de chamar no WhatsApp. Ative seu TechPass e veja ofertas, TechCash, benefícios e agendamentos em um dashboard só seu.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button className="min-h-12 rounded-full px-6 text-base shadow-[0_0_36px_rgba(141,255,42,0.24)] hover:scale-[1.02]" onClick={() => navigate('/techpass/TP-SG-000001')}>Ativar meu TechPass <ArrowRight className="h-4 w-4" /></Button>
              <Button variant="secondary" className="min-h-12 rounded-full px-6 text-base" onClick={() => document.getElementById('economia')?.scrollIntoView({ behavior: 'smooth' })}>Ver minha economia</Button>
            </div>
            <div className="mt-9 grid max-w-3xl grid-cols-3 gap-3">
              <PremiumStat value="R$1.240" label="valor anual estimado" />
              <PremiumStat value="6x" label="películas inclusas" />
              <PremiumStat value={String(activePartners.length || 3)} label="empresas ativas" />
            </div>
          </div>

          <div className="relative reveal-up lg:delay-150">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/12 bg-white/[0.06] p-3 shadow-2xl shadow-black/60 backdrop-blur-2xl">
              <img src={techpassVoucherMockup} alt="Mockup premium do voucher físico TechPass com QR Code e código de ativação" className="aspect-[1.16/1] w-full rounded-[1.35rem] object-cover" />
              <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/12 bg-black/75 p-4 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-tech-neon">Dashboard ativo</p>
                    <p className="mt-1 text-lg font-black text-white">R$ 68,50 em TechCash</p>
                  </div>
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-tech-neon text-black"><Wallet className="h-5 w-5" /></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="economia" className="border-y border-white/10 bg-[#f5f7ef] text-[#10140f]">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <SectionIntro eyebrow="Valor em 15 segundos" title="O TechPass precisa se pagar rápido. Por isso ele mostra a economia antes do contato." subtitle="Compare o que você pagaria como cliente comum com o que desbloqueia como membro ativo." dark={false} />
            <SavingsSimulator />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-6 sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-tech-neon">Cliente comum</p>
              <h2 className="mt-4 text-3xl font-black tracking-normal text-white sm:text-5xl">Paga primeiro. Descobre depois.</h2>
              <div className="mt-8 grid gap-3 text-zinc-400">
                {['Chama no WhatsApp sem saber a vantagem.', 'Paga preço cheio em serviços recorrentes.', 'Não acompanha histórico, saldo ou validade.', 'Perde ofertas porque não existe uma central.'].map((item) => <ComparisonLine key={item} tone="muted" text={item} />)}
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-tech-neon/35 bg-tech-neon p-6 text-black shadow-[0_24px_80px_rgba(141,255,42,0.18)] sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.2em]">Cliente TechPass</p>
              <h2 className="mt-4 text-3xl font-black tracking-normal sm:text-5xl">Vê a vantagem. Solicita com contexto.</h2>
              <div className="mt-8 grid gap-3">
                {['Compara preço normal x preço TechPass.', 'Acumula TechCash em compras participantes.', 'Acompanha benefícios, solicitações e indicações.', 'Ativa ofertas de TechSoft, Super Geeks e Fight Core.'].map((item) => <ComparisonLine key={item} tone="strong" text={item} />)}
              </div>
            </div>
          </div>
        </section>

        <section id="beneficios" className="border-y border-white/10 bg-[#080a09]">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <SectionIntro eyebrow="Benefícios por categoria" title="Um único acesso para tecnologia, educação, treino e recompensas." subtitle="A página não precisa listar tudo. Ela precisa mostrar que existe valor real em várias situações do mês." />
            <div className="mt-10 grid gap-4 lg:grid-cols-4">
              <BenefitTile className="lg:col-span-2 lg:row-span-2" icon={ShieldCheck} title="TechSoft sem improviso" value="30% OFF" text="Manutenção, diagnóstico, limpeza, acessórios, películas e TechCash em compras participantes." />
              <BenefitTile icon={Users} title="Super Geeks" value="R$492/ano" text="Condição especial no plano anual e renovação TechPass para famílias." />
              <BenefitTile icon={Activity} title="Fight Core" value="R$480" text="Planos especiais, aulas grátis e bônus por indicação qualificada." />
              <BenefitTile icon={Gift} title="Indique e ganhe" value="15 contatos" text="Campanhas por empresa com brindes, cashback ou bônus conforme regra." />
              <BenefitTile icon={Wallet} title="TechCash" value="R$100" text="Saldo acumulado para trocar por benefícios, descontos ou serviços." />
            </div>
          </div>
        </section>

        <section id="empresas" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionIntro eyebrow="Empresas participantes" title="Marcas locais conectadas por uma experiência premium." subtitle="Não é um cupom solto. Cada empresa tem ofertas, regras, leads e benefícios organizados dentro da rede." />
          <div className="mt-8 flex flex-wrap gap-3">
            {(partnerNames.length ? partnerNames : ['TechSoft', 'Super Geeks', 'Fight Core']).map((name) => <span key={name} className="rounded-full border border-white/12 bg-white/[0.055] px-5 py-3 text-sm font-black text-white">{name}</span>)}
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {(activeOffers.length ? activeOffers : state.ofertas.slice(0, 3)).map((offer) => <OfferPreview key={offer.id} state={state} offer={offer} />)}
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#f5f7ef] text-[#10140f]">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
            <SectionIntro eyebrow="Dashboard do cliente" title="Tudo que importa aparece em uma tela." subtitle="Status, validade, TechCash, películas, ofertas, solicitações e indicações. Sem depender de conversa perdida no WhatsApp." dark={false} />
            <ClientDashboardMockup />
          </div>
        </section>

        <section id="como-funciona" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionIntro eyebrow="Ativação simples" title="Três passos, sem bagunça." subtitle="O QR Code leva para a tela certa. O código secreto protege o voucher. A loja valida presencialmente." />
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            <ProcessCard number="01" title="Escaneie o voucher" text="Abra o QR Code e informe o código secreto impresso no TechPass físico." />
            <ProcessCard number="02" title="Envie o cadastro" text="Preencha CPF, telefone e dados do cliente para gerar a solicitação." />
            <ProcessCard number="03" title="Ative na loja" text="A equipe confere documento oficial e libera o painel de benefícios." />
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#080a09]">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <SectionIntro eyebrow="Prova de valor" title="Pensado para situações reais, não para uma lista bonita de descontos." subtitle="O TechPass é útil quando você troca película, faz manutenção, procura aula, fecha plano ou indica alguém." />
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              <TestimonialCard quote="Antes eu perguntava preço no WhatsApp. Agora eu vejo a condição TechPass e já solicito com o benefício certo." name="Maria Eduarda" role="Cliente TechPass" />
              <TestimonialCard quote="O painel deixou claro o que o cliente pediu. Chega menos conversa solta e mais atendimento pronto." name="Equipe parceira" role="Atendimento local" />
              <TestimonialCard quote="A vantagem ficou fácil de explicar: voucher, ativação presencial, dashboard e histórico de uso." name="TechSoft" role="Operação TechPass" />
            </div>
          </div>
        </section>

        <section id="faq-cliente" className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <SectionIntro eyebrow="FAQ" title="Perguntas antes de ativar." subtitle="Respostas curtas para decidir com segurança." center />
          <FaqList items={faq} />
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6">
          <FinalCta
            eyebrow="Comece pelo voucher"
            title="Ative seu TechPass e veja sua rede de vantagens em minutos."
            subtitle="Use o código secreto, faça o pré-cadastro e finalize a ativação presencial para desbloquear ofertas, TechCash e benefícios."
            primary="Ativar meu TechPass"
            secondary="Entrar no dashboard"
            onPrimary={() => navigate('/techpass/TP-SG-000001')}
            onSecondary={() => navigate('/login')}
          />
        </section>

        <footer className="border-t border-white/10 px-4 py-10 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 text-sm text-zinc-400 md:flex-row md:items-center md:justify-between">
            <Brand />
            <div className="flex flex-wrap items-center gap-3">
              <span>Sua empresa quer fazer parte da Rede TechPass?</span>
              <Button variant="secondary" className="rounded-full" onClick={() => navigate('/parceiros')}>Seja nosso parceiro</Button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function PartnerLandingPage({ navigate }: { navigate: (path: string) => void }) {
  const openWhatsApp = () => {
    const text = encodeURIComponent('Olá, quero entender como minha empresa pode virar parceira da Rede TechPass.');
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return <PartnerLandingV2 navigate={navigate} openWhatsApp={openWhatsApp} />;

}

function PartnerLandingV2({ navigate, openWhatsApp }: { navigate: (path: string) => void; openWhatsApp: () => void }) {
  const faq = [
    ['Por que entrar na Rede TechPass?', 'Para transformar benefício em aquisição. Sua empresa publica ofertas, recebe leads com contexto e aparece para clientes de outras marcas parceiras.'],
    ['Como recebo os clientes?', 'O cliente clica na oferta, envia interesse e a solicitação aparece no painel parceiro com nome, telefone, TechPass, status e observação.'],
    ['Consigo publicar minhas próprias ofertas?', 'Sim. O parceiro cria ofertas, benefícios, brindes ou condições especiais. O administrador pode aprovar antes de aparecer para clientes.'],
    ['Quanto custa?', 'A parceria pode variar por volume de vouchers, presença na rede e campanha. A landing prepara o lead e a proposta fecha com a TechSoft.'],
    ['O parceiro vê dados de outras empresas?', 'Não. Cada empresa acessa apenas seus leads, solicitações, ofertas, cashback e indicações.'],
  ];
  const cases = [
    ['Fight Core', 'Aulas grátis por modalidade, planos com desconto e bônus de 6 meses por indicação qualificada.'],
    ['Super Geeks', 'Plano anual com condição TechPass, renovação especial e novos interessados vindos da rede.'],
    ['TechSoft', 'Serviços técnicos, películas, TechCash, brindes e indicações organizados em um funil próprio.'],
  ];

  return (
    <div className="landing-v2 min-h-screen overflow-hidden bg-[#050607] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050607]/78 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Brand />
          <nav className="hidden items-center gap-6 text-xs font-black uppercase tracking-[0.14em] text-zinc-400 lg:flex">
            <button className="transition hover:text-white" onClick={() => document.getElementById('por-que')?.scrollIntoView({ behavior: 'smooth' })}>Por que entrar</button>
            <button className="transition hover:text-white" onClick={() => document.getElementById('fluxo-parceiro')?.scrollIntoView({ behavior: 'smooth' })}>Como funciona</button>
            <button className="transition hover:text-white" onClick={() => document.getElementById('painel-parceiro-v2')?.scrollIntoView({ behavior: 'smooth' })}>Painel</button>
            <button className="transition hover:text-white" onClick={() => document.getElementById('planos-parceiro')?.scrollIntoView({ behavior: 'smooth' })}>Planos</button>
            <button className="transition hover:text-white" onClick={() => document.getElementById('faq-parceiro')?.scrollIntoView({ behavior: 'smooth' })}>FAQ</button>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="hidden rounded-full sm:inline-flex" onClick={() => navigate('/')}>Clientes</Button>
            <Button className="rounded-full px-5 shadow-[0_0_36px_rgba(141,255,42,0.2)]" onClick={openWhatsApp}>Entrar na rede</Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate mx-auto grid min-h-[calc(100vh-74px)] max-w-7xl gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pb-24 lg:pt-20">
          <div className="premium-grid absolute inset-0 -z-20 opacity-70" />
          <div className="reveal-up">
            <Pill className="border-tech-neon/35 bg-tech-neon/10 px-3 py-1.5 text-tech-neon">Seja Parceiro TechPass</Pill>
            <h1 className="mt-7 max-w-5xl text-5xl font-black leading-[0.9] tracking-normal text-white sm:text-7xl lg:text-8xl">
              Transforme clientes ocasionais em recorrentes.
            </h1>
            <p className="mt-6 max-w-2xl text-xl font-semibold leading-8 text-zinc-300 sm:text-2xl">
              Entre em uma rede local onde um voucher gera ofertas, leads, agendamentos, indicações e dados de conversão para sua empresa.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button className="min-h-12 rounded-full px-6 text-base shadow-[0_0_36px_rgba(141,255,42,0.24)] hover:scale-[1.02]" onClick={openWhatsApp}>Receber clientes pela rede <ArrowRight className="h-4 w-4" /></Button>
              <Button variant="secondary" className="min-h-12 rounded-full px-6 text-base" onClick={() => document.getElementById('fluxo-parceiro')?.scrollIntoView({ behavior: 'smooth' })}>Ver o fluxo completo</Button>
            </div>
            <div className="mt-9 grid max-w-3xl grid-cols-3 gap-3">
              <PremiumStat value="Leads" label="com intenção clara" />
              <PremiumStat value="24h" label="operação simples" />
              <PremiumStat value="1 painel" label="para sua empresa" />
            </div>
          </div>
          <PartnerDashboardShowcase />
        </section>

        <section id="por-que" className="border-y border-white/10 bg-[#f5f7ef] text-[#10140f]">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <SectionIntro eyebrow="Por que entrar" title="Pare de competir só por preço. Venda valor percebido." subtitle="O TechPass transforma uma oferta isolada em uma rede de benefícios com rastreio, contexto e recorrência." dark={false} />
            <div className="grid gap-4 sm:grid-cols-2">
              <PartnerValueCard title="Clientes de outras marcas" text="Sua empresa aparece para membros ativados por parceiros da rede." />
              <PartnerValueCard title="Leads menos frios" text="O cliente escolhe a oferta e chega com telefone, TechPass e intenção." />
              <PartnerValueCard title="Ofertas com aprovação" text="Você cria condições próprias e o admin mantém a qualidade da rede." />
              <PartnerValueCard title="Métricas no painel" text="Acompanhe leads novos, negociação, fechados, perdidos e ofertas ativas." />
            </div>
          </div>
        </section>

        <section id="fluxo-parceiro" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionIntro eyebrow="Fluxo completo" title="Do voucher ao atendimento, sem depender de planilha." subtitle="Cada etapa foi desenhada para reduzir atrito comercial e aumentar clareza no atendimento." />
          <div className="mt-10 grid gap-4 lg:grid-cols-4">
            <ProcessCard number="01" title="Você publica ofertas" text="Planos, aulas, brindes, serviços, cashback e condições especiais." />
            <ProcessCard number="02" title="O cliente vê a vantagem" text="Preço normal, preço TechPass, economia e regra aparecem antes do clique." />
            <ProcessCard number="03" title="O lead chega no painel" text="Dados do cliente, oferta escolhida, status e observações ficam centralizados." />
            <ProcessCard number="04" title="Sua equipe fecha o ciclo" text="Atualiza status, adiciona observação e mede a conversão por oferta." />
          </div>
        </section>

        <section id="painel-parceiro-v2" className="border-y border-white/10 bg-[#080a09]">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
            <SectionIntro eyebrow="Painel parceiro" title="Oferta, lead, solicitação e indicação no mesmo lugar." subtitle="Cada empresa visualiza apenas seus dados e ganha autonomia para atualizar o que vende dentro da Rede TechPass." />
            <PartnerDashboardPreview />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionIntro eyebrow="Gestão comercial" title="O parceiro controla a operação sem depender da TechSoft para tudo." subtitle="A autonomia vem com governança: ofertas podem entrar como pendentes de aprovação antes de aparecerem para clientes." />
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            <BenefitTile icon={Sparkles} title="Gestão de ofertas" value="Preço + regra" text="Publique planos, descontos, aulas grátis, serviços, brindes e renovações." />
            <BenefitTile icon={QrCodeIcon} title="Gestão de vouchers" value="QR + código" text="Acompanhe TechPass gerados, ativos, pendentes e vinculados à empresa." />
            <BenefitTile icon={Gift} title="Gestão de indicações" value="Campanhas" text="Veja contatos indicados, conversões, bônus, brindes e status por cliente." />
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#f5f7ef] text-[#10140f]">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <SectionIntro eyebrow="Estudos de caso" title="Três exemplos claros de como uma empresa usa a rede." subtitle="O TechPass se adapta ao que cada parceiro já vende: plano, serviço, aula, brinde ou renovação." dark={false} />
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {cases.map(([title, text]) => <PartnerCaseCard key={title} title={title} text={text} />)}
            </div>
          </div>
        </section>

        <section id="planos-parceiro" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionIntro eyebrow="Quanto custa" title="Planos por presença, volume e campanha." subtitle="Sem empurrar pacote genérico: a parceria pode começar simples e evoluir conforme o volume de vouchers e leads." />
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {[
              ['Inicial', 'Validar a rede', 'Presença básica, ofertas essenciais e volume reduzido de vouchers.'],
              ['Premium', 'Crescer a aquisição', 'Destaque na landing, mais vouchers, campanhas e painel parceiro completo.'],
              ['Estratégico', 'Operar em conjunto', 'Ações locais, campanhas sazonais, metas de leads e acompanhamento próximo.'],
            ].map(([name, goal, description], index) => (
              <div key={name} className={cx('rounded-[1.5rem] border p-6 transition hover:-translate-y-1', index === 1 ? 'border-tech-neon/40 bg-tech-neon text-black shadow-[0_24px_80px_rgba(141,255,42,0.18)]' : 'border-white/10 bg-white/[0.045] text-white')}>
                <p className={cx('text-xs font-black uppercase tracking-[0.18em]', index === 1 ? 'text-black/70' : 'text-tech-neon')}>{index === 1 ? 'Mais indicado' : 'Parceria'}</p>
                <h3 className="mt-4 text-3xl font-black">{name}</h3>
                <p className={cx('mt-2 font-black', index === 1 ? 'text-black' : 'text-zinc-200')}>{goal}</p>
                <p className={cx('mt-5 min-h-24 text-sm leading-7', index === 1 ? 'text-black/72' : 'text-zinc-400')}>{description}</p>
                <Button className={cx('mt-6 w-full rounded-full', index === 1 && 'border-black bg-black text-white hover:bg-zinc-900')} onClick={openWhatsApp}>Solicitar proposta</Button>
              </div>
            ))}
          </div>
        </section>

        <section id="faq-parceiro" className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <SectionIntro eyebrow="FAQ parceiro" title="O que sua empresa precisa saber." subtitle="Sem jargão. Só o que decide a próxima conversa." center />
          <FaqList items={faq} />
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6">
          <FinalCta
            eyebrow="Próximo passo"
            title="Coloque sua empresa dentro de uma rede que gera valor antes do desconto."
            subtitle="Publique ofertas, receba leads com contexto e acompanhe resultados em um painel exclusivo para parceiros."
            primary="Quero entrar na Rede TechPass"
            secondary="Ver painel parceiro"
            onPrimary={openWhatsApp}
            onSecondary={() => navigate('/parceiro/login')}
          />
        </section>
      </main>
    </div>
  );
}

function SectionIntro({ eyebrow, title, subtitle, center = false, dark = true }: { eyebrow: string; title: string; subtitle: string; center?: boolean; dark?: boolean }) {
  return (
    <div className={cx(center ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl')}>
      <p className={cx('text-xs font-black uppercase tracking-[0.22em]', dark ? 'text-tech-neon' : 'text-[#4d6d19]')}>{eyebrow}</p>
      <h2 className={cx('mt-4 text-4xl font-black leading-[0.95] tracking-normal sm:text-6xl', dark ? 'text-white' : 'text-[#10140f]')}>{title}</h2>
      <p className={cx('mt-5 text-lg leading-8', dark ? 'text-zinc-400' : 'text-[#4b5148]')}>{subtitle}</p>
    </div>
  );
}

function PremiumStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur transition hover:-translate-y-1 hover:border-tech-neon/40">
      <p className="text-2xl font-black text-white sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase leading-5 text-zinc-500">{label}</p>
    </div>
  );
}

function SavingsSimulator() {
  const [peliculas, setPeliculas] = useState(4);
  const [servicos, setServicos] = useState(2);
  const [ofertas, setOfertas] = useState(1);
  const techCash = 100;
  const total = peliculas * 35 + servicos * 120 + ofertas * 480 + techCash;
  return (
    <div className="rounded-[1.6rem] border border-[#10140f]/10 bg-white p-5 shadow-2xl shadow-black/10 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black/10 pb-6">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#5f7f1d]">Simulador de economia</p>
          <p className="mt-3 text-5xl font-black tracking-normal text-[#10140f]">{formatMoney(total)}</p>
        </div>
        <p className="max-w-52 text-sm font-semibold leading-6 text-[#5b6358]">Estimativa anual combinando películas, serviços, ofertas e TechCash.</p>
      </div>
      <div className="mt-6 grid gap-5">
        <SavingSlider label="Trocas de película" value={peliculas} max={6} suffix="x" onChange={setPeliculas} />
        <SavingSlider label="Serviços com desconto" value={servicos} max={6} suffix="x" onChange={setServicos} />
        <SavingSlider label="Ofertas premium usadas" value={ofertas} max={3} suffix="x" onChange={setOfertas} />
      </div>
      <div className="mt-6 rounded-2xl bg-[#10140f] p-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-zinc-400">Meta TechCash</span>
          <strong className="text-tech-neon">+ {formatMoney(techCash)}</strong>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-full rounded-full bg-tech-neon" />
        </div>
      </div>
    </div>
  );
}

function SavingSlider({ label, value, max, suffix, onChange }: { label: string; value: number; max: number; suffix: string; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-2">
      <span className="flex items-center justify-between text-sm font-black text-[#10140f]"><span>{label}</span><span>{value}{suffix}</span></span>
      <input aria-label={label} type="range" min={0} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="accent-[#8DFF2A]" />
    </label>
  );
}

function ComparisonLine({ text, tone }: { text: string; tone: 'muted' | 'strong' }) {
  return <div className={cx('flex items-start gap-3 rounded-2xl p-3 text-sm font-bold leading-6', tone === 'strong' ? 'bg-black/10 text-black' : 'bg-white/[0.04] text-zinc-300')}><CheckCircle2 className={cx('mt-0.5 h-5 w-5 shrink-0', tone === 'strong' ? 'text-black' : 'text-tech-neon')} />{text}</div>;
}

function BenefitTile({ icon: Icon, title, value, text, className }: { icon: typeof Activity; title: string; value: string; text: string; className?: string }) {
  return (
    <div className={cx('group rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-6 transition duration-300 hover:-translate-y-1 hover:border-tech-neon/40 hover:bg-white/[0.07]', className)}>
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-tech-neon/12 text-tech-neon transition group-hover:bg-tech-neon group-hover:text-black"><Icon className="h-5 w-5" /></div>
      <p className="mt-6 text-sm font-black uppercase tracking-[0.18em] text-zinc-500">{title}</p>
      <h3 className="mt-2 text-4xl font-black tracking-normal text-white">{value}</h3>
      <p className="mt-4 text-sm leading-7 text-zinc-400">{text}</p>
    </div>
  );
}

function OfferPreview({ state, offer }: { state: AppState; offer: OfertaParceiro }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 transition hover:-translate-y-1 hover:border-tech-neon/40">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-tech-neon">{getEmpresaName(state, offer.empresa_id)}</p>
      <h3 className="mt-3 text-2xl font-black tracking-normal text-white">{offer.nome}</h3>
      <p className="mt-4 min-h-16 text-sm leading-6 text-zinc-400">{offer.descricao}</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Info label="Normal" value={offer.preco_normal || 'Sob consulta'} />
        <Info label="TechPass" value={offer.preco_techpass || 'Condição especial'} />
      </div>
      <p className="mt-4 text-sm font-black text-tech-neon">{offer.economia || offer.beneficio_extra}</p>
    </div>
  );
}

function ClientDashboardMockup() {
  const items = [
    ['Status', 'Ativo'],
    ['TechCash', 'R$ 68,50'],
    ['Películas', '4 de 6'],
    ['Indicações', '3 enviadas'],
  ];
  return (
    <div className="rounded-[1.6rem] border border-black/10 bg-[#10140f] p-4 shadow-2xl shadow-black/20">
      <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-tech-neon">Meu TechPass</p>
            <h3 className="mt-2 text-3xl font-black text-white">Maria Eduarda</h3>
          </div>
          <Pill className="border-tech-neon/40 bg-tech-neon/10 text-tech-neon">Ativo</Pill>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {items.map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-black/30 p-4"><p className="text-xs font-bold uppercase text-zinc-500">{label}</p><p className="mt-2 text-2xl font-black text-white">{value}</p></div>)}
        </div>
        <div className="mt-5 rounded-2xl bg-tech-neon p-4 text-black">
          <p className="text-xs font-black uppercase tracking-[0.18em]">Próxima melhor ação</p>
          <p className="mt-2 text-xl font-black">Solicitar troca de película na TechSoft</p>
        </div>
      </div>
    </div>
  );
}

function ProcessCard({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-6 transition hover:-translate-y-1 hover:border-tech-neon/40">
      <p className="font-mono text-sm font-black text-tech-neon">{number}</p>
      <h3 className="mt-5 text-2xl font-black tracking-normal text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-zinc-400">{text}</p>
    </div>
  );
}

function TestimonialCard({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-6">
      <p className="text-lg font-semibold leading-8 text-white">“{quote}”</p>
      <div className="mt-6 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-tech-neon text-sm font-black text-black">{name.slice(0, 2).toUpperCase()}</div>
        <div>
          <p className="font-black text-white">{name}</p>
          <p className="text-sm text-zinc-500">{role}</p>
        </div>
      </div>
    </div>
  );
}

function FaqList({ items }: { items: string[][] }) {
  return <div className="mt-10 grid gap-3">{items.map(([question, answer]) => <details key={question} className="group rounded-2xl border border-white/10 bg-white/[0.045] p-5 open:border-tech-neon/35"><summary className="cursor-pointer list-none text-lg font-black text-white">{question}</summary><p className="mt-4 text-sm leading-7 text-zinc-400">{answer}</p></details>)}</div>;
}

function FinalCta({ eyebrow, title, subtitle, primary, secondary, onPrimary, onSecondary }: { eyebrow: string; title: string; subtitle: string; primary: string; secondary: string; onPrimary: () => void; onSecondary: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-tech-neon/35 bg-tech-neon p-6 text-black shadow-[0_24px_90px_rgba(141,255,42,0.18)] sm:p-10">
      <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-black/65">{eyebrow}</p>
          <h2 className="mt-4 max-w-4xl text-4xl font-black leading-[0.95] tracking-normal sm:text-6xl">{title}</h2>
          <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-black/72">{subtitle}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Button className="min-h-12 rounded-full border-black bg-black px-6 text-white hover:bg-zinc-900" onClick={onPrimary}>{primary} <ArrowRight className="h-4 w-4" /></Button>
          <Button variant="secondary" className="min-h-12 rounded-full border-black/20 bg-black/10 px-6 text-black hover:bg-black hover:text-white" onClick={onSecondary}>{secondary}</Button>
        </div>
      </div>
    </div>
  );
}

function PartnerDashboardShowcase() {
  return (
    <div className="relative reveal-up lg:delay-150">
      <div className="relative rounded-[1.7rem] border border-white/12 bg-white/[0.06] p-4 shadow-2xl shadow-black/60 backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-tech-neon">Painel parceiro</p><p className="mt-1 text-2xl font-black text-white">Fight Core</p></div>
          <Pill className="border-tech-neon/40 bg-tech-neon/10 text-tech-neon">12 novos</Pill>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            ['Leads recebidos', '48'],
            ['Em negociação', '17'],
            ['Fechados', '9'],
            ['Conversão', '18%'],
          ].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-black/30 p-4"><p className="text-xs font-bold uppercase text-zinc-500">{label}</p><p className="mt-2 text-3xl font-black text-white">{value}</p></div>)}
        </div>
        <div className="mt-4 rounded-2xl bg-tech-neon p-4 text-black"><p className="text-xs font-black uppercase tracking-[0.18em]">Lead mais recente</p><p className="mt-2 font-black">Plano anual Fight Core · WhatsApp pronto para contato</p></div>
      </div>
    </div>
  );
}

function PartnerDashboardPreview() {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl shadow-black/30">
      <div className="grid gap-3 md:grid-cols-3">
        {['Ofertas ativas', 'Leads novos', 'Cashback pendente'].map((label, index) => <div key={label} className="rounded-2xl border border-white/10 bg-black/35 p-4"><p className="text-xs font-bold uppercase text-zinc-500">{label}</p><p className="mt-2 text-3xl font-black text-white">{index === 0 ? 8 : index === 1 ? 12 : 'R$178'}</p></div>)}
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/35 p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-tech-neon">Fila comercial</p>
        {['Maria · Aula grátis Muay Thai', 'Lucas · Plano semestral', 'Ana · Renovação Super Geeks'].map((item) => <div key={item} className="mt-3 flex items-center justify-between rounded-xl bg-white/[0.05] px-3 py-3 text-sm text-zinc-300"><span>{item}</span><span className="font-bold text-tech-neon">novo</span></div>)}
      </div>
    </div>
  );
}

function PartnerValueCard({ title, text }: { title: string; text: string }) {
  return <div className="rounded-[1.35rem] border border-black/10 bg-white p-5 shadow-xl shadow-black/5"><h3 className="text-2xl font-black tracking-normal text-[#10140f]">{title}</h3><p className="mt-3 text-sm leading-7 text-[#5b6358]">{text}</p></div>;
}

function PartnerCaseCard({ title, text }: { title: string; text: string }) {
  return <div className="rounded-[1.5rem] border border-black/10 bg-white p-6 shadow-xl shadow-black/5"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#5f7f1d]">Caso de uso</p><h3 className="mt-4 text-3xl font-black tracking-normal text-[#10140f]">{title}</h3><p className="mt-4 text-sm leading-7 text-[#5b6358]">{text}</p></div>;
}

function PublicTechPassPage({ serial, state, actions }: { serial: string; state: AppState; actions: ReturnType<typeof useTechPassStore>['actions'] }) {
  const techpass = state.techpasses.find((item) => item.serial.toLowerCase() === serial.toLowerCase());
  if (!techpass) {
    return <PublicShell><StatusPublic title="TechPass não encontrado" description="Verifique se o QR Code foi lido corretamente ou entre em contato com a TechSoft." tone="danger" /></PublicShell>;
  }
  const status = getEffectiveStatus(techpass);
  const empresa = state.empresas.find((item) => item.id === techpass.empresa_id);
  const cliente = state.clientes.find((item) => item.id === techpass.cliente_id);

  return (
    <PublicShell>
      {status === 'DISPONIVEL' && <AvailableTechPass techpass={techpass} empresaName={empresa?.nome ?? 'Empresa parceira'} actions={actions} />}
      {status === 'PENDENTE_ATIVACAO' && (
        <Card className="mx-auto max-w-3xl p-6 sm:p-8">
          <StatusPill status={status} />
          <h1 className="mt-5 text-3xl font-black text-white sm:text-5xl">Cadastro recebido</h1>
          <p className="mt-4 text-xl font-semibold text-tech-neon">Seu TechPass está aguardando ativação presencial.</p>
          <p className="mt-4 text-zinc-300">Compareça à TechSoft com documento oficial com foto para liberar os benefícios.</p>
          <BenefitsList />
        </Card>
      )}
      {status === 'ATIVO' && (
        <Card className="mx-auto max-w-4xl p-6 sm:p-8">
          <StatusPill status={status} />
          <h1 className="mt-5 text-3xl font-black text-white sm:text-5xl">TechPass Ativo</h1>
          <p className="mt-3 font-semibold text-tech-neon">Apresente documento oficial com foto para utilizar os benefícios.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Info label="Nome do cliente" value={cliente?.nome ?? 'Cliente'} />
            <Info label="Empresa parceira" value={empresa?.nome ?? 'Empresa'} />
            <Info label="Número do TechPass" value={techpass.serial} />
            <Info label="Validade" value={formatDate(techpass.expires_at)} />
            <Info label="Cashback disponível" value={formatMoney(getCashbackBalance(state, techpass.id))} />
            <Info label="Trocas de película" value={String(techpass.peliculas_restantes)} />
            <Info label="Código de indicação" value={techpass.codigo_indicacao ?? cliente?.codigo_indicacao ?? 'Não gerado'} />
          </div>
        </Card>
      )}
      {status === 'CANCELADO' && <StatusPublic title="TechPass Cancelado" description="Os benefícios deste TechPass não estão mais disponíveis." tone="danger" />}
      {status === 'EXPIRADO' && <StatusPublic title="TechPass Expirado" description="Este benefício encerrou sua validade." tone="neutral" />}
    </PublicShell>
  );
}

function AvailableTechPass({ techpass, empresaName, actions }: { techpass: TechPass; empresaName: string; actions: ReturnType<typeof useTechPassStore>['actions'] }) {
  const [form, setForm] = useState({ nome: '', cpf: '', telefone: '', email: '', codigo: '' });
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = actions.requestActivation(techpass.serial, form.codigo, {
      nome: form.nome,
      cpf: form.cpf,
      telefone: form.telefone,
      email: form.email,
    });
    setMessage(result.message);
    setSuccess(result.ok);
  };

  return (
    <div className="grid gap-6">
      <Card className="p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_160px] lg:items-start">
          <div>
            <StatusPill status={techpass.status} />
            <h1 className="mt-5 text-3xl font-black text-white sm:text-5xl">Parabéns! Você tem um voucher TechPass Premium.</h1>
            <p className="mt-4 text-xl font-semibold text-tech-neon">Seu acesso já foi comprado. Falta apenas concluir o cadastro e ativar presencialmente na TechSoft.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Info label="Número de série" value={techpass.serial} />
              <Info label="Empresa parceira" value={empresaName} />
            </div>
          </div>
          <QrCode serial={techpass.serial} size={150} />
        </div>
      </Card>

      <Card><BenefitsList /></Card>

      <Card>
        <PageTitle title="Conheça tudo que a TechSoft pode fazer por você" subtitle="Serviços para celular, computador, videogame e acessórios." />
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {SERVICOS_TECHSOFT.map((service) => <Info key={service.title} label={service.title} value={service.description} />)}
        </div>
      </Card>

      <Card>
        <PageTitle title="Como ativar seu TechPass" subtitle="A ativação final só acontece presencialmente na loja TechSoft." />
        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <StepCard number="1" title="Escaneie" text="Escaneie o QR Code do voucher." />
          <StepCard number="2" title="Digite" text="Digite o código secreto do seu voucher TechPass." />
          <StepCard number="3" title="Cadastre" text="Preencha o cadastro nesta página." />
          <StepCard number="4" title="Compareça" text="Vá à TechSoft com voucher e documento." />
          <StepCard number="5" title="Ative" text="A equipe TechSoft libera seus benefícios." />
        </div>
      </Card>

      <Card>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-black text-white">Solicitar ativação do TechPass</h2>
            <p className="mt-1 text-sm text-zinc-400">O campo Código secreto do voucher é obrigatório.</p>
          </div>
          <Field label="Nome completo"><Input required disabled={success} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></Field>
          <Field label="CPF"><Input required disabled={success} value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" /></Field>
          <Field label="Telefone / WhatsApp"><Input required disabled={success} value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></Field>
          <Field label="E-mail"><Input required disabled={success} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Código secreto do voucher"><Input required disabled={success} value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })} placeholder="Ex: SG-7K2P" /></Field>
          <div className="md:col-span-2">
            <Button type="submit" disabled={success}><UserCheck className="h-4 w-4" />Enviar cadastro</Button>
            {message && <div className={cx('mt-4 rounded-lg border p-4 text-sm', success ? 'border-tech-neon/30 bg-tech-neon/10 text-tech-neon' : 'border-red-300/30 bg-red-300/10 text-red-100')}>{success ? 'Cadastro enviado com sucesso! Seu TechPass está pendente de ativação. Para liberar seus benefícios, compareça à TechSoft com seu voucher e documento oficial com foto.' : message}</div>}
          </div>
        </form>
      </Card>
    </div>
  );
}

function AdminApp({ state, actions, navigate }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions']; navigate: (path: string) => void }) {
  const [logged, setLogged] = useState(false);
  const [view, setView] = useState<AdminView>('dashboard');
  if (!logged) {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-tech-ink">
        <Card className="w-full max-w-md p-6">
          <Brand />
          <h1 className="mt-8 text-2xl font-black text-white">Painel administrativo</h1>
          <p className="mt-2 text-sm text-zinc-400">Login simples para MVP. A autenticação real pode ser conectada ao Supabase Auth depois.</p>
          <Button className="mt-6 w-full" onClick={() => setLogged(true)}><LockKeyhole className="h-4 w-4" />Entrar no painel</Button>
          <Button className="mt-3 w-full" variant="ghost" onClick={() => navigate('/')}>Voltar para Rede TechPass</Button>
        </Card>
      </div>
    );
  }
  return (
    <div className="min-h-screen text-tech-ink">
      <header className="border-b border-white/10 bg-black/55 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <Brand />
          <div className="flex flex-wrap items-center gap-2">
            <Pill className={hasSupabaseConfig ? 'border-tech-neon/40 bg-tech-neon/10 text-tech-neon' : 'border-white/15 bg-white/[0.06] text-zinc-200'}>{hasSupabaseConfig ? 'Supabase conectado' : 'Modo demo local'}</Pill>
            <NotificationBell notifications={state.notifications.filter((item) => item.tipo_usuario === 'admin')} actions={actions} navigate={navigate} scope={{ tipo_usuario: 'admin' }} />
            <Button variant="secondary" onClick={actions.resetDemo}><RefreshCw className="h-4 w-4" />Reset demo</Button>
            <Button variant="ghost" onClick={() => navigate('/')}>Site público</Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="min-w-0 h-max rounded-lg border border-white/10 bg-white/[0.04] p-3 lg:sticky lg:top-4">
          <nav className="grid max-h-[55vh] grid-flow-col gap-1 overflow-x-auto pb-1 lg:max-h-none lg:grid-flow-row lg:overflow-visible lg:pb-0">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              return <button key={item.id} onClick={() => setView(item.id)} className={cx('flex min-h-11 min-w-max items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition lg:min-w-0', view === item.id ? 'bg-tech-neon text-black' : 'text-zinc-300 hover:bg-white/[0.07] hover:text-white')}><Icon className="h-4 w-4" />{item.label}</button>;
            })}
          </nav>
        </aside>
        <main className="min-w-0">
          {view === 'dashboard' && <Dashboard state={state} />}
          {view === 'saude' && <NetworkHealthScreen state={state} />}
          {view === 'atendimento' && <StoreActivationScreen state={state} actions={actions} navigate={navigate} />}
          {view === 'empresas' && <EmpresasScreen state={state} actions={actions} />}
          {view === 'techpass' && <TechPassScreen state={state} actions={actions} navigate={navigate} />}
          {view === 'qrcodes' && <QrCodesScreen state={state} navigate={navigate} />}
          {view === 'pendentes' && <PendentesScreen state={state} actions={actions} />}
          {view === 'ativar' && <PendentesScreen state={state} actions={actions} />}
          {view === 'validar' && <ValidarScreen state={state} actions={actions} />}
          {view === 'orcamentos' && <BudgetsScreen state={state} actions={actions} />}
          {view === 'cashback' && <CashbackScreen state={state} actions={actions} />}
          {view === 'indicacoes' && <IndicacoesScreen state={state} actions={actions} />}
          {view === 'solicitacoes' && <SolicitacoesScreen state={state} actions={actions} />}
          {view === 'beneficios' && <BeneficiosServicosScreen state={state} actions={actions} />}
          {view === 'ofertas' && <OfertasAdminScreen state={state} actions={actions} />}
          {view === 'clientes' && <ClientesScreen state={state} />}
          {view === 'logs' && <SystemLogsScreen state={state} />}
        </main>
      </div>
    </div>
  );
}

function Dashboard({ state }: { state: AppState }) {
  const stats = useMemo(() => {
    const cashback = state.cashback_movements
      .filter((item) => item.tipo === 'credito')
      .reduce((sum, item) => sum + item.valor, 0) + state.techpasses.reduce((sum, item) => sum + item.cashback_saldo, 0);
    return {
      total: state.techpasses.length,
      disponiveis: state.techpasses.filter((item) => item.status === 'DISPONIVEL').length,
      pendentes: state.techpasses.filter((item) => item.status === 'PENDENTE_ATIVACAO').length,
      ativos: state.techpasses.filter((item) => item.status === 'ATIVO').length,
      cancelados: state.techpasses.filter((item) => item.status === 'CANCELADO').length,
      empresas: state.empresas.length,
      clientes: state.clientes.filter((client) => state.techpasses.some((tp) => tp.cliente_id === client.id && tp.status === 'ATIVO')).length,
      cashback,
      indicacoes: state.indicacoes.filter((item) => item.status === 'pendente').length,
      notificacoes: state.notifications.filter((item) => item.tipo_usuario === 'admin' && !item.lida).length,
      erros: state.system_logs.filter((item) => item.nivel === 'error' || item.nivel === 'critical').length,
      parceirosNovos: state.empresas.length,
      leadsPendentes: state.leads.filter((item) => ['novo', 'negociacao'].includes(item.status)).length,
      solicitacoesPendentes: state.solicitacoes.filter((item) => ['nova', 'analise'].includes(item.status)).length,
      cashbackPendente: state.cashback_transactions.filter((item) => item.status === 'pendente').length,
      ofertasAguardando: state.ofertas.filter((item) => item.status === 'PENDENTE_APROVACAO').length,
    };
  }, [state]);
  return (
    <div className="grid gap-6">
      <PageTitle title="Dashboard" subtitle="Resumo operacional da Rede TechPass." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="TechPass gerados" value={stats.total} tone="neon" />
        <Stat label="Disponíveis" value={stats.disponiveis} />
        <Stat label="Aguardando ativação" value={stats.pendentes} tone="warn" />
        <Stat label="TechPass ativos" value={stats.ativos} tone="neon" />
        <Stat label="Cancelados" value={stats.cancelados} tone="danger" />
        <Stat label="Empresas parceiras" value={stats.empresas} />
        <Stat label="Clientes ativos" value={stats.clientes} />
        <Stat label="Cashback concedido" value={formatMoney(stats.cashback)} tone="neon" />
        <Stat label="Indicações pendentes" value={stats.indicacoes} tone="warn" />
        <Stat label="Notificações" value={stats.notificacoes} tone="warn" />
        <Stat label="Erros do sistema" value={stats.erros} tone="danger" />
        <Stat label="Novos parceiros" value={stats.parceirosNovos} />
        <Stat label="Leads pendentes" value={stats.leadsPendentes} tone="warn" />
        <Stat label="Solicitações pendentes" value={stats.solicitacoesPendentes} tone="warn" />
        <Stat label="Cashback pendente" value={stats.cashbackPendente} tone="warn" />
        <Stat label="Ofertas aguardando aprovação" value={stats.ofertasAguardando} tone="warn" />
      </div>
      <Card className="p-6">
        <PageTitle title="Últimos logs" subtitle="Resumo rápido dos eventos recentes do sistema." />
        <div className="mt-4 grid gap-3">
          {state.system_logs.slice(0, 3).map((log) => <div key={log.id} className="rounded-lg border border-white/10 bg-black/25 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><p className="font-black text-white">{log.descricao}</p><Pill className={LOG_LEVEL_STYLE[log.nivel]}>{log.nivel}</Pill></div><p className="mt-1 text-sm text-zinc-400">{log.pagina} · {log.usuario} · {formatDateTime(log.created_at)}</p></div>)}
        </div>
      </Card>
      <Card className="p-6">
        <h3 className="text-lg font-black uppercase text-zinc-400">Fluxo operacional</h3>
        <ol className="mt-5 grid gap-4 text-sm leading-7 text-zinc-100">
          <li><strong className="mr-3 text-tech-neon">1.</strong>Cliente compra o voucher TechPass em uma empresa parceira.</li>
          <li><strong className="mr-3 text-tech-neon">2.</strong>Cliente acessa o QR Code, informa o código secreto do voucher e solicita ativação.</li>
          <li><strong className="mr-3 text-tech-neon">3.</strong>Equipe TechSoft confere documento oficial com foto e ativa presencialmente.</li>
          <li><strong className="mr-3 text-tech-neon">4.</strong>Cliente usa benefícios, cashback, indicações e trocas de película.</li>
        </ol>
      </Card>
    </div>
  );
}

function NetworkHealthScreen({ state }: { state: AppState }) {
  const today = Date.now();
  const activePasses = state.techpasses.filter((item) => getEffectiveStatus(item) === 'ATIVO');
  const expiringSoon = activePasses.filter((item) => item.expires_at && new Date(item.expires_at).getTime() - today <= 1000 * 60 * 60 * 24 * 30);
  const pendingLeads = state.leads.filter((item) => ['novo', 'negociacao'].includes(item.status));
  const closedLeads = state.leads.filter((item) => item.status === 'fechado').length;
  const conversion = state.leads.length ? Math.round((closedLeads / state.leads.length) * 100) : 0;
  const pendingOffers = state.ofertas.filter((item) => item.status === 'PENDENTE_APROVACAO');
  const criticalLogs = state.system_logs.filter((item) => item.nivel === 'error' || item.nivel === 'critical');
  const partnerHealth = state.empresas.map((empresa) => {
    const leads = state.leads.filter((lead) => lead.empresa_id === empresa.id);
    const solicitacoes = state.solicitacoes.filter((item) => item.empresa_id === empresa.id && !['concluida', 'cancelada'].includes(item.status));
    const offers = state.ofertas.filter((item) => item.empresa_id === empresa.id);
    const waiting = leads.filter((lead) => ['novo', 'negociacao'].includes(lead.status)).length + solicitacoes.length;
    return { empresa, leads: leads.length, waiting, activeOffers: offers.filter((item) => item.status === 'ativo').length };
  }).sort((a, b) => b.waiting - a.waiting);
  const topOffers = state.ofertas
    .map((oferta) => ({ oferta, score: getOfferScore(oferta), leads: state.leads.filter((lead) => lead.oferta_id === oferta.id).length }))
    .sort((a, b) => b.score + b.leads * 50 - (a.score + a.leads * 50))
    .slice(0, 5);

  return (
    <div className="grid gap-6">
      <PageTitle title="Saude da Rede" subtitle="Visao executiva para priorizar ativacao, parceiros, leads e riscos operacionais." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="TechPass ativos" value={activePasses.length} tone="neon" />
        <Stat label="Vencem em 30 dias" value={expiringSoon.length} tone="warn" />
        <Stat label="Leads pendentes" value={pendingLeads.length} tone="warn" />
        <Stat label="Conversao geral" value={conversion + '%'} tone="neon" />
        <Stat label="Ofertas para aprovar" value={pendingOffers.length} tone="warn" />
        <Stat label="Erros criticos" value={criticalLogs.length} tone="danger" />
        <Stat label="Cashback pendente" value={formatMoney(state.cashback_transactions.filter((item) => item.status === 'pendente').reduce((sum, item) => sum + item.valor, 0))} tone="warn" />
        <Stat label="Solicitacoes abertas" value={state.solicitacoes.filter((item) => !['concluida', 'cancelada'].includes(item.status)).length} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <PageTitle title="Parceiros que precisam de atencao" subtitle="Ordenado por leads e solicitacoes ainda sem conclusao." />
          <div className="mt-4 grid gap-3">
            {partnerHealth.map(({ empresa, leads, waiting, activeOffers }) => (
              <div key={empresa.id} className="rounded-lg border border-white/10 bg-black/25 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><p className="font-black text-white">{empresa.nome}</p><p className="text-sm text-zinc-400">{empresa.categoria} · {activeOffers} ofertas ativas</p></div>
                  <Pill className={waiting ? 'border-yellow-300/30 bg-yellow-400/10 text-yellow-100' : 'border-tech-neon/40 bg-tech-neon/10 text-tech-neon'}>{waiting} pendencias</Pill>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2"><Info label="Leads totais" value={String(leads)} /><Info label="Status" value={empresa.status} /></div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <PageTitle title="Ofertas com melhor tracao" subtitle="Ranking por economia percebida, cashback e leads gerados." />
          <div className="mt-4 grid gap-3">
            {topOffers.map(({ oferta, score, leads }, index) => (
              <div key={oferta.id} className="rounded-lg border border-white/10 bg-black/25 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-xs font-black uppercase text-tech-neon">#{index + 1} · {getEmpresaName(state, oferta.empresa_id)}</p><p className="mt-1 font-black text-white">{oferta.nome}</p></div>
                  <Pill className="border-white/15 bg-white/[0.06] text-zinc-200">{Math.round(score)} pts</Pill>
                </div>
                <p className="mt-2 text-sm text-zinc-400">{leads} leads · economia {oferta.economia || 'variavel'}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card>
        <PageTitle title="Alertas recentes" subtitle="Logs e notificacoes que merecem acompanhamento do administrador." />
        <div className="mt-4 grid gap-3">
          {[...criticalLogs.slice(0, 3).map((log) => ({ id: log.id, title: log.descricao, meta: `${log.nivel} · ${log.pagina} · ${formatDateTime(log.created_at)}`, tone: 'danger' })), ...state.notifications.filter((item) => !item.lida && item.tipo_usuario === 'admin').slice(0, 3).map((item) => ({ id: item.id, title: item.titulo, meta: `${item.tipo} · ${formatDateTime(item.created_at)}`, tone: 'warn' }))].map((item) => (
            <div key={item.id} className="rounded-lg border border-white/10 bg-black/25 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-black text-white">{item.title}</p><Pill className={item.tone === 'danger' ? 'border-red-400/40 bg-red-500/10 text-red-100' : 'border-yellow-300/30 bg-yellow-400/10 text-yellow-100'}>{item.tone}</Pill></div>
              <p className="mt-1 text-sm text-zinc-400">{item.meta}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SystemLogsScreen({ state }: { state: AppState }) {
  const [filters, setFilters] = useState({ data: '', empresa: '', usuario: '', tipo: '', search: '' });
  const logs = state.system_logs.filter((log) => {
    const matchesDate = !filters.data || log.created_at.slice(0, 10) === filters.data;
    const matchesEmpresa = !filters.empresa || log.empresa === filters.empresa;
    const matchesUsuario = !filters.usuario || log.usuario.toLowerCase().includes(filters.usuario.toLowerCase());
    const matchesTipo = !filters.tipo || log.nivel === filters.tipo;
    const haystack = [log.pagina, log.descricao, log.stacktrace, log.usuario, log.empresa].join(' ').toLowerCase();
    const matchesSearch = !filters.search || haystack.includes(filters.search.toLowerCase());
    return matchesDate && matchesEmpresa && matchesUsuario && matchesTipo && matchesSearch;
  });
  const exportCsv = () => {
    const header = ['Data', 'Nivel', 'Usuario', 'Empresa', 'Pagina', 'Descricao', 'Stack trace'];
    const rows = logs.map((log) => [log.created_at, log.nivel, log.usuario, log.empresa, log.pagina, log.descricao, log.stacktrace]);
    const csv = [header, ...rows].map((row) => row.map((cell) => '"' + String(cell).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'techpass-system-logs.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };
  const empresas = Array.from(new Set(state.system_logs.map((log) => log.empresa))).filter(Boolean);
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle title="Logs do Sistema" subtitle="Erros de autenticação, banco, API, upload, QR Code, integrações e páginas não encontradas." />
        <Button variant="secondary" onClick={exportCsv}><Download className="h-4 w-4" />Exportar CSV</Button>
      </div>
      <Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Field label="Data"><Input type="date" value={filters.data} onChange={(event) => setFilters({ ...filters, data: event.target.value })} /></Field>
          <Field label="Empresa"><Select value={filters.empresa} onChange={(event) => setFilters({ ...filters, empresa: event.target.value })}><option value="">Todas</option>{empresas.map((empresa) => <option key={empresa} value={empresa}>{empresa}</option>)}</Select></Field>
          <Field label="Usuário"><Input value={filters.usuario} onChange={(event) => setFilters({ ...filters, usuario: event.target.value })} /></Field>
          <Field label="Tipo"><Select value={filters.tipo} onChange={(event) => setFilters({ ...filters, tipo: event.target.value })}><option value="">Todos</option><option value="info">Info</option><option value="warning">Warning</option><option value="error">Error</option><option value="critical">Critical</option></Select></Field>
          <Field label="Pesquisar"><Input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Descrição, página ou stack" /></Field>
        </div>
      </Card>
      <div className="grid gap-3">
        {logs.map((log) => <Card key={log.id} className="p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-black text-white">{log.descricao}</p><p className="mt-1 text-sm text-zinc-400">{formatDateTime(log.created_at)} · {log.usuario} · {log.empresa} · {log.pagina}</p></div><Pill className={LOG_LEVEL_STYLE[log.nivel]}>{log.nivel}</Pill></div>{log.stacktrace && <pre className="mt-4 overflow-auto rounded-md border border-white/10 bg-black/35 p-3 text-xs text-zinc-300">{log.stacktrace}</pre>}</Card>)}
        {logs.length === 0 && <EmptyMessage title="Sem logs encontrados" description="Ajuste os filtros para ampliar a busca." />}
      </div>
    </div>
  );
}

function extractTechPassToken(value: string) {
  const raw = value.trim();
  if (!raw) return '';
  try {
    const url = new URL(raw);
    const parts = url.pathname.split('/').filter(Boolean);
    const techpassIndex = parts.findIndex((part) => part.toLowerCase() === 'techpass');
    if (techpassIndex >= 0 && parts[techpassIndex + 1]) return decodeURIComponent(parts[techpassIndex + 1]).toUpperCase();
    return decodeURIComponent(parts[parts.length - 1] ?? raw).toUpperCase();
  } catch {
    const serial = raw.match(/TP-[A-Z0-9]+-\d{3,}/i)?.[0];
    return (serial ?? raw).trim().toUpperCase();
  }
}

function findTechPassByToken(state: AppState, value: string) {
  const token = extractTechPassToken(value);
  const normalized = normalizeSecretCode(token);
  return state.techpasses.find((item) => {
    return item.serial.toUpperCase() === token || normalizeSecretCode(item.codigo_fisico) === normalized;
  }) ?? null;
}

function StoreActivationScreen({ state, actions, navigate }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions']; navigate: (path: string) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const [scanInput, setScanInput] = useState('');
  const [scanMessage, setScanMessage] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [form, setForm] = useState({ nome: '', cpf: '', telefone: '', email: '', codigo: '' });
  const [feedback, setFeedback] = useState('');
  const techpass = findTechPassByToken(state, scanInput);
  const cliente = techpass?.cliente_id ? state.clientes.find((item) => item.id === techpass.cliente_id) : null;
  const pending = techpass ? state.pending_activations.find((item) => item.techpass_id === techpass.id && item.status === 'PENDENTE_ATIVACAO') : null;

  const stopCamera = () => {
    if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current);
    scanLoopRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  useEffect(() => () => stopCamera(), []);

  useEffect(() => {
    if (!techpass) return;
    if (cliente) {
      setForm((current) => ({
        ...current,
        nome: cliente.nome,
        cpf: cliente.cpf,
        telefone: cliente.telefone,
        email: cliente.email,
      }));
    }
    if (normalizeSecretCode(scanInput) === normalizeSecretCode(techpass.codigo_fisico)) {
      setForm((current) => ({ ...current, codigo: techpass.codigo_fisico }));
    }
  }, [techpass?.id, cliente?.id]);

  const startCamera = async () => {
    setScanMessage('');
    setFeedback('');
    const BarcodeDetectorApi = (window as any).BarcodeDetector;
    if (!BarcodeDetectorApi) {
      setScanMessage('Este navegador não liberou leitura de QR por câmera. Cole o link do QR, digite o serial ou use um leitor USB.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setCameraActive(true);
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      const detector = new BarcodeDetectorApi({ formats: ['qr_code'] });
      const scan = async () => {
        if (!videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes[0]?.rawValue) {
            setScanInput(codes[0].rawValue);
            setScanMessage('QR Code lido. Confira os dados e conclua o atendimento.');
            stopCamera();
            return;
          }
        } catch {
          setScanMessage('Não foi possível ler este quadro. Tente aproximar o QR Code da câmera.');
        }
        scanLoopRef.current = requestAnimationFrame(scan);
      };
      scanLoopRef.current = requestAnimationFrame(scan);
    } catch {
      setScanMessage('Câmera bloqueada ou indisponível. Cole o link do QR ou digite o serial do voucher.');
      stopCamera();
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setFeedback('');
    if (!techpass) {
      setFeedback('Informe ou escaneie um TechPass válido antes de cadastrar.');
      return;
    }
    if (techpass.status === 'ATIVO') {
      setFeedback('Este TechPass já está ativo.');
      return;
    }
    if (pending || techpass.status === 'PENDENTE_ATIVACAO') {
      const result = actions.activatePending(techpass.id);
      setFeedback(result.message);
      return;
    }
    const request = actions.requestActivation(techpass.serial, form.codigo, {
      nome: form.nome,
      cpf: form.cpf,
      telefone: form.telefone,
      email: form.email,
    });
    if (!request.ok) {
      setFeedback(request.message);
      return;
    }
    const activation = actions.activatePending(techpass.id);
    setFeedback(activation.message);
  };

  const status = techpass ? getEffectiveStatus(techpass) : null;

  return (
    <div className="grid gap-6">
      <PageTitle title="Atendimento na loja" subtitle="Escaneie o QR Code do voucher, cadastre o cliente e ative o TechPass presencialmente." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <Field label="QR Code, link, serial ou código do voucher">
              <Input value={scanInput} onChange={(event) => { setScanInput(event.target.value); setFeedback(''); }} placeholder="Ex: /techpass/TP-SG-000001 ou SG-7K2P" />
            </Field>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-none">
              <Button variant="secondary" onClick={startCamera} disabled={cameraActive}><ScanLine className="h-4 w-4" />Escanear QR</Button>
              <Button variant="ghost" onClick={stopCamera} disabled={!cameraActive}>Parar câmera</Button>
            </div>
          </div>
          {scanMessage && <p className="mt-3 rounded-lg border border-white/10 bg-black/25 p-3 text-sm text-zinc-300">{scanMessage}</p>}
          <div className={cx('mt-4 overflow-hidden rounded-lg border border-white/10 bg-black/35', cameraActive ? 'block' : 'hidden')}>
            <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Info label="TechPass" value={techpass?.serial ?? 'Não localizado'} />
            <Info label="Empresa" value={techpass ? getEmpresaName(state, techpass.empresa_id) : '-'} />
            <Info label="Status" value={status ? STATUS_LABEL[status] : '-'} />
            <Info label="Código físico" value={techpass?.codigo_fisico ?? '-'} />
          </div>
        </Card>

        <Card className="h-max">
          <PageTitle title="Checklist presencial" subtitle="Use antes de liberar benefícios." />
          <ol className="mt-4 grid gap-3 text-sm leading-6 text-zinc-300">
            <li><strong className="text-tech-neon">1.</strong> Conferir voucher físico e código secreto.</li>
            <li><strong className="text-tech-neon">2.</strong> Conferir documento oficial com foto.</li>
            <li><strong className="text-tech-neon">3.</strong> Confirmar telefone/WhatsApp do cliente.</li>
            <li><strong className="text-tech-neon">4.</strong> Ativar e orientar o acesso ao dashboard.</li>
          </ol>
          <Button className="mt-5 w-full" variant="secondary" onClick={() => techpass && navigate('/techpass/' + techpass.serial)} disabled={!techpass}><ExternalLink className="h-4 w-4" />Abrir página pública</Button>
        </Card>
      </div>

      <Card>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="md:col-span-2 xl:col-span-4">
            <PageTitle title="Cadastro assistido do cliente" subtitle="Preencha junto com o cliente no balcão. Se já houver solicitação pendente, o botão apenas ativa." />
          </div>
          <Field label="Nome completo"><Input required value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} /></Field>
          <Field label="CPF"><Input required value={form.cpf} onChange={(event) => setForm({ ...form, cpf: event.target.value })} placeholder="000.000.000-00" /></Field>
          <Field label="Telefone / WhatsApp"><Input required value={form.telefone} onChange={(event) => setForm({ ...form, telefone: event.target.value })} /></Field>
          <Field label="E-mail"><Input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
          <Field label="Código secreto do voucher"><Input required value={form.codigo} onChange={(event) => setForm({ ...form, codigo: event.target.value.toUpperCase() })} placeholder="Ex: SG-7K2P" /></Field>
          <div className="grid gap-2 md:col-span-2 xl:col-span-3 xl:grid-cols-[auto_auto_1fr] xl:items-end">
            <Button type="submit" disabled={!techpass || techpass.status === 'CANCELADO'}><UserCheck className="h-4 w-4" />Cadastrar e ativar</Button>
            {techpass && <Button type="button" variant="secondary" onClick={() => { const result = actions.activatePending(techpass.id); setFeedback(result.message); }} disabled={!pending && techpass.status !== 'PENDENTE_ATIVACAO'}>Ativar pendente</Button>}
            {feedback && <p className={cx('rounded-lg border p-3 text-sm', feedback.includes('sucesso') || feedback.includes('ativado') ? 'border-tech-neon/30 bg-tech-neon/10 text-tech-neon' : 'border-yellow-300/30 bg-yellow-300/10 text-yellow-100')}>{feedback}</p>}
          </div>
        </form>
      </Card>
    </div>
  );
}

function EmpresasScreen({ state, actions }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions'] }) {
  const [form, setForm] = useState({ nome: '', categoria: '', beneficio: '', status: 'ativa' as 'ativa' | 'inativa' });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.nome.trim()) return;
    actions.addEmpresa(form);
    setForm({ nome: '', categoria: '', beneficio: '', status: 'ativa' });
  };
  return (
    <div className="grid gap-6">
      <PageTitle title="Empresas parceiras" subtitle="Cadastre nome, categoria, benefício e status." />
      <Card>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Nome"><Input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></Field>
          <Field label="Categoria"><Input required value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} /></Field>
          <Field label="Benefício"><Input required value={form.beneficio} onChange={(e) => setForm({ ...form, beneficio: e.target.value })} /></Field>
          <Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'ativa' | 'inativa' })}><option value="ativa">Ativa</option><option value="inativa">Inativa</option></Select></Field>
          <div className="md:col-span-2 xl:col-span-4"><Button type="submit"><Plus className="h-4 w-4" />Cadastrar empresa</Button></div>
        </form>
      </Card>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {state.empresas.map((empresa) => <PartnerCard key={empresa.id} empresa={empresa} />)}
      </div>
    </div>
  );
}

function TechPassScreen({ state, actions, navigate }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions']; navigate: (path: string) => void }) {
  const firstEmpresa = state.empresas.find((item) => item.status === 'ativa')?.id ?? '';
  const [empresaId, setEmpresaId] = useState(firstEmpresa);
  const [prefix, setPrefix] = useState('TP-SG');
  const [quantity, setQuantity] = useState(5);
  const [query, setQuery] = useState('');
  const filtered = state.techpasses.filter((item) => [item.serial, item.codigo_fisico, item.status, getEmpresaName(state, item.empresa_id)].join(' ').toLowerCase().includes(query.toLowerCase()));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    actions.generateTechPass(empresaId, prefix, quantity);
  };
  const downloadQr = async (serial: string) => {
    const dataUrl = await createQrDataUrl(serial);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = serial + '-qrcode.png';
    link.click();
  };
  return (
    <div className="grid gap-6">
      <PageTitle title="TechPass" subtitle="Crie vouchers TechPass com serial único, código secreto e QR permanente." />
      <Card>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
          <Field label="Empresa parceira"><Select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)}>{state.empresas.filter((item) => item.status === 'ativa').map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>)}</Select></Field>
          <Field label="Prefixo"><Input value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} /></Field>
          <Field label="Quantidade"><Input type="number" min={1} max={500} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} /></Field>
          <div className="md:col-span-3"><Button type="submit"><CreditCard className="h-4 w-4" />Gerar lote</Button></div>
        </form>
      </Card>
      <Card><div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/35 px-3"><Search className="h-4 w-4 text-zinc-500" /><input className="min-h-11 flex-1 bg-transparent text-white outline-none placeholder:text-zinc-500" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar por serial, código, empresa ou status" /></div></Card>
      <div className="grid gap-3">
        {filtered.map((item) => (
          <Card key={item.id} className="grid gap-4 xl:grid-cols-[110px_1fr_auto] xl:items-center">
            <QrCode serial={item.serial} size={96} />
            <div>
              <p className="font-mono text-base font-black text-white">{item.serial}</p>
              <p className="mt-1 text-sm text-zinc-400">{getEmpresaName(state, item.empresa_id)}</p>
              <p className="mt-2 font-mono text-sm font-bold text-tech-neon">Código do voucher: {getTechPassSecret(item)}</p>
              <div className="mt-3"><StatusPill status={getEffectiveStatus(item)} /></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => downloadQr(item.serial)}><Download className="h-4 w-4" />PNG</Button>
              <Button variant="secondary" onClick={() => navigator.clipboard.writeText(item.codigo_fisico)}><Copy className="h-4 w-4" />Copiar código</Button>
              <Button onClick={() => navigate('/techpass/' + item.serial)}><ExternalLink className="h-4 w-4" />Abrir QR</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PendentesScreen({ state, actions }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions'] }) {
  const pending = state.pending_activations.filter((item) => item.status === 'PENDENTE_ATIVACAO');
  const [message, setMessage] = useState('');
  return (
    <div className="grid gap-6">
      <PageTitle title="Cadastros pendentes" subtitle="Confira documento oficial com foto antes de ativar este benefício." />
      <div className="grid gap-3">
        {pending.map((item) => {
          const techpass = state.techpasses.find((pass) => pass.id === item.techpass_id);
          const cliente = state.clientes.find((client) => client.id === item.cliente_id);
          if (!techpass || !cliente) return null;
          return (
            <Card key={item.id} className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-black text-white">{cliente.nome}</h3><StatusPill status="PENDENTE_ATIVACAO" /></div>
                <p className="mt-2 text-sm text-zinc-400">CPF {cliente.cpf} · {cliente.telefone} · {cliente.email}</p>
                <p className="mt-1 text-sm text-zinc-400">{getEmpresaName(state, techpass.empresa_id)} · {techpass.serial} · {formatDate(item.created_at)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => { const result = actions.activatePending(techpass.id); setMessage(result.message); }}><UserCheck className="h-4 w-4" />Ativar TechPass</Button>
                <Button variant="danger" onClick={() => actions.cancelPending(techpass.id)}><Ban className="h-4 w-4" />Cancelar solicitação</Button>
              </div>
            </Card>
          );
        })}
        {pending.length === 0 && <EmptyMessage title="Nenhum cadastro pendente" description="Quando um cliente enviar o formulário do QR, ele aparecerá aqui." />}
        {message && <p className="text-sm text-tech-neon">{message}</p>}
      </div>
    </div>
  );
}

function QrCodesScreen({ state, navigate }: { state: AppState; navigate: (path: string) => void }) {
  const [query, setQuery] = useState('');
  const filtered = state.techpasses.filter((item) => [item.serial, item.codigo_fisico, item.status, getEmpresaName(state, item.empresa_id)].join(' ').toLowerCase().includes(query.toLowerCase()));
  const downloadQr = async (serial: string) => {
    const dataUrl = await createQrDataUrl(serial);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = serial + '-qrcode.png';
    link.click();
  };
  return (
    <div className="grid gap-6">
      <PageTitle title="QR Codes" subtitle="Baixe, copie e abra a página pública vinculada a cada TechPass." />
      <Card><div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/35 px-3"><Search className="h-4 w-4 text-zinc-500" /><input className="min-h-11 flex-1 bg-transparent text-white outline-none placeholder:text-zinc-500" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar por serial, código, empresa ou status" /></div></Card>
      <div className="grid gap-3">
        {filtered.map((item) => (
          <Card key={item.id} className="grid gap-4 xl:grid-cols-[110px_1fr_auto] xl:items-center">
            <QrCode serial={item.serial} size={96} />
            <div>
              <p className="font-mono text-base font-black text-white">{item.serial}</p>
              <p className="mt-1 text-sm text-zinc-400">{getEmpresaName(state, item.empresa_id)}</p>
              <p className="mt-2 font-mono text-sm font-bold text-tech-neon">Código do voucher: {item.codigo_fisico}</p>
              <div className="mt-3"><StatusPill status={getEffectiveStatus(item)} /></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => downloadQr(item.serial)}><Download className="h-4 w-4" />PNG</Button>
              <Button variant="secondary" onClick={() => navigator.clipboard.writeText(item.codigo_fisico)}><Copy className="h-4 w-4" />Copiar código</Button>
              <Button onClick={() => navigate('/techpass/' + item.serial)}><ExternalLink className="h-4 w-4" />Abrir página</Button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <EmptyMessage title="Nenhum QR Code localizado" description="Gere um lote ou ajuste os filtros." />}
      </div>
    </div>
  );
}

function ValidarScreen({ state, actions }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions'] }) {
  const activePasses = state.techpasses.filter((item) => item.status === 'ATIVO' && item.cliente_id);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(activePasses[0]?.id ?? '');
  const [obs, setObs] = useState('Atendimento validado no balcão TechSoft.');
  const [cashValue, setCashValue] = useState(25);
  const [cashDesc, setCashDesc] = useState('Movimentação registrada no atendimento.');
  const [feedback, setFeedback] = useState('');
  const results = activePasses.filter((item) => {
    const client = state.clientes.find((cliente) => cliente.id === item.cliente_id);
    return [item.serial, client?.nome ?? '', client?.cpf ?? ''].join(' ').toLowerCase().includes(query.toLowerCase());
  });
  const selected = state.techpasses.find((item) => item.id === selectedId) ?? results[0] ?? null;
  const cliente = selected ? state.clientes.find((item) => item.id === selected.cliente_id) : null;
  const registerFilm = () => {
    if (!selected) return;
    const ok = actions.registerPeliculas(selected.id, obs);
    setFeedback(ok ? 'Troca de película registrada.' : 'Não foi possível registrar. Verifique status e saldo de trocas.');
  };
  const addCash = (tipo: CashbackTipo) => {
    if (!selected?.cliente_id) return;
    const balance = getCashbackBalance(state, selected.id);
    if (tipo === 'debito' && cashValue > balance) {
      setFeedback('Débito bloqueado: saldo de cashback insuficiente.');
      return;
    }
    actions.addCashback({ cliente_id: selected.cliente_id, techpass_id: selected.id, tipo, valor: cashValue, descricao: cashDesc });
    setFeedback(tipo === 'credito' ? 'Cashback adicionado.' : 'Cashback usado.');
  };
  return (
    <div className="grid gap-6">
      <PageTitle title="Validar TechPass" subtitle="Consulta rápida para liberar benefícios com conferência de documento." />
      <Card>
        <div className="rounded-lg border border-tech-neon/30 bg-tech-neon/10 p-4 text-sm text-white"><strong className="text-tech-neon">Solicitar documento oficial com foto antes da liberação dos benefícios.</strong></div>
        <div className="mt-4 flex items-center gap-2 rounded-md border border-white/10 bg-black/35 px-3"><Search className="h-4 w-4 text-zinc-500" /><input className="min-h-11 flex-1 bg-transparent text-white outline-none placeholder:text-zinc-500" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar por serial, nome ou CPF" /></div>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{results.map((item) => <button key={item.id} onClick={() => setSelectedId(item.id)} className={cx('rounded-lg border p-4 text-left transition', selected?.id === item.id ? 'border-tech-neon bg-tech-neon/10' : 'border-white/10 bg-black/25 hover:border-tech-neon/50')}><p className="font-mono text-sm font-black text-white">{item.serial}</p><p className="mt-1 text-sm text-zinc-400">{getClientName(state, item.cliente_id)}</p></button>)}</div>
      </Card>
      {selected ? <Card><div className="grid gap-5 xl:grid-cols-[1fr_360px]"><div><div className="flex flex-wrap items-center gap-3"><h3 className="text-2xl font-black text-white">{cliente?.nome ?? 'Cliente'}</h3><StatusPill status={getEffectiveStatus(selected)} /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Info label="CPF" value={cliente?.cpf ?? 'Não vinculado'} /><Info label="Empresa" value={getEmpresaName(state, selected.empresa_id)} /><Info label="Validade" value={formatDate(selected.expires_at)} /><Info label="Cashback" value={formatMoney(getCashbackBalance(state, selected.id))} /><Info label="Películas restantes" value={String(selected.peliculas_restantes)} /><Info label="Código de indicação" value={selected.codigo_indicacao ?? cliente?.codigo_indicacao ?? 'Não gerado'} /></div></div><div className="rounded-lg border border-white/10 bg-black/25 p-4"><h4 className="font-black text-white">Ações rápidas</h4><div className="mt-4 grid gap-3"><Field label="Observação"><Input value={obs} onChange={(e) => setObs(e.target.value)} /></Field><Button variant="secondary" onClick={registerFilm}><Film className="h-4 w-4" />Registrar troca de película</Button><Button variant="secondary" onClick={() => actions.registerUso(selected.id, 'Uso de benefício', obs)}><BadgeCheck className="h-4 w-4" />Registrar uso</Button><div className="grid gap-2 sm:grid-cols-[120px_1fr]"><Input type="number" min={0} step="0.01" value={cashValue} onChange={(e) => setCashValue(Number(e.target.value))} /><Input value={cashDesc} onChange={(e) => setCashDesc(e.target.value)} /></div><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => addCash('credito')}><Plus className="h-4 w-4" />Adicionar cashback</Button><Button variant="secondary" onClick={() => addCash('debito')}><Wallet className="h-4 w-4" />Usar cashback</Button></div>{feedback && <p className="text-sm text-tech-neon">{feedback}</p>}</div></div></div></Card> : <EmptyMessage title="Nenhum TechPass ativo" description="Ative um cadastro pendente para validar benefícios." />}
    </div>
  );
}

type BudgetForm = Omit<Budget, 'id' | 'numero' | 'subtotal' | 'total' | 'created_at' | 'updated_at'> & { id?: string; numero?: string };
type BudgetItemForm = Omit<BudgetItem, 'id' | 'budget_id' | 'created_at'>;
type CnpjLookupStatus = 'idle' | 'loading' | 'success' | 'error';

interface BrasilApiCnpjResponse {
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  cep?: string;
  municipio?: string;
  uf?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  ddd_telefone_1?: string;
  ddd_telefone_2?: string;
  email?: string;
}

function createEmptyBudgetForm(): BudgetForm {
  const today = new Date().toISOString().slice(0, 10);
  return {
    data_orcamento: today,
    previsao_entrega: '',
    tecnico_responsavel: TECHSOFT_BUDGET_INFO.responsavel,
    aos_cuidados_de: '',
    cliente_nome: '',
    cliente_documento: '',
    cliente_endereco: '',
    cliente_cep: '',
    cliente_cidade: 'São José',
    cliente_estado: 'SC',
    cliente_telefone: '',
    cliente_email: '',
    garantia_texto: DEFAULT_WARRANTY_TEXT,
    status: 'rascunho',
  };
}

function createEmptyBudgetItem(index: number): BudgetItemForm {
  return { item_numero: index, nome: '', quantidade: 1, valor_unitario: 0, subtotal: 0 };
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function formatCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatCep(value = '') {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, '$1-$2');
}

function formatCnpjPhone(data: BrasilApiCnpjResponse) {
  const phone = data.ddd_telefone_1 || data.ddd_telefone_2 || '';
  const digits = onlyDigits(phone);
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return phone;
}

function formatCnpjAddress(data: BrasilApiCnpjResponse) {
  return [data.logradouro, data.numero, data.complemento, data.bairro].filter(Boolean).join(', ');
}

function budgetStatusClass(status: BudgetStatus) {
  if (status === 'aprovado' || status === 'concluido') return 'border-tech-neon/40 bg-tech-neon/10 text-tech-neon';
  if (status === 'recusado') return 'border-red-300/30 bg-red-400/10 text-red-100';
  if (status === 'enviado') return 'border-sky-300/30 bg-sky-400/10 text-sky-100';
  return 'border-yellow-300/30 bg-yellow-400/10 text-yellow-100';
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char] ?? char));
}

function getBudgetItems(state: AppState, budgetId: string) {
  return state.budget_items.filter((item) => item.budget_id === budgetId).sort((a, b) => a.item_numero - b.item_numero);
}

function buildBudgetPrintHtml(budget: Budget, items: BudgetItem[], telefone: string) {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantidade, 0);
  const generatedAt = formatDateTime(new Date().toISOString());
  const rows = items.map((item) => `
    <tr>
      <td>${item.item_numero}</td>
      <td>${escapeHtml(item.nome)}</td>
      <td class="num">${item.quantidade}</td>
      <td class="num">${formatMoney(item.valor_unitario)}</td>
      <td class="num">${formatMoney(item.subtotal)}</td>
    </tr>
  `).join('');
  return `<!doctype html>
  <html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Orçamento ${escapeHtml(budget.numero)}</title>
    <style>
      @page { size: A4; margin: 8mm; }
      * { box-sizing: border-box; }
      body { margin: 0; background: #e9e9e9; color: #111; font-family: Arial, Helvetica, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .sheet { width: 190mm; min-height: auto; margin: 0 auto; background: #fff; padding: 9mm 10mm 10mm; }
      .docbar { display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; margin-bottom: 8px; font-size: 9px; color: #111; }
      .docbar .center { text-align: center; }
      .top { display: grid; grid-template-columns: 86px 1fr 154px; gap: 9px; align-items: center; border-bottom: 2px solid #2f2f2f; padding-bottom: 10px; }
      .logo { width: 82px; height: 82px; border: 1px solid #222; background: #000; object-fit: contain; display: block; }
      h1 { margin: 0 0 5px; font-size: 22px; line-height: 1.05; letter-spacing: .01em; }
      .meta { border: 1px solid #b8b8b8; font-size: 11px; align-self: start; }
      .meta div { display: grid; grid-template-columns: 64px 1fr; border-bottom: 1px solid #d2d2d2; min-height: 26px; }
      .meta div:last-child { border-bottom: 0; }
      .meta b { background: #f2f2f2; padding: 6px 7px; border-right: 1px solid #d2d2d2; }
      .meta span { padding: 6px 7px; }
      .muted { margin: 0; color: #333; font-size: 11px; line-height: 1.35; }
      .section-title { margin-top: 12px; background: #f4f4f4; border: 1px solid #c9c9c9; padding: 7px 9px; font-weight: 800; font-style: italic; text-transform: uppercase; font-size: 12px; }
      .grid { display: grid; grid-template-columns: repeat(2, 1fr); border-left: 1px solid #c9c9c9; border-top: 1px solid #c9c9c9; }
      .field { min-height: 32px; border-right: 1px solid #c9c9c9; border-bottom: 1px solid #c9c9c9; padding: 5px 8px; font-size: 11px; }
      .field b { display: block; color: #333; font-size: 9px; text-transform: uppercase; margin-bottom: 3px; }
      table { width: 100%; border-collapse: collapse; margin-top: 0; font-size: 11px; }
      th { background: #f4f4f4; border: 1px solid #b9b9b9; padding: 6px 7px; text-align: left; text-transform: uppercase; font-size: 10px; }
      td { border: 1px solid #c9c9c9; padding: 6px 7px; vertical-align: top; }
      .num { text-align: right; white-space: nowrap; }
      .totals { margin-left: auto; width: 260px; border: 1px solid #999; border-top: 0; }
      .totals div { display: grid; grid-template-columns: 1fr 110px; border-top: 1px solid #ccc; font-size: 12px; }
      .totals b { background: #f2f2f2; padding: 6px 8px; }
      .totals span { padding: 6px 8px; text-align: right; }
      .warranty { min-height: 58px; border: 1px solid #c9c9c9; border-top: 0; padding: 7px 9px; white-space: pre-line; font-size: 11px; line-height: 1.3; }
      .signature { margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 36px; align-items: end; break-inside: avoid; page-break-inside: avoid; }
      .line { border-top: 1px solid #111; text-align: center; padding-top: 6px; font-size: 11px; }
      .actions { position: fixed; right: 18px; top: 18px; display: flex; gap: 8px; }
      .actions button { border: 1px solid #111; background: #111; color: #fff; border-radius: 8px; padding: 10px 12px; font-weight: 700; cursor: pointer; }
      .hint { position: fixed; right: 18px; top: 64px; max-width: 260px; border-radius: 8px; background: #fff; border: 1px solid #bbb; padding: 10px; font-size: 12px; line-height: 1.35; color: #222; }
      @media print { body { background: #fff; } .sheet { width: auto; min-height: 0; margin: 0; padding: 0; } .actions, .hint { display: none; } }
    </style>
  </head>
  <body>
    <div class="actions"><button onclick="window.print()">Imprimir / Salvar PDF</button></div>
    <div class="hint">Se aparecer segunda página em branco, selecione margens "Nenhuma" ou "Mínimas" na janela de impressão.</div>
    <main class="sheet">
      <div class="docbar">
        <span>${escapeHtml(generatedAt)}</span>
        <span class="center">Orçamento ${escapeHtml(budget.numero)}</span>
        <span></span>
      </div>
      <header class="top">
        <img class="logo" src="${techsoftLogo}" alt="Logo TechSoft" />
        <div>
          <h1>${TECHSOFT_BUDGET_INFO.nome}</h1>
          <p class="muted">
            CNPJ: ${TECHSOFT_BUDGET_INFO.cnpj}<br />
            E-mail: ${TECHSOFT_BUDGET_INFO.email}<br />
            Telefone: ${escapeHtml(telefone || 'Configurar no painel')}<br />
            Responsável Técnico: ${TECHSOFT_BUDGET_INFO.responsavel}<br />
            Endereço: ${TECHSOFT_BUDGET_INFO.endereco}
          </p>
        </div>
        <div class="meta">
          <div><b>Orç.</b><span>${escapeHtml(budget.numero)}</span></div>
          <div><b>Data</b><span>${formatDate(budget.data_orcamento)}</span></div>
          <div><b>Entrega</b><span>${formatDate(budget.previsao_entrega)}</span></div>
          <div><b>Status</b><span>${BUDGET_STATUS_LABEL[budget.status]}</span></div>
        </div>
      </header>
      <div class="section-title">Informações gerais</div>
      <div class="grid">
        <div class="field"><b>Técnico responsável</b>${escapeHtml(budget.tecnico_responsavel)}</div>
        <div class="field"><b>Aos cuidados de</b>${escapeHtml(budget.aos_cuidados_de)}</div>
      </div>
      <div class="section-title">Dados do cliente / empresa solicitante</div>
      <div class="grid">
        <div class="field"><b>Nome / Razão Social</b>${escapeHtml(budget.cliente_nome)}</div>
        <div class="field"><b>CPF / CNPJ</b>${escapeHtml(budget.cliente_documento)}</div>
        <div class="field"><b>Endereço</b>${escapeHtml(budget.cliente_endereco)}</div>
        <div class="field"><b>CEP</b>${escapeHtml(budget.cliente_cep)}</div>
        <div class="field"><b>Cidade / Estado</b>${escapeHtml(budget.cliente_cidade)} / ${escapeHtml(budget.cliente_estado)}</div>
        <div class="field"><b>Telefone</b>${escapeHtml(budget.cliente_telefone)}</div>
        <div class="field"><b>E-mail</b>${escapeHtml(budget.cliente_email)}</div>
      </div>
      <div class="section-title">Serviços / produtos</div>
      <table>
        <thead><tr><th style="width:52px">Item</th><th>Nome / descrição</th><th style="width:82px" class="num">Qtd.</th><th style="width:125px" class="num">Valor unit.</th><th style="width:125px" class="num">Subtotal</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="totals">
        <div><b>Quantidade total</b><span>${totalQuantity}</span></div>
        <div><b>Total serviços</b><span>${formatMoney(budget.subtotal)}</span></div>
        <div><b>Total geral</b><span><strong>${formatMoney(budget.total)}</strong></span></div>
      </div>
      <div class="section-title">Garantia do serviço</div>
      <div class="warranty">${escapeHtml(budget.garantia_texto)}</div>
      <div class="signature">
        <div class="line">Assinatura do cliente</div>
        <div class="line">${TECHSOFT_BUDGET_INFO.nome}</div>
      </div>
    </main>
    <script>setTimeout(() => window.print(), 300);</script>
  </body>
  </html>`;
}

function openBudgetPdf(budget: Budget, items: BudgetItem[], telefone: string) {
  const popup = window.open('', '_blank', 'width=980,height=900');
  if (!popup) return;
  popup.document.open();
  popup.document.write(buildBudgetPrintHtml(budget, items, telefone));
  popup.document.close();
}

function BudgetsScreen({ state, actions }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions'] }) {
  const [telefone, setTelefone] = useState(localStorage.getItem('techsoft-budget-phone') ?? '(48) 99151-2020');
  const [form, setForm] = useState<BudgetForm>(createEmptyBudgetForm());
  const [items, setItems] = useState<BudgetItemForm[]>([createEmptyBudgetItem(1)]);
  const [selectedId, setSelectedId] = useState(state.budgets[0]?.id ?? '');
  const [presetId, setPresetId] = useState(BUDGET_SERVICE_PRESETS[0]?.id ?? '');
  const [cnpjLookupStatus, setCnpjLookupStatus] = useState<CnpjLookupStatus>('idle');
  const [cnpjLookupMessage, setCnpjLookupMessage] = useState('');
  const total = items.reduce((sum, item) => sum + (Number(item.quantidade) || 0) * (Number(item.valor_unitario) || 0), 0);
  const selectedBudget = state.budgets.find((item) => item.id === selectedId) ?? null;

  const loadBudget = (budget: Budget) => {
    setSelectedId(budget.id);
    setForm({ ...budget });
    setItems(getBudgetItems(state, budget.id).map((item) => ({ item_numero: item.item_numero, nome: item.nome, quantidade: item.quantidade, valor_unitario: item.valor_unitario, subtotal: item.subtotal })));
  };
  const resetForm = () => {
    setSelectedId('');
    setForm(createEmptyBudgetForm());
    setItems([createEmptyBudgetItem(1)]);
  };
  const save = (status?: BudgetStatus) => {
    const cleanItems = items.filter((item) => item.nome.trim()).map((item, index) => ({
      ...item,
      item_numero: index + 1,
      quantidade: Number(item.quantidade) || 0,
      valor_unitario: Number(item.valor_unitario) || 0,
      subtotal: (Number(item.quantidade) || 0) * (Number(item.valor_unitario) || 0),
    }));
    const id = actions.saveBudget({ ...form, id: form.id || selectedId || undefined, status: status ?? form.status }, cleanItems.length ? cleanItems : [createEmptyBudgetItem(1)]);
    setSelectedId(id);
    setForm((current) => ({ ...current, id, status: status ?? current.status }));
    localStorage.setItem('techsoft-budget-phone', telefone);
  };
  const printCurrent = () => {
    const budget = state.budgets.find((item) => item.id === selectedId);
    if (!budget) {
      save('rascunho');
      setTimeout(() => {
        const saved = state.budgets.find((item) => item.id === selectedId);
        if (saved) openBudgetPdf(saved, getBudgetItems(state, saved.id), telefone);
      }, 50);
      return;
    }
    openBudgetPdf(budget, getBudgetItems(state, budget.id), telefone);
  };
  const duplicate = (id: string) => {
    const newId = actions.duplicateBudget(id);
    const duplicated = state.budgets.find((item) => item.id === newId);
    if (duplicated) loadBudget(duplicated);
  };
  const addPreset = () => {
    const preset = BUDGET_SERVICE_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    const nextItem = {
      item_numero: items.length + 1,
      nome: `${preset.nome} | Modelo: ${preset.modelo} | Peça: ${preset.peca}`,
      quantidade: 1,
      valor_unitario: preset.valor,
      subtotal: preset.valor,
    };
    const hasBlankOnly = items.length === 1 && !items[0].nome.trim() && Number(items[0].valor_unitario) === 0;
    setItems(hasBlankOnly ? [nextItem] : [...items, nextItem]);
  };
  const lookupCnpj = async () => {
    const cnpj = onlyDigits(form.cliente_documento);
    if (cnpj.length !== 14) {
      setCnpjLookupStatus('error');
      setCnpjLookupMessage('Informe um CNPJ com 14 digitos para buscar os dados da empresa.');
      return;
    }
    setCnpjLookupStatus('loading');
    setCnpjLookupMessage('Consultando dados cadastrais...');
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if (!response.ok) throw new Error(response.status === 404 ? 'CNPJ nao encontrado.' : 'Nao foi possivel consultar este CNPJ agora.');
      const data = await response.json() as BrasilApiCnpjResponse;
      setForm((current) => ({
        ...current,
        cliente_nome: data.razao_social || data.nome_fantasia || current.cliente_nome,
        cliente_documento: formatCnpj(data.cnpj || cnpj),
        cliente_endereco: formatCnpjAddress(data) || current.cliente_endereco,
        cliente_cep: formatCep(data.cep || current.cliente_cep),
        cliente_cidade: data.municipio || current.cliente_cidade,
        cliente_estado: (data.uf || current.cliente_estado).toUpperCase(),
        cliente_telefone: formatCnpjPhone(data) || current.cliente_telefone,
        cliente_email: data.email?.toLowerCase() || current.cliente_email,
      }));
      setCnpjLookupStatus('success');
      setCnpjLookupMessage('Dados da empresa preenchidos para o orcamento e NF.');
    } catch (error) {
      setCnpjLookupStatus('error');
      setCnpjLookupMessage(error instanceof Error ? error.message : 'Nao foi possivel consultar este CNPJ agora.');
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle title="Gerador de Orçamentos em PDF" subtitle="Crie orçamentos A4 profissionais da TechSoft, prontos para impressão ou salvar como PDF." />
        <div className="flex flex-wrap gap-2">
          <Button onClick={resetForm}><Plus className="h-4 w-4" />Criar orçamento</Button>
          <Button variant="secondary" onClick={() => save('rascunho')}>Salvar rascunho</Button>
          <Button variant="secondary" onClick={printCurrent}><Printer className="h-4 w-4" />Gerar PDF / Imprimir</Button>
        </div>
      </div>
      <Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Info label="Empresa" value={TECHSOFT_BUDGET_INFO.nome} />
          <Info label="CNPJ" value={TECHSOFT_BUDGET_INFO.cnpj} />
          <Info label="E-mail" value={TECHSOFT_BUDGET_INFO.email} />
          <Field label="Telefone configurável"><Input value={telefone} onChange={(event) => setTelefone(event.target.value)} /></Field>
        </div>
        <p className="mt-4 text-sm leading-6 text-zinc-400">Responsável Técnico: {TECHSOFT_BUDGET_INFO.responsavel}. Endereço: {TECHSOFT_BUDGET_INFO.endereco}</p>
      </Card>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Número do orçamento"><Input value={form.numero ?? (selectedBudget?.numero ?? 'Automático ao salvar')} disabled /></Field>
            <Field label="Data do orçamento"><Input type="date" value={form.data_orcamento} onChange={(e) => setForm({ ...form, data_orcamento: e.target.value })} /></Field>
            <Field label="Previsão de entrega"><Input type="date" value={form.previsao_entrega} onChange={(e) => setForm({ ...form, previsao_entrega: e.target.value })} /></Field>
            <Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as BudgetStatus })}>{Object.entries(BUDGET_STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
            <Field label="Técnico responsável"><Input value={form.tecnico_responsavel} onChange={(e) => setForm({ ...form, tecnico_responsavel: e.target.value })} /></Field>
            <Field label="Aos cuidados de"><Input value={form.aos_cuidados_de} onChange={(e) => setForm({ ...form, aos_cuidados_de: e.target.value })} /></Field>
          </div>
          <div className="mt-6">
            <PageTitle title="Cliente / empresa solicitante" subtitle="Dados que aparecerão no bloco principal do orçamento." />
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Nome / Razão Social"><Input value={form.cliente_nome} onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })} /></Field>
              <Field label="CPF / CNPJ" className="md:col-span-2 xl:col-span-2">
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px]">
                  <Input
                    value={form.cliente_documento}
                    onChange={(e) => {
                      setForm({ ...form, cliente_documento: e.target.value });
                      setCnpjLookupStatus('idle');
                      setCnpjLookupMessage('');
                    }}
                    onBlur={() => {
                      if (onlyDigits(form.cliente_documento).length === 14) {
                        setForm((current) => ({ ...current, cliente_documento: formatCnpj(current.cliente_documento) }));
                      }
                    }}
                    placeholder="Digite CPF ou CNPJ"
                  />
                  <Button variant="secondary" className="w-full whitespace-nowrap" onClick={lookupCnpj} disabled={cnpjLookupStatus === 'loading'}>
                    <Search className="h-4 w-4" />{cnpjLookupStatus === 'loading' ? 'Buscando' : 'Buscar CNPJ'}
                  </Button>
                </div>
                {cnpjLookupMessage && <p className={cx('mt-2 text-xs leading-5', cnpjLookupStatus === 'success' ? 'text-tech-neon' : 'text-yellow-100')}>{cnpjLookupMessage}</p>}
              </Field>
              <Field label="Endereço"><Input value={form.cliente_endereco} onChange={(e) => setForm({ ...form, cliente_endereco: e.target.value })} /></Field>
              <Field label="CEP"><Input value={form.cliente_cep} onChange={(e) => setForm({ ...form, cliente_cep: e.target.value })} /></Field>
              <Field label="Cidade"><Input value={form.cliente_cidade} onChange={(e) => setForm({ ...form, cliente_cidade: e.target.value })} /></Field>
              <Field label="Estado"><Input value={form.cliente_estado} onChange={(e) => setForm({ ...form, cliente_estado: e.target.value.toUpperCase() })} maxLength={2} /></Field>
              <Field label="Telefone"><Input value={form.cliente_telefone} onChange={(e) => setForm({ ...form, cliente_telefone: e.target.value })} /></Field>
              <Field label="E-mail"><Input type="email" value={form.cliente_email} onChange={(e) => setForm({ ...form, cliente_email: e.target.value })} /></Field>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <PageTitle title="Serviços / produtos" subtitle="Adicione quantos itens precisar. Os totais são calculados automaticamente." />
              <Button variant="secondary" onClick={() => setItems([...items, createEmptyBudgetItem(items.length + 1)])}><Plus className="h-4 w-4" />Adicionar item</Button>
            </div>
            <Card className="mt-4 bg-black/25">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <Field label="Adicionar serviço/modelo/peça pesquisado"><Select value={presetId} onChange={(event) => setPresetId(event.target.value)}>{BUDGET_SERVICE_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.categoria} · {preset.modelo} · {preset.peca} · {formatMoney(preset.valor)}</option>)}</Select></Field>
                <Button variant="secondary" onClick={addPreset}><Plus className="h-4 w-4" />Adicionar ao orçamento</Button>
              </div>
              <p className="mt-3 text-xs leading-5 text-zinc-500">Valores de referência para orçamento rápido. Ajuste cada item conforme modelo exato, disponibilidade da peça e diagnóstico.</p>
            </Card>
            <div className="mt-4 grid gap-3">
              {items.map((item, index) => {
                const subtotal = (Number(item.quantidade) || 0) * (Number(item.valor_unitario) || 0);
                return (
                  <div key={index} className="grid min-w-0 gap-3 rounded-lg border border-white/10 bg-black/25 p-4 sm:grid-cols-2 xl:grid-cols-[64px_minmax(220px,1fr)_88px_132px_132px_52px] xl:items-end">
                    <Field label="Item"><Input type="number" value={index + 1} disabled /></Field>
                    <Field label="Nome / descrição" className="sm:col-span-2 xl:col-span-1"><Input value={item.nome} onChange={(e) => setItems(items.map((row, rowIndex) => rowIndex === index ? { ...row, nome: e.target.value } : row))} /></Field>
                    <Field label="Qtd."><Input type="number" min={0} step="1" value={item.quantidade} onChange={(e) => setItems(items.map((row, rowIndex) => rowIndex === index ? { ...row, quantidade: Number(e.target.value) } : row))} /></Field>
                    <Field label="Valor unitário"><Input type="number" min={0} step="0.01" value={item.valor_unitario} onChange={(e) => setItems(items.map((row, rowIndex) => rowIndex === index ? { ...row, valor_unitario: Number(e.target.value) } : row))} /></Field>
                    <div className="min-w-0"><Info label="Subtotal" value={formatMoney(subtotal)} /></div>
                    <Button variant="danger" className="h-11 w-full px-3 xl:w-11" onClick={() => setItems(items.filter((_, rowIndex) => rowIndex !== index))} disabled={items.length === 1}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_260px]">
            <Field label="Garantia do serviço"><Textarea value={form.garantia_texto} onChange={(e) => setForm({ ...form, garantia_texto: e.target.value })} /></Field>
            <Card className="h-max bg-black/25">
              <Info label="Quantidade total" value={String(items.reduce((sum, item) => sum + (Number(item.quantidade) || 0), 0))} />
              <div className="mt-3"><Info label="Total de serviços" value={formatMoney(total)} /></div>
              <div className="mt-3"><Info label="Total geral" value={formatMoney(total)} /></div>
            </Card>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => save('rascunho')}>Salvar rascunho</Button>
            <Button variant="secondary" onClick={() => save('enviado')}>Marcar como enviado</Button>
            <Button variant="secondary" onClick={printCurrent}><Download className="h-4 w-4" />Gerar PDF</Button>
            <Button variant="secondary" onClick={printCurrent}><Printer className="h-4 w-4" />Imprimir</Button>
          </div>
        </Card>
        <div className="grid h-max gap-4">
          <Card>
            <PageTitle title="Orçamentos" subtitle="Editar, duplicar, excluir ou atualizar status." />
            <div className="mt-4 grid gap-3">
              {state.budgets.map((budget) => (
                <div key={budget.id} className={cx('rounded-lg border p-4', selectedId === budget.id ? 'border-tech-neon/40 bg-tech-neon/10' : 'border-white/10 bg-black/25')}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div><p className="font-black text-white">{budget.numero}</p><p className="mt-1 text-sm text-zinc-400">{budget.cliente_nome || 'Cliente não informado'} · {formatMoney(budget.total)}</p></div>
                    <Pill className={budgetStatusClass(budget.status)}>{BUDGET_STATUS_LABEL[budget.status]}</Pill>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => loadBudget(budget)}>Editar</Button>
                    <Button variant="secondary" onClick={() => openBudgetPdf(budget, getBudgetItems(state, budget.id), telefone)}>PDF</Button>
                    <Button variant="secondary" onClick={() => duplicate(budget.id)}><Copy className="h-4 w-4" />Duplicar</Button>
                    <Button variant="danger" onClick={() => actions.deleteBudget(budget.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {(['aprovado', 'recusado', 'concluido'] as BudgetStatus[]).map((status) => <Button key={status} variant="secondary" onClick={() => actions.setBudgetStatus(budget.id, status)}>{BUDGET_STATUS_LABEL[status]}</Button>)}
                  </div>
                </div>
              ))}
              {state.budgets.length === 0 && <EmptyMessage title="Nenhum orçamento" description="Crie o primeiro orçamento profissional em PDF da TechSoft." />}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CashbackScreen({ state, actions }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions'] }) {
  const activePasses = state.techpasses.filter((item) => item.status === 'ATIVO' && item.cliente_id);
  const [techpassId, setTechpassId] = useState(activePasses[0]?.id ?? '');
  const [tipo, setTipo] = useState<CashbackTipo>('credito');
  const [valor, setValor] = useState(20);
  const [descricao, setDescricao] = useState('Cashback lançado manualmente.');
  const [message, setMessage] = useState('');
  const [empresaFilter, setEmpresaFilter] = useState('todas');
  const [statusFilter, setStatusFilter] = useState('todos');
  const selected = state.techpasses.find((item) => item.id === techpassId) ?? null;
  const filteredTransactions = state.cashback_transactions.filter((item) => (empresaFilter === 'todas' || item.empresa_id === empresaFilter) && (statusFilter === 'todos' || item.status === statusFilter));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!selected?.cliente_id) return;
    const balance = getCashbackBalance(state, selected.id);
    if (tipo === 'debito' && valor > balance) {
      setMessage('Débito bloqueado: saldo insuficiente.');
      return;
    }
    actions.addCashback({ cliente_id: selected.cliente_id, techpass_id: selected.id, tipo, valor, descricao });
    setMessage('Movimentação registrada.');
  };
  return (
    <div className="grid gap-6">
      <PageTitle title="Cashback" subtitle="Adicione créditos, registre débitos e acompanhe o histórico." />
      <Card><form onSubmit={submit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Field label="Cliente TechPass"><Select value={techpassId} onChange={(e) => setTechpassId(e.target.value)}>{activePasses.map((item) => <option key={item.id} value={item.id}>{getClientName(state, item.cliente_id)} · {item.serial}</option>)}</Select></Field><Field label="Tipo"><Select value={tipo} onChange={(e) => setTipo(e.target.value as CashbackTipo)}><option value="credito">Crédito</option><option value="debito">Débito</option></Select></Field><Field label="Valor"><Input type="number" min={0} step="0.01" value={valor} onChange={(e) => setValor(Number(e.target.value))} /></Field><Field label="Descrição"><Input value={descricao} onChange={(e) => setDescricao(e.target.value)} /></Field><div className="md:col-span-2 xl:col-span-4"><Button type="submit" disabled={!selected}><Wallet className="h-4 w-4" />Registrar movimentação</Button>{selected && <p className="mt-3 text-sm text-zinc-400">Saldo atual: {formatMoney(getCashbackBalance(state, selected.id))}</p>}{message && <p className="mt-2 text-sm text-tech-neon">{message}</p>}</div></form></Card>
      <Card><PageTitle title="Cashback por empresa parceira" subtitle="Visão geral de saldos e transações configuráveis por empresa." /><div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Empresa"><Select value={empresaFilter} onChange={(e) => setEmpresaFilter(e.target.value)}><option value="todas">Todas</option>{state.empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>)}</Select></Field><Field label="Status"><Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="todos">Todos</option><option value="pendente">Pendente</option><option value="disponivel">Disponível</option><option value="usado">Usado</option><option value="cancelado">Cancelado</option></Select></Field></div><div className="mt-5 grid gap-3">{filteredTransactions.map((item) => <div key={item.id} className="grid gap-2 rounded-lg border border-white/10 bg-black/25 p-4 md:grid-cols-[1fr_auto] md:items-center"><div><p className="font-bold text-white">{getClientName(state, item.cliente_id)} · {getEmpresaName(state, item.empresa_id)}</p><p className="text-sm text-zinc-400">{item.descricao} · {formatDateTime(item.created_at)} · {item.tipo}/{item.status}</p></div><p className={cx('font-black', item.tipo === 'credito' ? 'text-tech-neon' : 'text-red-200')}>{item.tipo === 'credito' ? '+' : '-'} {formatMoney(item.valor)}</p></div>)}{filteredTransactions.length === 0 && <EmptyMessage title="Sem transações" description="As transações de cashback por empresa aparecerão aqui." />}</div></Card>
      <Card><h3 className="text-lg font-black text-white">Histórico de cashback</h3><div className="mt-4 grid gap-3">{state.cashback_movements.map((item) => <div key={item.id} className="grid gap-2 rounded-lg border border-white/10 bg-black/25 p-4 md:grid-cols-[1fr_auto] md:items-center"><div><p className="font-bold text-white">{getClientName(state, item.cliente_id)}</p><p className="text-sm text-zinc-400">{item.descricao} · {formatDate(item.created_at)}</p></div><p className={cx('font-black', item.tipo === 'credito' ? 'text-tech-neon' : 'text-red-200')}>{item.tipo === 'credito' ? '+' : '-'} {formatMoney(item.valor)}</p></div>)}{state.cashback_movements.length === 0 && <EmptyMessage title="Sem movimentações" description="As movimentações de cashback aparecerão aqui." />}</div></Card>
    </div>
  );
}

function IndicacoesScreen({ state, actions }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions'] }) {
  const activeClients = state.clientes.filter((client) => state.techpasses.some((tp) => tp.cliente_id === client.id && tp.status === 'ATIVO'));
  const [form, setForm] = useState({ cliente_indicador_id: activeClients[0]?.id ?? '', nome_indicado: '', telefone_indicado: '', valor_servico: 0, status: 'pendente' as IndicacaoStatus, recompensa: 'cashback' as RecompensaTipo, observacao: '' });
  const [message, setMessage] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (form.status === 'aprovado' && form.valor_servico < 350) {
      setMessage('A recompensa só pode ser aprovada quando o serviço ou compra for acima de R$350.');
      return;
    }
    actions.addIndicacao(form);
    setMessage('Indicação registrada.');
    setForm({ ...form, nome_indicado: '', telefone_indicado: '', valor_servico: 0, observacao: '' });
  };
  return (
    <div className="grid gap-6">
      <PageTitle title="Indique e Ganhe" subtitle="Registre indicações e aplique a regra de aprovação acima de R$350." />
      <Card><form onSubmit={submit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Field label="Cliente indicador"><Select value={form.cliente_indicador_id} onChange={(e) => setForm({ ...form, cliente_indicador_id: e.target.value })}>{activeClients.map((client) => <option key={client.id} value={client.id}>{client.nome} · {client.codigo_indicacao}</option>)}</Select></Field><Field label="Nome do indicado"><Input value={form.nome_indicado} onChange={(e) => setForm({ ...form, nome_indicado: e.target.value })} required /></Field><Field label="Telefone do indicado"><Input value={form.telefone_indicado} onChange={(e) => setForm({ ...form, telefone_indicado: e.target.value })} required /></Field><Field label="Valor do serviço ou compra"><Input type="number" min={0} step="0.01" value={form.valor_servico} onChange={(e) => setForm({ ...form, valor_servico: Number(e.target.value) })} /></Field><Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as IndicacaoStatus })}><option value="pendente">Pendente</option><option value="aprovado">Aprovado</option><option value="recusado">Recusado</option></Select></Field><Field label="Recompensa"><Select value={form.recompensa} onChange={(e) => setForm({ ...form, recompensa: e.target.value as RecompensaTipo })}><option value="desconto">Desconto</option><option value="cashback">Cashback</option><option value="brinde">Brinde</option></Select></Field><Field label="Observação"><Input value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} /></Field><div className="md:col-span-2 xl:col-span-3"><Button type="submit"><Gift className="h-4 w-4" />Registrar indicação</Button>{message && <p className="mt-3 text-sm text-zinc-200">{message}</p>}</div></form></Card>
      <Card><h3 className="text-lg font-black text-white">Histórico de indicações</h3><div className="mt-4 grid gap-3">{state.indicacoes.map((item) => <div key={item.id} className="rounded-lg border border-white/10 bg-black/25 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold text-white">{item.nome_indicado}</p><p className="text-sm text-zinc-400">Indicador: {state.clientes.find((client) => client.id === item.cliente_indicador_id)?.nome ?? 'Cliente'}</p></div><Pill className="border-white/15 bg-white/[0.06] text-zinc-200">{item.status}</Pill></div><p className="mt-2 text-sm text-zinc-400">{formatMoney(item.valor_servico)} · recompensa: {item.recompensa} · {item.observacao}</p></div>)}{state.indicacoes.length === 0 && <EmptyMessage title="Sem indicações" description="As indicações registradas aparecerão aqui." />}</div></Card>
    </div>
  );
}

function getServicoName(state: AppState, id: string) {
  return state.beneficios_servicos.find((item) => item.id === id)?.nome ?? 'Item não encontrado';
}

function SolicitacaoPill({ status }: { status: SolicitacaoStatus }) {
  const tone = status === 'concluida' ? 'border-tech-neon/40 bg-tech-neon/10 text-tech-neon' : status === 'cancelada' ? 'border-red-300/30 bg-red-400/10 text-red-100' : 'border-sky-300/30 bg-sky-400/10 text-sky-100';
  return <Pill className={tone}>{SOLICITACAO_LABEL[status]}</Pill>;
}

function findClientAccess(state: AppState, login: { cpf: string; telefone: string; codigo: string }) {
  const cpf = login.cpf.replace(/\D/g, '');
  const telefone = login.telefone.replace(/\D/g, '');
  const codigo = login.codigo.trim().toLowerCase();
  return state.techpasses.find((techpass) => {
    if (techpass.status !== 'ATIVO' || !techpass.cliente_id) return false;
    const cliente = state.clientes.find((item) => item.id === techpass.cliente_id);
    if (!cliente) return false;
    const byCpf = cpf && cliente.cpf.replace(/\D/g, '') === cpf;
    const byPhone = telefone && cliente.telefone.replace(/\D/g, '').includes(telefone);
    const byCode = codigo && [techpass.serial, techpass.codigo_fisico, techpass.codigo_indicacao ?? '', cliente.codigo_indicacao].some((value) => value.toLowerCase() === codigo);
    return Boolean(byCpf || byPhone || byCode);
  }) ?? null;
}

function ClientLogin({ state, navigate }: { state: AppState; navigate: (path: string) => void }) {
  const [login, setLogin] = useState({ cpf: '123.456.789-10', telefone: '', codigo: 'TP-SG-000002' });
  const [message, setMessage] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const techpass = findClientAccess(state, login);
    if (!techpass?.cliente_id) {
      setMessage('Não encontramos um TechPass ativo com esses dados.');
      return;
    }
    localStorage.setItem('techpass-client-id', techpass.cliente_id);
    navigate('/cliente/dashboard');
  };
  return (
    <PublicShell>
      <Card className="mx-auto max-w-3xl p-6 sm:p-8">
        <PageTitle title="Login do cliente TechPass" subtitle="Acesse usando CPF, telefone/WhatsApp ou código TechPass." />
        <form className="mt-6 grid gap-4 md:grid-cols-3" onSubmit={submit}>
          <Field label="CPF"><Input value={login.cpf} onChange={(event) => setLogin({ ...login, cpf: event.target.value })} placeholder="000.000.000-00" /></Field>
          <Field label="Telefone / WhatsApp"><Input value={login.telefone} onChange={(event) => setLogin({ ...login, telefone: event.target.value })} placeholder="(00) 00000-0000" /></Field>
          <Field label="Código TechPass"><Input value={login.codigo} onChange={(event) => setLogin({ ...login, codigo: event.target.value })} placeholder="Serial, voucher ou indicação" /></Field>
          <div className="md:col-span-3"><Button type="submit"><UserCheck className="h-4 w-4" />Entrar no dashboard</Button></div>
        </form>
        {message && <p className="mt-4 text-sm text-red-100">{message}</p>}
        <p className="mt-4 text-sm text-zinc-400">Demonstração: use CPF 123.456.789-10 ou código TP-SG-000002.</p>
      </Card>
    </PublicShell>
  );
}

function MyEconomyPage({ state, navigate }: { state: AppState; navigate: (path: string) => void }) {
  const clientId = localStorage.getItem('techpass-client-id') ?? 'cli-maria';
  const cliente = state.clientes.find((item) => item.id === clientId);
  const techpass = cliente ? state.techpasses.find((item) => item.cliente_id === cliente.id && item.status === 'ATIVO') : null;
  return (
    <PublicShell>
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageTitle title="Minha Economia TechPass" subtitle="Veja em dinheiro o que o TechPass ja devolveu em beneficios, TechCash e condicoes exclusivas." />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate('/cliente/dashboard')}>Dashboard do cliente</Button>
            <Button variant="secondary" onClick={() => navigate('/')}>Home</Button>
          </div>
        </div>
        {cliente && techpass ? <MyEconomyPanel state={state} cliente={cliente} techpass={techpass} /> : <EmptyMessage title="Cliente nao autenticado" description="Entre pelo login do cliente para consultar sua economia." />}
      </div>
    </PublicShell>
  );
}

function MyEconomyPanel({ state, cliente, techpass }: { state: AppState; cliente: AppState['clientes'][number]; techpass: TechPass }) {
  const economy = getClientEconomy(state, cliente.id, techpass);
  const companyBalances = state.cashback_balances.filter((item) => item.cliente_id === cliente.id);
  const rankedOffers = state.ofertas
    .filter((oferta) => oferta.status === 'ativo' && state.empresas.find((empresa) => empresa.id === oferta.empresa_id)?.status === 'ativa')
    .sort((a, b) => getOfferScore(b) - getOfferScore(a))
    .slice(0, 4);
  const progress = Math.min((economy.confirmedValue / Math.max(economy.confirmedValue + economy.potentialValue, 1)) * 100, 100);

  return (
    <div className="grid gap-6">
      <Card className="overflow-hidden border-tech-neon/30 bg-tech-neon/10 p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-tech-neon">Resumo pessoal</p>
            <h2 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">{formatMoney(economy.confirmedValue)}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">Economia registrada para {cliente.nome}, somando beneficios usados, TechCash disponivel e ofertas ja convertidas em leads fechados.</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 p-4">
            <p className="text-sm font-black text-white">Potencial ainda disponivel</p>
            <p className="mt-2 text-3xl font-black text-tech-neon">{formatMoney(economy.potentialValue)}</p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-tech-neon" style={{ width: `${progress}%` }} /></div>
          </div>
        </div>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="TechCash disponivel" value={formatMoney(economy.cashbackAvailable)} tone="neon" />
        <Stat label="TechCash pendente" value={formatMoney(economy.cashbackPending)} tone="warn" />
        <Stat label="Peliculas usadas" value={`${economy.filmsUsed} de 6`} />
        <Stat label="Peliculas restantes" value={`${techpass.peliculas_restantes} de 6`} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <PageTitle title="De onde veio sua economia" subtitle="Uma leitura simples para o cliente entender o valor do TechPass." />
          <div className="mt-5 grid gap-3">
            <Info label="Beneficios e usos registrados" value={formatMoney(Math.max(economy.filmsValue, economy.usageValue))} />
            <Info label="Cashback ja liberado" value={formatMoney(economy.cashbackAvailable)} />
            <Info label="Ofertas fechadas" value={formatMoney(economy.leadsValue)} />
            <Info label="Empresa de origem" value={getEmpresaName(state, techpass.empresa_id)} />
          </div>
        </Card>
        <Card>
          <PageTitle title="Saldos por empresa" subtitle="O TechCash pode ter regras e limites diferentes por parceiro." />
          <div className="mt-5 grid gap-3">
            {companyBalances.map((item) => <div key={item.id} className="rounded-lg border border-white/10 bg-black/25 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><p className="font-black text-white">{getEmpresaName(state, item.empresa_id)}</p><Pill className="border-tech-neon/40 bg-tech-neon/10 text-tech-neon">{formatMoney(item.saldo_disponivel)} disponivel</Pill></div><p className="mt-2 text-sm text-zinc-400">{formatMoney(item.saldo_pendente)} aguardando confirmacao · limite {formatMoney(item.limite_maximo)}</p></div>)}
            {companyBalances.length === 0 && <EmptyMessage title="Sem TechCash por empresa" description="Quando uma oferta ou compra gerar cashback, o saldo aparecera aqui." />}
          </div>
        </Card>
      </div>
      <Card>
        <PageTitle title="Proximas economias recomendadas" subtitle="Ofertas ordenadas por vantagem percebida, cashback e recorrencia." />
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {rankedOffers.map((oferta, index) => <div key={oferta.id} className="rounded-lg border border-white/10 bg-black/25 p-4"><p className="text-xs font-black uppercase text-tech-neon">#{index + 1} · {getEmpresaName(state, oferta.empresa_id)}</p><h3 className="mt-2 font-black text-white">{oferta.nome}</h3><p className="mt-2 text-sm text-zinc-400">{oferta.economia || 'Condicao especial'} · {oferta.preco_techpass || 'Sob consulta'}</p></div>)}
        </div>
      </Card>
    </div>
  );
}

type ClientView = 'techpass' | 'economia' | 'beneficios' | 'ofertas' | 'solicitacoes' | 'indicacoes' | 'techcash' | 'perfil';

function ClientArea({ state, actions, navigate }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions']; navigate: (path: string) => void }) {
  const clientId = localStorage.getItem('techpass-client-id') ?? 'cli-maria';
  const cliente = state.clientes.find((item) => item.id === clientId);
  const matchedPass = cliente ? state.techpasses.find((item) => item.cliente_id === cliente.id && item.status === 'ATIVO') : null;
  const [view, setView] = useState<ClientView>('techpass');

  return (
    <PublicShell>
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageTitle title="Dashboard do cliente" subtitle="Meu TechPass, ofertas, indicações, TechCash e solicitações em andamento." />
          <div className="flex flex-wrap gap-2">
            {cliente && <NotificationBell notifications={state.notifications.filter((item) => item.tipo_usuario === 'cliente' && item.user_id === cliente.id)} actions={actions} navigate={navigate} scope={{ tipo_usuario: 'cliente', user_id: cliente.id }} />}
            <Button variant="secondary" onClick={() => navigate('/login')}>Trocar acesso</Button>
            <Button variant="secondary" onClick={() => navigate('/')}>Site público</Button>
          </div>
        </div>
        {!matchedPass || !cliente ? <EmptyMessage title="Cliente não autenticado" description="Acesse pela página de login usando CPF, telefone ou código TechPass." /> : (
          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <Card className="h-max p-3">
              {[
                ['techpass', 'Meu TechPass'],
                ['economia', 'Minha Economia'],
                ['beneficios', 'Benefícios'],
                ['ofertas', 'Ofertas Exclusivas'],
                ['solicitacoes', 'Agendamentos/Solicitações'],
                ['indicacoes', 'Indicações'],
                ['techcash', 'TechCash'],
                ['perfil', 'Perfil'],
              ].map(([id, label]) => <button key={id} onClick={() => setView(id as typeof view)} className={cx('block w-full rounded-md px-3 py-3 text-left text-sm font-bold transition', view === id ? 'bg-tech-neon text-black' : 'text-zinc-300 hover:bg-white/[0.08] hover:text-white')}>{label}</button>)}
            </Card>
            <ClientDashboard state={state} actions={actions} cliente={cliente} techpass={matchedPass} view={view} navigate={navigate} setView={setView} />
          </div>
        )}
      </div>
    </PublicShell>
  );
}

function ClientDashboard({ state, actions, cliente, techpass, view, navigate, setView }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions']; cliente: AppState['clientes'][number]; techpass: TechPass; view: ClientView; navigate: (path: string) => void; setView: (view: ClientView) => void }) {
  const solicitacoes = state.solicitacoes.filter((item) => item.cliente_id === cliente.id);
  const utilizacoes = state.utilizacoes.filter((item) => item.cliente_id === cliente.id);
  const itensAtivos = state.beneficios_servicos.filter((item) => item.status === 'ativo');
  const [empresaId, setEmpresaId] = useState(itensAtivos[0]?.empresa_id ?? '');
  const itensEmpresa = itensAtivos.filter((item) => !empresaId || item.empresa_id === empresaId);
  const [itemId, setItemId] = useState(itensEmpresa[0]?.id ?? '');
  const selectedItem = state.beneficios_servicos.find((item) => item.id === itemId) ?? itensEmpresa[0];
  const [agenda, setAgenda] = useState({ data: '', horario: '', observacao: '' });
  const [message, setMessage] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const item = selectedItem;
    if (!item) return;
    actions.addSolicitacao({ cliente_id: cliente.id, techpass_id: techpass.id, empresa_id: item.empresa_id, beneficio_servico_id: item.id, tipo: item.tipo, data_preferida: agenda.data, horario_preferido: agenda.horario, observacao: agenda.observacao });
    setAgenda({ data: '', horario: '', observacao: '' });
    setMessage('Solicitação enviada. A empresa responsável vai analisar e confirmar.');
  };
  const openSolicitacoes = solicitacoes.filter((item) => !['concluida', 'cancelada'].includes(item.status));
  const ofertasAtivas = state.ofertas.filter((oferta) => oferta.status === 'ativo' && state.empresas.find((empresa) => empresa.id === oferta.empresa_id)?.status === 'ativa');
  const clientNotifications = state.notifications.filter((item) => item.tipo_usuario === 'cliente' && item.user_id === cliente.id);
  const techCashDisponivel = state.cashback_balances.filter((item) => item.cliente_id === cliente.id).reduce((sum, item) => sum + item.saldo_disponivel, 0);
  const economy = getClientEconomy(state, cliente.id, techpass);
  const bestOffer = ofertasAtivas.slice().sort((a, b) => getOfferScore(b) - getOfferScore(a))[0];
  if (view === 'beneficios') {
    return <div className="grid gap-6"><Card><BenefitsList /></Card><Card><PageTitle title="Benefícios utilizados" subtitle="Histórico de películas, limpezas, consultorias, descontos, cashback e indicações." /><UsageHistory state={state} utilizacoes={utilizacoes} /></Card></div>;
  }
  if (view === 'economia') {
    return <MyEconomyPanel state={state} cliente={cliente} techpass={techpass} />;
  }
  if (view === 'ofertas') {
    return <ClientOffers state={state} actions={actions} cliente={cliente} techpass={techpass} ofertas={ofertasAtivas} />;
  }
  if (view === 'solicitacoes') {
    return <Card><PageTitle title="Agendamentos e solicitações" subtitle="Acompanhe pedidos enviados para empresas parceiras." /><div className="mt-4 grid gap-3">{solicitacoes.map((item) => <SolicitacaoRow key={item.id} state={state} solicitacao={item} />)}{solicitacoes.length === 0 && <EmptyMessage title="Sem solicitações" description="Solicite um serviço, aula ou oferta para acompanhar aqui." />}</div></Card>;
  }
  if (view === 'indicacoes') {
    return <ClientIndications state={state} actions={actions} cliente={cliente} techpass={techpass} />;
  }
  if (view === 'techcash') {
    return <TechCashPanel state={state} techpass={techpass} />;
  }
  if (view === 'perfil') {
    return <ClientProfile cliente={cliente} techpass={techpass} state={state} />;
  }
  return (
    <div className="grid gap-6">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h1 className="text-3xl font-black text-white">{cliente.nome}</h1><p className="mt-1 text-zinc-400">{getEmpresaName(state, techpass.empresa_id)} · {techpass.serial}</p></div>
          <StatusPill status={getEffectiveStatus(techpass)} />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Info label="Notificações" value={String(clientNotifications.filter((item) => !item.lida).length)} />
          <Info label="Novas ofertas" value={String(ofertasAtivas.length)} />
          <Info label="Validade" value={formatDate(techpass.expires_at)} />
          <Info label="Cashback disponível" value={formatMoney(techCashDisponivel || getCashbackBalance(state, techpass.id))} />
          <Info label="Películas restantes" value={techpass.peliculas_restantes + ' de 6'} />
          <Info label="Código de indicação" value={techpass.codigo_indicacao ?? cliente.codigo_indicacao ?? 'Não gerado'} />
          <Info label="Benefícios disponíveis" value={String(itensAtivos.length)} />
          <Info label="Agendamentos" value={String(openSolicitacoes.length)} />
          <Info label="Histórico" value={String(utilizacoes.length)} />
          <Info label="Indicações" value={String(state.fight_core_indicacoes.filter((item) => item.cliente_id === cliente.id).length + state.techsoft_indicacoes.filter((item) => item.cliente_id === cliente.id).length)} />
        </div>
      </Card>
      <Card className="border-tech-neon/30 bg-tech-neon/10">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-tech-neon">Proxima melhor acao</p>
            <h3 className="mt-2 text-2xl font-black text-white">{economy.cashbackAvailable >= 100 ? 'Voce ja pode usar seu TechCash.' : bestOffer ? 'Veja a oferta com maior vantagem agora.' : 'Acompanhe sua economia acumulada.'}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-300">{economy.cashbackAvailable >= 100 ? 'Seu saldo passou do ponto de resgate. Use em brinde, servico ou desconto conforme regras da empresa.' : bestOffer ? `${bestOffer.nome} concentra uma das melhores condicoes disponiveis para membros TechPass.` : 'A tela de economia mostra cashback, beneficios usados e valor potencial da rede.'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate('/minha-economia')}>Ver minha economia</Button>
            {bestOffer && <Button variant="secondary" onClick={() => setView('ofertas')}>Abrir ofertas</Button>}
          </div>
        </div>
      </Card>
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card><BenefitsList /></Card>
        <Card><PageTitle title="Solicitações em aberto" subtitle="Pedidos aguardando análise, confirmação ou atendimento." /><div className="mt-4 grid gap-3">{openSolicitacoes.map((item) => <SolicitacaoRow key={item.id} state={state} solicitacao={item} />)}{openSolicitacoes.length === 0 && <EmptyMessage title="Nada em aberto" description="Solicite um serviço ou benefício quando precisar." />}</div></Card>
      </div>
      <Card>
        <PageTitle title="Benefícios utilizados" subtitle="Histórico de películas, limpezas, consultorias, descontos, cashback e indicações." />
        <UsageHistory state={state} utilizacoes={utilizacoes} />
      </Card>
      <Card>
        <PageTitle title="Serviços com desconto para membros TechPass" subtitle="Escolha uma empresa, selecione o serviço ou benefício e envie uma solicitação." />
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{itensAtivos.map((item) => <ServiceCard key={item.id} state={state} item={item} onSelect={() => { setEmpresaId(item.empresa_id); setItemId(item.id); }} />)}</div>
        <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Empresa parceira"><Select value={empresaId} onChange={(event) => { setEmpresaId(event.target.value); setItemId(state.beneficios_servicos.find((item) => item.empresa_id === event.target.value && item.status === 'ativo')?.id ?? ''); }}>{state.empresas.filter((item) => item.status === 'ativa').map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>)}</Select></Field>
          <Field label="Serviço ou benefício"><Select value={itemId} onChange={(event) => setItemId(event.target.value)}>{itensEmpresa.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</Select></Field>
          <Field label="Data desejada"><Input type="date" value={agenda.data} onChange={(event) => setAgenda({ ...agenda, data: event.target.value })} /></Field>
          <Field label="Horário / preferência"><Input value={agenda.horario} onChange={(event) => setAgenda({ ...agenda, horario: event.target.value })} placeholder="Ex: 14h ou tarde" /></Field>
          <div className="md:col-span-2 xl:col-span-4"><Field label="Observação"><Textarea value={agenda.observacao} onChange={(event) => setAgenda({ ...agenda, observacao: event.target.value })} /></Field></div>
          <div className="md:col-span-2 xl:col-span-4"><Button type="submit" disabled={!selectedItem}><Store className="h-4 w-4" />Solicitar serviço</Button>{message && <p className="mt-3 text-sm text-tech-neon">{message}</p>}</div>
        </form>
      </Card>
    </div>
  );
}

function ServiceCard({ state, item, onSelect }: { state: AppState; item: BeneficioServico; onSelect?: () => void }) {
  return <button type="button" onClick={onSelect} className="rounded-lg border border-white/10 bg-black/25 p-4 text-left transition hover:border-tech-neon/60"><div className="flex items-start justify-between gap-2"><div><p className="font-black text-white">{item.nome}</p><p className="mt-1 text-xs font-bold uppercase text-tech-neon">{getEmpresaName(state, item.empresa_id)} · {item.categoria}</p></div><Pill className="border-white/15 bg-white/[0.06] text-zinc-200">{TIPO_LABEL[item.tipo]}</Pill></div><p className="mt-3 text-sm leading-6 text-zinc-400">{item.descricao}</p><p className="mt-3 text-sm text-zinc-300">{item.valor_normal ? <>Normal: {formatMoney(item.valor_normal)} · </> : null}<span className="font-bold text-tech-neon">{item.valor_desconto === 0 ? 'Incluso' : item.valor_desconto ? formatMoney(item.valor_desconto) : item.percentual_desconto ? item.percentual_desconto + '% OFF' : 'Condição especial'}</span></p></button>;
}

function UsageHistory({ state, utilizacoes }: { state: AppState; utilizacoes: AppState['utilizacoes'] }) {
  return <div className="mt-4 grid gap-3">{utilizacoes.map((item) => <div key={item.id} className="grid gap-2 rounded-lg border border-white/10 bg-black/25 p-4 md:grid-cols-[1fr_auto]"><div><p className="font-bold text-white">{item.beneficio}</p><p className="text-sm text-zinc-400">{getEmpresaName(state, item.empresa_id)} · {formatDateTime(item.completed_at ?? item.created_at)}</p><p className="mt-1 text-sm text-zinc-500">{item.observacao}</p></div><Pill className="border-tech-neon/40 bg-tech-neon/10 text-tech-neon">{item.status}</Pill></div>)}{utilizacoes.length === 0 && <EmptyMessage title="Sem usos registrados" description="Os benefícios utilizados aparecerão aqui." />}</div>;
}

function ClientOffers({ state, actions, cliente, techpass, ofertas }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions']; cliente: AppState['clientes'][number]; techpass: TechPass; ofertas: OfertaParceiro[] }) {
  const [message, setMessage] = useState('');
  const rankedOffers = ofertas.slice().sort((a, b) => getOfferScore(b) - getOfferScore(a));
  const topOffer = rankedOffers[0];
  const requestOffer = (oferta: OfertaParceiro) => {
    if (getEffectiveStatus(techpass) !== 'ATIVO') {
      setMessage('Apenas clientes com TechPass ativo podem solicitar ofertas exclusivas.');
      return;
    }
    actions.addLead({ cliente_id: cliente.id, techpass_id: techpass.id, empresa_id: oferta.empresa_id, oferta_id: oferta.id, oferta_nome: oferta.nome, telefone_cliente: cliente.telefone, observacao: oferta.cta });
    setMessage('Lead enviado para ' + getEmpresaName(state, oferta.empresa_id) + '. A empresa parceira receberá seus dados e a oferta desejada.');
  };
  return (
    <div className="grid gap-6">
      <PageTitle title="Ofertas Exclusivas" subtitle="Compare a condição normal com a condição TechPass antes de demonstrar interesse." />
      {message && <Card className="border-tech-neon/30 bg-tech-neon/10 p-4 text-sm font-semibold text-tech-neon">{message}</Card>}
      {topOffer && (
        <Card className="border-tech-neon/30 bg-tech-neon/10">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-tech-neon">Oferta mais vantajosa agora</p>
              <h3 className="mt-2 text-2xl font-black text-white">{topOffer.nome}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{getEmpresaName(state, topOffer.empresa_id)} · economia estimada {topOffer.economia || formatMoney(getOfferSavingsValue(topOffer))} · score {Math.round(getOfferScore(topOffer))}</p>
            </div>
            <Button onClick={() => requestOffer(topOffer)}>{topOffer.cta}</Button>
          </div>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rankedOffers.map((oferta, index) => <OfferCard key={oferta.id} state={state} oferta={oferta} onClick={() => requestOffer(oferta)}>{index < 3 && <Pill className="justify-self-start border-tech-neon/40 bg-tech-neon/10 text-tech-neon">Top {index + 1} em vantagem</Pill>}</OfferCard>)}
      </div>
    </div>
  );
}

function OfferCard({ state, oferta, onClick, children }: { state: AppState; oferta: OfertaParceiro; onClick: () => void; children?: ReactNode }) {
  return (
    <Card className="grid content-between gap-5 p-5">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-tech-neon">{getEmpresaName(state, oferta.empresa_id)}</p>
            <h3 className="mt-2 text-xl font-black text-white">{oferta.nome}</h3>
          </div>
          <div className="flex flex-col gap-2">
            <Pill className="border-white/15 bg-white/[0.06] text-zinc-200">{OFERTA_TIPO_LABEL[oferta.tipo]}</Pill>
            <Pill className={oferta.status === 'ativo' ? 'border-tech-neon/40 bg-tech-neon/10 text-tech-neon' : 'border-yellow-300/30 bg-yellow-400/10 text-yellow-100'}>{oferta.status}</Pill>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-zinc-400">{oferta.descricao}</p>
        {oferta.cashback_ativo && oferta.cashback_tipo !== 'sem_cashback' && (
          <div className="mt-4 rounded-lg border border-tech-neon/30 bg-tech-neon/10 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-tech-neon">Você ganha cashback nessa oferta</p>
            <p className="mt-2 text-lg font-black text-white">{oferta.cashback_valor ? formatMoney(oferta.cashback_valor) : OFERTA_CASHBACK_LABEL[oferta.cashback_tipo]}</p>
            <p className="mt-1 text-sm leading-6 text-zinc-300">{oferta.cashback_descricao_cliente || oferta.cashback_regras}</p>
          </div>
        )}
        <div className="mt-5 grid gap-2">
          <Info label="Preço normal" value={oferta.preco_normal || 'Sob consulta'} />
          <Info label="Preço TechPass" value={oferta.preco_techpass || 'Condição especial'} />
          <Info label="Economia estimada" value={oferta.economia || 'Variável'} />
          <Info label="Benefício extra" value={oferta.beneficio_extra || 'Não informado'} />
        </div>
        <p className="mt-4 text-xs leading-5 text-zinc-500">{oferta.regras}</p>
      </div>
      <Button onClick={onClick}>{oferta.cta}</Button>
      {children}
    </Card>
  );
}

function ClientIndications({ state, actions, cliente, techpass }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions']; cliente: AppState['clientes'][number]; techpass: TechPass }) {
  return <div className="grid gap-6"><TechSoftIndications state={state} actions={actions} cliente={cliente} techpass={techpass} /><FightCoreIndications state={state} actions={actions} cliente={cliente} techpass={techpass} /></div>;
}

function TechSoftIndications({ state, actions, cliente, techpass }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions']; cliente: AppState['clientes'][number]; techpass: TechPass }) {
  const indicacoes = state.techsoft_indicacoes.filter((item) => item.cliente_id === cliente.id);
  const progress = Math.min(indicacoes.length, 15);
  const hasGift = indicacoes.some((item) => item.status === 'brinde_liberado' || item.status === 'brinde_retirado');
  const [form, setForm] = useState({ nome: '', telefone: '', observacao: '' });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.nome || !form.telefone || techpass.status !== 'ATIVO') return;
    actions.addTechSoftIndicacao({ cliente_id: cliente.id, techpass_id: techpass.id, nome_indicado: form.nome, telefone_indicado: form.telefone, observacao: form.observacao });
    setForm({ nome: '', telefone: '', observacao: '' });
  };
  return (
    <div className="grid gap-6">
      <Card>
        <PageTitle title="Indicações TechSoft" subtitle="Envie 15 contatos. Se pelo menos uma pessoa indicada comprar ou fechar um serviço de até R$250 na TechSoft, você ganha um brinde surpresa na loja." />
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_280px] lg:items-center">
          <div>
            <p className="text-4xl font-black text-white">{progress}/15 contatos enviados</p>
            <div className="mt-4 h-4 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-tech-neon" style={{ width: `${(progress / 15) * 100}%` }} /></div>
            <p className="mt-3 text-sm font-semibold text-zinc-300">Status da campanha: {hasGift ? 'Brinde liberado' : 'Aguardando contatos e conversão'}</p>
          </div>
          <div className="rounded-lg border border-tech-neon/30 bg-tech-neon/10 p-5 text-sm font-bold leading-6 text-white">Recompensa: Brinde surpresa na loja. Retirada presencial na TechSoft, sem conversão em dinheiro.</div>
        </div>
      </Card>
      <Card>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
          <Field label="Nome do indicado"><Input value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} /></Field>
          <Field label="WhatsApp do indicado"><Input value={form.telefone} onChange={(event) => setForm({ ...form, telefone: event.target.value })} /></Field>
          <Field label="Observação opcional"><Input value={form.observacao} onChange={(event) => setForm({ ...form, observacao: event.target.value })} /></Field>
          <div className="md:col-span-3"><Button type="submit"><Gift className="h-4 w-4" />Enviar indicação TechSoft</Button></div>
        </form>
      </Card>
      <div className="grid gap-3">{indicacoes.map((item) => <Card key={item.id} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center"><div><p className="font-bold text-white">{item.nome_indicado}</p><p className="text-sm text-zinc-400">{item.telefone_indicado} · {formatDate(item.created_at)} · {formatMoney(item.valor_compra)}</p><p className="text-sm text-zinc-500">{item.observacao}</p></div><Pill className={item.gerou_brinde ? 'border-tech-neon/40 bg-tech-neon/10 text-tech-neon' : 'border-white/15 bg-white/[0.06] text-zinc-200'}>{TECHSOFT_INDICACAO_LABEL[item.status]}</Pill></Card>)}</div>
    </div>
  );
}

function FightCoreIndications({ state, actions, cliente, techpass }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions']; cliente: AppState['clientes'][number]; techpass: TechPass }) {
  const indicacoes = state.fight_core_indicacoes.filter((item) => item.cliente_id === cliente.id);
  const fechou = indicacoes.some((item) => ['fechou_plano', 'bonus_liberado'].includes(item.status));
  const progress = Math.min(indicacoes.length, 15);
  const [form, setForm] = useState({ nome: '', telefone: '', observacao: '' });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.nome || !form.telefone) return;
    actions.addFightCoreIndicacao({ cliente_id: cliente.id, techpass_id: techpass.id, nome_indicado: form.nome, telefone_indicado: form.telefone, observacao: form.observacao });
    setForm({ nome: '', telefone: '', observacao: '' });
  };
  return (
    <div className="grid gap-6">
      <Card>
        <PageTitle title="Indicações Fight Core" subtitle="Envie 15 contatos. Se pelo menos uma pessoa fechar qualquer plano, você pode ganhar 6 meses de bônus no seu plano Fight Core." />
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_280px] lg:items-center">
          <div>
            <p className="text-4xl font-black text-white">{progress}/15 contatos enviados</p>
            <div className="mt-4 h-4 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-tech-neon" style={{ width: `${(progress / 15) * 100}%` }} /></div>
            <p className="mt-3 text-sm font-semibold text-zinc-300">{fechou ? 'Conversão registrada. Bônus pode ser liberado.' : 'Status: Aguardando conversão'}</p>
          </div>
          <div className="rounded-lg border border-tech-neon/30 bg-tech-neon/10 p-5 text-sm font-bold leading-6 text-white">Bônus: 6 meses de bônus no plano Fight Core quando a regra for cumprida.</div>
        </div>
      </Card>
      <Card>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
          <Field label="Nome do contato indicado"><Input value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} /></Field>
          <Field label="Telefone/WhatsApp"><Input value={form.telefone} onChange={(event) => setForm({ ...form, telefone: event.target.value })} /></Field>
          <Field label="Observação opcional"><Input value={form.observacao} onChange={(event) => setForm({ ...form, observacao: event.target.value })} /></Field>
          <div className="md:col-span-3"><Button type="submit"><Gift className="h-4 w-4" />Enviar indicação</Button></div>
        </form>
      </Card>
      <div className="grid gap-3">{indicacoes.map((item) => <Card key={item.id} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center"><div><p className="font-bold text-white">{item.nome_indicado}</p><p className="text-sm text-zinc-400">{item.telefone_indicado} · {formatDate(item.created_at)}</p><p className="text-sm text-zinc-500">{item.observacao}</p></div><Pill className="border-white/15 bg-white/[0.06] text-zinc-200">{FIGHT_CORE_INDICACAO_LABEL[item.status]}</Pill></Card>)}</div>
    </div>
  );
}

function TechCashPanel({ state, techpass }: { state: AppState; techpass: TechPass }) {
  const balance = getCashbackBalance(state, techpass.id);
  const remaining = Math.max(100 - balance, 0);
  const companyBalances = state.cashback_balances.filter((item) => item.cliente_id === techpass.cliente_id);
  return <div className="grid gap-6"><Card className="p-8"><PageTitle title="TechCash" subtitle="Cashback exclusivo para membros TechPass ativos." /><p className="mt-8 text-5xl font-black text-white">{formatMoney(balance)}</p><div className="mt-5 h-4 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-tech-neon" style={{ width: `${Math.min(balance, 100)}%` }} /></div><p className="mt-4 text-sm text-zinc-300">{remaining > 0 ? `Faltam ${formatMoney(remaining)} para desbloquear um resgate.` : 'Resgate liberado para brinde, serviço ou desconto.'}</p></Card><Card><PageTitle title="Cashback por empresa" subtitle="Cada empresa parceira pode ter saldo, limite e regras próprias." /><div className="mt-5 grid gap-3">{companyBalances.map((item) => <div key={item.id} className="rounded-lg border border-white/10 bg-black/25 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-black text-white">{getEmpresaName(state, item.empresa_id)}</h3><Pill className="border-tech-neon/40 bg-tech-neon/10 text-tech-neon">Limite {formatMoney(item.limite_maximo)}</Pill></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><Info label="Disponível" value={formatMoney(item.saldo_disponivel)} /><Info label="Aguardando confirmação" value={formatMoney(item.saldo_pendente)} /><Info label="Falta para limite" value={formatMoney(Math.max(item.limite_maximo - item.saldo_disponivel, 0))} /></div></div>)}{companyBalances.length === 0 && <EmptyMessage title="Sem cashback por empresa" description="Quando uma oferta fechada gerar cashback, ela aparecerá aqui." />}</div></Card></div>;
}

function ClientProfile({ cliente, techpass, state }: { cliente: AppState['clientes'][number]; techpass: TechPass; state: AppState }) {
  return <Card><PageTitle title="Perfil" subtitle="Dados principais do cliente e do TechPass ativo." /><div className="mt-5 grid gap-3 sm:grid-cols-2"><Info label="Nome" value={cliente.nome} /><Info label="CPF" value={cliente.cpf} /><Info label="Telefone" value={cliente.telefone} /><Info label="E-mail" value={cliente.email} /><Info label="Empresa de origem" value={getEmpresaName(state, techpass.empresa_id)} /><Info label="Código TechPass" value={techpass.serial} /></div></Card>;
}

function SolicitacaoRow({ state, solicitacao }: { state: AppState; solicitacao: Solicitacao }) {
  return <div className="rounded-lg border border-white/10 bg-black/25 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold text-white">{getServicoName(state, solicitacao.beneficio_servico_id)}</p><p className="mt-1 text-sm text-zinc-400">{getEmpresaName(state, solicitacao.empresa_id)} · {formatDate(solicitacao.data_preferida)} {solicitacao.horario_preferido}</p></div><SolicitacaoPill status={solicitacao.status} /></div><p className="mt-2 text-sm text-zinc-500">{solicitacao.observacao || solicitacao.observacao_empresa}</p></div>;
}

function SolicitacoesScreen({ state, actions }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions'] }) {
  const [empresaId, setEmpresaId] = useState('todas');
  const filtered = state.solicitacoes.filter((item) => empresaId === 'todas' || item.empresa_id === empresaId);
  return (
    <div className="grid gap-6">
      <PageTitle title="Solicitações e agendamentos" subtitle="Acompanhe pedidos de clientes por empresa, status e atendimento." />
      <Card><Field label="Filtro por empresa"><Select value={empresaId} onChange={(event) => setEmpresaId(event.target.value)}><option value="todas">Todas</option>{state.empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>)}</Select></Field></Card>
      <SolicitacoesList state={state} actions={actions} solicitacoes={filtered} />
    </div>
  );
}

function SolicitacoesList({ state, actions, solicitacoes }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions']; solicitacoes: Solicitacao[] }) {
  const [drafts, setDrafts] = useState<Record<string, { status: SolicitacaoStatus; observacao: string; funcionario: string }>>({});
  const getDraft = (item: Solicitacao) => drafts[item.id] ?? { status: item.status, observacao: item.observacao_empresa, funcionario: item.funcionario_responsavel };
  return <div className="grid gap-3">{solicitacoes.map((item) => {
    const draft = getDraft(item);
    const cliente = state.clientes.find((client) => client.id === item.cliente_id);
    return <Card key={item.id} className="grid gap-4 xl:grid-cols-[1fr_360px]"><div><div className="flex flex-wrap items-center gap-3"><h3 className="text-xl font-black text-white">{getServicoName(state, item.beneficio_servico_id)}</h3><SolicitacaoPill status={item.status} /></div><p className="mt-2 text-sm text-zinc-400">{cliente?.nome ?? 'Cliente'} · {cliente?.telefone ?? ''} · {getEmpresaName(state, item.empresa_id)}</p><p className="mt-1 text-sm text-zinc-400">Preferência: {formatDate(item.data_preferida)} {item.horario_preferido || 'sem horário'}</p><p className="mt-3 text-sm text-zinc-300">{item.observacao}</p>{item.observacao_empresa && <p className="mt-2 text-sm text-tech-neon">{item.observacao_empresa}</p>}</div><div className="grid gap-3"><Field label="Status"><Select value={draft.status} onChange={(event) => setDrafts({ ...drafts, [item.id]: { ...draft, status: event.target.value as SolicitacaoStatus } })}>{Object.entries(SOLICITACAO_LABEL).map(([status, label]) => <option key={status} value={status}>{label}</option>)}</Select></Field><Field label="Funcionário responsável"><Input value={draft.funcionario} onChange={(event) => setDrafts({ ...drafts, [item.id]: { ...draft, funcionario: event.target.value } })} /></Field><Field label="Observação da empresa"><Textarea value={draft.observacao} onChange={(event) => setDrafts({ ...drafts, [item.id]: { ...draft, observacao: event.target.value } })} /></Field><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => actions.updateSolicitacao(item.id, { status: draft.status, observacao_empresa: draft.observacao, funcionario_responsavel: draft.funcionario })}>Salvar status</Button><Button onClick={() => actions.concludeSolicitacao(item.id, draft.observacao || 'Atendimento concluído.', draft.funcionario || 'Empresa parceira')}>Concluir e registrar uso</Button></div></div></Card>;
  })}{solicitacoes.length === 0 && <EmptyMessage title="Sem solicitações" description="As solicitações aparecerão aqui quando clientes enviarem pedidos." />}</div>;
}

function BeneficiosServicosScreen({ state, actions }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions'] }) {
  const [form, setForm] = useState<Omit<BeneficioServico, 'id' | 'created_at'>>({ nome: '', tipo: 'servico_desconto', empresa_id: state.empresas[0]?.id ?? '', categoria: '', descricao: '', valor_normal: null, valor_desconto: null, percentual_desconto: null, limite_uso: null, validade: null, status: 'ativo', regras_uso: '' });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    actions.addBeneficioServico(form);
    setForm({ ...form, nome: '', descricao: '', valor_normal: null, valor_desconto: null, percentual_desconto: null, limite_uso: null, regras_uso: '' });
  };
  return (
    <div className="grid gap-6">
      <PageTitle title="Benefícios e Serviços" subtitle="Crie benefícios inclusos, serviços com desconto, brindes, cashback, indicações e regras de uso." />
      <Card><form onSubmit={submit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Field label="Nome"><Input value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} required /></Field><Field label="Tipo"><Select value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value as BeneficioServicoTipo })}>{Object.entries(TIPO_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field><Field label="Empresa responsável"><Select value={form.empresa_id} onChange={(event) => setForm({ ...form, empresa_id: event.target.value })}>{state.empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>)}</Select></Field><Field label="Categoria"><Input value={form.categoria} onChange={(event) => setForm({ ...form, categoria: event.target.value })} /></Field><Field label="Valor normal"><Input type="number" value={form.valor_normal ?? ''} onChange={(event) => setForm({ ...form, valor_normal: event.target.value ? Number(event.target.value) : null })} /></Field><Field label="Valor com desconto"><Input type="number" value={form.valor_desconto ?? ''} onChange={(event) => setForm({ ...form, valor_desconto: event.target.value ? Number(event.target.value) : null })} /></Field><Field label="% desconto"><Input type="number" value={form.percentual_desconto ?? ''} onChange={(event) => setForm({ ...form, percentual_desconto: event.target.value ? Number(event.target.value) : null })} /></Field><Field label="Limite de uso"><Input type="number" value={form.limite_uso ?? ''} onChange={(event) => setForm({ ...form, limite_uso: event.target.value ? Number(event.target.value) : null })} /></Field><Field label="Validade"><Input type="date" value={form.validade ?? ''} onChange={(event) => setForm({ ...form, validade: event.target.value || null })} /></Field><Field label="Status"><Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as 'ativo' | 'inativo' })}><option value="ativo">Ativo</option><option value="inativo">Inativo</option></Select></Field><div className="md:col-span-2 xl:col-span-4"><Field label="Descrição"><Textarea value={form.descricao} onChange={(event) => setForm({ ...form, descricao: event.target.value })} /></Field></div><div className="md:col-span-2 xl:col-span-4"><Field label="Regras de uso"><Textarea value={form.regras_uso} onChange={(event) => setForm({ ...form, regras_uso: event.target.value })} /></Field></div><div className="md:col-span-2 xl:col-span-4"><Button type="submit"><Plus className="h-4 w-4" />Criar item</Button></div></form></Card>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{state.beneficios_servicos.map((item) => <Card key={item.id}><div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-white">{item.nome}</h3><p className="mt-1 text-xs font-bold uppercase text-tech-neon">{getEmpresaName(state, item.empresa_id)} · {TIPO_LABEL[item.tipo]}</p></div><Pill className={item.status === 'ativo' ? 'border-tech-neon/40 bg-tech-neon/10 text-tech-neon' : 'border-red-300/30 bg-red-400/10 text-red-100'}>{item.status}</Pill></div><p className="mt-3 text-sm leading-6 text-zinc-400">{item.descricao}</p><div className="mt-4 flex flex-wrap gap-2"><Button variant="secondary" onClick={() => actions.updateBeneficioServico(item.id, { status: item.status === 'ativo' ? 'inativo' : 'ativo' })}>{item.status === 'ativo' ? 'Inativar' : 'Ativar'}</Button></div></Card>)}</div>
    </div>
  );
}

function OfertasAdminScreen({ state, actions }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions'] }) {
  const [form, setForm] = useState<Omit<OfertaParceiro, 'id' | 'created_at'>>({ empresa_id: state.empresas[0]?.id ?? '', nome: '', tipo: 'plano', preco_normal: '', preco_techpass: '', economia: '', descricao: '', descricao_completa: '', regras: '', beneficio_extra: '', validade: null, status: 'ativo', cta: 'Tenho interesse', origem: 'admin', cashback_ativo: false, cashback_tipo: 'sem_cashback', cashback_valor: null, cashback_limite: null, cashback_regras: '', cashback_descricao_cliente: '' });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    actions.addOferta(form);
    setForm({ ...form, nome: '', preco_normal: '', preco_techpass: '', economia: '', descricao: '', descricao_completa: '', regras: '', beneficio_extra: '', validade: null, cashback_ativo: false, cashback_tipo: 'sem_cashback', cashback_valor: null, cashback_limite: null, cashback_regras: '', cashback_descricao_cliente: '' });
  };
  return (
    <div className="grid gap-6">
      <PageTitle title="Editor de ofertas" subtitle="Edite ofertas exclusivas de planos, aulas grátis, serviços, brindes, indicações e renovações." />
      <Card>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Empresa parceira"><Select value={form.empresa_id} onChange={(event) => setForm({ ...form, empresa_id: event.target.value })}>{state.empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>)}</Select></Field>
          <Field label="Nome da oferta"><Input value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} required /></Field>
          <Field label="Tipo"><Select value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value as OfertaTipo })}>{Object.entries(OFERTA_TIPO_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
          <Field label="Status"><Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as OfertaParceiro['status'] })}><option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="PENDENTE_APROVACAO">Pendente aprovação</option><option value="AJUSTE_SOLICITADO">Ajuste solicitado</option><option value="REPROVADA">Reprovada</option></Select></Field>
          <Field label="Preço normal"><Input value={form.preco_normal} onChange={(event) => setForm({ ...form, preco_normal: event.target.value })} /></Field>
          <Field label="Preço TechPass"><Input value={form.preco_techpass} onChange={(event) => setForm({ ...form, preco_techpass: event.target.value })} /></Field>
          <Field label="Economia estimada"><Input value={form.economia} onChange={(event) => setForm({ ...form, economia: event.target.value })} /></Field>
          <Field label="Botão"><Input value={form.cta} onChange={(event) => setForm({ ...form, cta: event.target.value })} /></Field>
          <Field label="Validade"><Input type="date" value={form.validade ?? ''} onChange={(event) => setForm({ ...form, validade: event.target.value || null })} /></Field>
          <div className="md:col-span-2"><Field label="Descrição curta"><Textarea value={form.descricao} onChange={(event) => setForm({ ...form, descricao: event.target.value })} /></Field></div>
          <div className="md:col-span-2"><Field label="Descrição completa"><Textarea value={form.descricao_completa} onChange={(event) => setForm({ ...form, descricao_completa: event.target.value })} /></Field></div>
          <div className="md:col-span-2"><Field label="Regras"><Textarea value={form.regras} onChange={(event) => setForm({ ...form, regras: event.target.value })} /></Field></div>
          <div className="md:col-span-2 xl:col-span-4"><Field label="Benefício extra"><Input value={form.beneficio_extra} onChange={(event) => setForm({ ...form, beneficio_extra: event.target.value })} /></Field></div>
          <Field label="Cashback ativo"><Select value={form.cashback_ativo ? 'sim' : 'nao'} onChange={(event) => setForm({ ...form, cashback_ativo: event.target.value === 'sim' })}><option value="nao">Não</option><option value="sim">Sim</option></Select></Field>
          <Field label="Tipo de cashback"><Select value={form.cashback_tipo} onChange={(event) => setForm({ ...form, cashback_tipo: event.target.value as OfertaCashbackTipo })}>{Object.entries(OFERTA_CASHBACK_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
          <Field label="Valor do cashback"><Input type="number" min={0} step="0.01" value={form.cashback_valor ?? ''} onChange={(event) => setForm({ ...form, cashback_valor: event.target.value ? Number(event.target.value) : null })} /></Field>
          <Field label="Limite de cashback"><Input type="number" min={0} step="0.01" value={form.cashback_limite ?? ''} onChange={(event) => setForm({ ...form, cashback_limite: event.target.value ? Number(event.target.value) : null })} /></Field>
          <div className="md:col-span-2"><Field label="Regras de cashback"><Textarea value={form.cashback_regras} onChange={(event) => setForm({ ...form, cashback_regras: event.target.value })} /></Field></div>
          <div className="md:col-span-2"><Field label="Descrição de cashback para o cliente"><Textarea value={form.cashback_descricao_cliente} onChange={(event) => setForm({ ...form, cashback_descricao_cliente: event.target.value })} /></Field></div>
          <div className="md:col-span-2 xl:col-span-4"><Button type="submit"><Plus className="h-4 w-4" />Criar oferta</Button></div>
        </form>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {state.ofertas.map((oferta) => (
          <OfferCard key={oferta.id} state={state} oferta={oferta} onClick={() => actions.updateOferta(oferta.id, { status: oferta.status === 'ativo' ? 'inativo' : 'ativo' })}>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="secondary" onClick={() => actions.updateOferta(oferta.id, { status: 'ativo' })}>Aprovar</Button>
              <Button variant="secondary" onClick={() => actions.updateOferta(oferta.id, { status: 'AJUSTE_SOLICITADO' })}>Solicitar ajuste</Button>
              <Button variant="secondary" onClick={() => actions.updateOferta(oferta.id, { status: 'REPROVADA' })}>Reprovar</Button>
              <Button variant="secondary" onClick={() => actions.updateOferta(oferta.id, { status: 'inativo' })}>Desativar</Button>
            </div>
          </OfferCard>
        ))}
      </div>
    </div>
  );
}

type PartnerView = 'dashboard' | 'funil' | 'ofertas' | 'beneficios' | 'leads' | 'solicitacoes' | 'indicacoes' | 'cashback' | 'configuracoes';

function PartnerLogin({ state, navigate }: { state: AppState; navigate: (path: string) => void }) {
  const [form, setForm] = useState({ email: 'fightcore@parceiro.com', senha: '123456' });
  const [message, setMessage] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const user = state.parceiro_usuarios.find((item) => item.email.toLowerCase() === form.email.trim().toLowerCase() && item.senha === form.senha);
    if (!user) {
      setMessage('Usuário parceiro não encontrado.');
      return;
    }
    localStorage.setItem('techpass-partner-user-id', user.id);
    navigate('/parceiro/dashboard');
  };
  return <PublicShell><Card className="mx-auto max-w-2xl p-6 sm:p-8"><PageTitle title="Login parceiro" subtitle="Acesse com o usuário da sua empresa parceira." /><form onSubmit={submit} className="mt-6 grid gap-4"><Field label="E-mail"><Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field><Field label="Senha"><Input type="password" value={form.senha} onChange={(event) => setForm({ ...form, senha: event.target.value })} /></Field><Button type="submit"><LockKeyhole className="h-4 w-4" />Entrar no painel parceiro</Button></form>{message && <p className="mt-4 text-sm text-red-100">{message}</p>}<p className="mt-4 text-sm text-zinc-400">Demonstração: fightcore@parceiro.com / 123456</p></Card></PublicShell>;
}

function PartnerDashboard({ state, actions, navigate }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions']; navigate: (path: string) => void }) {
  const userId = localStorage.getItem('techpass-partner-user-id') ?? 'par-fight-core';
  const user = state.parceiro_usuarios.find((item) => item.id === userId) ?? state.parceiro_usuarios[0];
  const empresa = user ? state.empresas.find((item) => item.id === user.empresa_id) : null;
  const [view, setView] = useState<PartnerView>('dashboard');
  if (!user || !empresa) return <PublicShell><EmptyMessage title="Parceiro não autenticado" description="Entre pela rota /parceiro/login." /></PublicShell>;
  const leads = state.leads.filter((item) => item.empresa_id === empresa.id);
  const solicitacoes = state.solicitacoes.filter((item) => item.empresa_id === empresa.id);
  const ofertas = state.ofertas.filter((item) => item.empresa_id === empresa.id);
  const beneficios = state.beneficios_servicos.filter((item) => item.empresa_id === empresa.id);
  return (
    <PublicShell>
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageTitle title={'Painel parceiro · ' + empresa.nome} subtitle="Gerencie ofertas, benefícios, leads e solicitações da sua empresa." />
          <div className="flex flex-wrap gap-2">
            <NotificationBell notifications={state.notifications.filter((item) => item.tipo_usuario === 'parceiro' && item.empresa_id === empresa.id)} actions={actions} navigate={navigate} scope={{ tipo_usuario: 'parceiro', empresa_id: empresa.id }} />
            <Button variant="secondary" onClick={() => navigate('/parceiro/login')}>Trocar parceiro</Button>
            <Button variant="secondary" onClick={() => navigate('/')}>Site público</Button>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <Card className="h-max p-3">
            {[
              ['dashboard', 'Dashboard'],
              ['funil', 'Funil comercial'],
              ['ofertas', 'Minhas ofertas'],
              ['beneficios', 'Benefícios'],
              ['leads', 'Leads recebidos'],
              ['solicitacoes', 'Solicitações'],
              ['indicacoes', 'Indicações'],
              ['cashback', 'Cashback'],
              ['configuracoes', 'Configurações'],
            ].map(([id, label]) => <button key={id} onClick={() => setView(id as PartnerView)} className={cx('block w-full rounded-md px-3 py-3 text-left text-sm font-bold transition', view === id ? 'bg-tech-neon text-black' : 'text-zinc-300 hover:bg-white/[0.08] hover:text-white')}>{label}</button>)}
          </Card>
          <PartnerScopedView state={state} actions={actions} empresa={empresa} view={view} leads={leads} solicitacoes={solicitacoes} ofertas={ofertas} beneficios={beneficios} />
        </div>
      </div>
    </PublicShell>
  );
}

function PartnerScopedView({ state, actions, empresa, view, leads, solicitacoes, ofertas, beneficios }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions']; empresa: AppState['empresas'][number]; view: PartnerView; leads: LeadParceiro[]; solicitacoes: Solicitacao[]; ofertas: OfertaParceiro[]; beneficios: BeneficioServico[] }) {
  if (view === 'funil') return <PartnerPipeline state={state} actions={actions} leads={leads} />;
  if (view === 'ofertas') return <PartnerOffers state={state} actions={actions} empresa={empresa} ofertas={ofertas} />;
  if (view === 'beneficios') return <PartnerBenefits actions={actions} empresa={empresa} beneficios={beneficios} />;
  if (view === 'leads') return <Card><PageTitle title="Leads recebidos" subtitle="Atualize status, registre observações e abra o WhatsApp do cliente." /><LeadList state={state} actions={actions} leads={leads} /></Card>;
  if (view === 'solicitacoes') return <SolicitacoesList state={state} actions={actions} solicitacoes={solicitacoes} />;
  if (view === 'indicacoes') return <PartnerIndications state={state} actions={actions} empresa={empresa} />;
  if (view === 'cashback') return <PartnerCashback state={state} actions={actions} empresa={empresa} />;
  if (view === 'configuracoes') return <PartnerSettings actions={actions} empresa={empresa} />;
  const closed = leads.filter((item) => item.status === 'fechado').length;
  const conversion = leads.length ? Math.round((closed / leads.length) * 100) : 0;
  const requested = solicitacoes.reduce<Record<string, number>>((acc, item) => ({ ...acc, [getServicoName(state, item.beneficio_servico_id)]: (acc[getServicoName(state, item.beneficio_servico_id)] ?? 0) + 1 }), {});
  const unread = state.notifications.filter((item) => item.tipo_usuario === 'parceiro' && item.empresa_id === empresa.id && !item.lida).length;
  const pendingCashback = state.cashback_transactions.filter((item) => item.empresa_id === empresa.id && item.status === 'pendente').length;
  const waitingClients = new Set([...leads.filter((item) => item.status === 'novo').map((item) => item.cliente_id), ...solicitacoes.filter((item) => ['nova', 'analise'].includes(item.status)).map((item) => item.cliente_id)]).size;
  const topOffers = ofertas.map((oferta) => ({ oferta, total: leads.filter((lead) => lead.oferta_id === oferta.id).length })).sort((a, b) => b.total - a.total).slice(0, 3);
  return (
    <div className="grid gap-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Notificações" value={unread} tone="warn" />
        <Stat label="Benefícios solicitados" value={solicitacoes.length} />
        <Stat label="Leads recebidos" value={leads.length} tone="neon" />
        <Stat label="Leads novos" value={leads.filter((item) => item.status === 'novo').length} />
        <Stat label="Em negociação" value={leads.filter((item) => item.status === 'negociacao').length} />
        <Stat label="Leads fechados" value={closed} tone="neon" />
        <Stat label="Leads perdidos" value={leads.filter((item) => item.status === 'perdido').length} tone="danger" />
        <Stat label="Cashbacks pendentes" value={pendingCashback} tone="warn" />
        <Stat label="Ofertas ativas" value={ofertas.filter((item) => item.status === 'ativo').length} />
        <Stat label="Ofertas inativas" value={ofertas.filter((item) => item.status === 'inativo').length} />
        <Stat label="Clientes aguardando" value={waitingClients} tone="warn" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <PageTitle title="Últimos leads" subtitle="Clientes que demonstraram interesse nas suas ofertas." />
          <div className="mt-4 grid gap-3">{leads.slice(0, 4).map((lead) => <div key={lead.id} className="rounded-lg border border-white/10 bg-black/25 p-3"><p className="font-black text-white">{getClientName(state, lead.cliente_id)}</p><p className="text-sm text-zinc-400">{lead.oferta_nome} · {LEAD_STATUS_LABEL[lead.status]}</p></div>)}{leads.length === 0 && <EmptyMessage title="Sem leads" description="Os leads recebidos aparecerão aqui." />}</div>
        </Card>
        <Card>
          <PageTitle title="Performance" subtitle="Conversão, solicitações e ofertas mais acessadas." />
          <div className="mt-5 grid gap-3 md:grid-cols-2"><Info label="Conversão de leads" value={conversion + '%'} /><Info label="Solicitações por mês" value={String(solicitacoes.length)} /></div>
          <div className="mt-5 grid gap-2">{topOffers.map(({ oferta, total }) => <div key={oferta.id} className="rounded-lg border border-white/10 bg-black/25 p-3 text-sm text-zinc-200">{oferta.nome}: <strong className="text-tech-neon">{total}</strong></div>)}{topOffers.length === 0 && <EmptyMessage title="Sem ofertas acessadas" description="Quando clientes clicarem nas ofertas, o ranking aparecerá aqui." />}</div>
        </Card>
      </div>
      <Card>
        <PageTitle title="Solicitações e agendamentos" subtitle="Pedidos que precisam de análise ou confirmação." />
        <div className="mt-4 grid gap-2">{solicitacoes.slice(0, 4).map((item) => <div key={item.id} className="rounded-lg border border-white/10 bg-black/25 p-3 text-sm text-zinc-200">{getClientName(state, item.cliente_id)} · {getServicoName(state, item.beneficio_servico_id)} · <strong className="text-tech-neon">{SOLICITACAO_LABEL[item.status]}</strong></div>)}{solicitacoes.length === 0 && <EmptyMessage title="Sem solicitações" description="Quando clientes solicitarem benefícios, eles aparecerão aqui." />}</div>
      </Card>
    </div>
  );
}

function PartnerPipeline({ state, actions, leads }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions']; leads: LeadParceiro[] }) {
  const columns: LeadStatus[] = ['novo', 'contato_realizado', 'negociacao', 'fechado', 'perdido'];
  const openLeads = leads.filter((item) => !['fechado', 'perdido', 'cancelado'].includes(item.status)).length;
  const closed = leads.filter((item) => item.status === 'fechado').length;
  const conversion = leads.length ? Math.round((closed / leads.length) * 100) : 0;

  return (
    <div className="grid gap-6">
      <PageTitle title="Funil comercial" subtitle="Acompanhe cada lead TechPass da chegada ate o fechamento." />
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Leads em aberto" value={openLeads} tone="warn" />
        <Stat label="Fechados" value={closed} tone="neon" />
        <Stat label="Conversao" value={conversion + '%'} />
      </div>
      <div className="grid gap-4 xl:grid-cols-5">
        {columns.map((status) => {
          const items = leads.filter((lead) => lead.status === status);
          return (
            <Card key={status} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-black uppercase text-white">{LEAD_STATUS_LABEL[status]}</h3>
                <Pill className="border-white/15 bg-white/[0.06] text-zinc-200">{items.length}</Pill>
              </div>
              <div className="mt-4 grid gap-3">
                {items.map((lead) => (
                  <div key={lead.id} className="rounded-lg border border-white/10 bg-black/25 p-3">
                    <p className="font-black text-white">{getClientName(state, lead.cliente_id)}</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-400">{lead.oferta_nome} · {lead.telefone_cliente}</p>
                    <p className="mt-2 text-xs text-zinc-500">{formatDateTime(lead.created_at)}</p>
                    <div className="mt-3">
                      <Select value={lead.status} onChange={(event) => actions.updateLead(lead.id, { status: event.target.value as LeadStatus })}>
                        {Object.entries(LEAD_STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </Select>
                    </div>
                  </div>
                ))}
                {items.length === 0 && <p className="rounded-lg border border-dashed border-white/10 p-4 text-center text-xs text-zinc-500">Sem leads nesta etapa.</p>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function PartnerCashback({ state, actions, empresa }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions']; empresa: AppState['empresas'][number] }) {
  const setting = state.cashback_settings.find((item) => item.empresa_id === empresa.id);
  const [form, setForm] = useState({
    ativo: setting?.ativo ?? false,
    valor_minimo: setting?.valor_minimo ?? 0,
    tipo_calculo: setting?.tipo_calculo ?? 'oferta_especifica' as CashbackCalculoTipo,
    limite_maximo: setting?.limite_maximo ?? 100,
    regras_uso: setting?.regras_uso ?? '',
    status: setting?.status ?? 'ativo' as 'ativo' | 'inativo',
  });
  const balances = state.cashback_balances.filter((item) => item.empresa_id === empresa.id);
  const transactions = state.cashback_transactions.filter((item) => item.empresa_id === empresa.id);
  const [useDraft, setUseDraft] = useState<Record<string, number>>({});
  const save = (event: FormEvent) => {
    event.preventDefault();
    actions.updateCashbackSetting(empresa.id, form);
  };
  return (
    <div className="grid gap-6">
      <Card>
        <PageTitle title="Configurações de Cashback" subtitle="Defina regras gerais para geração e uso de cashback da sua empresa." />
        <form onSubmit={save} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Cashback ativo"><Select value={form.ativo ? 'sim' : 'nao'} onChange={(e) => setForm({ ...form, ativo: e.target.value === 'sim' })}><option value="sim">Sim</option><option value="nao">Não</option></Select></Field>
          <Field label="Valor mínimo para gerar"><Input type="number" min={0} step="0.01" value={form.valor_minimo} onChange={(e) => setForm({ ...form, valor_minimo: Number(e.target.value) })} /></Field>
          <Field label="Tipo de cálculo"><Select value={form.tipo_calculo} onChange={(e) => setForm({ ...form, tipo_calculo: e.target.value as CashbackCalculoTipo })}>{Object.entries(CASHBACK_CALCULO_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
          <Field label="Limite máximo acumulado"><Input type="number" min={0} step="0.01" value={form.limite_maximo} onChange={(e) => setForm({ ...form, limite_maximo: Number(e.target.value) })} /></Field>
          <Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'ativo' | 'inativo' })}><option value="ativo">Ativo</option><option value="inativo">Inativo</option></Select></Field>
          <div className="md:col-span-2 xl:col-span-4"><Field label="Regras de uso"><Textarea value={form.regras_uso} onChange={(e) => setForm({ ...form, regras_uso: e.target.value })} /></Field></div>
          <div className="md:col-span-2 xl:col-span-4"><Button type="submit">Salvar configurações</Button></div>
        </form>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Cashback disponível" value={formatMoney(balances.reduce((sum, item) => sum + item.saldo_disponivel, 0))} tone="neon" />
        <Stat label="Cashback pendente" value={formatMoney(balances.reduce((sum, item) => sum + item.saldo_pendente, 0))} />
        <Stat label="Movimentações" value={transactions.length} />
      </div>

      <Card>
        <PageTitle title="Cashback dos clientes" subtitle="Saldo separado por cliente e por empresa parceira." />
        <div className="mt-5 grid gap-3">
          {balances.map((balance) => {
            const cliente = state.clientes.find((item) => item.id === balance.cliente_id);
            const techpass = state.techpasses.find((item) => item.cliente_id === balance.cliente_id);
            return <div key={balance.id} className="grid gap-3 rounded-lg border border-white/10 bg-black/25 p-4 xl:grid-cols-[1fr_320px]"><div><p className="font-black text-white">{cliente?.nome ?? 'Cliente'}</p><p className="mt-1 text-sm text-zinc-400">{cliente?.cpf ?? ''} · {techpass?.serial ?? 'TechPass'}</p><div className="mt-3 grid gap-2 sm:grid-cols-3"><Info label="Disponível" value={formatMoney(balance.saldo_disponivel)} /><Info label="Pendente" value={formatMoney(balance.saldo_pendente)} /><Info label="Limite" value={formatMoney(balance.limite_maximo)} /></div></div><div className="grid gap-2"><Field label="Valor para usar"><Input type="number" min={0} step="0.01" value={useDraft[balance.id] ?? 0} onChange={(e) => setUseDraft({ ...useDraft, [balance.id]: Number(e.target.value) })} /></Field><Button variant="secondary" onClick={() => actions.useCompanyCashback(balance.cliente_id, empresa.id, useDraft[balance.id] ?? 0, 'Cashback usado na empresa ' + empresa.nome)}>Usar cashback</Button></div></div>;
          })}
          {balances.length === 0 && <EmptyMessage title="Sem saldos" description="Os saldos aparecerão quando leads fechados gerarem cashback." />}
        </div>
      </Card>

      <Card>
        <PageTitle title="Histórico de movimentações" subtitle="Créditos, débitos, ajustes e cancelamentos da sua empresa." />
        <div className="mt-5 grid gap-3">
          {transactions.map((tx) => <div key={tx.id} className="grid gap-3 rounded-lg border border-white/10 bg-black/25 p-4 xl:grid-cols-[1fr_auto] xl:items-center"><div><p className="font-black text-white">{getClientName(state, tx.cliente_id)} · {formatMoney(tx.valor)}</p><p className="mt-1 text-sm text-zinc-400">{tx.descricao} · {formatDateTime(tx.created_at)} · compra/plano: {formatMoney(tx.valor_compra)}</p><p className="mt-1 text-xs uppercase text-zinc-500">{tx.tipo} · {tx.status}</p></div><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => actions.approveCashbackTransaction(tx.id)} disabled={tx.status !== 'pendente'}>Aprovar</Button><Button variant="secondary" onClick={() => actions.cancelCashbackTransaction(tx.id)} disabled={tx.status === 'cancelado'}>Cancelar</Button></div></div>)}
          {transactions.length === 0 && <EmptyMessage title="Sem movimentações" description="Cashback gerado, aprovado ou usado aparecerá aqui." />}
        </div>
      </Card>
    </div>
  );
}

function PartnerOffers({ state, actions, empresa, ofertas }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions']; empresa: AppState['empresas'][number]; ofertas: OfertaParceiro[] }) {
  const [form, setForm] = useState<Omit<OfertaParceiro, 'id' | 'created_at'>>({ empresa_id: empresa.id, nome: '', tipo: 'plano', preco_normal: '', preco_techpass: '', economia: '', descricao: '', descricao_completa: '', regras: '', beneficio_extra: '', validade: null, status: 'PENDENTE_APROVACAO', cta: 'Tenho interesse', origem: 'parceiro', cashback_ativo: false, cashback_tipo: 'sem_cashback', cashback_valor: null, cashback_limite: null, cashback_regras: '', cashback_descricao_cliente: '' });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    actions.addOferta({ ...form, empresa_id: empresa.id, status: 'PENDENTE_APROVACAO', origem: 'parceiro' });
    setForm({ ...form, nome: '', preco_normal: '', preco_techpass: '', economia: '', descricao: '', descricao_completa: '', regras: '', beneficio_extra: '', validade: null });
  };
  return <div className="grid gap-6"><PageTitle title="Minhas ofertas" subtitle="Ofertas criadas pelo parceiro entram como pendente de aprovação antes de aparecer para clientes." /><Card><form onSubmit={submit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Field label="Nome da oferta"><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required /></Field><Field label="Tipo"><Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as OfertaTipo })}>{Object.entries(OFERTA_TIPO_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field><Field label="Preço normal"><Input value={form.preco_normal} onChange={(e) => setForm({ ...form, preco_normal: e.target.value })} /></Field><Field label="Preço TechPass"><Input value={form.preco_techpass} onChange={(e) => setForm({ ...form, preco_techpass: e.target.value })} /></Field><Field label="Economia estimada"><Input value={form.economia} onChange={(e) => setForm({ ...form, economia: e.target.value })} /></Field><Field label="Validade"><Input type="date" value={form.validade ?? ''} onChange={(e) => setForm({ ...form, validade: e.target.value || null })} /></Field><Field label="Botão"><Input value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} /></Field><Field label="Benefício extra"><Input value={form.beneficio_extra} onChange={(e) => setForm({ ...form, beneficio_extra: e.target.value })} /></Field><Field label="Cashback ativo"><Select value={form.cashback_ativo ? 'sim' : 'nao'} onChange={(e) => setForm({ ...form, cashback_ativo: e.target.value === 'sim' })}><option value="nao">Não</option><option value="sim">Sim</option></Select></Field><Field label="Tipo de cashback"><Select value={form.cashback_tipo} onChange={(e) => setForm({ ...form, cashback_tipo: e.target.value as OfertaCashbackTipo })}>{Object.entries(OFERTA_CASHBACK_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field><Field label="Valor do cashback"><Input type="number" min={0} step="0.01" value={form.cashback_valor ?? ''} onChange={(e) => setForm({ ...form, cashback_valor: e.target.value ? Number(e.target.value) : null })} /></Field><Field label="Limite de cashback"><Input type="number" min={0} step="0.01" value={form.cashback_limite ?? ''} onChange={(e) => setForm({ ...form, cashback_limite: e.target.value ? Number(e.target.value) : null })} /></Field><div className="md:col-span-2"><Field label="Descrição curta"><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></Field></div><div className="md:col-span-2"><Field label="Descrição completa"><Textarea value={form.descricao_completa} onChange={(e) => setForm({ ...form, descricao_completa: e.target.value })} /></Field></div><div className="md:col-span-2"><Field label="Regras"><Textarea value={form.regras} onChange={(e) => setForm({ ...form, regras: e.target.value })} /></Field></div><div className="md:col-span-2"><Field label="Regras de cashback"><Textarea value={form.cashback_regras} onChange={(e) => setForm({ ...form, cashback_regras: e.target.value })} /></Field></div><div className="md:col-span-2 xl:col-span-4"><Field label="Descrição de cashback para o cliente"><Textarea value={form.cashback_descricao_cliente} onChange={(e) => setForm({ ...form, cashback_descricao_cliente: e.target.value })} /></Field></div><div className="md:col-span-2 xl:col-span-4"><Button type="submit"><Plus className="h-4 w-4" />Enviar para aprovação</Button></div></form></Card><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{ofertas.map((oferta) => <OfferCard key={oferta.id} state={state} oferta={oferta} onClick={() => actions.updateOferta(oferta.id, { status: oferta.status === 'inativo' ? 'PENDENTE_APROVACAO' : 'inativo' })} />)}</div></div>;
}

function PartnerBenefits({ actions, empresa, beneficios }: { actions: ReturnType<typeof useTechPassStore>['actions']; empresa: AppState['empresas'][number]; beneficios: BeneficioServico[] }) {
  const [form, setForm] = useState<Omit<BeneficioServico, 'id' | 'created_at'>>({ nome: '', tipo: 'beneficio', empresa_id: empresa.id, categoria: '', descricao: '', valor_normal: null, valor_desconto: null, percentual_desconto: null, limite_uso: null, validade: null, status: 'ativo', regras_uso: '' });
  return <div className="grid gap-6"><PageTitle title="Benefícios" subtitle="Edite os benefícios oferecidos pela sua empresa." /><Card><form onSubmit={(e) => { e.preventDefault(); actions.addBeneficioServico({ ...form, empresa_id: empresa.id }); setForm({ ...form, nome: '', descricao: '', regras_uso: '', limite_uso: null }); }} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Field label="Nome do benefício"><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></Field><Field label="Limite de uso"><Input type="number" value={form.limite_uso ?? ''} onChange={(e) => setForm({ ...form, limite_uso: e.target.value ? Number(e.target.value) : null })} /></Field><Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'ativo' | 'inativo' })}><option value="ativo">Ativo</option><option value="inativo">Inativo</option></Select></Field><Field label="Regra de liberação"><Input value={form.regras_uso} onChange={(e) => setForm({ ...form, regras_uso: e.target.value })} /></Field><div className="md:col-span-2 xl:col-span-4"><Field label="Descrição"><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></Field></div><div className="md:col-span-2 xl:col-span-4"><Button type="submit">Criar benefício</Button></div></form></Card><div className="grid gap-3 md:grid-cols-2">{beneficios.map((item) => <Card key={item.id}><div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-white">{item.nome}</h3><p className="text-sm text-zinc-400">{item.descricao}</p><p className="mt-2 text-xs text-zinc-500">Limite: {item.limite_uso ?? 'sem limite'} · Regra: {item.regras_uso}</p></div><Button variant="secondary" onClick={() => actions.updateBeneficioServico(item.id, { status: item.status === 'ativo' ? 'inativo' : 'ativo' })}>{item.status}</Button></div></Card>)}</div></div>;
}

function PartnerIndications({ state, actions, empresa }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions']; empresa: AppState['empresas'][number] }) {
  if (empresa.id === 'emp-techsoft') return <Card><PageTitle title="Indicações TechSoft" subtitle="Acompanhe contatos enviados, compras/serviços de até R$250 e retirada do brinde surpresa." /><TechSoftPartnerList state={state} actions={actions} indicacoes={state.techsoft_indicacoes} /></Card>;
  if (empresa.id !== 'emp-fight-core') return <EmptyMessage title="Sem regra especial" description="Esta empresa ainda não possui uma regra de indicação específica." />;
  return <Card><PageTitle title="Indicações Fight Core" subtitle="Acompanhe contatos enviados, conversões e liberação do bônus de 6 meses." /><FightCorePartnerList state={state} actions={actions} indicacoes={state.fight_core_indicacoes} /></Card>;
}

function PartnerSettings({ actions, empresa }: { actions: ReturnType<typeof useTechPassStore>['actions']; empresa: AppState['empresas'][number] }) {
  const [form, setForm] = useState({ nome: empresa.nome, categoria: empresa.categoria, telefone: empresa.telefone ?? '', whatsapp: empresa.whatsapp ?? '', email: empresa.email ?? '', endereco: empresa.endereco ?? '', descricao: empresa.descricao ?? '', instagram: empresa.instagram ?? '', logo_url: empresa.logo_url ?? '', status: empresa.status });
  return <Card><PageTitle title="Configurações do parceiro" subtitle="Atualize dados públicos da sua empresa na Rede TechPass." /><form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); actions.updateEmpresa(empresa.id, form); }}><Field label="Nome da empresa"><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></Field><Field label="Categoria"><Input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} /></Field><Field label="Telefone"><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></Field><Field label="WhatsApp"><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></Field><Field label="E-mail"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field><Field label="Instagram"><Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /></Field><Field label="Endereço"><Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} /></Field><Field label="Logo URL"><Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} /></Field><Field label="Status"><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'ativa' | 'inativa' })}><option value="ativa">Ativa</option><option value="inativa">Inativa</option></Select></Field><div className="md:col-span-2"><Field label="Descrição da empresa"><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></Field></div><div className="md:col-span-2"><Button type="submit">Salvar configurações</Button></div></form></Card>;
}

function PartnerArea({ state, actions, navigate }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions']; navigate: (path: string) => void }) {
  const [empresaId, setEmpresaId] = useState(state.empresas[0]?.id ?? '');
  const solicitacoes = state.solicitacoes.filter((item) => item.empresa_id === empresaId);
  const leads = state.leads.filter((item) => item.empresa_id === empresaId);
  const fightIndications = state.fight_core_indicacoes;
  return <PublicShell><div className="grid gap-6"><div className="flex flex-wrap items-center justify-between gap-3"><PageTitle title="Painel da empresa parceira" subtitle="Visualize leads, solicitações e finalize atendimentos da empresa selecionada." /><Button variant="secondary" onClick={() => navigate('/admin')}>Painel admin</Button></div><Card><Field label="Empresa parceira"><Select value={empresaId} onChange={(event) => setEmpresaId(event.target.value)}>{state.empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>)}</Select></Field></Card><Card><PageTitle title="Leads de ofertas" subtitle="Interesses gerados por botões como Tenho interesse, Quero esta condição e Solicitar aula." /><LeadList state={state} actions={actions} leads={leads} /></Card>{empresaId === 'emp-fight-core' && <Card><PageTitle title="Indicações Fight Core" subtitle="Contatos enviados para regra de bônus de 6 meses." /><FightCorePartnerList state={state} actions={actions} indicacoes={fightIndications} /></Card>}{empresaId === 'emp-techsoft' && <Card><PageTitle title="Indicações TechSoft" subtitle="Contatos enviados para regra do brinde surpresa." /><TechSoftPartnerList state={state} actions={actions} indicacoes={state.techsoft_indicacoes} /></Card>}<SolicitacoesList state={state} actions={actions} solicitacoes={solicitacoes} /></div></PublicShell>;
}

function LeadList({ state, actions, leads }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions']; leads: LeadParceiro[] }) {
  return <div className="mt-4 grid gap-3">{leads.map((lead) => {
    const cliente = state.clientes.find((item) => item.id === lead.cliente_id);
    return <div key={lead.id} className="grid gap-3 rounded-lg border border-white/10 bg-black/25 p-4 lg:grid-cols-[1fr_220px]"><div><p className="font-black text-white">{lead.oferta_nome}</p><p className="mt-1 text-sm text-zinc-400">{cliente?.nome ?? 'Cliente'} · {lead.telefone_cliente} · {formatDateTime(lead.created_at)}</p><p className="mt-2 text-sm text-zinc-500">{lead.observacao}</p></div><Field label="Status"><Select value={lead.status} onChange={(event) => actions.updateLead(lead.id, { status: event.target.value as LeadStatus })}>{Object.entries(LEAD_STATUS_LABEL).map(([status, label]) => <option key={status} value={status}>{label}</option>)}</Select></Field></div>;
  })}{leads.length === 0 && <EmptyMessage title="Sem leads" description="Os interesses dos clientes aparecerão aqui." />}</div>;
}

function TechSoftPartnerList({ state, actions, indicacoes }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions']; indicacoes: AppState['techsoft_indicacoes'] }) {
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const updateStatus = (id: string, status: IndicacaoTechSoftStatus) => {
    actions.updateTechSoftIndicacao(id, { status, valor_compra: drafts[id] ?? indicacoes.find((item) => item.id === id)?.valor_compra ?? 0 });
  };
  return <div className="mt-4 grid gap-3">{indicacoes.map((item) => {
    const cliente = state.clientes.find((client) => client.id === item.cliente_id);
    const total = indicacoes.filter((ind) => ind.cliente_id === item.cliente_id).length;
    return <div key={item.id} className="grid gap-3 rounded-lg border border-white/10 bg-black/25 p-4 xl:grid-cols-[1fr_320px]"><div><p className="font-black text-white">{item.nome_indicado}</p><p className="mt-1 text-sm text-zinc-400">Indicador: {cliente?.nome ?? 'Cliente'} · contatos enviados: {Math.min(total, 15)}/15 · {item.telefone_indicado}</p><p className="mt-2 text-sm text-zinc-500">{item.observacao}</p><div className="mt-3 grid gap-2 sm:grid-cols-3"><Info label="Valor compra/serviço" value={formatMoney(item.valor_compra)} /><Info label="Gerou brinde" value={item.gerou_brinde ? 'Sim' : 'Não'} /><Info label="Data" value={formatDate(item.created_at)} /></div></div><div className="grid gap-2"><Field label="Valor da compra/serviço"><Input type="number" min={0} step="0.01" value={drafts[item.id] ?? item.valor_compra} onChange={(event) => setDrafts({ ...drafts, [item.id]: Number(event.target.value) })} /></Field><Field label="Status"><Select value={item.status} onChange={(event) => updateStatus(item.id, event.target.value as IndicacaoTechSoftStatus)}>{Object.entries(TECHSOFT_INDICACAO_LABEL).map(([status, label]) => <option key={status} value={status}>{label}</option>)}</Select></Field><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => updateStatus(item.id, 'em_contato')}>Em contato</Button><Button variant="secondary" onClick={() => updateStatus(item.id, 'comprou_fechou')}>Comprou/fechou</Button><Button variant="secondary" onClick={() => updateStatus(item.id, 'brinde_liberado')}>Liberar brinde</Button><Button variant="secondary" onClick={() => updateStatus(item.id, 'brinde_retirado')}>Brinde retirado</Button><Button variant="secondary" onClick={() => updateStatus(item.id, 'nao_converteu')}>Recusar</Button></div></div></div>;
  })}{indicacoes.length === 0 && <EmptyMessage title="Sem indicações TechSoft" description="As indicações enviadas por clientes aparecerão aqui." />}</div>;
}

function FightCorePartnerList({ state, actions, indicacoes }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions']; indicacoes: AppState['fight_core_indicacoes'] }) {
  return <div className="mt-4 grid gap-3">{indicacoes.map((item) => {
    const cliente = state.clientes.find((client) => client.id === item.cliente_id);
    return <div key={item.id} className="grid gap-3 rounded-lg border border-white/10 bg-black/25 p-4 lg:grid-cols-[1fr_220px]"><div><p className="font-black text-white">{item.nome_indicado}</p><p className="mt-1 text-sm text-zinc-400">Indicado por {cliente?.nome ?? 'Cliente'} · {item.telefone_indicado}</p><p className="mt-2 text-sm text-zinc-500">{item.observacao}</p></div><Field label="Status"><Select value={item.status} onChange={(event) => actions.updateFightCoreIndicacao(item.id, event.target.value as IndicacaoFightCoreStatus)}>{Object.entries(FIGHT_CORE_INDICACAO_LABEL).map(([status, label]) => <option key={status} value={status}>{label}</option>)}</Select></Field></div>;
  })}{indicacoes.length === 0 && <EmptyMessage title="Sem indicações Fight Core" description="As indicações enviadas pelo cliente aparecerão aqui." />}</div>;
}

function ClientesScreen({ state }: { state: AppState }) {
  return (
    <div className="grid gap-6">
      <PageTitle title="Clientes" subtitle="Clientes cadastrados pela página pública ou ativados presencialmente." />
      <div className="grid gap-3">
        {state.clientes.map((client) => {
          const techpass = state.techpasses.find((item) => item.cliente_id === client.id && item.status === 'ATIVO') ?? state.techpasses.find((item) => item.cliente_id === client.id);
          return <Card key={client.id} className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center"><div><h3 className="text-xl font-black text-white">{client.nome}</h3><p className="mt-1 text-sm text-zinc-400">CPF {client.cpf} · {client.telefone} · {client.email}</p><p className="mt-1 text-sm text-zinc-400">Código de indicação: <span className="font-mono text-tech-neon">{client.codigo_indicacao || techpass?.codigo_indicacao || 'Não gerado'}</span></p></div>{techpass ? <StatusPill status={getEffectiveStatus(techpass)} /> : <Pill className="border-white/15 bg-white/[0.06] text-zinc-200">sem techpass</Pill>}</Card>;
        })}
      </div>
    </div>
  );
}

function PublicShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen px-4 py-6 text-tech-ink sm:px-6"><div className="mx-auto flex max-w-5xl items-center justify-between gap-4"><Brand /></div><main className="mx-auto mt-8 max-w-5xl">{children}</main></div>;
}

function StatusPublic({ title, description, tone }: { title: string; description?: string; tone: 'danger' | 'neutral' }) {
  const toneClass = tone === 'danger' ? 'text-red-200' : 'text-zinc-100';
  return <Card className="mx-auto max-w-2xl p-8 text-center"><h1 className={cx('text-3xl font-black sm:text-5xl', toneClass)}>{title}</h1>{description && <p className="mt-4 text-lg text-zinc-300">{description}</p>}</Card>;
}

function BenefitsList() {
  return <div><h2 className="text-lg font-black text-white">Benefícios disponíveis</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{BENEFICIOS_PADRAO.map((benefit) => <div key={benefit} className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/25 p-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-tech-neon" /><span className="text-sm text-zinc-200">{benefit}</span></div>)}</div></div>;
}

function LandingHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div>
      <p className="text-sm font-black uppercase tracking-[0.22em] text-tech-neon">{eyebrow}</p>
      <h2 className="mt-3 max-w-4xl text-4xl font-black leading-tight text-white">{title}</h2>
      <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-400">{subtitle}</p>
    </div>
  );
}

function LandingPartnerCard({ partner }: { partner: typeof LANDING_PARTNERS[number] }) {
  const active = partner.status === 'Parceiro ativo';
  return (
    <Card className="grid min-h-[300px] content-between p-5">
      <div>
        <div className="flex h-20 items-center justify-center rounded-lg border border-white/10 bg-black/35 p-3">
          {'image' in partner && partner.image ? <img src={partner.image} alt={'Logo ' + partner.name} className="max-h-14 max-w-full object-contain" /> : <div className="grid h-14 w-14 place-items-center rounded-md border border-tech-neon/40 bg-tech-neon/10 text-lg font-black text-tech-neon">{partner.icon}</div>}
        </div>
        <div className="mt-5 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-white">{partner.name}</h3>
            <p className="mt-1 text-sm font-semibold text-tech-neon">{partner.category}</p>
          </div>
          <Pill className={active ? 'border-tech-neon/40 bg-tech-neon/10 text-tech-neon' : 'border-white/15 bg-white/[0.06] text-zinc-200'}>{partner.status}</Pill>
        </div>
        <p className="mt-4 text-sm leading-6 text-zinc-300">{partner.benefit}</p>
      </div>
      <div className="mt-5 rounded-md border border-white/10 bg-black/30 p-3">
        <p className="text-xs font-black uppercase text-zinc-500">Oferta TechPass</p>
        <p className="mt-1 text-sm font-semibold text-white">{partner.offer}</p>
      </div>
    </Card>
  );
}

function LandingOfferCard({ offer }: { offer: typeof LANDING_OFFERS[number] }) {
  return (
    <Card className="p-6">
      <p className="text-sm font-black uppercase tracking-[0.16em] text-tech-neon">{offer.company}</p>
      <h3 className="mt-3 text-2xl font-black text-white">{offer.title}</h3>
      <div className="mt-5 grid gap-3">
        <Info label="Preço normal" value={offer.normal} />
        <Info label="Preço TechPass" value={offer.techpass} />
        <Info label="Economia estimada" value={offer.saving} />
        <Info label="Brinde / extra" value={offer.bonus} />
      </div>
      <Button className="mt-5 w-full">{offer.cta}</Button>
    </Card>
  );
}

function LandingMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-l border-tech-neon/35 pl-3">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase text-zinc-500">{label}</p>
    </div>
  );
}

function LandingFeature({ icon: Icon, title, text }: { icon: typeof Activity; title: string; text: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/30 p-4">
      <Icon className="h-5 w-5 text-tech-neon" />
      <h3 className="mt-3 font-black text-white">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-zinc-400">{text}</p>
    </div>
  );
}

function PartnerCard({ empresa, index = 0 }: { empresa: AppState['empresas'][number]; index?: number }) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="absolute right-4 top-4 font-mono text-5xl font-black text-white/[0.035]">{String(index + 1).padStart(2, '0')}</div>
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-white">{empresa.nome}</h3>
            <p className="mt-1 text-sm font-semibold text-tech-neon">{empresa.categoria}</p>
          </div>
          <Pill className={empresa.status === 'ativa' ? 'border-tech-neon/40 bg-tech-neon/10 text-tech-neon' : 'border-red-300/30 bg-red-400/10 text-red-100'}>{empresa.status}</Pill>
        </div>
        <p className="mt-5 text-sm leading-6 text-zinc-300">{empresa.beneficio}</p>
      </div>
    </Card>
  );
}

function StepCard({ number, title, text }: { number: string; title: string; text: string }) {
  return <Card><div className="grid h-9 w-9 place-items-center rounded-md bg-tech-neon font-black text-black">{number}</div><h3 className="mt-4 text-lg font-black text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p></Card>;
}

function Section({ title, subtitle }: { title: string; subtitle: string }) {
  return <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6"><Card className="p-8"><h2 className="text-3xl font-black text-white">{title}</h2><p className="mt-4 max-w-4xl text-lg leading-8 text-zinc-300">{subtitle}</p></Card></section>;
}

function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return <section><h2 className="text-2xl font-black text-white sm:text-3xl">{title}</h2><p className="mt-1 text-sm text-zinc-400">{subtitle}</p></section>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-white/10 bg-black/25 p-4"><p className="text-xs font-semibold uppercase text-zinc-500">{label}</p><p className="mt-1 break-words font-semibold text-white">{value}</p></div>;
}

function Brand() {
  return <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-lg border border-tech-neon/50 bg-tech-neon/10 shadow-neon"><BadgeCheck className="h-6 w-6 text-tech-neon" /></div><div><p className="text-xs font-bold uppercase text-tech-neon">TechSoft</p><p className="text-xl font-black text-white">TechPass Premium</p></div></div>;
}

export default App;
