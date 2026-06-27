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
  formatMoney,
  getCashbackBalance,
  getClientName,
  getEmpresaName,
  getTechPassSecret,
  useTechPassStore,
} from './lib/store';
import type { AppState, CashbackTipo, IndicacaoStatus, RecompensaTipo, TechPass, TechPassStatus } from './types';
import { Button, Card, Field, Input, Pill, Select, Stat, cx } from './components/ui';
import { QrCode, createQrDataUrl } from './components/QrCode';

type AdminView = 'dashboard' | 'empresas' | 'techpass' | 'qrcodes' | 'pendentes' | 'ativar' | 'validar' | 'cashback' | 'indicacoes' | 'clientes';

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
  { id: 'clientes', label: 'Clientes', icon: Users },
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

  return <LandingPage state={state} navigate={navigate} />;
}

function LandingPage({ state, navigate }: { state: AppState; navigate: (path: string) => void }) {
  const partners = state.empresas.filter((empresa) => empresa.status === 'ativa');
  const samplePass = state.techpasses.find((item) => item.status === 'DISPONIVEL') ?? state.techpasses[0];
  return (
    <div className="min-h-screen overflow-hidden bg-black text-tech-ink">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Brand />
          <nav className="hidden items-center gap-7 text-sm font-black uppercase tracking-normal text-zinc-400 md:flex">
            <button className="transition hover:text-tech-neon" onClick={() => document.getElementById('rede')?.scrollIntoView({ behavior: 'smooth' })}>Processo</button>
            <button className="transition hover:text-tech-neon" onClick={() => document.getElementById('parceiras')?.scrollIntoView({ behavior: 'smooth' })}>Rede</button>
            <button className="transition hover:text-tech-neon" onClick={() => document.getElementById('ativacao')?.scrollIntoView({ behavior: 'smooth' })}>Ativação</button>
          </nav>
          <Button variant="secondary" onClick={() => navigate('/admin')}><LockKeyhole className="h-4 w-4" />Painel</Button>
        </div>
      </header>

      <main>
        <section className="relative mx-auto grid min-h-[calc(100vh-74px)] max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(141,255,42,0.18),transparent_28rem),radial-gradient(circle_at_88%_18%,rgba(255,255,255,0.08),transparent_18rem)]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-sm border border-tech-neon/35 bg-tech-neon/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-tech-neon">
              <Sparkles className="h-3.5 w-3.5" /> Tecnologia de ativação segura
            </div>
            <h1 className="mt-7 max-w-5xl text-5xl font-black leading-[0.92] tracking-normal text-white sm:text-7xl lg:text-8xl">O futuro da exclusividade na sua carteira.</h1>
            <p className="mt-6 max-w-2xl text-2xl font-black leading-tight text-tech-neon sm:text-3xl">TechPass Premium é um voucher comprado nas empresas parceiras, com QR permanente, código secreto e ativação presencial TechSoft.</p>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">O cliente compra o voucher, escaneia o QR, confirma o código secreto e só libera os benefícios após validação presencial com documento com foto. Um acesso simples para o cliente e controlado para a operação.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button onClick={() => document.getElementById('ativacao')?.scrollIntoView({ behavior: 'smooth' })}>Ativar meu TechPass <ArrowRight className="h-4 w-4" /></Button>
              <Button variant="secondary" onClick={() => document.getElementById('parceiro')?.scrollIntoView({ behavior: 'smooth' })}>Quero ser parceiro</Button>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              <LandingMetric value={String(partners.length)} label="parceiros ativos" />
              <LandingMetric value="12m" label="validade após ativação" />
              <LandingMetric value="QR" label="permanente" />
            </div>
          </div>

          <div className="relative">
            <div className="rounded-lg border border-white/10 bg-[#050505] p-4 shadow-2xl shadow-tech-neon/10">
              <div className="rounded-md border border-tech-neon/45 bg-[linear-gradient(135deg,#080908_0%,#171915_58%,#8DFF2A_205%)] p-5 sm:p-6">
                <div className="grid gap-6 sm:grid-cols-[1fr_112px] sm:items-start">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase text-tech-neon">Voucher TechPass</p>
                    <h2 className="mt-3 max-w-md text-3xl font-black leading-tight text-white">Um voucher. Um segredo. Uma ativação segura.</h2>
                  </div>
                  {samplePass && <div className="w-max rounded-lg bg-white p-2 shadow-xl shadow-black/30"><QrCode serial={samplePass.serial} size={96} /></div>}
                </div>
                <div className="mt-10 grid gap-3 sm:grid-cols-2">
                  <LandingFeature icon={ScanLine} title="QR permanente" text="A URL não muda; o status do benefício muda." />
                  <LandingFeature icon={ShieldCheck} title="Código secreto" text="Cadastro só avança com o código do voucher." />
                  <LandingFeature icon={Store} title="Loja valida" text="Documento com foto antes de liberar benefícios." />
                  <LandingFeature icon={Handshake} title="Parceiros" text="Mais valor para clientes sem baixar preço do serviço principal." />
                </div>
              </div>
              <div className="grid grid-cols-3 border-x border-b border-tech-neon/20 text-center text-xs font-black uppercase text-white/65">
                <span className="border-r border-tech-neon/20 py-3">Escaneia</span>
                <span className="border-r border-tech-neon/20 py-3">Cadastra</span>
                <span className="py-3">Ativa</span>
              </div>
            </div>
          </div>
        </section>

        <section id="rede" className="border-y border-white/10 bg-[#050505] text-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase text-tech-neon">O que é o TechPass</p>
              <h2 className="mt-3 text-4xl font-black text-white">Sua chave física no mundo digital.</h2>
            </div>
            <p className="text-lg leading-8 text-zinc-300">Diferente de acessos liberados sem controle, o TechPass Premium começa no voucher comprado em uma empresa parceira. O código secreto do voucher é a única forma de iniciar o cadastro, e a ativação final acontece presencialmente na TechSoft.</p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-tech-neon">Benefícios premium</p>
              <h2 className="mt-3 text-4xl font-black text-white">Mais que um voucher, uma experiência de rede.</h2>
              <p className="mt-4 text-zinc-400">A proposta é transformar cada voucher TechPass em uma porta de entrada para vantagens reais, controladas e fáceis de validar.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <LandingFeature icon={Wallet} title="Cashback real" text="Créditos acompanhados pelo painel e vinculados ao TechPass ativo." />
              <LandingFeature icon={CreditCard} title="Descontos VIP" text="Condições especiais em serviços TechSoft e empresas parceiras." />
              <LandingFeature icon={Gift} title="Brindes e indicações" text="Recompensas para clientes que trazem novos participantes para a rede." />
              <LandingFeature icon={Film} title="Serviços recorrentes" text="Benefícios como películas, manutenção e vantagens por validade." />
            </div>
          </div>
        </section>

        <section id="parceiras" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-tech-neon">Rede exclusiva</p>
              <h2 className="mt-3 text-4xl font-black text-white">Empresas parceiras</h2>
              <p className="mt-2 max-w-2xl text-zinc-400">Uma rede de vantagens que começa local e cresce por indicação.</p>
            </div>
            <Pill className="w-max border-tech-neon/40 bg-tech-neon/10 text-tech-neon">{partners.length} parceiros ativos</Pill>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {partners.map((empresa, index) => <PartnerCard key={empresa.id} empresa={empresa} index={index} />)}
          </div>
        </section>

        <section id="ativacao" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="rounded-lg border border-white/10 bg-[#090909] p-6 shadow-2xl shadow-black/40 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-tech-neon">Acesso em 3 atos</p>
                <h2 className="mt-3 text-4xl font-black text-white">Da compra do voucher à ativação presencial.</h2>
                <p className="mt-4 text-zinc-400">O cliente solicita a ativação online, mas a liberação final continua sob controle da equipe TechSoft.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <StepCard number="1" title="Compra" text="O cliente compra o voucher em uma empresa parceira participante." />
                <StepCard number="2" title="Escaneia" text="O QR abre a página pública e pede o código secreto do voucher." />
                <StepCard number="3" title="Ativa" text="A TechSoft confere documento com foto e libera o benefício." />
              </div>
            </div>
          </div>
        </section>

        <section id="parceiro" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="rounded-lg border border-tech-neon/40 bg-tech-neon p-8 text-black shadow-neon lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8">
            <div>
              <p className="text-sm font-black uppercase">Para empresas locais</p>
              <h2 className="mt-3 max-w-3xl text-4xl font-black">Sua empresa também pode fazer parte da Rede TechPass.</h2>
              <p className="mt-4 max-w-3xl text-base font-semibold text-black/75">Ofereça mais valor aos seus clientes sem precisar reduzir o preço do seu serviço principal.</p>
            </div>
            <Button className="mt-6 border-black bg-black text-white hover:bg-zinc-900 lg:mt-0">Quero ser parceiro <ArrowRight className="h-4 w-4" /></Button>
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
