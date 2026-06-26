import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { Plus, Power } from "lucide-react";

interface Empresa {
  id: string;
  nome: string;
  responsavel: string | null;
  telefone: string | null;
  email: string | null;
  status: "ativa" | "inativa";
}

export default function Empresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [form, setForm] = useState({ nome: "", responsavel: "", telefone: "", email: "" });

  const load = async () => {
    const { data } = await supabase.from("empresas").select("*").order("nome");
    setEmpresas((data as Empresa[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return toast.error("Informe o nome da empresa");
    const { error } = await supabase.from("empresas").insert([{ ...form, status: "ativa" }]);
    if (error) return toast.error(error.message);
    toast.success("Empresa cadastrada");
    setForm({ nome: "", responsavel: "", telefone: "", email: "" });
    load();
  };

  const toggle = async (emp: Empresa) => {
    const novoStatus = emp.status === "ativa" ? "inativa" : "ativa";
    const { error } = await supabase.from("empresas").update({ status: novoStatus }).eq("id", emp.id);
    if (error) return toast.error(error.message);
    if (novoStatus === "inativa") {
      // Suspende TechPass aguardando ou ativos da empresa
      await supabase
        .from("techpass")
        .update({ status: "SUSPENSO" })
        .eq("empresa_id", emp.id)
        .in("status", ["AGUARDANDO_ATIVACAO", "ATIVO"]);
      toast.warning(`${emp.nome} inativada. TechPass vinculados foram suspensos.`);
    } else {
      toast.success(`${emp.nome} reativada`);
    }
    load();
  };

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      <Card>
        <CardContent className="p-0">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold">Empresas parceiras</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Inativar uma empresa suspende automaticamente os TechPass vinculados.
            </p>
          </div>
          <div className="divide-y divide-border">
            {empresas.map((e) => (
              <div key={e.id} className="p-5 flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {e.nome} <StatusBadge status={e.status} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {e.responsavel || "—"} · {e.telefone || "—"} · {e.email || "—"}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => toggle(e)}>
                  <Power className="h-4 w-4 mr-1" />
                  {e.status === "ativa" ? "Inativar" : "Reativar"}
                </Button>
              </div>
            ))}
            {empresas.length === 0 && (
              <div className="p-8 text-sm text-muted-foreground text-center">
                Nenhuma empresa cadastrada.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> Nova empresa
          </h3>
          <form onSubmit={create} className="space-y-3">
            <div>
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div>
              <Label>Responsável</Label>
              <Input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <Button type="submit" className="w-full">Cadastrar empresa</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}