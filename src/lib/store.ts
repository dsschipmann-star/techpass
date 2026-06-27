import { useEffect, useMemo, useState } from 'react';
import { createInitialState } from '../data';
import { hasSupabaseConfig, supabase } from './supabase';
import type { AppState, BeneficioServico, CashbackBalance, CashbackMovement, CashbackSetting, CashbackTransaction, Cliente, Empresa, Indicacao, IndicacaoFightCore, IndicacaoTechSoft, LeadParceiro, NotificationItem, OfertaParceiro, ParceiroUsuario, PendingActivation, Solicitacao, SystemLog, TechPass, TechPassStatus, TipoUsuario, Utilizacao } from '../types';

const STORAGE_KEY = 'techpass-premium-state-v2';

function safeParse(value: string | null): AppState | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as AppState;
    if (!parsed.pending_activations) return null;
    return {
      ...parsed,
      parceiro_usuarios: parsed.parceiro_usuarios ?? createInitialState().parceiro_usuarios,
      cashback_settings: parsed.cashback_settings ?? createInitialState().cashback_settings,
      cashback_balances: parsed.cashback_balances ?? createInitialState().cashback_balances,
      cashback_transactions: parsed.cashback_transactions ?? createInitialState().cashback_transactions,
      beneficios_servicos: parsed.beneficios_servicos ?? createInitialState().beneficios_servicos,
      solicitacoes: parsed.solicitacoes ?? createInitialState().solicitacoes,
      ofertas: (parsed.ofertas ?? createInitialState().ofertas).map(normalizeOferta),
      leads: parsed.leads ?? [],
      fight_core_indicacoes: parsed.fight_core_indicacoes ?? [],
      techsoft_indicacoes: parsed.techsoft_indicacoes ?? [],
      notifications: parsed.notifications ?? createInitialState().notifications,
      system_logs: parsed.system_logs ?? createInitialState().system_logs,
      utilizacoes: (parsed.utilizacoes ?? []).map((item: any) => ({
        empresa_id: item.empresa_id ?? parsed.techpasses?.find((tp) => tp.id === item.techpass_id)?.empresa_id ?? 'emp-techsoft',
        solicitacao_id: item.solicitacao_id ?? null,
        status: item.status ?? 'concluida',
        funcionario_responsavel: item.funcionario_responsavel ?? 'Atendimento TechSoft',
        completed_at: item.completed_at ?? item.created_at ?? null,
        ...item,
      })),
    };
  } catch {
    return null;
  }
}

export function makeId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return prefix + '-' + crypto.randomUUID();
  }
  return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function cleanCpf(cpf: string) {
  return cpf.replace(/\D/g, '');
}

export function normalizeSecretCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

export function getTechPassSecret(techpass: Pick<TechPass, 'serial'> & Partial<Pick<TechPass, 'codigo_fisico'>>) {
  if (techpass.codigo_fisico) return techpass.codigo_fisico;
  const cleanSerial = techpass.serial.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  return cleanSerial.slice(-8).replace(/^(.{2})/, '$1-');
}

function createSecretCode(serial: string) {
  const base = serial.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return (base.slice(0, 2) || 'TP') + '-' + random;
}

