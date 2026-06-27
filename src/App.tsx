import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Ban,
  Building2,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Film,
  Gift,
  Handshake,
  LockKeyhole,
  Plus,
  QrCode as QrCodeIcon,
  RefreshCw,
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
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
  getEmpresaName,
  getTechPassSecret,
  useTechPassStore,
} from './lib/store';
import type { AppState, BeneficioServico, BeneficioServicoTipo, CashbackTipo, IndicacaoFightCoreStatus, IndicacaoStatus, LeadParceiro, LeadStatus, OfertaParceiro, OfertaTipo, RecompensaTipo, Solicitacao, SolicitacaoStatus, TechPass, TechPassStatus } from './types';
import { Button, Card, Field, Input, Pill, Select, Stat, Textarea, cx } from './components/ui';
import { QrCode, createQrDataUrl } from './components/QrCode';
import fightCoreLogo from './assets/fight-core-logo.png';
import superGeeksLogo from './assets/super-geeks-logo.png';
import techpassVoucherMockup from './assets/techpass-voucher-mockup.png';

type AdminView = 'dashboard' | 'empresas' | 'techpass' | 'qrcodes' | 'pendentes' | 'ativar' | 'validar' | 'cashback' | 'indicacoes' | 'solicitacoes' | 'beneficios' | 'ofertas' | 'clientes';

const ADMIN_NAV: Array<{ id: AdminView; label: string; icon: typeof Activity }> = [
  { id: 'dashboard', label: 'Dashboard', icon: Activity },
  { id: 'empresas', label: 'Empresas parceiras', icon: Building2 },
  { id: 'techpass', label: 'Gerar TechPass', icon: CreditCard },
  { id: 'qrcodes', label: 'QR Codes', icon: QrCodeIcon },
  { id: 'pendentes', label: 'Cadastros pendentes', icon: UserCheck },
  { id: 'ativar', label: 'Ativar TechPass', icon: ShieldCheck },
  { id: 'validar', label: 'Validar TechPass', icon: BadgeCheck },
  { id: 'cashback', label: 'Cashback', icon: Wallet },
  { id: 'indicacoes', label: 'Indique e Ganhe', icon: Gift },
  { id: 'solicitacoes', label: 'Solicitações', icon: Store },
  { id: 'beneficios', label: 'Benefícios e Serviços', icon: Sparkles },
  { id: 'ofertas', label: 'Editor de ofertas', icon: Handshake },
  { id: 'clientes', label: 'Clientes', icon: Users },
];

const SOLICITACAO_LABEL: Record<SolicitacaoStatus, string> = {
  nova: 'Nova solicitação',
  analise: 'Em análise',
  confirmada: 'Confirmada',
  atendimento: 'Em atendimento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

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

  if (path.startsWith('/login')) {
    return <ClientLogin state={state} navigate={navigate} />;
  }

  if (path.startsWith('/cliente')) {
    return <ClientArea state={state} actions={actions} navigate={navigate} />;
  }

  if (path.startsWith('/empresa')) {
    return <PartnerArea state={state} actions={actions} navigate={navigate} />;
  }

  return <LandingPage state={state} navigate={navigate} />;
}

