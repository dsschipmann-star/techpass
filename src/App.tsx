import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  Activity,
  BadgeCheck,
  Ban,
  Building2,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  LockKeyhole,
  Plus,
  QrCode as QrCodeIcon,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
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
import type { AppState, TechPass, TechPassStatus } from './types';
import { Button, Card, Field, Input, Pill, Select, Stat, cx } from './components/ui';
import { QrCode, createQrDataUrl } from './components/QrCode';

type AdminView = 'dashboard' | 'empresas' | 'techpass' | 'pendentes' | 'clientes';

const ADMIN_NAV: Array<{ id: AdminView; label: string; icon: typeof Activity }> = [
  { id: 'dashboard', label: 'Dashboard', icon: Activity },
  { id: 'empresas', label: 'Empresas parceiras', icon: Building2 },
  { id: 'techpass', label: 'TechPass', icon: CreditCard },
  { id: 'pendentes', label: 'Cadastros pendentes', icon: UserCheck },
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
  return (
    <div className="min-h-screen text-tech-ink">
      <header className="border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
          <Brand />
          <Button variant="secondary" onClick={() => navigate('/admin')}><LockKeyhole className="h-4 w-4" />Painel</Button>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-24">
          <div>
            <Pill className="border-tech-neon/40 bg-tech-neon/10 text-tech-neon">Rede TechPass</Pill>
            <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-normal text-white sm:text-7xl">Rede TechPass</h1>
            <p className="mt-5 text-2xl font-semibold text-tech-neon">Benefícios exclusivos entre empresas parceiras.</p>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-300">O TechPass conecta empresas locais em uma rede de vantagens, onde clientes de empresas parceiras recebem benefícios exclusivos na TechSoft e em outros negócios participantes.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => document.getElementById('parceiras')?.scrollIntoView({ behavior: 'smooth' })}>Ver empresas parceiras</Button>
              <Button variant="secondary" onClick={() => document.getElementById('parceiro')?.scrollIntoView({ behavior: 'smooth' })}>Quero ser parceiro</Button>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/30">
            <div className="rounded-lg border border-tech-neon/30 bg-tech-neon/10 p-5">
              <p className="text-sm font-bold uppercase text-tech-neon">Benefício premium</p>
              <h2 className="mt-3 text-3xl font-black text-white">TechPass físico + QR permanente</h2>
              <p className="mt-3 text-zinc-300">O cliente escaneia, entende o benefício, cadastra com o código secreto do cartão e ativa presencialmente na TechSoft.</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {['QR Code permanente', 'Código físico único', 'Ativação presencial', 'Rede de parceiros'].map((item) => <Info key={item} label="Recurso" value={item} />)}
            </div>
          </div>
        </section>

        <Section title="O que é o TechPass" subtitle="O TechPass Premium é um clube de benefícios que dá acesso a descontos, brindes, cashback e vantagens exclusivas em empresas parceiras." />

        <section id="parceiras" className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <PageTitle title="Empresas parceiras" subtitle="Uma rede local de vantagens para clientes e negócios participantes." />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {partners.map((empresa) => <PartnerCard key={empresa.id} empresa={empresa} />)}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <PageTitle title="Como funciona" subtitle="Simples para o cliente, seguro para a TechSoft." />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <StepCard number="1" title="Você recebe o TechPass" text="O cartão é entregue por uma empresa parceira participante." />
            <StepCard number="2" title="Escaneia o QR Code" text="Você acessa a página de cadastro e informa o código do cartão físico." />
            <StepCard number="3" title="Ativa presencialmente" text="Compareça à TechSoft com documento oficial com foto para liberar seus benefícios." />
          </div>
        </section>

        <section id="parceiro" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <Card className="grid gap-6 p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-3xl font-black text-white">Sua empresa também pode fazer parte da Rede TechPass.</h2>
              <p className="mt-3 max-w-3xl text-zinc-300">Ofereça mais valor aos seus clientes sem precisar reduzir o preço do seu serviço principal.</p>
            </div>
            <Button>Quero ser parceiro</Button>
          </Card>
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
            <h1 className="mt-5 text-3xl font-black text-white sm:text-5xl">Parabéns! Você recebeu um TechPass Premium.</h1>
            <p className="mt-4 text-xl font-semibold text-tech-neon">Seu benefício já é seu. Falta apenas concluir o cadastro e ativar presencialmente na TechSoft.</p>
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
          <StepCard number="1" title="Escaneie" text="Escaneie o QR Code do cartão." />
          <StepCard number="2" title="Revele" text="Revele o código físico do seu TechPass." />
          <StepCard number="3" title="Cadastre" text="Preencha o cadastro nesta página." />
          <StepCard number="4" title="Compareça" text="Vá à TechSoft com cartão e documento." />
          <StepCard number="5" title="Ative" text="A equipe TechSoft libera seus benefícios." />
        </div>
      </Card>

      <Card>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-black text-white">Solicitar ativação do TechPass</h2>
            <p className="mt-1 text-sm text-zinc-400">O campo Código do TechPass físico é obrigatório.</p>
          </div>
          <Field label="Nome completo"><Input required disabled={success} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></Field>
          <Field label="CPF"><Input required disabled={success} value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" /></Field>
          <Field label="Telefone / WhatsApp"><Input required disabled={success} value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></Field>
          <Field label="E-mail"><Input required disabled={success} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Código do TechPass físico"><Input required disabled={success} value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })} placeholder="Ex: SG-7K2P" /></Field>
          <div className="md:col-span-2">
            <Button type="submit" disabled={success}><UserCheck className="h-4 w-4" />Enviar cadastro</Button>
            {message && <div className={cx('mt-4 rounded-lg border p-4 text-sm', success ? 'border-tech-neon/30 bg-tech-neon/10 text-tech-neon' : 'border-red-300/30 bg-red-300/10 text-red-100')}>{success ? 'Cadastro enviado com sucesso! Seu TechPass está pendente de ativação. Para liberar seus benefícios, compareça à TechSoft com seu TechPass físico e documento oficial com foto.' : message}</div>}
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
          {view === 'pendentes' && <PendentesScreen state={state} actions={actions} />}
          {view === 'clientes' && <ClientesScreen state={state} />}
        </main>
      </div>
    </div>
  );
}

