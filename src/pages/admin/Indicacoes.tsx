import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtBRL, fmtDate } from "@/lib/format";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Ind {
  id: string;
  nome_indicado: string;
  telefone_indicado: string | null;
  valor_servico: number | null;
  status: "pendente" | "aprovado" | "recusado";
  recompensa: "desconto" | "cashback" | "brinde" | null;
  observacao: string | null;
  created_at: string;
  cliente_indicador: { nome: string } | null;
}

export default function Indicacoes() {
  const [list, setList] = useState<Ind[]>([]);
  const load = () => supabase.from("indicacoes")
    .select("*,cliente_indicador:clientes!cliente_indicador_id(nome)")
    .order("created_at", { ascending: false })
    .then(({ data }) => setList((data as unknown as Ind[]) ?? []));
  useEffect(() => { load(); }, []);

  const aprovar = async (i: Ind, recompensa: Ind["recompensa"]) => {
    if (!i.valor_servico || i.valor_servico <= 350) {
      return toast.error("Recompensa só pode ser aprovada se valor do serviço/compra for acima de R$ 350,00.");
    }
    if (!recompensa) return toast.error("Selecione a recompensa");
    await supabase.from("indicacoes").update({ status: "aprovado", recompensa }).eq("id", i.id);
    toast.success("Indicação aprovada");
    load();
  };
  const recusar = async (i: Ind) => {
    await supabase.from("indicacoes").update({ status: "recusado" }).eq("id", i.id);
    toast.success("Indicação recusada"); load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold">Programa Indique e Ganhe</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Cada cliente ativo possui um código de indicação único. Recompensas (até R$ 50,00) só podem ser aprovadas se o valor do serviço ou compra for acima de R$ 350,00.
          </p>
        </CardContent>
      </Card>
      <div className="grid gap-3">
        {list.map((i) => (
          <Card key={i.id}>
            <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{i.nome_indicado}</p>
                  <StatusBadge status={i.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Indicado por <strong>{i.cliente_indicador?.nome ?? "—"}</strong> · {i.telefone_indicado || "—"} · {fmtDate(i.created_at)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Valor: <span className="text-foreground font-medium">{i.valor_servico ? fmtBRL(i.valor_servico) : "—"}</span>
                  {i.recompensa && <> · Recompensa: <span className="text-primary">{i.recompensa}</span></>}
                </p>
                {i.observacao && <p className="text-xs text-muted-foreground italic mt-1">"{i.observacao}"</p>}
              </div>
              {i.status === "pendente" && (
                <div className="flex items-center gap-2">
                  <ApproveControls onApprove={(r) => aprovar(i, r)} />
                  <Button size="sm" variant="outline" onClick={() => recusar(i)}>Recusar</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {list.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-12">Nenhuma indicação registrada.</p>
        )}
      </div>
    </div>
  );
}

function ApproveControls({ onApprove }: { onApprove: (r: "desconto" | "cashback" | "brinde") => void }) {
  const [r, setR] = useState<"desconto" | "cashback" | "brinde">("cashback");
  return (
    <div className="flex items-center gap-2">
      <Select value={r} onValueChange={(v) => setR(v as typeof r)}>
        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="desconto">Desconto</SelectItem>
          <SelectItem value="cashback">Cashback</SelectItem>
          <SelectItem value="brinde">Brinde</SelectItem>
        </SelectContent>
      </Select>
      <Button size="sm" onClick={() => onApprove(r)}>Aprovar</Button>
    </div>
  );
}