export function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(value: string | null | undefined) {
  if (!value) return 'Não definido';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Não definido';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

export function addMonths(date: Date, months: number) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

function normalizeOferta(oferta: any): OfertaParceiro {
  return {
    cashback_ativo: false,
    cashback_tipo: 'sem_cashback',
    cashback_valor: null,
    cashback_limite: null,
    cashback_regras: '',
    cashback_descricao_cliente: '',
    ...oferta,
  };
}

async function loadSupabaseState(): Promise<AppState | null> {
  if (!supabase) return null;
  const [empresas, parceiroUsuarios, clientes, techpass, pending, cashback, cashbackSettings, cashbackBalances, cashbackTransactions, indicacoes, utilizacoes, beneficiosServicos, solicitacoes, ofertas, leads, fightCoreIndicacoes, techSoftIndicacoes, notifications, systemLogs] = await Promise.all([
    supabase.from('empresas').select('*').order('created_at', { ascending: false }),
    supabase.from('parceiro_usuarios').select('*').order('created_at', { ascending: false }),
    supabase.from('clientes').select('*').order('created_at', { ascending: false }),
    supabase.from('techpass').select('*').order('created_at', { ascending: false }),
    supabase.from('pending_activations').select('*').order('created_at', { ascending: false }),
    supabase.from('cashback_movements').select('*').order('created_at', { ascending: false }),
    supabase.from('cashback_settings').select('*').order('created_at', { ascending: false }),
    supabase.from('cashback_balances').select('*').order('updated_at', { ascending: false }),
    supabase.from('cashback_transactions').select('*').order('created_at', { ascending: false }),
    supabase.from('indicacoes').select('*').order('created_at', { ascending: false }),
    supabase.from('utilizacoes').select('*').order('created_at', { ascending: false }),
    supabase.from('beneficios_servicos').select('*').order('created_at', { ascending: false }),
    supabase.from('solicitacoes').select('*').order('data_solicitacao', { ascending: false }),
    supabase.from('ofertas').select('*').order('created_at', { ascending: false }),
    supabase.from('leads').select('*').order('created_at', { ascending: false }),
    supabase.from('fight_core_indicacoes').select('*').order('created_at', { ascending: false }),
    supabase.from('techsoft_indicacoes').select('*').order('created_at', { ascending: false }),
    supabase.from('notifications').select('*').order('created_at', { ascending: false }),
    supabase.from('system_logs').select('*').order('created_at', { ascending: false }),
  ]);
  const error = empresas.error ?? parceiroUsuarios.error ?? clientes.error ?? techpass.error ?? pending.error ?? cashback.error ?? cashbackSettings.error ?? cashbackBalances.error ?? cashbackTransactions.error ?? indicacoes.error ?? utilizacoes.error ?? beneficiosServicos.error ?? solicitacoes.error ?? ofertas.error ?? leads.error ?? fightCoreIndicacoes.error ?? techSoftIndicacoes.error ?? notifications.error ?? systemLogs.error;
  if (error) throw error;
  return {
    empresas: empresas.data ?? [],
    parceiro_usuarios: parceiroUsuarios.data ?? [],
    clientes: clientes.data ?? [],
    techpasses: techpass.data ?? [],
    pending_activations: pending.data ?? [],
    cashback_movements: cashback.data ?? [],
    cashback_settings: cashbackSettings.data ?? [],
    cashback_balances: cashbackBalances.data ?? [],
    cashback_transactions: cashbackTransactions.data ?? [],
    indicacoes: indicacoes.data ?? [],
    utilizacoes: utilizacoes.data ?? [],
    beneficios_servicos: beneficiosServicos.data ?? [],
    solicitacoes: solicitacoes.data ?? [],
    ofertas: (ofertas.data ?? []).map(normalizeOferta),
    leads: leads.data ?? [],
    fight_core_indicacoes: fightCoreIndicacoes.data ?? [],
    techsoft_indicacoes: techSoftIndicacoes.data ?? [],
    notifications: notifications.data ?? [],
    system_logs: systemLogs.data ?? [],
  };
}

async function syncSupabaseState(state: AppState) {
  if (!supabase) return;
  const tasks = [
    state.empresas.length ? supabase.from('empresas').upsert(state.empresas as any) : null,
    state.parceiro_usuarios.length ? supabase.from('parceiro_usuarios').upsert(state.parceiro_usuarios as any) : null,
    state.clientes.length ? supabase.from('clientes').upsert(state.clientes as any) : null,
    state.techpasses.length ? supabase.from('techpass').upsert(state.techpasses as any) : null,
    state.pending_activations.length ? supabase.from('pending_activations').upsert(state.pending_activations as any) : null,
    state.cashback_movements.length ? supabase.from('cashback_movements').upsert(state.cashback_movements as any) : null,
    state.cashback_settings.length ? supabase.from('cashback_settings').upsert(state.cashback_settings as any) : null,
    state.cashback_balances.length ? supabase.from('cashback_balances').upsert(state.cashback_balances as any) : null,
    state.cashback_transactions.length ? supabase.from('cashback_transactions').upsert(state.cashback_transactions as any) : null,
    state.indicacoes.length ? supabase.from('indicacoes').upsert(state.indicacoes as any) : null,
    state.utilizacoes.length ? supabase.from('utilizacoes').upsert(state.utilizacoes as any) : null,
    state.beneficios_servicos.length ? supabase.from('beneficios_servicos').upsert(state.beneficios_servicos as any) : null,
    state.solicitacoes.length ? supabase.from('solicitacoes').upsert(state.solicitacoes as any) : null,
    state.ofertas.length ? supabase.from('ofertas').upsert(state.ofertas as any) : null,
    state.leads.length ? supabase.from('leads').upsert(state.leads as any) : null,
    state.fight_core_indicacoes.length ? supabase.from('fight_core_indicacoes').upsert(state.fight_core_indicacoes as any) : null,
    state.techsoft_indicacoes.length ? supabase.from('techsoft_indicacoes').upsert(state.techsoft_indicacoes as any) : null,
    state.notifications.length ? supabase.from('notifications').upsert(state.notifications as any) : null,
    state.system_logs.length ? supabase.from('system_logs').upsert(state.system_logs as any) : null,
  ].filter(Boolean);
  const results = await Promise.all(tasks);
  const failed = results.find((result: any) => result.error);
  if (failed) throw failed.error;
}

function calculateOfferCashback(oferta: OfertaParceiro | undefined, settings: CashbackSetting | undefined, valorCompra: number) {
  if (!oferta?.cashback_ativo || oferta.cashback_tipo === 'sem_cashback') return 0;
  if (settings && (!settings.ativo || valorCompra < settings.valor_minimo)) return 0;
  let value = 0;
  if (oferta.cashback_tipo === 'valor_fixo' || oferta.cashback_tipo === 'mensalidade') value = oferta.cashback_valor ?? 0;
  if (oferta.cashback_tipo === 'percentual') value = valorCompra * ((oferta.cashback_valor ?? 0) / 100);
  if (oferta.cashback_tipo === 'proporcional') value = oferta.cashback_valor ?? Math.max(valorCompra / 12, 0);
  const offerLimit = oferta.cashback_limite ?? Number.POSITIVE_INFINITY;
  const companyLimit = settings?.limite_maximo ?? Number.POSITIVE_INFINITY;
  return Math.max(0, Math.min(value, offerLimit, companyLimit));
}

function upsertBalance(balances: CashbackBalance[], payload: { cliente_id: string; empresa_id: string; limite_maximo: number; pendingDelta?: number; availableDelta?: number }) {
  const existing = balances.find((item) => item.cliente_id === payload.cliente_id && item.empresa_id === payload.empresa_id);
  const now = new Date().toISOString();
  if (!existing) {
    return [{
      id: makeId('cashbal'),
      cliente_id: payload.cliente_id,
      empresa_id: payload.empresa_id,
      saldo_disponivel: Math.max(0, payload.availableDelta ?? 0),
      saldo_pendente: Math.max(0, payload.pendingDelta ?? 0),
      limite_maximo: payload.limite_maximo,
      updated_at: now,
    }, ...balances];
  }
  return balances.map((item) => item.id === existing.id ? {
    ...item,
    saldo_disponivel: Math.max(0, Math.min(payload.limite_maximo, item.saldo_disponivel + (payload.availableDelta ?? 0))),
    saldo_pendente: Math.max(0, Math.min(payload.limite_maximo, item.saldo_pendente + (payload.pendingDelta ?? 0))),
    limite_maximo: payload.limite_maximo,
    updated_at: now,
  } : item);
}

export function useTechPassStore() {
  const [state, setState] = useState<AppState>(() => safeParse(localStorage.getItem(STORAGE_KEY)) ?? createInitialState());
  const [remoteReady, setRemoteReady] = useState(!hasSupabaseConfig);

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    let active = true;
    loadSupabaseState()
      .then((remoteState) => {
        if (active && remoteState) setState(remoteState);
      })
      .catch((error) => console.warn('Falha ao carregar Supabase, usando dados locais.', error))
      .finally(() => {
        if (active) setRemoteReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (!remoteReady || !hasSupabaseConfig) return;
    const timer = window.setTimeout(() => {
      syncSupabaseState(state).catch((error) => console.warn('Falha ao sincronizar Supabase.', error));
    }, 450);
    return () => window.clearTimeout(timer);
  }, [state, remoteReady]);

  const actions = useMemo(() => ({
    resetDemo() {
      setState(createInitialState());
    },
    addEmpresa(payload: Omit<Empresa, 'id' | 'created_at'>) {
      setState((current) => ({
        ...current,
        empresas: [{ ...payload, id: makeId('emp'), created_at: new Date().toISOString() }, ...current.empresas],
      }));
    },
    updateEmpresa(id: string, payload: Partial<Omit<Empresa, 'id' | 'created_at'>>) {
      setState((current) => ({
        ...current,
        empresas: current.empresas.map((item) => item.id === id ? { ...item, ...payload } : item),
      }));
    },
    findParceiroAccess(email: string, senha: string) {
      return state.parceiro_usuarios.find((item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.senha === senha) ?? null;
    },
    findActiveClientAccess(payload: { cpf: string; telefone: string; codigo: string }) {
      const cpf = cleanCpf(payload.cpf);
      const telefone = payload.telefone.replace(/\D/g, '');
      const codigo = payload.codigo.trim().toLowerCase();
      const activePass = state.techpasses.find((techpass) => {
        if (techpass.status !== 'ATIVO' || !techpass.cliente_id) return false;
        const cliente = state.clientes.find((item) => item.id === techpass.cliente_id);
        if (!cliente) return false;
        const byCpf = cpf && cleanCpf(cliente.cpf) === cpf;
        const byPhone = telefone && cliente.telefone.replace(/\D/g, '').includes(telefone);
        const byCode = codigo && [techpass.serial, techpass.codigo_fisico, techpass.codigo_indicacao ?? '', cliente.codigo_indicacao].some((value) => value.toLowerCase() === codigo);
        return byCpf || byPhone || byCode;
      });
      return activePass?.cliente_id ?? '';
    },
    toggleEmpresaStatus(id: string) {
      setState((current) => {
        const empresa = current.empresas.find((item) => item.id === id);
        const nextStatus = empresa?.status === 'ativa' ? 'inativa' : 'ativa';
        return {
          ...current,
          empresas: current.empresas.map((item) => item.id === id ? { ...item, status: nextStatus } : item),
          techpasses: nextStatus === 'inativa'
            ? current.techpasses.map((item) => item.empresa_id === id && item.status !== 'CANCELADO' ? { ...item, status: 'CANCELADO' } : item)
            : current.techpasses,
        };
      });
    },
    generateTechPass(empresaId: string, prefix: string, quantity: number) {
      const normalizedPrefix = prefix.trim().toUpperCase();
      if (!empresaId || !normalizedPrefix || quantity < 1) return [] as TechPass[];
      const created: TechPass[] = [];
      setState((current) => {
        const maxExisting = current.techpasses
          .filter((item) => item.serial.startsWith(normalizedPrefix + '-'))
          .map((item) => {
            const parts = item.serial.split('-');
            return Number(parts[parts.length - 1] ?? '0');
          })
          .filter(Number.isFinite)
          .reduce((max, item) => Math.max(max, item), 0);
        const now = new Date().toISOString();
        for (let index = 1; index <= quantity; index += 1) {
          const serial = normalizedPrefix + '-' + String(maxExisting + index).padStart(6, '0');
          created.push({
            id: makeId('tp'),
            serial,
            empresa_id: empresaId,
            cliente_id: null,
            status: 'DISPONIVEL',
            qr_code_url: '/techpass/' + serial,
            codigo_fisico: createSecretCode(serial),
            codigo_usado: false,
            activated_at: null,
            expires_at: null,
            peliculas_restantes: 6,
            cashback_saldo: 0,
            codigo_indicacao: null,
            created_at: now,
          });
        }
        return { ...current, techpasses: [...created, ...current.techpasses] };
      });
      return created;
    },
    requestActivation(serial: string, codigoInformado: string, clientPayload: Omit<Cliente, 'id' | 'created_at' | 'codigo_indicacao'>) {
      let result: { ok: boolean; message: string } = { ok: false, message: 'TechPass não encontrado.' };
      setState((current) => {
        const techpass = current.techpasses.find((item) => item.serial.toLowerCase() === serial.toLowerCase());
        if (!techpass) {
          result = { ok: false, message: 'TechPass não encontrado.' };
          return current;
        }
        if (techpass.status !== 'DISPONIVEL' || techpass.codigo_usado) {
          result = { ok: false, message: 'Este TechPass não está disponível para cadastro.' };
          return current;
        }
        if (normalizeSecretCode(codigoInformado) !== normalizeSecretCode(techpass.codigo_fisico)) {
          result = { ok: false, message: 'Código secreto do voucher inválido.' };
          return current;
        }
        const cpf = cleanCpf(clientPayload.cpf);
        const existingClient = current.clientes.find((item) => cleanCpf(item.cpf) === cpf);
        const hasDuplicate = existingClient
          ? current.techpasses.some((item) => item.cliente_id === existingClient.id && (item.status === 'ATIVO' || item.status === 'PENDENTE_ATIVACAO'))
          : false;
        if (hasDuplicate) {
          result = { ok: false, message: 'Este CPF já possui TechPass ativo ou pendente.' };
          return current;
        }
        const clientId = existingClient?.id ?? makeId('cli');
        const client: Cliente = existingClient ?? {
          ...clientPayload,
          id: clientId,
          codigo_indicacao: '',
          created_at: new Date().toISOString(),
        };
        const pending: PendingActivation = {
          id: makeId('pend'),
          techpass_id: techpass.id,
          cliente_id: clientId,
          codigo_informado: codigoInformado,
          status: 'PENDENTE_ATIVACAO',
          created_at: new Date().toISOString(),
        };
        result = { ok: true, message: 'Cadastro enviado com sucesso!' };
        return {
          ...current,
          clientes: existingClient ? current.clientes.map((item) => item.id === existingClient.id ? { ...item, ...clientPayload } : item) : [client, ...current.clientes],
          pending_activations: [pending, ...current.pending_activations],
          techpasses: current.techpasses.map((item) => item.id === techpass.id ? {
            ...item,
            cliente_id: clientId,
            status: 'PENDENTE_ATIVACAO',
            codigo_usado: true,
          } : item),
        };
      });
      return result;
    },
    activatePending(techpassId: string) {
      let result: { ok: boolean; message: string } = { ok: false, message: 'Cadastro pendente não encontrado.' };
      setState((current) => {
        const techpass = current.techpasses.find((item) => item.id === techpassId);
        const pending = current.pending_activations.find((item) => item.techpass_id === techpassId && item.status === 'PENDENTE_ATIVACAO');
        if (!techpass || !pending || !techpass.cliente_id) return current;
        const activatedAt = new Date();
        const expiresAt = addMonths(activatedAt, 12);
        const codigoIndicacao = techpass.serial + '-IND';
        result = { ok: true, message: 'TechPass ativado presencialmente com sucesso.' };
        return {
          ...current,
          clientes: current.clientes.map((item) => item.id === techpass.cliente_id ? { ...item, codigo_indicacao: codigoIndicacao } : item),
          pending_activations: current.pending_activations.map((item) => item.id === pending.id ? { ...item, status: 'ATIVADO' } : item),
          techpasses: current.techpasses.map((item) => item.id === techpassId ? {
            ...item,
            status: 'ATIVO',
            activated_at: activatedAt.toISOString(),
            expires_at: expiresAt.toISOString(),
            peliculas_restantes: 6,
            cashback_saldo: 0,
            codigo_indicacao: codigoIndicacao,
          } : item),
        };
      });
      return result;
    },
    cancelPending(techpassId: string) {
      setState((current) => ({
        ...current,
        pending_activations: current.pending_activations.map((item) => item.techpass_id === techpassId && item.status === 'PENDENTE_ATIVACAO' ? { ...item, status: 'CANCELADO' } : item),
        techpasses: current.techpasses.map((item) => item.id === techpassId ? { ...item, status: 'CANCELADO' } : item),
      }));
    },
    setTechPassStatus(id: string, status: TechPassStatus) {
      setState((current) => ({
        ...current,
        techpasses: current.techpasses.map((item) => item.id === id ? { ...item, status } : item),
      }));
    },
    registerUso(techpassId: string, beneficio: string, observacao: string) {
      setState((current) => {
        const techpass = current.techpasses.find((item) => item.id === techpassId);
        if (!techpass?.cliente_id) return current;
        return {
          ...current,
          utilizacoes: [{
            id: makeId('uti'),
            cliente_id: techpass.cliente_id,
            techpass_id: techpass.id,
            empresa_id: techpass.empresa_id,
            solicitacao_id: null,
            beneficio,
            status: 'concluida',
            observacao,
            funcionario_responsavel: 'Atendimento TechSoft',
            created_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          }, ...current.utilizacoes],
        };
      });
    },
    registerPeliculas(techpassId: string, observacao: string) {
      let ok = false;
      setState((current) => {
        const techpass = current.techpasses.find((item) => item.id === techpassId);
        if (!techpass?.cliente_id || techpass.status !== 'ATIVO' || techpass.peliculas_restantes <= 0) return current;
        ok = true;
        return {
          ...current,
          techpasses: current.techpasses.map((item) => item.id === techpassId ? { ...item, peliculas_restantes: Math.max(item.peliculas_restantes - 1, 0) } : item),
          utilizacoes: [{
            id: makeId('uti'),
            cliente_id: techpass.cliente_id,
            techpass_id: techpass.id,
            empresa_id: 'emp-techsoft',
            solicitacao_id: null,
            beneficio: 'Troca de película',
            status: 'concluida',
            observacao,
            funcionario_responsavel: 'Atendimento TechSoft',
            created_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          }, ...current.utilizacoes],
        };
      });
      return ok;
    },
    addCashback(payload: Omit<CashbackMovement, 'id' | 'created_at'>) {
      setState((current) => ({
        ...current,
        cashback_movements: [{ ...payload, id: makeId('cash'), created_at: new Date().toISOString() }, ...current.cashback_movements],
      }));
    },
    updateCashbackSetting(empresaId: string, payload: Omit<CashbackSetting, 'id' | 'empresa_id' | 'created_at' | 'updated_at'>) {
      setState((current) => {
        const existing = current.cashback_settings.find((item) => item.empresa_id === empresaId);
        const now = new Date().toISOString();
        return {
          ...current,
          cashback_settings: existing
            ? current.cashback_settings.map((item) => item.id === existing.id ? { ...item, ...payload, updated_at: now } : item)
            : [{ ...payload, id: makeId('cashset'), empresa_id: empresaId, created_at: now, updated_at: now }, ...current.cashback_settings],
        };
      });
    },
    addCashbackTransaction(payload: Omit<CashbackTransaction, 'id' | 'created_at'>) {
      setState((current) => {
        const settings = current.cashback_settings.find((item) => item.empresa_id === payload.empresa_id);
        const limit = settings?.limite_maximo ?? payload.valor;
        const isAvailableCredit = payload.tipo === 'credito' && payload.status === 'disponivel';
        const isPendingCredit = payload.tipo === 'credito' && payload.status === 'pendente';
        return {
          ...current,
          cashback_transactions: [{ ...payload, id: makeId('cashtx'), created_at: new Date().toISOString() }, ...current.cashback_transactions],
          cashback_balances: upsertBalance(current.cashback_balances, {
            cliente_id: payload.cliente_id,
            empresa_id: payload.empresa_id,
            limite_maximo: limit,
            availableDelta: isAvailableCredit ? payload.valor : 0,
            pendingDelta: isPendingCredit ? payload.valor : 0,
          }),
        };
      });
    },
    approveCashbackTransaction(id: string) {
      setState((current) => {
        const tx = current.cashback_transactions.find((item) => item.id === id && item.status === 'pendente' && item.tipo === 'credito');
        if (!tx) return current;
        const settings = current.cashback_settings.find((item) => item.empresa_id === tx.empresa_id);
        return {
          ...current,
          cashback_transactions: current.cashback_transactions.map((item) => item.id === id ? { ...item, status: 'disponivel' } : item),
          cashback_balances: upsertBalance(current.cashback_balances, {
            cliente_id: tx.cliente_id,
            empresa_id: tx.empresa_id,
            limite_maximo: settings?.limite_maximo ?? tx.valor,
            pendingDelta: -tx.valor,
            availableDelta: tx.valor,
          }),
        };
      });
    },
    useCompanyCashback(clienteId: string, empresaId: string, valor: number, descricao: string) {
      setState((current) => {
        const balance = current.cashback_balances.find((item) => item.cliente_id === clienteId && item.empresa_id === empresaId);
        if (!balance || valor <= 0 || balance.saldo_disponivel < valor) return current;
        return {
          ...current,
          cashback_transactions: [{
            id: makeId('cashtx'),
            cliente_id: clienteId,
            techpass_id: current.techpasses.find((item) => item.cliente_id === clienteId)?.id ?? '',
            empresa_id: empresaId,
            oferta_id: null,
            lead_id: null,
            tipo: 'debito',
            valor,
            status: 'usado',
            descricao,
            valor_compra: 0,
            created_at: new Date().toISOString(),
          }, ...current.cashback_transactions],
          cashback_balances: upsertBalance(current.cashback_balances, {
            cliente_id: clienteId,
            empresa_id: empresaId,
            limite_maximo: balance.limite_maximo,
            availableDelta: -valor,
          }),
        };
      });
    },
    cancelCashbackTransaction(id: string) {
      setState((current) => {
        const tx = current.cashback_transactions.find((item) => item.id === id && item.status !== 'cancelado');
        if (!tx) return current;
        const balance = current.cashback_balances.find((item) => item.cliente_id === tx.cliente_id && item.empresa_id === tx.empresa_id);
        return {
          ...current,
          cashback_transactions: current.cashback_transactions.map((item) => item.id === id ? { ...item, status: 'cancelado', tipo: item.tipo === 'credito' ? 'cancelamento' : item.tipo } : item),
          cashback_balances: tx.tipo === 'credito' ? upsertBalance(current.cashback_balances, {
            cliente_id: tx.cliente_id,
            empresa_id: tx.empresa_id,
            limite_maximo: balance?.limite_maximo ?? tx.valor,
            pendingDelta: tx.status === 'pendente' ? -tx.valor : 0,
            availableDelta: tx.status === 'disponivel' ? -tx.valor : 0,
          }) : current.cashback_balances,
        };
      });
    },
    addIndicacao(payload: Omit<Indicacao, 'id' | 'created_at'>) {
      setState((current) => ({
        ...current,
        indicacoes: [{ ...payload, id: makeId('ind'), created_at: new Date().toISOString() }, ...current.indicacoes],
      }));
    },
    addBeneficioServico(payload: Omit<BeneficioServico, 'id' | 'created_at'>) {
      setState((current) => ({
        ...current,
        beneficios_servicos: [{ ...payload, id: makeId('bs'), created_at: new Date().toISOString() }, ...current.beneficios_servicos],
      }));
    },
    addOferta(payload: Omit<OfertaParceiro, 'id' | 'created_at'>) {
      setState((current) => ({
        ...current,
        ofertas: [{ ...payload, id: makeId('of'), created_at: new Date().toISOString() }, ...current.ofertas],
      }));
    },
    updateOferta(id: string, payload: Partial<Omit<OfertaParceiro, 'id' | 'created_at'>>) {
      setState((current) => ({
        ...current,
        ofertas: current.ofertas.map((item) => item.id === id ? { ...item, ...payload } : item),
      }));
    },
    addParceiroUsuario(payload: Omit<ParceiroUsuario, 'id' | 'created_at' | 'tipo_acesso'>) {
      setState((current) => ({
        ...current,
        parceiro_usuarios: [{ ...payload, id: makeId('par'), tipo_acesso: 'parceiro', created_at: new Date().toISOString() }, ...current.parceiro_usuarios],
      }));
    },
    addLead(payload: Omit<LeadParceiro, 'id' | 'status' | 'created_at'>) {
      setState((current) => ({
        ...current,
        leads: [{ ...payload, id: makeId('lead'), status: 'novo', created_at: new Date().toISOString() }, ...current.leads],
        notifications: [{
          id: makeId('not'),
          user_id: current.parceiro_usuarios.find((item) => item.empresa_id === payload.empresa_id)?.id ?? null,
          empresa_id: payload.empresa_id,
          tipo_usuario: 'parceiro',
          titulo: 'Novo lead recebido',
          descricao: getClientName(current, payload.cliente_id) + ' demonstrou interesse em ' + payload.oferta_nome + '.',
          tipo: 'informacao',
          url: '/parceiro/dashboard',
          lida: false,
          created_at: new Date().toISOString(),
        }, ...current.notifications],
      }));
    },
    updateLead(id: string, payload: Partial<Pick<LeadParceiro, 'status' | 'observacao'>>) {
      setState((current) => {
        const lead = current.leads.find((item) => item.id === id);
        if (!lead) return current;
        let next = {
          ...current,
          leads: current.leads.map((item) => item.id === id ? { ...item, ...payload } : item),
        };
        const alreadyGenerated = current.cashback_transactions.some((item) => item.lead_id === id && item.tipo === 'credito' && item.status !== 'cancelado');
        if (payload.status === 'fechado' && lead.status !== 'fechado' && !alreadyGenerated) {
          const oferta = current.ofertas.find((item) => item.id === lead.oferta_id);
          const settings = current.cashback_settings.find((item) => item.empresa_id === lead.empresa_id);
          const valueFromPrice = Number((oferta?.preco_techpass ?? '').replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.')) || 0;
          const valorCompra = valueFromPrice || oferta?.cashback_limite || oferta?.cashback_valor || 0;
          const cashbackValue = calculateOfferCashback(oferta, settings, valorCompra);
          if (cashbackValue > 0) {
            const tx: CashbackTransaction = {
              id: makeId('cashtx'),
              cliente_id: lead.cliente_id,
              techpass_id: lead.techpass_id,
              empresa_id: lead.empresa_id,
              oferta_id: lead.oferta_id,
              lead_id: lead.id,
              tipo: 'credito',
              valor: cashbackValue,
              status: 'pendente',
              descricao: 'Cashback gerado pela oferta ' + lead.oferta_nome,
              valor_compra: valorCompra,
              created_at: new Date().toISOString(),
            };
            next = {
              ...next,
              cashback_transactions: [tx, ...current.cashback_transactions],
              cashback_balances: upsertBalance(current.cashback_balances, {
                cliente_id: lead.cliente_id,
                empresa_id: lead.empresa_id,
                limite_maximo: settings?.limite_maximo ?? cashbackValue,
                pendingDelta: cashbackValue,
              }),
            };
          }
        }
        return next;
      });
    },
    addFightCoreIndicacao(payload: Omit<IndicacaoFightCore, 'id' | 'status' | 'created_at'>) {
      setState((current) => ({
        ...current,
        fight_core_indicacoes: [{ ...payload, id: makeId('fcind'), status: 'enviada', created_at: new Date().toISOString() }, ...current.fight_core_indicacoes],
      }));
    },
    updateFightCoreIndicacao(id: string, status: IndicacaoFightCore['status']) {
      setState((current) => ({
        ...current,
        fight_core_indicacoes: current.fight_core_indicacoes.map((item) => item.id === id ? { ...item, status } : item),
      }));
    },
    addTechSoftIndicacao(payload: Omit<IndicacaoTechSoft, 'id' | 'status' | 'valor_compra' | 'gerou_brinde' | 'created_at'>) {
      setState((current) => ({
        ...current,
        techsoft_indicacoes: [{ ...payload, id: makeId('tsind'), status: 'enviada', valor_compra: 0, gerou_brinde: false, created_at: new Date().toISOString() }, ...current.techsoft_indicacoes],
      }));
    },
    updateTechSoftIndicacao(id: string, payload: Partial<Pick<IndicacaoTechSoft, 'status' | 'valor_compra' | 'observacao'>>) {
      setState((current) => ({
        ...current,
        techsoft_indicacoes: current.techsoft_indicacoes.map((item) => {
          if (item.id !== id) return item;
          const next = { ...item, ...payload };
          const gerouBrinde = ['comprou_fechou', 'brinde_liberado', 'brinde_retirado'].includes(next.status) && next.valor_compra > 0 && next.valor_compra <= 250;
          return { ...next, gerou_brinde: gerouBrinde || next.status === 'brinde_liberado' || next.status === 'brinde_retirado' };
        }),
      }));
    },
    updateBeneficioServico(id: string, payload: Partial<Omit<BeneficioServico, 'id' | 'created_at'>>) {
      setState((current) => ({
        ...current,
        beneficios_servicos: current.beneficios_servicos.map((item) => item.id === id ? { ...item, ...payload } : item),
      }));
    },
    addSolicitacao(payload: Omit<Solicitacao, 'id' | 'status' | 'funcionario_responsavel' | 'data_solicitacao' | 'data_conclusao' | 'observacao_empresa'>) {
      setState((current) => ({
        ...current,
        solicitacoes: [{
          ...payload,
          id: makeId('sol'),
          status: 'nova',
          funcionario_responsavel: '',
          data_solicitacao: new Date().toISOString(),
          data_conclusao: null,
          observacao_empresa: '',
        }, ...current.solicitacoes],
      }));
    },
    updateSolicitacao(id: string, payload: Partial<Pick<Solicitacao, 'status' | 'observacao_empresa' | 'funcionario_responsavel'>>) {
      setState((current) => ({
        ...current,
        solicitacoes: current.solicitacoes.map((item) => item.id === id ? { ...item, ...payload } : item),
      }));
    },
    concludeSolicitacao(id: string, observacaoEmpresa: string, funcionario: string) {
      let ok = false;
      setState((current) => {
        const solicitacao = current.solicitacoes.find((item) => item.id === id);
        if (!solicitacao) return current;
        const techpass = current.techpasses.find((item) => item.id === solicitacao.techpass_id);
        const servico = current.beneficios_servicos.find((item) => item.id === solicitacao.beneficio_servico_id);
        if (!techpass?.cliente_id || techpass.status !== 'ATIVO') return current;
        const isPelicula = (servico?.nome ?? '').toLowerCase().includes('película');
        if (isPelicula && techpass.peliculas_restantes <= 0) return current;
        ok = true;
        const now = new Date().toISOString();
        return {
          ...current,
          techpasses: current.techpasses.map((item) => item.id === techpass.id && isPelicula ? { ...item, peliculas_restantes: Math.max(item.peliculas_restantes - 1, 0) } : item),
          solicitacoes: current.solicitacoes.map((item) => item.id === id ? {
            ...item,
            status: 'concluida',
            observacao_empresa: observacaoEmpresa,
            funcionario_responsavel: funcionario,
            data_conclusao: now,
          } : item),
          utilizacoes: [{
            id: makeId('uti'),
            cliente_id: techpass.cliente_id,
            techpass_id: techpass.id,
            empresa_id: solicitacao.empresa_id,
            solicitacao_id: solicitacao.id,
            beneficio: servico?.nome ?? 'Benefício ou serviço',
            status: 'concluida',
            observacao: observacaoEmpresa || solicitacao.observacao,
            funcionario_responsavel: funcionario,
            created_at: solicitacao.data_solicitacao,
            completed_at: now,
          }, ...current.utilizacoes],
        };
      });
      return ok;
    },
    addNotification(payload: Omit<NotificationItem, 'id' | 'created_at' | 'lida'> & { lida?: boolean }) {
      setState((current) => ({
        ...current,
        notifications: [{ ...payload, id: makeId('not'), lida: payload.lida ?? false, created_at: new Date().toISOString() }, ...current.notifications],
      }));
    },
    markNotificationRead(id: string) {
      setState((current) => ({
        ...current,
        notifications: current.notifications.map((item) => item.id === id ? { ...item, lida: true } : item),
      }));
    },
    markAllNotificationsRead(scope?: { tipo_usuario?: TipoUsuario; user_id?: string | null; empresa_id?: string | null }) {
      setState((current) => ({
        ...current,
        notifications: current.notifications.map((item) => {
          const matchesUserType = !scope?.tipo_usuario || item.tipo_usuario === scope.tipo_usuario;
          const matchesUser = scope?.user_id === undefined || item.user_id === scope.user_id;
          const matchesEmpresa = scope?.empresa_id === undefined || item.empresa_id === scope.empresa_id;
          return matchesUserType && matchesUser && matchesEmpresa ? { ...item, lida: true } : item;
        }),
      }));
    },
    addSystemLog(payload: Omit<SystemLog, 'id' | 'created_at'>) {
      setState((current) => ({
        ...current,
        system_logs: [{ ...payload, id: makeId('log'), created_at: new Date().toISOString() }, ...current.system_logs],
      }));
    },
  }), []);

  return { state, setState, actions };
}

export function getCashbackBalance(state: AppState, techpassId: string) {
  const techpass = state.techpasses.find((item) => item.id === techpassId);
  const movements = state.cashback_movements
    .filter((item) => item.techpass_id === techpassId)
    .reduce((total, item) => total + (item.tipo === 'credito' ? item.valor : -item.valor), 0);
  return (techpass?.cashback_saldo ?? 0) + movements;
}

export function getCompanyCashbackBalance(state: AppState, clienteId: string, empresaId: string) {
  return state.cashback_balances.find((item) => item.cliente_id === clienteId && item.empresa_id === empresaId) ?? {
    id: '',
    cliente_id: clienteId,
    empresa_id: empresaId,
    saldo_disponivel: 0,
    saldo_pendente: 0,
    limite_maximo: state.cashback_settings.find((item) => item.empresa_id === empresaId)?.limite_maximo ?? 0,
    updated_at: '',
  };
}

export function getClientName(state: AppState, clientId: string | null | undefined) {
  return state.clientes.find((item) => item.id === clientId)?.nome ?? 'Não vinculado';
}

export function getEmpresaName(state: AppState, empresaId: string) {
  return state.empresas.find((item) => item.id === empresaId)?.nome ?? 'Empresa não encontrada';
}
