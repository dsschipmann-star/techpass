import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Search } from "lucide-react";

interface Tp {
  id: string;
  serial: string;
  status: string;
  empresa_id: string;
  empresa: { nome: string; status: string } | null;
}

export default function Ativar() {
  const [list, setList] = useState<Tp[]>([]);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Tp | null>(null);
  const [form, setForm] = useState({ nome: "", cpf: "", telefone: "", email: "" });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("techpass")
      .select("id,serial,status,empresa_id,empresa:empresas(nome,status)")
      .eq("status", "AGUARDANDO_ATIVACAO").order("serial").limit(100);
    setList((data as unknown as Tp[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return list;
    return list.filter((r) =>
      r.serial.toLowerCase().includes(t) || r.empresa?.nome.toLowerCase().includes(t)
    );
  }, [list, q]);

  const ativar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sel) return;
    if (sel.empresa?.status !== "ativa") return toast.error("Empresa parceira está inativa");
    if (!form.nome.trim() || !form.cpf.trim()) return toast.error("Nome e CPF obrigatórios");

    setLoading(true);
    try {
      // Procura/cria cliente
      let { data: cli } = await supabase.from("clientes").select("id").eq("cpf", form.cpf).maybeSingle();
      let clienteId = cli?.id;
      if (!clienteId) {
        const codigo = `${sel.serial}-IND`;
        const { data: novo, error } = await supabase.from("clientes")
          .insert([{ nome: form.nome, cpf: form.cpf, telefone: form.telefone, email: form.email, codigo_indicacao: codigo }])
          .select("id").single();
        if (error) throw error;
        clienteId = novo.id;
      } else {
        // Já existe — checa se tem TechPass ativo
        const { data: ativos } = await supabase.from("techpass").select("id")
          .eq("cliente_id", clienteId).eq("status", "ATIVO");
        if (ativos && ativos.length > 0) {
          throw new Error("Este CPF já possui um TechPass ativo. TechPass é pessoal e intransferível.");
        }
      }

      const expires = new Date();
      expires.setMonth(expires.getMonth() + 12);

      const { error: upErr } = await supabase.from("techpass").update({
        cliente_id: clienteId,
        status: "ATIVO",
        activated_at: new Date().toISOString(),
        expires_at: expires.toISOString(),
        peliculas_restantes: 6,
      }).eq("id", sel.id);
      if (upErr) throw upErr;

      toast.success(`TechPass ${sel.serial} ativado para ${form.nome}`);
      setSel(null);
      setForm({ nome: "", cpf: "", telefone: "", email: "" });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_420px] gap-6">
      <Card>
        <CardContent className="p-5">
          <div className="relative mb-4">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Pesquisar serial, QR Code ou empresa..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="space-y-1.5 max-h-[600px] overflow-auto">
            {filtered.map((r) => (
              <button key={r.id} onClick={() => setSel(r)}
                className={"w-full text-left rounded-lg border p-3 transition " + (sel?.id === r.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40")}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono font-medium">{r.serial}</div>
                    <div className="text-xs text-muted-foreground">{r.empresa?.nome}</div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhum TechPass aguardando ativação.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          {!sel ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              Selecione um TechPass à esquerda para ativar.
            </div>
          ) : (
            <form onSubmit={ativar} className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Ativando</p>
                <p className="font-mono font-semibold text-lg">{sel.serial}</p>
                <p className="text-xs text-muted-foreground">{sel.empresa?.nome}</p>
              </div>
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 flex gap-2 text-xs text-yellow-300">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p><strong>Confirme o documento oficial com foto antes de ativar este TechPass.</strong> TechPass é pessoal e intransferível.</p>
              </div>
              <div><Label>Nome completo *</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
              <div><Label>CPF *</Label><Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" /></div>
              <div><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
              <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <Button type="submit" className="w-full" disabled={loading}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {loading ? "Ativando..." : "Confirmar e ativar TechPass"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}