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
  Film,
  Gift,
  PauseCircle,
  Plus,
  QrCode as QrCodeIcon,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { BENEFICIOS_PADRAO, STATUS_LABEL, STATUS_STYLE } from './data';
import { hasSupabaseConfig } from './lib/supabase';
import {
  formatDate,
  formatMoney,
  getCashbackBalance,
  getClientName,
  getEmpresaName,
  useTechPassStore,
} from './lib/store';
import type { AppState, CashbackTipo, IndicacaoStatus, RecompensaTipo, TechPass, TechPassStatus } from './types';
import { Button, Card, Field, Input, Pill, Select, Stat, Textarea, cx } from './components/ui';
import { QrCode, createQrDataUrl } from './components/QrCode';

type View = 'dashboard' | 'empresas' | 'gerar' | 'exportar' | 'ativar' | 'validar' | 'cashback' | 'indicacoes' | 'clientes';

const NAV_ITEMS: Array<{ id: View; label: string; icon: typeof Activity }> = [
  { id: 'dashboard', label: 'Dashboard', icon: Activity },
  { id: 'empresas', label: 'Empresas', icon: Building2 },
  { id: 'gerar', label: 'Gerar TechPass', icon: CreditCard },
  { id: 'exportar', label: 'Exportar QR Codes', icon: QrCodeIcon },
  { id: 'ativar', label: 'Ativar TechPass', icon: UserCheck },
  { id: 'validar', label: 'Validar TechPass', icon: ShieldCheck },
  { id: 'cashback', label: 'Cashback', icon: Wallet },
  { id: 'indicacoes', label: 'Indicações', icon: Gift },
  { id: 'clientes', label: 'Clientes', icon: Users },
];

function getSerialFromPath(pathname: string) {
  const match = pathname.match(/^/techpass/([^/]+)/);
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
  const [view, setView] = useState<View>('dashboard');
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
    return <PublicTechPassPage serial={publicSerial} state={state} onBack={() => navigate('/')} />;
  }

  return (
    <div className="min-h-screen text-tech-ink">
      <header className="border-b border-white/10 bg-black/55 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg border border-tech-neon/50 bg-tech-neon/10 shadow-neon">
                <BadgeCheck className="h-6 w-6 text-tech-neon" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-tech-neon">TechSoft</p>
                <h1 className="text-2xl font-black tracking-normal text-white">TechPass Premium</h1>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill className={hasSupabaseConfig ? 'border-tech-neon/40 bg-tech-neon/10 text-tech-neon' : 'border-white/15 bg-white/[0.06] text-zinc-200'}>
              {hasSupabaseConfig ? 'Supabase conectado' : 'Modo demo local'}
            </Pill>
            <Button variant="secondary" onClick={actions.resetDemo} title="Restaurar dados de demonstração">
              <RefreshCw className="h-4 w-4" />
              Reset demo
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-max rounded-lg border border-white/10 bg-white/[0.04] p-3 lg:sticky lg:top-4">
          <nav className="grid gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={cx(
                    'flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition',
                    view === item.id ? 'bg-tech-neon text-black' : 'text-zinc-300 hover:bg-white/[0.07] hover:text-white',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main>
          {view === 'dashboard' && <Dashboard state={state} navigatePublic={navigate} />}
          {view === 'empresas' && <EmpresasScreen state={state} actions={actions} />}
          {view === 'gerar' && <GerarTechPassScreen state={state} actions={actions} />}
          {view === 'exportar' && <ExportarQrCodesScreen state={state} navigatePublic={navigate} />}
          {view === 'ativar' && <AtivarTechPassScreen state={state} actions={actions} />}
          {view === 'validar' && <ValidarTechPassScreen state={state} actions={actions} />}
          {view === 'cashback' && <CashbackScreen state={state} actions={actions} />}
          {view === 'indicacoes' && <IndicacoesScreen state={state} actions={actions} />}
          {view === 'clientes' && <ClientesScreen state={state} />}
        </main>
      </div>
    </div>
  );
}

