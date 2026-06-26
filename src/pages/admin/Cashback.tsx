import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtBRL, fmtDateTime } from "@/lib/format";

interface Mov {
  id: string;
  tipo: "credito" | "debito";
  valor: number;
  descricao: string | null;
  created_at: string;
  cliente: { nome: string } | null;
  techpass: { serial: string } | null;
}

export default function Cashback() {
  const [mov, setMov] = useState<Mov[]>([]);
  useEffect(() => {
    supabase.from("cashback_movements")
      .select("id,tipo,valor,descricao,created_at,cliente:clientes(nome),techpass:techpass(serial)")
      .order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => setMov((data as unknown as Mov[]) ?? []));
  }, []);

  const totais = mov.reduce(
    (a, m) => {
      if (m.tipo === "credito") a.credito += Number(m.valor);
      else a.debito += Number(m.valor);
      return a;
    },
    { credito: 0, debito: 0 }
  );

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground uppercase">Total creditado</p><p className="text-2xl font-bold text-primary mt-1">{fmtBRL(totais.credito)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground uppercase">Total debitado</p><p className="text-2xl font-bold mt-1">{fmtBRL(totais.debito)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground uppercase">Saldo em circulação</p><p className="text-2xl font-bold mt-1">{fmtBRL(totais.credito - totais.debito)}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold">Histórico de movimentações</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Use a tela <strong>Validar TechPass</strong> para creditar ou debitar cashback.</p>
          </div>
          <div className="divide-y divide-border">
            {mov.map((m) => (
              <div key={m.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={m.tipo === "credito" ? "ativa" : "pendente"} />
                    <span className="text-sm font-medium truncate">{m.cliente?.nome ?? "—"}</span>
                    <span className="text-xs text-muted-foreground font-mono">{m.techpass?.serial}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{m.descricao || "—"} · {fmtDateTime(m.created_at)}</p>
                </div>
                <div className={"font-bold tabular-nums " + (m.tipo === "credito" ? "text-primary" : "text-destructive")}>
                  {m.tipo === "credito" ? "+" : "−"} {fmtBRL(m.valor)}
                </div>
              </div>
            ))}
            {mov.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma movimentação.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}