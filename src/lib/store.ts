import { useEffect, useMemo, useState } from 'react';
import { createInitialState } from '../data';
import { hasSupabaseConfig, supabase } from './supabase';
import type { AppState, CashbackMovement, Cliente, Empresa, Indicacao, PendingActivation, TechPass, TechPassStatus, Utilizacao } from '../types';

const STORAGE_KEY = 'techpass-premium-state-v2';

function safeParse(value: string | null): AppState | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as AppState;
    return parsed.pending_activations ? parsed : null;
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

export function addMonths(date: Date, months: number) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

async function loadSupabaseState(): Promise<AppState | null> {
  if (!supabase) return null;
  const [empresas, clientes, techpass, pending, cashback, indicacoes, utilizacoes] = await Promise.all([
    supabase.from('empresas').select('*').order('created_at', { ascending: false }),
    supabase.from('clientes').select('*').order('created_at', { ascending: false }),
    supabase.from('techpass').select('*').order('created_at', { ascending: false }),
    supabase.from('pending_activations').select('*').order('created_at', { ascending: false }),
    supabase.from('cashback_movements').select('*').order('created_at', { ascending: false }),
    supabase.from('indicacoes').select('*').order('created_at', { ascending: false }),
    supabase.from('utilizacoes').select('*').order('created_at', { ascending: false }),
  ]);
  const error = empresas.error ?? clientes.error ?? techpass.error ?? pending.error ?? cashback.error ?? indicacoes.error ?? utilizacoes.error;
  if (error) throw error;
  return {
    empresas: empresas.data ?? [],
    clientes: clientes.data ?? [],
    techpasses: techpass.data ?? [],
    pending_activations: pending.data ?? [],
    cashback_movements: cashback.data ?? [],
    indicacoes: indicacoes.data ?? [],
    utilizacoes: utilizacoes.data ?? [],
  };
}

async function syncSupabaseState(state: AppState) {
  if (!supabase) return;
  const tasks = [
    state.empresas.length ? supabase.from('empresas').upsert(state.empresas as any) : null,
    state.clientes.length ? supabase.from('clientes').upsert(state.clientes as any) : null,
    state.techpasses.length ? supabase.from('techpass').upsert(state.techpasses as any) : null,
    state.pending_activations.length ? supabase.from('pending_activations').upsert(state.pending_activations as any) : null,
    state.cashback_movements.length ? supabase.from('cashback_movements').upsert(state.cashback_movements as any) : null,
    state.indicacoes.length ? supabase.from('indicacoes').upsert(state.indicacoes as any) : null,
    state.utilizacoes.length ? supabase.from('utilizacoes').upsert(state.utilizacoes as any) : null,
  ].filter(Boolean);
  const results = await Promise.all(tasks);
  const failed = results.find((result: any) => result.error);
  if (failed) throw failed.error;
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
          result = { ok: false, message: 'Código do TechPass físico inválido.' };
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
          utilizacoes: [{ id: makeId('uti'), cliente_id: techpass.cliente_id, techpass_id: techpass.id, beneficio, observacao, created_at: new Date().toISOString() }, ...current.utilizacoes],
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
          utilizacoes: [{ id: makeId('uti'), cliente_id: techpass.cliente_id, techpass_id: techpass.id, beneficio: 'Troca de película', observacao, created_at: new Date().toISOString() }, ...current.utilizacoes],
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
    addIndicacao(payload: Omit<Indicacao, 'id' | 'created_at'>) {
      setState((current) => ({
        ...current,
        indicacoes: [{ ...payload, id: makeId('ind'), created_at: new Date().toISOString() }, ...current.indicacoes],
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

export function getClientName(state: AppState, clientId: string | null | undefined) {
  return state.clientes.find((item) => item.id === clientId)?.nome ?? 'Não vinculado';
}

export function getEmpresaName(state: AppState, empresaId: string) {
  return state.empresas.find((item) => item.id === empresaId)?.nome ?? 'Empresa não encontrada';
}