function Dashboard({ state, navigatePublic }: { state: AppState; navigatePublic: (path: string) => void }) {
  const stats = useMemo(() => {
    const totalCashback = state.cashback_movements
      .filter((item) => item.tipo === 'credito')
      .reduce((sum, item) => sum + item.valor, 0);
    return {
      total: state.techpasses.length,
      aguardando: state.techpasses.filter((item) => item.status === 'AGUARDANDO_ATIVACAO').length,
      ativos: state.techpasses.filter((item) => item.status === 'ATIVO').length,
      cancelados: state.techpasses.filter((item) => item.status === 'CANCELADO').length,
      empresas: state.empresas.length,
      clientesAtivos: state.clientes.filter((client) => state.techpasses.some((tp) => tp.cliente_id === client.id && tp.status === 'ATIVO')).length,
      cashback: totalCashback,
      indicacoesPendentes: state.indicacoes.filter((item) => item.status === 'pendente').length,
    };
  }, [state]);

  const recent = state.techpasses.slice(0, 6);

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-semibold text-tech-neon">Painel administrativo TechSoft</p>
        <h2 className="mt-1 text-3xl font-black text-white">Controle completo do clube de benefícios</h2>
      </section>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total de TechPass gerados" value={stats.total} tone="neon" />
        <Stat label="Aguardando ativação" value={stats.aguardando} tone="warn" />
        <Stat label="TechPass ativos" value={stats.ativos} tone="neon" />
        <Stat label="TechPass cancelados" value={stats.cancelados} tone="danger" />
        <Stat label="Empresas parceiras" value={stats.empresas} />
        <Stat label="Clientes ativos" value={stats.clientesAtivos} />
        <Stat label="Cashback concedido" value={formatMoney(stats.cashback)} />
        <Stat label="Indicações pendentes" value={stats.indicacoesPendentes} tone="warn" />
      </div>
      <Card>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-black text-white">TechPass recentes</h3>
            <p className="text-sm text-zinc-400">QR permanente, status dinâmico e ativação apenas presencial.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3">
          {recent.map((item) => (
            <div key={item.id} className="grid gap-3 rounded-lg border border-white/10 bg-black/25 p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
              <div>
                <p className="font-mono text-sm font-bold text-white">{item.serial}</p>
                <p className="text-sm text-zinc-400">{getEmpresaName(state, item.empresa_id)} · {getClientName(state, item.cliente_id)}</p>
              </div>
              <StatusPill status={getEffectiveStatus(item)} />
              <Button variant="secondary" onClick={() => navigatePublic('/techpass/' + item.serial)}>
                <ExternalLink className="h-4 w-4" />
                Página pública
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function EmpresasScreen({ state, actions }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions'] }) {
  const [form, setForm] = useState({ nome: '', responsavel: '', telefone: '', email: '', status: 'ativa' as 'ativa' | 'inativa' });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.nome.trim()) return;
    actions.addEmpresa(form);
    setForm({ nome: '', responsavel: '', telefone: '', email: '', status: 'ativa' });
  };

  return (
    <div className="grid gap-6">
      <PageTitle title="Empresas parceiras" subtitle="Cadastre parceiros e controle a validade dos TechPass vinculados." />
      <Card>
        <form onSubmit={submit} className="grid gap-4 lg:grid-cols-5">
          <Field label="Nome da empresa"><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Super Geeks" /></Field>
          <Field label="Responsável"><Input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} placeholder="Nome do responsável" /></Field>
          <Field label="Telefone"><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-0000" /></Field>
          <Field label="E-mail"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contato@empresa.com" /></Field>
          <div className="grid gap-2">
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'ativa' | 'inativa' })}>
                <option value="ativa">Ativa</option>
                <option value="inativa">Inativa</option>
              </Select>
            </Field>
          </div>
          <div className="lg:col-span-5">
            <Button type="submit"><Plus className="h-4 w-4" />Cadastrar empresa</Button>
          </div>
        </form>
      </Card>
      <div className="grid gap-3">
        {state.empresas.map((empresa) => (
          <Card key={empresa.id} className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-black text-white">{empresa.nome}</h3>
                <Pill className={empresa.status === 'ativa' ? 'border-tech-neon/40 bg-tech-neon/10 text-tech-neon' : 'border-red-300/30 bg-red-400/10 text-red-100'}>{empresa.status}</Pill>
              </div>
              <p className="mt-2 text-sm text-zinc-400">{empresa.responsavel} · {empresa.telefone} · {empresa.email}</p>
              <p className="mt-1 text-xs text-zinc-500">TechPass vinculados: {state.techpasses.filter((item) => item.empresa_id === empresa.id).length}</p>
            </div>
            <Button variant={empresa.status === 'ativa' ? 'danger' : 'secondary'} onClick={() => actions.toggleEmpresaStatus(empresa.id)}>
              {empresa.status === 'ativa' ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {empresa.status === 'ativa' ? 'Inativar e suspender' : 'Reativar empresa'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function GerarTechPassScreen({ state, actions }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions'] }) {
  const firstActiveEmpresa = state.empresas.find((item) => item.status === 'ativa')?.id ?? '';
  const [empresaId, setEmpresaId] = useState(firstActiveEmpresa);
  const [prefix, setPrefix] = useState('TP-SG');
  const [quantity, setQuantity] = useState(10);
  const [message, setMessage] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    actions.generateTechPass(empresaId, prefix, quantity);
    setMessage('Lote gerado com sucesso. Os QR Codes já apontam para /techpass/{serial}.');
  };

  return (
    <div className="grid gap-6">
      <PageTitle title="Gerar TechPass em lote" subtitle="Crie seriais únicos e QR Codes permanentes vinculados a uma empresa parceira." />
      <Card>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
          <Field label="Empresa parceira">
            <Select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)}>
              {state.empresas.filter((item) => item.status === 'ativa').map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome}</option>)}
            </Select>
          </Field>
          <Field label="Prefixo do serial"><Input value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} placeholder="TP-SG" /></Field>
          <Field label="Quantidade"><Input type="number" min={1} max={500} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} /></Field>
          <div className="md:col-span-3">
            <Button type="submit" disabled={!empresaId || quantity < 1}><CreditCard className="h-4 w-4" />Gerar lote</Button>
            {message && <p className="mt-3 text-sm text-tech-neon">{message}</p>}
          </div>
        </form>
      </Card>
      <Card>
        <h3 className="text-lg font-black text-white">Últimos TechPass gerados</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {state.techpasses.slice(0, 9).map((item) => (
            <div key={item.id} className="rounded-lg border border-white/10 bg-black/25 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-black text-white">{item.serial}</p>
                  <p className="mt-1 text-xs text-zinc-400">{getEmpresaName(state, item.empresa_id)}</p>
                </div>
                <QrCode serial={item.serial} size={76} />
              </div>
              <div className="mt-3"><StatusPill status={getEffectiveStatus(item)} /></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ExportarQrCodesScreen({ state, navigatePublic }: { state: AppState; navigatePublic: (path: string) => void }) {
  const [query, setQuery] = useState('');
  const filtered = state.techpasses.filter((item) => {
    const haystack = [item.serial, getEmpresaName(state, item.empresa_id), item.status].join(' ').toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  const copySerial = async (serial: string) => {
    await navigator.clipboard.writeText(serial);
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
      <PageTitle title="Exportar QR Codes" subtitle="Baixe o PNG do QR Code, copie o serial ou abra a página pública." />
      <Card>
        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/35 px-3">
          <Search className="h-4 w-4 text-zinc-500" />
          <input className="min-h-11 flex-1 bg-transparent text-white outline-none placeholder:text-zinc-500" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar por serial, empresa ou status" />
        </div>
      </Card>
      <div className="grid gap-3">
        {filtered.map((item) => (
          <Card key={item.id} className="grid gap-4 xl:grid-cols-[110px_1fr_auto] xl:items-center">
            <QrCode serial={item.serial} size={96} />
            <div>
              <p className="font-mono text-base font-black text-white">{item.serial}</p>
              <p className="mt-1 text-sm text-zinc-400">{getEmpresaName(state, item.empresa_id)}</p>
              <div className="mt-3"><StatusPill status={getEffectiveStatus(item)} /></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => downloadQr(item.serial)}><Download className="h-4 w-4" />PNG</Button>
              <Button variant="secondary" onClick={() => copySerial(item.serial)}><Copy className="h-4 w-4" />Copiar serial</Button>
              <Button onClick={() => navigatePublic('/techpass/' + item.serial)}><ExternalLink className="h-4 w-4" />Abrir página</Button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <EmptyMessage title="Nenhum QR Code encontrado" description="Ajuste a busca ou gere um novo lote de TechPass." />}
      </div>
    </div>
  );
}

function AtivarTechPassScreen({ state, actions }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions'] }) {
  const [query, setQuery] = useState('');
  const [selectedSerial, setSelectedSerial] = useState('');
  const [form, setForm] = useState({ nome: '', cpf: '', telefone: '', email: '' });
  const [message, setMessage] = useState('');
  const waiting = state.techpasses.filter((item) => item.status === 'AGUARDANDO_ATIVACAO');
  const results = waiting.filter((item) => {
    const haystack = [item.serial, item.qr_code_url, getEmpresaName(state, item.empresa_id)].join(' ').toLowerCase();
    return haystack.includes(query.toLowerCase());
  });
  const selected = state.techpasses.find((item) => item.serial === selectedSerial) ?? null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    const result = actions.activateTechPass(selected.serial, form);
    setMessage(result.message);
    if (result.ok) {
      setForm({ nome: '', cpf: '', telefone: '', email: '' });
      setSelectedSerial('');
      setQuery('');
    }
  };

  return (
    <div className="grid gap-6">
      <PageTitle title="Ativar TechPass" subtitle="Ativação presencial feita exclusivamente por funcionário TechSoft." />
      <Card>
        <div className="rounded-lg border border-tech-neon/30 bg-tech-neon/10 p-4 text-sm text-white">
          <strong className="text-tech-neon">Regra obrigatória:</strong> confirme o documento oficial com foto antes de ativar este TechPass.
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-md border border-white/10 bg-black/35 px-3">
          <Search className="h-4 w-4 text-zinc-500" />
          <input className="min-h-11 flex-1 bg-transparent text-white outline-none placeholder:text-zinc-500" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar por número de série, QR Code ou empresa parceira" />
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {results.slice(0, 9).map((item) => (
            <button key={item.id} onClick={() => setSelectedSerial(item.serial)} className={cx('rounded-lg border p-4 text-left transition', selectedSerial === item.serial ? 'border-tech-neon bg-tech-neon/10' : 'border-white/10 bg-black/25 hover:border-tech-neon/50')}>
              <p className="font-mono text-sm font-black text-white">{item.serial}</p>
              <p className="mt-1 text-sm text-zinc-400">{getEmpresaName(state, item.empresa_id)}</p>
            </button>
          ))}
        </div>
      </Card>
      <Card>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <h3 className="text-lg font-black text-white">Dados do cliente</h3>
            {selected ? <p className="mt-1 text-sm text-zinc-400">Ativando {selected.serial} · {getEmpresaName(state, selected.empresa_id)}</p> : <p className="mt-1 text-sm text-zinc-400">Selecione um TechPass aguardando ativação.</p>}
          </div>
          <Field label="Nome completo"><Input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></Field>
          <Field label="CPF"><Input required value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" /></Field>
          <Field label="Telefone"><Input required value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></Field>
          <Field label="E-mail"><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <div className="md:col-span-2">
            <Button type="submit" disabled={!selected}><UserCheck className="h-4 w-4" />Confirmar ativação presencial</Button>
            {message && <p className="mt-3 text-sm text-zinc-200">{message}</p>}
          </div>
        </form>
      </Card>
    </div>
  );
}

function ValidarTechPassScreen({ state, actions }: { state: AppState; actions: ReturnType<typeof useTechPassStore>['actions'] }) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(state.techpasses.find((item) => item.status === 'ATIVO')?.id ?? '');
  const [obs, setObs] = useState('Atendimento validado no balcão TechSoft.');
  const [cashValue, setCashValue] = useState(25);
  const [cashDesc, setCashDesc] = useState('Movimentação registrada no atendimento.');
  const [feedback, setFeedback] = useState('');

  const results = state.techpasses.filter((item) => {
    const client = state.clientes.find((cliente) => cliente.id === item.cliente_id);
    const haystack = [item.serial, client?.nome ?? '', client?.cpf ?? ''].join(' ').toLowerCase();
    return haystack.includes(query.toLowerCase());
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
        <div className="rounded-lg border border-tech-neon/30 bg-tech-neon/10 p-4 text-sm text-white">
          <strong className="text-tech-neon">Solicitar documento oficial com foto antes da liberação dos benefícios.</strong>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-md border border-white/10 bg-black/35 px-3">
          <Search className="h-4 w-4 text-zinc-500" />
          <input className="min-h-11 flex-1 bg-transparent text-white outline-none placeholder:text-zinc-500" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar por número de série, nome do cliente ou CPF" />
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {results.slice(0, 9).map((item) => (
            <button key={item.id} onClick={() => setSelectedId(item.id)} className={cx('rounded-lg border p-4 text-left transition', selected?.id === item.id ? 'border-tech-neon bg-tech-neon/10' : 'border-white/10 bg-black/25 hover:border-tech-neon/50')}>
              <p className="font-mono text-sm font-black text-white">{item.serial}</p>
              <p className="mt-1 text-sm text-zinc-400">{getClientName(state, item.cliente_id)}</p>
            </button>
          ))}
        </div>
      </Card>
      {selected ? (
        <Card>
          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-2xl font-black text-white">{cliente?.nome ?? 'Cliente não vinculado'}</h3>
                <StatusPill status={getEffectiveStatus(selected)} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Info label="CPF" value={cliente?.cpf ?? 'Não vinculado'} />
                <Info label="Empresa parceira" value={getEmpresaName(state, selected.empresa_id)} />
                <Info label="Validade" value={formatDate(selected.expires_at)} />
                <Info label="Cashback disponível" value={formatMoney(getCashbackBalance(state, selected.id))} />
                <Info label="Trocas de película restantes" value={String(selected.peliculas_restantes)} />
                <Info label="Código de indicação" value={cliente?.codigo_indicacao ?? 'Não gerado'} />
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <h4 className="font-black text-white">Ações rápidas</h4>
              <div className="mt-4 grid gap-3">
                <Field label="Observação"><Textarea value={obs} onChange={(e) => setObs(e.target.value)} /></Field>
                <Button variant="secondary" onClick={registerFilm}><Film className="h-4 w-4" />Registrar troca de película</Button>
                <Button variant="secondary" onClick={() => actions.registerUso(selected.id, 'Uso de benefício', obs)}><BadgeCheck className="h-4 w-4" />Registrar uso de benefício</Button>
                <div className="grid gap-2 sm:grid-cols-[120px_1fr]">
                  <Input type="number" min={0} step="0.01" value={cashValue} onChange={(e) => setCashValue(Number(e.target.value))} />
                  <Input value={cashDesc} onChange={(e) => setCashDesc(e.target.value)} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => addCash('credito')}><Plus className="h-4 w-4" />Adicionar cashback</Button>
                  <Button variant="secondary" onClick={() => addCash('debito')}><Wallet className="h-4 w-4" />Usar cashback</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => actions.setTechPassStatus(selected.id, 'SUSPENSO')}><PauseCircle className="h-4 w-4" />Suspender</Button>
                  <Button variant="danger" onClick={() => actions.setTechPassStatus(selected.id, 'CANCELADO')}><Ban className="h-4 w-4" />Cancelar</Button>
                </div>
                {feedback && <p className="text-sm text-tech-neon">{feedback}</p>}
              </div>
            </div>
          </div>
        </Card>
      ) : <EmptyMessage title="Nenhum TechPass localizado" description="Faça uma busca por serial, nome ou CPF." />}
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
      <PageTitle title="Cashback" subtitle="Adicione créditos, registre débitos e acompanhe o histórico simples." />
      <Card>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Cliente TechPass">
            <Select value={techpassId} onChange={(e) => setTechpassId(e.target.value)}>
              {activePasses.map((item) => <option key={item.id} value={item.id}>{getClientName(state, item.cliente_id)} · {item.serial}</option>)}
            </Select>
          </Field>
          <Field label="Tipo">
            <Select value={tipo} onChange={(e) => setTipo(e.target.value as CashbackTipo)}>
              <option value="credito">Crédito</option>
              <option value="debito">Débito</option>
            </Select>
          </Field>
          <Field label="Valor"><Input type="number" min={0} step="0.01" value={valor} onChange={(e) => setValor(Number(e.target.value))} /></Field>
          <Field label="Descrição"><Input value={descricao} onChange={(e) => setDescricao(e.target.value)} /></Field>
          <div className="md:col-span-2 xl:col-span-4">
            <Button type="submit" disabled={!selected}><Wallet className="h-4 w-4" />Registrar movimentação</Button>
            {selected && <p className="mt-3 text-sm text-zinc-400">Saldo atual: {formatMoney(getCashbackBalance(state, selected.id))}</p>}
            {message && <p className="mt-2 text-sm text-tech-neon">{message}</p>}
          </div>
        </form>
      </Card>
      <HistoryList state={state} />
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
      <Card>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Cliente indicador">
            <Select value={form.cliente_indicador_id} onChange={(e) => setForm({ ...form, cliente_indicador_id: e.target.value })}>
              {activeClients.map((client) => <option key={client.id} value={client.id}>{client.nome} · {client.codigo_indicacao}</option>)}
            </Select>
          </Field>
          <Field label="Nome do indicado"><Input value={form.nome_indicado} onChange={(e) => setForm({ ...form, nome_indicado: e.target.value })} required /></Field>
          <Field label="Telefone do indicado"><Input value={form.telefone_indicado} onChange={(e) => setForm({ ...form, telefone_indicado: e.target.value })} required /></Field>
          <Field label="Valor do serviço ou compra"><Input type="number" min={0} step="0.01" value={form.valor_servico} onChange={(e) => setForm({ ...form, valor_servico: Number(e.target.value) })} /></Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as IndicacaoStatus })}>
              <option value="pendente">Pendente</option>
              <option value="aprovado">Aprovado</option>
              <option value="recusado">Recusado</option>
            </Select>
          </Field>
          <Field label="Recompensa">
            <Select value={form.recompensa} onChange={(e) => setForm({ ...form, recompensa: e.target.value as RecompensaTipo })}>
              <option value="desconto">Desconto</option>
              <option value="cashback">Cashback</option>
              <option value="brinde">Brinde</option>
            </Select>
          </Field>
          <div className="md:col-span-2 xl:col-span-3">
            <Field label="Observação"><Textarea value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} /></Field>
          </div>
          <div className="md:col-span-2 xl:col-span-3">
            <Button type="submit"><Gift className="h-4 w-4" />Registrar indicação</Button>
            {message && <p className="mt-3 text-sm text-zinc-200">{message}</p>}
          </div>
        </form>
      </Card>
      <Card>
        <h3 className="text-lg font-black text-white">Histórico de indicações</h3>
        <div className="mt-4 grid gap-3">
          {state.indicacoes.map((item) => (
            <div key={item.id} className="rounded-lg border border-white/10 bg-black/25 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-white">{item.nome_indicado}</p>
                  <p className="text-sm text-zinc-400">Indicador: {state.clientes.find((client) => client.id === item.cliente_indicador_id)?.nome ?? 'Cliente'}</p>
                </div>
                <Pill className="border-white/15 bg-white/[0.06] text-zinc-200">{item.status}</Pill>
              </div>
              <p className="mt-2 text-sm text-zinc-400">{formatMoney(item.valor_servico)} · recompensa: {item.recompensa} · {item.observacao}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ClientesScreen({ state }: { state: AppState }) {
  return (
    <div className="grid gap-6">
      <PageTitle title="Clientes" subtitle="Clientes vinculados por ativação presencial." />
      <div className="grid gap-3">
        {state.clientes.map((client) => {
          const techpass = state.techpasses.find((item) => item.cliente_id === client.id && item.status === 'ATIVO') ?? state.techpasses.find((item) => item.cliente_id === client.id);
          return (
            <Card key={client.id} className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h3 className="text-xl font-black text-white">{client.nome}</h3>
                <p className="mt-1 text-sm text-zinc-400">CPF {client.cpf} · {client.telefone} · {client.email}</p>
                <p className="mt-1 text-sm text-zinc-400">Código de indicação: <span className="font-mono text-tech-neon">{client.codigo_indicacao}</span></p>
              </div>
              {techpass ? <StatusPill status={getEffectiveStatus(techpass)} /> : <Pill className="border-white/15 bg-white/[0.06] text-zinc-200">sem techpass</Pill>}
            </Card>
          );
        })}
        {state.clientes.length === 0 && <EmptyMessage title="Nenhum cliente ativo" description="Os clientes aparecem após a ativação presencial de um TechPass." />}
      </div>
    </div>
  );
}

function PublicTechPassPage({ serial, state }: { serial: string; state: AppState; onBack: () => void }) {
  const techpass = state.techpasses.find((item) => item.serial.toLowerCase() === serial.toLowerCase());
  if (!techpass) {
    return <PublicShell><StatusPublic title="TECHPASS NÃO ENCONTRADO" tone="danger" /></PublicShell>;
  }
  const status = getEffectiveStatus(techpass);
  const empresa = state.empresas.find((item) => item.id === techpass.empresa_id);
  const cliente = state.clientes.find((item) => item.id === techpass.cliente_id);
  const balance = getCashbackBalance(state, techpass.id);

  return (
    <PublicShell>
      {status === 'AGUARDANDO_ATIVACAO' && (
        <Card className="mx-auto max-w-3xl p-6 sm:p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_150px] md:items-start">
            <div>
              <StatusPill status={status} />
              <h1 className="mt-5 text-3xl font-black text-white sm:text-5xl">Parabéns! Você recebeu um TechPass Premium.</h1>
              <p className="mt-4 text-xl font-semibold text-tech-neon">Seu benefício já é seu. Falta apenas ativá-lo presencialmente na TechSoft.</p>
              <p className="mt-4 text-zinc-300">Para liberar suas vantagens, compareça à loja TechSoft com seu TechPass e um documento oficial com foto.</p>
            </div>
            <QrCode serial={techpass.serial} size={150} />
          </div>
          <BenefitsList />
        </Card>
      )}
      {status === 'ATIVO' && (
        <Card className="mx-auto max-w-4xl p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_180px] lg:items-start">
            <div>
              <StatusPill status={status} />
              <h1 className="mt-5 text-3xl font-black text-white sm:text-5xl">{cliente?.nome}</h1>
              <p className="mt-3 text-zinc-300">Apresente documento oficial com foto para utilizar os benefícios.</p>
            </div>
            <QrCode serial={techpass.serial} size={170} />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Info label="Empresa parceira" value={empresa?.nome ?? 'Empresa'} />
            <Info label="Número do TechPass" value={techpass.serial} />
            <Info label="Validade" value={formatDate(techpass.expires_at)} />
            <Info label="Saldo de cashback" value={formatMoney(balance)} />
            <Info label="Código de indicação" value={cliente?.codigo_indicacao ?? 'Não gerado'} />
            <Info label="Trocas de película restantes" value={String(techpass.peliculas_restantes)} />
          </div>
          <BenefitsList />
        </Card>
      )}
      {status === 'SUSPENSO' && <StatusPublic title="TECHPASS SUSPENSO" description="Este benefício está temporariamente indisponível." tone="warn" />}
      {status === 'CANCELADO' && <StatusPublic title="TECHPASS CANCELADO" description="Os benefícios deste TechPass não estão mais disponíveis." tone="danger" />}
      {status === 'EXPIRADO' && <StatusPublic title="TECHPASS EXPIRADO" description="Este benefício encerrou sua validade." tone="neutral" />}
    </PublicShell>
  );
}

function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen px-4 py-6 text-tech-ink sm:px-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg border border-tech-neon/50 bg-tech-neon/10"><BadgeCheck className="h-5 w-5 text-tech-neon" /></div>
          <div>
            <p className="text-xs font-bold uppercase text-tech-neon">TechSoft</p>
            <p className="font-black text-white">TechPass Premium</p>
          </div>
        </div>
      </div>
      <main className="mx-auto mt-8 max-w-5xl">{children}</main>
    </div>
  );
}

function StatusPublic({ title, description, tone }: { title: string; description?: string; tone: 'warn' | 'danger' | 'neutral' }) {
  const toneClass = tone === 'warn' ? 'text-yellow-200' : tone === 'danger' ? 'text-red-200' : 'text-zinc-100';
  return (
    <Card className="mx-auto max-w-2xl p-8 text-center">
      <h1 className={cx('text-3xl font-black sm:text-5xl', toneClass)}>{title}</h1>
      {description && <p className="mt-4 text-lg text-zinc-300">{description}</p>}
    </Card>
  );
}

function BenefitsList() {
  return (
    <div className="mt-8">
      <h2 className="text-lg font-black text-white">Benefícios disponíveis</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {BENEFICIOS_PADRAO.map((benefit) => (
          <div key={benefit} className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/25 p-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-tech-neon" />
            <span className="text-sm text-zinc-200">{benefit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section>
      <h2 className="text-2xl font-black text-white sm:text-3xl">{title}</h2>
      <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-4">
      <p className="text-xs font-semibold uppercase text-zinc-500">{label}</p>
      <p className="mt-1 break-words font-semibold text-white">{value}</p>
    </div>
  );
}

function HistoryList({ state }: { state: AppState }) {
  return (
    <Card>
      <h3 className="text-lg font-black text-white">Histórico de cashback</h3>
      <div className="mt-4 grid gap-3">
        {state.cashback_movements.map((item) => (
          <div key={item.id} className="grid gap-2 rounded-lg border border-white/10 bg-black/25 p-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="font-bold text-white">{getClientName(state, item.cliente_id)}</p>
              <p className="text-sm text-zinc-400">{item.descricao} · {formatDate(item.created_at)}</p>
            </div>
            <p className={cx('font-black', item.tipo === 'credito' ? 'text-tech-neon' : 'text-red-200')}>
              {item.tipo === 'credito' ? '+' : '-'} {formatMoney(item.valor)}
            </p>
          </div>
        ))}
        {state.cashback_movements.length === 0 && <EmptyMessage title="Sem movimentações" description="As movimentações de cashback aparecerão aqui." />}
      </div>
    </Card>
  );
}

export default App;