function LandingPage({ state, navigate }: { state: AppState; navigate: (path: string) => void }) {
  return (
    <div className="min-h-screen overflow-hidden bg-black text-tech-ink">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Brand />
          <nav className="hidden items-center gap-7 text-sm font-black uppercase tracking-normal text-zinc-400 md:flex">
            <button className="transition hover:text-tech-neon" onClick={() => document.getElementById('rede')?.scrollIntoView({ behavior: 'smooth' })}>Rede</button>
            <button className="transition hover:text-tech-neon" onClick={() => document.getElementById('empresas')?.scrollIntoView({ behavior: 'smooth' })}>Empresas</button>
            <button className="transition hover:text-tech-neon" onClick={() => document.getElementById('ofertas')?.scrollIntoView({ behavior: 'smooth' })}>Ofertas</button>
            <button className="transition hover:text-tech-neon" onClick={() => document.getElementById('techcash')?.scrollIntoView({ behavior: 'smooth' })}>TechCash</button>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/cliente')}><Users className="h-4 w-4" />Área do cliente</Button>
            <Button variant="secondary" onClick={() => navigate('/admin')}><LockKeyhole className="h-4 w-4" />Painel</Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative mx-auto grid min-h-[calc(100vh-74px)] max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(141,255,42,0.18),transparent_28rem),radial-gradient(circle_at_88%_18%,rgba(255,255,255,0.08),transparent_18rem)]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-sm border border-tech-neon/35 bg-tech-neon/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-tech-neon">
              <Sparkles className="h-3.5 w-3.5" /> Marketplace local de vantagens
            </div>
            <h1 className="mt-7 max-w-5xl text-5xl font-black leading-[0.92] tracking-normal text-white sm:text-7xl lg:text-8xl">Rede TechPass</h1>
            <p className="mt-6 max-w-3xl text-2xl font-black leading-tight text-tech-neon sm:text-3xl">Benefícios, ofertas e indicações entre empresas parceiras.</p>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">A Rede TechPass conecta empresas locais em um ecossistema de vantagens, onde clientes ativos recebem descontos, brindes, cashback, ofertas exclusivas e condições especiais em negócios parceiros.</p>
            <div className="mt-6 rounded-lg border border-tech-neon/30 bg-tech-neon/10 p-4 text-base font-black text-white">
              Transforme seus clientes em oportunidades para empresas parceiras, e receba clientes qualificados de volta.
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button onClick={() => document.getElementById('parceiro')?.scrollIntoView({ behavior: 'smooth' })}>Quero ser parceiro <ArrowRight className="h-4 w-4" /></Button>
              <Button variant="secondary" onClick={() => document.getElementById('empresas')?.scrollIntoView({ behavior: 'smooth' })}>Ver empresas participantes</Button>
            </div>
            <div className="mt-10 grid max-w-3xl grid-cols-3 gap-3">
              <LandingMetric value="8+" label="empresas modelo" />
              <LandingMetric value="R$100" label="meta TechCash" />
              <LandingMetric value="Leads" label="qualificados" />
            </div>
          </div>

          <div className="relative z-10">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 shadow-2xl shadow-tech-neon/10 backdrop-blur">
              <img src={techpassVoucherMockup} alt="Mockup 3D do voucher TechPass Premium" className="w-full rounded-md object-cover" />
            </div>
          </div>
        </section>

        <section id="rede" className="border-y border-white/10 bg-[#050505] text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-tech-neon">O que é a Rede TechPass</p>
              <h2 className="mt-3 text-4xl font-black text-white">Não é apenas um cartão de descontos.</h2>
            </div>
            <div className="grid gap-5">
              <p className="text-lg leading-8 text-zinc-300">A Rede TechPass é uma plataforma de benefícios compartilhados entre empresas parceiras. Cada empresa oferece vantagens exclusivas para membros TechPass, como descontos, brindes, planos anuais especiais, cashback e condições personalizadas.</p>
              <p className="rounded-lg border border-tech-neon/30 bg-tech-neon/10 p-5 text-xl font-black leading-tight text-white">É uma rede local de geração de valor, fidelização e indicação cruzada.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <LandingHeader eyebrow="Como funciona" title="Da ativação ao lead qualificado." subtitle="O TechPass conecta o benefício entregue por uma empresa com novas oportunidades dentro da rede." />
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StepCard number="1" title="O cliente recebe o TechPass" text="O benefício é entregue por uma empresa parceira participante." />
            <StepCard number="2" title="Ativa presencialmente" text="Ele escaneia o QR Code, faz o pré-cadastro e ativa o benefício na loja." />
            <StepCard number="3" title="Acessa ofertas exclusivas" text="Planos anuais, brindes, serviços com desconto e condições especiais aparecem no painel do cliente." />
            <StepCard number="4" title="Empresas recebem leads" text="Quando o cliente demonstra interesse, a solicitação é direcionada para a empresa responsável." />
          </div>
        </section>

        <section id="empresas" className="border-y border-white/10 bg-[#050505]">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <LandingHeader eyebrow="Empresas participantes" title="Uma rede local com marcas reais e novos segmentos." subtitle="Conheça algumas empresas que fazem parte ou podem fazer parte da Rede TechPass." />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {LANDING_PARTNERS.map((partner) => <LandingPartnerCard key={partner.name} partner={partner} />)}
            </div>
          </div>
        </section>

        <section id="voucher" className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <LandingHeader eyebrow="Voucher TechPass" title="Um benefício físico com experiência digital." subtitle="O cliente recebe um voucher físico com QR Code, número de identificação e código revelado no estilo raspadinha." />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {['Voucher físico premium', 'QR Code exclusivo', 'Código único revelado no cartão', 'Pré-cadastro online', 'Ativação presencial com documento oficial', 'Dashboard de benefícios'].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/35 p-3 text-sm font-bold text-zinc-200"><CheckCircle2 className="h-5 w-5 text-tech-neon" />{item}</div>
              ))}
            </div>
          </div>
          <img src={techpassVoucherMockup} alt="Frente e verso do voucher TechPass Premium" className="w-full rounded-lg border border-tech-neon/25 shadow-2xl shadow-tech-neon/10" />
        </section>

        <section id="ofertas" className="border-y border-white/10 bg-[#050505]">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <LandingHeader eyebrow="Ofertas exclusivas TechPass" title="Ofertas exclusivas para membros TechPass." subtitle="Cada parceiro pode publicar ofertas especiais, mostrando preço normal, preço TechPass, economia estimada e benefício extra antes do cliente chamar no WhatsApp." />
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {LANDING_OFFERS.map((offer) => <LandingOfferCard key={offer.title} offer={offer} />)}
            </div>
          </div>
        </section>

        <section id="techcash" className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <LandingHeader eyebrow="TechCash" title="Cashback exclusivo para membros TechPass." subtitle="Clientes TechPass acumulam cashback em compras e serviços participantes na TechSoft." />
            <div className="mt-6 grid gap-3">
              {['Compras e serviços acima de R$ 250 geram TechCash.', 'O saldo é cumulativo.', 'Ao atingir R$ 100, o cliente pode trocar por brinde, serviço ou desconto.', 'O saldo não pode ser convertido em dinheiro.', 'Benefício exclusivo para membros TechPass ativos.'].map((item) => (
                <div key={item} className="flex items-start gap-3 text-zinc-300"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-tech-neon" />{item}</div>
              ))}
            </div>
          </div>
          <Card className="p-8">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-tech-neon">Saldo TechCash</p>
            <div className="mt-5 flex items-end justify-between gap-4">
              <p className="text-5xl font-black text-white">R$ 68,50</p>
              <p className="pb-2 font-bold text-zinc-400">/ R$ 100,00</p>
            </div>
            <div className="mt-6 h-4 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[68.5%] rounded-full bg-tech-neon shadow-neon" />
            </div>
            <p className="mt-4 text-sm font-semibold text-zinc-300">Faltam R$ 31,50 para desbloquear um resgate.</p>
          </Card>
        </section>

        <section className="border-y border-white/10 bg-[#050505]">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1fr] lg:items-start">
            <div>
              <LandingHeader eyebrow="Indique e Ganhe" title="Mais indicações, mais benefícios." subtitle="Membros TechPass possuem um código exclusivo de indicação. Quando uma pessoa indicada fecha serviço ou compra acima de R$ 350 em uma empresa participante, o membro pode receber uma recompensa." />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {['Até R$ 50 em desconto', 'Cashback', 'Brinde especial', 'Benefício exclusivo em empresa parceira'].map((item) => <LandingFeature key={item} icon={Gift} title={item} text="Recompensa possível conforme regra da oferta e empresa participante." />)}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <LandingHeader eyebrow="Dashboard do cliente" title="Tudo em um só painel." subtitle="O membro acompanha status, validade, benefícios, ofertas, TechCash, indicações, solicitações e agendamentos em um único lugar." />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {['Status do TechPass', 'Validade', 'Benefícios disponíveis', 'Benefícios já utilizados', 'Trocas de película', 'Saldo TechCash', 'Código de indicação', 'Ofertas exclusivas', 'Solicitações enviadas', 'Agendamento de serviços'].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/[0.045] p-4 text-sm font-bold text-white">{item}</div>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#050505]">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <LandingHeader eyebrow="Para empresas parceiras" title="Por que sua empresa deveria entrar na Rede TechPass?" subtitle="Mais valor percebido, indicação cruzada e oportunidades comerciais dentro de uma rede local." />
            <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {['Aumenta o valor percebido dos seus planos e serviços', 'Gera leads qualificados', 'Cria indicação cruzada entre empresas locais', 'Ajuda na fidelização de clientes', 'Permite oferecer vantagens sem reduzir diretamente sua mensalidade principal', 'Fortalece parcerias estratégicas', 'Cria um diferencial comercial frente aos concorrentes'].map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-black/35 p-4 text-sm font-semibold leading-6 text-zinc-200">{item}</div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <Card className="grid gap-8 p-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-tech-neon">Exemplo prático</p>
              <h2 className="mt-3 text-4xl font-black text-white">Um aluno vira cliente da rede inteira.</h2>
            </div>
            <p className="text-lg leading-8 text-zinc-300">Um aluno da Super Geeks recebe um TechPass. Ao acessar o painel, ele encontra benefícios na TechSoft, planos especiais na Fight Core e recompensas por indicação. Ao demonstrar interesse em uma oferta, a empresa parceira recebe um lead qualificado com os dados do cliente e a oferta desejada.</p>
          </Card>
        </section>

        <section id="parceiro" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="rounded-lg border border-tech-neon/40 bg-tech-neon p-8 text-black shadow-neon lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8">
            <div>
              <p className="text-sm font-black uppercase">CTA final</p>
              <h2 className="mt-3 max-w-3xl text-4xl font-black">Faça sua empresa parte da Rede TechPass.</h2>
              <p className="mt-4 max-w-3xl text-base font-semibold text-black/75">Crie ofertas, receba leads qualificados e entregue mais valor aos seus clientes através de uma rede local de parceiros.</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 lg:mt-0">
              <Button className="border-black bg-black text-white hover:bg-zinc-900">Quero ser parceiro <ArrowRight className="h-4 w-4" /></Button>
              <Button variant="secondary" className="border-black/30 bg-black/10 text-black hover:bg-black hover:text-white">Falar com a TechSoft</Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
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
            <Button variant="secondary" onClick={actions.resetDemo}><RefreshCw className="h-4 w-4" />Reset demo</Button>
            <Button variant="ghost" onClick={() => navigate('/')}>Site público</Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-max rounded-lg border border-white/10 bg-white/[0.04] p-3 lg:sticky lg:top-4">
          <nav className="grid gap-1">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              return <button key={item.id} onClick={() => setView(item.id)} className={cx('flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition', view === item.id ? 'bg-tech-neon text-black' : 'text-zinc-300 hover:bg-white/[0.07] hover:text-white')}><Icon className="h-4 w-4" />{item.label}</button>;
            })}
          </nav>
        </aside>
        <main>
          {view === 'dashboard' && <Dashboard state={state} />}
          {view === 'empresas' && <EmpresasScreen state={state} actions={actions} />}
          {view === 'techpass' && <TechPassScreen state={state} actions={actions} navigate={navigate} />}
          {view === 'qrcodes' && <QrCodesScreen state={state} navigate={navigate} />}
          {view === 'pendentes' && <PendentesScreen state={state} actions={actions} />}
          {view === 'ativar' && <PendentesScreen state={state} actions={actions} />}
          {view === 'validar' && <ValidarScreen state={state} actions={actions} />}
          {view === 'cashback' && <CashbackScreen state={state} actions={actions} />}
          {view === 'indicacoes' && <IndicacoesScreen state={state} actions={actions} />}
          {view === 'solicitacoes' && <SolicitacoesScreen state={state} actions={actions} />}
          {view === 'beneficios' && <BeneficiosServicosScreen state={state} actions={actions} />}
          {view === 'ofertas' && <OfertasAdminScreen state={state} actions={actions} />}
          {view === 'clientes' && <ClientesScreen state={state} />}
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
      </div>
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

