import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { fmtBRL } from "@/lib/format";
import {
  TicketCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  UserCheck,
  Wallet,
  Gift,
} from "lucide-react";

type Stats = {
  total: number;
  aguardando: number;
  ativos: number;
  cancelados: number;
  empresas: number;
  clientesAtivos: number;
  cashbackTotal: number;
  indicacoesPendentes: number;
};

export default function Dashboard() {
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const [tp, emp, cb, ind] = await Promise.all([
        supabase.from("techpass").select("status,cliente_id"),
        supabase.from("empresas").select("id,status"),
        supabase.from("cashback_movements").select("tipo,valor"),
        supabase.from("indicacoes").select("status"),
      ]);
      const tps = tp.data ?? [];
      const cbm = cb.data ?? [];
      const cashbackTotal = cbm.reduce(
        (acc, m) => acc + (m.tipo === "credito" ? Number(m.valor) : 0),
        0
      );
      setS({
        total: tps.length,
        aguardando: tps.filter((t) => t.status === "AGUARDANDO_ATIVACAO").length,
        ativos: tps.filter((t) => t.status === "ATIVO").length,
        cancelados: tps.filter((t) => t.status === "CANCELADO").length,
        empresas: (emp.data ?? []).length,
        clientesAtivos: new Set(
          tps.filter((t) => t.status === "ATIVO" && t.cliente_id).map((t) => t.cliente_id)
        ).size,
        cashbackTotal,
        indicacoesPendentes: (ind.data ?? []).filter((i) => i.status === "pendente").length,
      });
    })();
  }, []);

  const cards = [
    { label: "TechPass gerados", value: s?.total ?? "—", icon: TicketCheck, accent: false },
    { label: "Aguardando ativação", value: s?.aguardando ?? "—", icon: Clock, accent: false },
    { label: "TechPass ativos", value: s?.ativos ?? "—", icon: CheckCircle2, accent: true },
    { label: "Cancelados", value: s?.cancelados ?? "—", icon: XCircle, accent: false },
    { label: "Empresas parceiras", value: s?.empresas ?? "—", icon: Building2, accent: false },
    { label: "Clientes ativos", value: s?.clientesAtivos ?? "—", icon: UserCheck, accent: false },
    { label: "Cashback concedido", value: s ? fmtBRL(s.cashbackTotal) : "—", icon: Wallet, accent: true },
    { label: "Indicações pendentes", value: s?.indicacoesPendentes ?? "—", icon: Gift, accent: false },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card
            key={c.label}
            className={
              c.accent
                ? "border-primary/30 bg-card relative overflow-hidden"
                : "bg-card"
            }
          >
            {c.accent && (
              <div className="absolute inset-0 pointer-events-none gradient-neon opacity-[0.04]" />
            )}
            <CardContent className="p-5 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    {c.label}
                  </p>
                  <p
                    className={
                      "mt-2 text-3xl font-bold tracking-tight " +
                      (c.accent ? "text-primary" : "text-foreground")
                    }
                  >
                    {c.value}
                  </p>
                </div>
                <div
                  className={
                    "h-10 w-10 rounded-lg flex items-center justify-center " +
                    (c.accent ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")
                  }
                >
                  <c.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Fluxo operacional
          </h2>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3"><span className="text-primary font-bold">1.</span>Empresa parceira entrega o cartão TechPass físico ao cliente.</li>
            <li className="flex gap-3"><span className="text-primary font-bold">2.</span>Cliente acessa o QR Code e vê o status do TechPass.</li>
            <li className="flex gap-3"><span className="text-primary font-bold">3.</span>Ativação ocorre presencialmente na TechSoft, com documento oficial com foto.</li>
            <li className="flex gap-3"><span className="text-primary font-bold">4.</span>Cliente desfruta de benefícios, cashback e indicações.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}