function Dashboard({ state }: { state: AppState }) {
  const stats = useMemo(() => ({
    total: state.techpasses.length,
    disponiveis: state.techpasses.filter((item) => item.status === 'DISPONIVEL').length,
    pendentes: state.techpasses.filter((item) => item.status === 'PENDENTE_ATIVACAO').length,
    ativos: state.techpasses.filter((item) => item.status === 'ATIVO').length,
    cancelados: state.techpasses.filter((item) => item.status === 'CANCELADO').length,
  }), [state]);
  return (
    <div className="grid gap-6">
      <PageTitle title="Dashboard" subtitle="Resumo operacional da Rede TechPass." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Total de TechPass" value={stats.total} tone="neon" />
        <Stat label="Disponíveis" value={stats.disponiveis} />
        <Stat label="Pendentes" value={stats.pendentes} tone="warn" />
        <Stat label="Ativos" value={stats.ativos} tone="neon" />
        <Stat label="Cancelados" value={stats.cancelados} tone="danger" />
      </div>
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
      <PageTitle title="TechPass" subtitle="Crie TechPass com serial único, código físico secreto e QR permanente." />
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
              <p className="mt-2 font-mono text-sm font-bold text-tech-neon">Código físico: {getTechPassSecret(item)}</p>
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

function PartnerCard({ empresa }: { empresa: AppState['empresas'][number] }) {
  return <Card><div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-black text-white">{empresa.nome}</h3><p className="mt-1 text-sm text-tech-neon">{empresa.categoria}</p></div><Pill className={empresa.status === 'ativa' ? 'border-tech-neon/40 bg-tech-neon/10 text-tech-neon' : 'border-red-300/30 bg-red-400/10 text-red-100'}>{empresa.status}</Pill></div><p className="mt-4 text-sm leading-6 text-zinc-300">{empresa.beneficio}</p></Card>;
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