function CashbackScreen({ state, actions }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions'] }) {
  const activePasses = state.techpasses.filter((item) => item.status === 'ATIVO' && item.cliente_id);
  const [techpassId, setTechpassId] = useState(activePasses[0]?.id ?? '');
  const [tipo, setTipo] = useState<CashbackTipo>('credito');
  const [valor, setValor] = useState(20);
  const [descricao, setDescricao] = useState('Cashback lançado manualmente.');
  const [message, setMessage] = useState('');
  const selected = state.techpasses.find((item) => item.id === techpassId) ?? null;
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

function ClientArea({ state, actions, navigate }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions']; navigate: (path: string) => void }) {
  const clientId = localStorage.getItem('techpass-client-id') ?? 'cli-maria';
  const cliente = state.clientes.find((item) => item.id === clientId);
  const matchedPass = cliente ? state.techpasses.find((item) => item.cliente_id === cliente.id && item.status === 'ATIVO') : null;
  const [view, setView] = useState<'techpass' | 'beneficios' | 'ofertas' | 'solicitacoes' | 'indicacoes' | 'techcash' | 'perfil'>('techpass');

  return (
    <PublicShell>
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageTitle title="Dashboard do cliente" subtitle="Meu TechPass, ofertas, indicações, TechCash e solicitações em andamento." />
          <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => navigate('/login')}>Trocar acesso</Button><Button variant="secondary" onClick={() => navigate('/')}>Site público</Button></div>
        </div>
        {!matchedPass || !cliente ? <EmptyMessage title="Cliente não autenticado" description="Acesse pela página de login usando CPF, telefone ou código TechPass." /> : (
          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <Card className="h-max p-3">
              {[
                ['techpass', 'Meu TechPass'],
                ['beneficios', 'Benefícios'],
                ['ofertas', 'Ofertas Exclusivas'],
                ['solicitacoes', 'Agendamentos/Solicitações'],
                ['indicacoes', 'Indicações'],
                ['techcash', 'TechCash'],
                ['perfil', 'Perfil'],
              ].map(([id, label]) => <button key={id} onClick={() => setView(id as typeof view)} className={cx('block w-full rounded-md px-3 py-3 text-left text-sm font-bold transition', view === id ? 'bg-tech-neon text-black' : 'text-zinc-300 hover:bg-white/[0.08] hover:text-white')}>{label}</button>)}
            </Card>
            <ClientDashboard state={state} actions={actions} cliente={cliente} techpass={matchedPass} view={view} />
          </div>
        )}
      </div>
    </PublicShell>
  );
}

