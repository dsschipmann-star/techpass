import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";
import { BENEFICIOS, fmtBRL, fmtDate } from "@/lib/format";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Search, Wallet, Scissors, Gift, Ban, PauseCircle, ShoppingBag } from "lucide-react";

interface Tp {
  id: string;
  serial: string;
  status: string;
  expires_at: string | null;
  peliculas_restantes: number;
  cliente: { id: string; nome: string; cpf: string; codigo_indicacao: string | null } | null;
  empresa: { nome: string } | null;
}

export default function Validar() {
  const [list, setList] = useState<Tp[]>([]);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Tp | null>(null);
  const [saldo, setSaldo] = useState(0);

  const load = async () => {
    const { data } = await supabase.from("techpass")
      .select("id,serial,status,expires_at,peliculas_restantes,cliente:clientes(id,nome,cpf,codigo_indicacao),empresa:empresas(nome)")
      .order("created_at", { ascending: false }).limit(200);
    setList((data as unknown as Tp[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!sel?.cliente?.id) { setSaldo(0); return; }
    supabase.from("cashback_movements").select("tipo,valor").eq("cliente_id", sel.cliente.id)
      .then(({ data }) => {
        const s = (data ?? []).reduce((a, m) => a + (m.tipo === "credito" ? Number(m.valor) : -Number(m.valor)), 0);
        setSaldo(s);
      });
  }, [sel]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return list;
    return list.filter((r) =>
      r.serial.toLowerCase().includes(t)
      || r.cliente?.nome.toLowerCase().includes(t)
      || r.cliente?.cpf.toLowerCase().includes(t)
    );
  }, [list, q]);

  const refresh = async () => { await load(); /* re-select */ if (sel) { const x = list.find(l => l.id === sel.id); if (x) setSel(x); } };

  const registrarPelicula = async () => {
    if (!sel || !sel.cliente) return;
    if (sel.peliculas_restantes <= 0) return toast.error("Sem trocas de película restantes");
    await supabase.from("techpass").update({ peliculas_restantes: sel.peliculas_restantes - 1 }).eq("id", sel.id);
    await supabase.from("utilizacoes").insert([{ cliente_id: sel.cliente.id, techpass_id: sel.id, beneficio: "Troca de película" }]);
    toast.success("Troca de película registrada");
    await load();
    setSel((s) => s ? { ...s, peliculas_restantes: s.peliculas_restantes - 1 } : s);
  };

  const cancelar = async () => {
    if (!sel) return;
    await supabase.from("techpass").update({ status: "CANCELADO" }).eq("id", sel.id);
    toast.success("TechPass cancelado");
    setSel(null); load();
  };
  const suspender = async () => {
    if (!sel) return;
    await supabase.from("techpass").update({ status: "SUSPENSO" }).eq("id", sel.id);
    toast.success("TechPass suspenso");
    setSel(null); load();
  };

  return (
    <div className="grid lg:grid-cols-[1fr_520px] gap-6">
      <Card>
        <CardContent className="p-5">
          <div className="relative mb-4">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Pesquisar por serial, nome ou CPF..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="space-y-1.5 max-h-[640px] overflow-auto">
            {filtered.map((r) => (
              <button key={r.id} onClick={() => setSel(r)}
                className={"w-full text-left rounded-lg border p-3 transition " + (sel?.id === r.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40")}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono font-medium truncate">{r.serial}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {r.cliente?.nome ?? "—"} · {r.empresa?.nome}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          {!sel ? (
            <div className="text-center py-10 text-sm text-muted-foreground">Selecione um TechPass.</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono font-semibold text-lg">{sel.serial}</p>
                  <p className="text-xs text-muted-foreground">{sel.empresa?.nome}</p>
                </div>
                <StatusBadge status={sel.status} />
              </div>

              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 flex gap-2 text-xs text-yellow-300">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p><strong>Solicitar documento oficial com foto antes da liberação dos benefícios.</strong></p>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-muted-foreground">Cliente</dt><dd className="font-medium">{sel.cliente?.nome ?? "—"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">CPF</dt><dd className="font-medium">{sel.cliente?.cpf ?? "—"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Validade</dt><dd className="font-medium">{fmtDate(sel.expires_at)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Trocas de película</dt><dd className="font-medium text-primary">{sel.peliculas_restantes} / 6</dd></div>
                <div><dt className="text-xs text-muted-foreground">Cashback disponível</dt><dd className="font-medium text-primary">{fmtBRL(saldo)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Código indicação</dt><dd className="font-mono text-xs">{sel.cliente?.codigo_indicacao ?? "—"}</dd></div>
              </dl>

              {sel.status === "ATIVO" && sel.cliente && (
                <>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={registrarPelicula}>
                      <Scissors className="h-4 w-4 mr-1.5" /> Troca película
                    </Button>
                    <UsoBeneficio sel={sel} onDone={refresh} />
                    <CashbackDialog sel={sel} tipo="credito" onDone={refresh} />
                    <CashbackDialog sel={sel} tipo="debito" saldo={saldo} onDone={refresh} />
                    <IndicacaoDialog sel={sel} onDone={refresh} />
                    <Button size="sm" variant="outline" onClick={suspender}>
                      <PauseCircle className="h-4 w-4 mr-1.5" /> Suspender
                    </Button>
                    <Button size="sm" variant="destructive" onClick={cancelar} className="col-span-2">
                      <Ban className="h-4 w-4 mr-1.5" /> Cancelar TechPass
                    </Button>
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-border">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Benefícios</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {BENEFICIOS.map((b) => <li key={b}>• {b}</li>)}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UsoBeneficio({ sel, onDone }: { sel: Tp; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [b, setB] = useState(BENEFICIOS[0]);
  const [obs, setObs] = useState("");
  const submit = async () => {
    if (!sel.cliente) return;
    await supabase.from("utilizacoes").insert([{ cliente_id: sel.cliente.id, techpass_id: sel.id, beneficio: b, observacao: obs }]);
    toast.success("Uso registrado");
    setOpen(false); setObs(""); onDone();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><ShoppingBag className="h-4 w-4 mr-1.5" /> Uso benefício</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Registrar uso de benefício</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Benefício</Label>
            <Select value={b} onValueChange={setB}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{BENEFICIOS.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Observação</Label><Input value={obs} onChange={(e) => setObs(e.target.value)} /></div>
          <Button onClick={submit} className="w-full">Registrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CashbackDialog({ sel, tipo, saldo, onDone }: { sel: Tp; tipo: "credito" | "debito"; saldo?: number; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [valor, setValor] = useState("");
  const [desc, setDesc] = useState("");
  const submit = async () => {
    if (!sel.cliente) return;
    const v = Number(valor);
    if (!v || v <= 0) return toast.error("Valor inválido");
    if (tipo === "debito" && saldo !== undefined && v > saldo) return toast.error("Saldo insuficiente");
    const { error } = await supabase.from("cashback_movements").insert([{
      cliente_id: sel.cliente.id, techpass_id: sel.id, tipo, valor: v, descricao: desc,
    }]);
    if (error) return toast.error(error.message);
    toast.success(tipo === "credito" ? "Cashback creditado" : "Cashback debitado");
    setOpen(false); setValor(""); setDesc(""); onDone();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={tipo === "credito" ? "default" : "outline"}>
          <Wallet className="h-4 w-4 mr-1.5" />
          {tipo === "credito" ? "Adicionar cashback" : "Usar cashback"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{tipo === "credito" ? "Adicionar cashback" : "Usar cashback"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} /></div>
          <div><Label>Descrição</Label><Input value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
          {tipo === "debito" && <p className="text-xs text-muted-foreground">Saldo disponível: <span className="text-primary">{fmtBRL(saldo ?? 0)}</span></p>}
          <Button onClick={submit} className="w-full">Confirmar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function IndicacaoDialog({ sel, onDone }: { sel: Tp; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ nome: "", telefone: "", valor: "", obs: "" });
  const submit = async () => {
    if (!sel.cliente) return;
    if (!f.nome.trim()) return toast.error("Informe o nome do indicado");
    await supabase.from("indicacoes").insert([{
      cliente_indicador_id: sel.cliente.id,
      nome_indicado: f.nome,
      telefone_indicado: f.telefone,
      valor_servico: f.valor ? Number(f.valor) : null,
      status: "pendente",
      observacao: f.obs,
    }]);
    toast.success("Indicação registrada");
    setOpen(false); setF({ nome: "", telefone: "", valor: "", obs: "" }); onDone();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Gift className="h-4 w-4 mr-1.5" /> Indicação</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Registrar indicação</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome do indicado *</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
          <div><Label>Telefone</Label><Input value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} /></div>
          <div><Label>Valor do serviço/compra (R$)</Label><Input type="number" step="0.01" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} /></div>
          <div><Label>Observação</Label><Input value={f.obs} onChange={(e) => setF({ ...f, obs: e.target.value })} /></div>
          <Button onClick={submit} className="w-full">Registrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}