function ClientDashboard({ state, actions, cliente, techpass, view }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions']; cliente: AppState['clientes'][number]; techpass: TechPass; view: 'techpass' | 'beneficios' | 'ofertas' | 'solicitacoes' | 'indicacoes' | 'techcash' | 'perfil' }) {
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
  if (view === 'beneficios') {
    return <div className="grid gap-6"><Card><BenefitsList /></Card><Card><PageTitle title="Benefícios utilizados" subtitle="Histórico de películas, limpezas, consultorias, descontos, cashback e indicações." /><UsageHistory state={state} utilizacoes={utilizacoes} /></Card></div>;
  }
  if (view === 'ofertas') {
    return <ClientOffers state={state} actions={actions} cliente={cliente} techpass={techpass} ofertas={ofertasAtivas} />;
  }
  if (view === 'solicitacoes') {
    return <Card><PageTitle title="Agendamentos e solicitações" subtitle="Acompanhe pedidos enviados para empresas parceiras." /><div className="mt-4 grid gap-3">{solicitacoes.map((item) => <SolicitacaoRow key={item.id} state={state} solicitacao={item} />)}{solicitacoes.length === 0 && <EmptyMessage title="Sem solicitações" description="Solicite um serviço, aula ou oferta para acompanhar aqui." />}</div></Card>;
  }
  if (view === 'indicacoes') {
    return <FightCoreIndications state={state} actions={actions} cliente={cliente} techpass={techpass} />;
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
          <Info label="Validade" value={formatDate(techpass.expires_at)} />
          <Info label="Saldo TechCash" value={formatMoney(getCashbackBalance(state, techpass.id))} />
          <Info label="Películas restantes" value={techpass.peliculas_restantes + ' de 6'} />
          <Info label="Código de indicação" value={techpass.codigo_indicacao ?? cliente.codigo_indicacao ?? 'Não gerado'} />
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ofertas.map((oferta) => <OfferCard key={oferta.id} state={state} oferta={oferta} onClick={() => requestOffer(oferta)} />)}
      </div>
    </div>
  );
}

function OfferCard({ state, oferta, onClick }: { state: AppState; oferta: OfertaParceiro; onClick: () => void }) {
  return (
    <Card className="grid content-between gap-5 p-5">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-tech-neon">{getEmpresaName(state, oferta.empresa_id)}</p>
            <h3 className="mt-2 text-xl font-black text-white">{oferta.nome}</h3>
          </div>
          <Pill className="border-white/15 bg-white/[0.06] text-zinc-200">{OFERTA_TIPO_LABEL[oferta.tipo]}</Pill>
        </div>
        <p className="mt-4 text-sm leading-6 text-zinc-400">{oferta.descricao}</p>
        <div className="mt-5 grid gap-2">
          <Info label="Preço normal" value={oferta.preco_normal || 'Sob consulta'} />
          <Info label="Preço TechPass" value={oferta.preco_techpass || 'Condição especial'} />
          <Info label="Economia estimada" value={oferta.economia || 'Variável'} />
          <Info label="Benefício extra" value={oferta.beneficio_extra || 'Não informado'} />
        </div>
        <p className="mt-4 text-xs leading-5 text-zinc-500">{oferta.regras}</p>
      </div>
      <Button onClick={onClick}>{oferta.cta}</Button>
    </Card>
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
  return <Card className="p-8"><PageTitle title="TechCash" subtitle="Cashback exclusivo para membros TechPass ativos." /><p className="mt-8 text-5xl font-black text-white">{formatMoney(balance)}</p><div className="mt-5 h-4 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-tech-neon" style={{ width: `${Math.min(balance, 100)}%` }} /></div><p className="mt-4 text-sm text-zinc-300">{remaining > 0 ? `Faltam ${formatMoney(remaining)} para desbloquear um resgate.` : 'Resgate liberado para brinde, serviço ou desconto.'}</p></Card>;
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
  const [form, setForm] = useState<Omit<OfertaParceiro, 'id' | 'created_at'>>({ empresa_id: state.empresas[0]?.id ?? '', nome: '', tipo: 'plano', preco_normal: '', preco_techpass: '', economia: '', descricao: '', regras: '', beneficio_extra: '', status: 'ativo', cta: 'Tenho interesse' });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    actions.addOferta(form);
    setForm({ ...form, nome: '', preco_normal: '', preco_techpass: '', economia: '', descricao: '', regras: '', beneficio_extra: '' });
  };
  return (
    <div className="grid gap-6">
      <PageTitle title="Editor de ofertas" subtitle="Edite ofertas exclusivas de planos, aulas grátis, serviços, brindes, indicações e renovações." />
      <Card>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Empresa parceira"><Select value={form.empresa_id} onChange={(event) => setForm({ ...form, empresa_id: event.target.value })}>{state.empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>)}</Select></Field>
          <Field label="Nome da oferta"><Input value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} required /></Field>
          <Field label="Tipo"><Select value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value as OfertaTipo })}>{Object.entries(OFERTA_TIPO_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
          <Field label="Status"><Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as 'ativo' | 'inativo' })}><option value="ativo">Ativo</option><option value="inativo">Inativo</option></Select></Field>
          <Field label="Preço normal"><Input value={form.preco_normal} onChange={(event) => setForm({ ...form, preco_normal: event.target.value })} /></Field>
          <Field label="Preço TechPass"><Input value={form.preco_techpass} onChange={(event) => setForm({ ...form, preco_techpass: event.target.value })} /></Field>
          <Field label="Economia estimada"><Input value={form.economia} onChange={(event) => setForm({ ...form, economia: event.target.value })} /></Field>
          <Field label="Botão"><Input value={form.cta} onChange={(event) => setForm({ ...form, cta: event.target.value })} /></Field>
          <div className="md:col-span-2"><Field label="Descrição"><Textarea value={form.descricao} onChange={(event) => setForm({ ...form, descricao: event.target.value })} /></Field></div>
          <div className="md:col-span-2"><Field label="Regras"><Textarea value={form.regras} onChange={(event) => setForm({ ...form, regras: event.target.value })} /></Field></div>
          <div className="md:col-span-2 xl:col-span-4"><Field label="Benefício extra"><Input value={form.beneficio_extra} onChange={(event) => setForm({ ...form, beneficio_extra: event.target.value })} /></Field></div>
          <div className="md:col-span-2 xl:col-span-4"><Button type="submit"><Plus className="h-4 w-4" />Criar oferta</Button></div>
        </form>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{state.ofertas.map((oferta) => <OfferCard key={oferta.id} state={state} oferta={oferta} onClick={() => actions.updateOferta(oferta.id, { status: oferta.status === 'ativo' ? 'inativo' : 'ativo' })} />)}</div>
    </div>
  );
}

function PartnerArea({ state, actions, navigate }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions']; navigate: (path: string) => void }) {
  const [empresaId, setEmpresaId] = useState(state.empresas[0]?.id ?? '');
  const solicitacoes = state.solicitacoes.filter((item) => item.empresa_id === empresaId);
  const leads = state.leads.filter((item) => item.empresa_id === empresaId);
  const fightIndications = state.fight_core_indicacoes;
  return <PublicShell><div className="grid gap-6"><div className="flex flex-wrap items-center justify-between gap-3"><PageTitle title="Painel da empresa parceira" subtitle="Visualize leads, solicitações e finalize atendimentos da empresa selecionada." /><Button variant="secondary" onClick={() => navigate('/admin')}>Painel admin</Button></div><Card><Field label="Empresa parceira"><Select value={empresaId} onChange={(event) => setEmpresaId(event.target.value)}>{state.empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>)}</Select></Field></Card><Card><PageTitle title="Leads de ofertas" subtitle="Interesses gerados por botões como Tenho interesse, Quero esta condição e Solicitar aula." /><LeadList state={state} actions={actions} leads={leads} /></Card>{empresaId === 'emp-fight-core' && <Card><PageTitle title="Indicações Fight Core" subtitle="Contatos enviados para regra de bônus de 6 meses." /><FightCorePartnerList state={state} actions={actions} indicacoes={fightIndications} /></Card>}<SolicitacoesList state={state} actions={actions} solicitacoes={solicitacoes} /></div></PublicShell>;
}

function LeadList({ state, actions, leads }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions']; leads: LeadParceiro[] }) {
  return <div className="mt-4 grid gap-3">{leads.map((lead) => {
    const cliente = state.clientes.find((item) => item.id === lead.cliente_id);
    return <div key={lead.id} className="grid gap-3 rounded-lg border border-white/10 bg-black/25 p-4 lg:grid-cols-[1fr_220px]"><div><p className="font-black text-white">{lead.oferta_nome}</p><p className="mt-1 text-sm text-zinc-400">{cliente?.nome ?? 'Cliente'} · {lead.telefone_cliente} · {formatDateTime(lead.created_at)}</p><p className="mt-2 text-sm text-zinc-500">{lead.observacao}</p></div><Field label="Status"><Select value={lead.status} onChange={(event) => actions.updateLead(lead.id, { status: event.target.value as LeadStatus })}>{Object.entries(LEAD_STATUS_LABEL).map(([status, label]) => <option key={status} value={status}>{label}</option>)}</Select></Field></div>;
  })}{leads.length === 0 && <EmptyMessage title="Sem leads" description="Os interesses dos clientes aparecerão aqui." />}</div>;
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
