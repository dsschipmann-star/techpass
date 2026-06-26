import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BENEFICIOS, fmtBRL, fmtDate } from "@/lib/format";
import { Zap, ShieldAlert, CheckCircle2, Clock, XCircle, Calendar, Tag } from "lucide-react";

interface PublicTp {
  serial: string;
  status: string;
  expires_at: string | null;
  peliculas_restantes: number;
  cliente: { nome: string; codigo_indicacao: string | null; id: string } | null;
  empresa: { nome: string; status: string } | null;
}

export default function TechPassPublic() {
  const { serial } = useParams<{ serial: string }>();
  const [tp, setTp] = useState<PublicTp | null | "notfound">(null);
  const [saldo, setSaldo] = useState(0);

  useEffect(() => {
    if (!serial) return;
    supabase.from("techpass")
      .select("serial,status,expires_at,peliculas_restantes,cliente:clientes(id,nome,codigo_indicacao),empresa:empresas(nome,status)")
      .eq("serial", serial).maybeSingle()
      .then(async ({ data }) => {
        if (!data) return setTp("notfound");
        setTp(data as unknown as PublicTp);
        const cli = (data as unknown as PublicTp).cliente;
        if (cli?.id) {
          const { data: m } = await supabase.from("cashback_movements").select("tipo,valor").eq("cliente_id", cli.id);
          const s = (m ?? []).reduce((a, x) => a + (x.tipo === "credito" ? Number(x.valor) : -Number(x.valor)), 0);
          setSaldo(s);
        }
      });
  }, [serial]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="h-10 w-10 rounded-lg gradient-neon flex items-center justify-center glow-neon">
            <Zap className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-bold tracking-tight leading-none">TechPass</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-primary">Premium</div>
          </div>
        </div>

        {tp === null && <p className="text-center text-sm text-muted-foreground">Carregando...</p>}

        {tp === "notfound" && (
          <Shell tone="neutral" icon={XCircle} title="TECHPASS NÃO ENCONTRADO"
            subtitle="Verifique o número de série ou o QR Code." />
        )}

        {tp && tp !== "notfound" && tp.status === "AGUARDANDO_ATIVACAO" && (
          <Shell tone="primary" icon={Clock}
            title="Parabéns! Você recebeu um TechPass Premium."
            subtitle="Seu benefício já é seu. Falta apenas ativá-lo presencialmente na TechSoft.">
            <p className="text-sm text-foreground/80 text-center mb-4">
              Para liberar suas vantagens, compareça à loja TechSoft com seu TechPass e um documento oficial com foto.
            </p>
            <div className="text-center text-xs uppercase tracking-wider text-yellow-400 font-semibold mb-4">
              Status: AGUARDANDO ATIVAÇÃO
            </div>
            <BeneficiosList />
            <p className="text-center text-[11px] text-muted-foreground mt-5 font-mono">{tp.serial}</p>
          </Shell>
        )}

        {tp && tp !== "notfound" && tp.status === "ATIVO" && (
          <Shell tone="primary" icon={CheckCircle2} title={tp.cliente?.nome ?? "Cliente"}
            subtitle={tp.empresa?.nome ?? undefined}>
            <div className="text-center text-xs uppercase tracking-wider text-primary font-semibold mb-1">Status: ATIVO</div>
            <p className="text-center font-mono text-xs text-muted-foreground mb-5">{tp.serial}</p>

            <div className="grid grid-cols-2 gap-3 text-sm mb-5">
              <Info icon={Calendar} label="Validade" value={fmtDate(tp.expires_at)} />
              <Info icon={Tag} label="Cashback" value={fmtBRL(saldo)} accent />
              <Info icon={Tag} label="Películas" value={`${tp.peliculas_restantes} / 6`} accent />
              <Info icon={Tag} label="Indicação" value={tp.cliente?.codigo_indicacao ?? "—"} mono />
            </div>

            <BeneficiosList />

            <div className="mt-5 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-center text-xs text-yellow-300">
              <ShieldAlert className="h-4 w-4 inline mr-1" />
              Apresente documento oficial com foto para utilizar os benefícios.
            </div>
          </Shell>
        )}

        {tp && tp !== "notfound" && tp.status === "SUSPENSO" && (
          <Shell tone="warning" icon={ShieldAlert} title="TECHPASS SUSPENSO"
            subtitle="Este benefício está temporariamente indisponível." />
        )}
        {tp && tp !== "notfound" && tp.status === "CANCELADO" && (
          <Shell tone="danger" icon={XCircle} title="TECHPASS CANCELADO"
            subtitle="Os benefícios deste TechPass não estão mais disponíveis." />
        )}
        {tp && tp !== "notfound" && tp.status === "EXPIRADO" && (
          <Shell tone="neutral" icon={Clock} title="TECHPASS EXPIRADO"
            subtitle="Este benefício encerrou sua validade." />
        )}
      </div>
    </div>
  );
}

function Shell({
  tone, icon: Icon, title, subtitle, children,
}: {
  tone: "primary" | "warning" | "danger" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  const toneRing = {
    primary: "border-primary/40 shadow-[var(--shadow-neon)]",
    warning: "border-yellow-500/40",
    danger: "border-destructive/40",
    neutral: "border-border",
  }[tone];
  const toneIcon = {
    primary: "bg-primary/15 text-primary",
    warning: "bg-yellow-500/15 text-yellow-400",
    danger: "bg-destructive/15 text-destructive",
    neutral: "bg-muted text-muted-foreground",
  }[tone];
  return (
    <div className={"rounded-2xl border bg-card p-6 " + toneRing}>
      <div className={"h-14 w-14 mx-auto rounded-full flex items-center justify-center mb-4 " + toneIcon}>
        <Icon className="h-7 w-7" />
      </div>
      <h1 className="text-xl font-bold text-center leading-tight">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground text-center mt-2">{subtitle}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

function Info({ icon: Icon, label, value, accent, mono }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; accent?: boolean; mono?: boolean;
}) {
  return (
    <div className="rounded-lg bg-muted/40 border border-border p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className={"mt-1 font-semibold " + (accent ? "text-primary " : "") + (mono ? "font-mono text-xs" : "")}>
        {value}
      </div>
    </div>
  );
}

function BeneficiosList() {
  return (
    <div className="rounded-lg bg-muted/30 border border-border p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Benefícios</p>
      <ul className="space-y-1.5 text-sm">
        {BENEFICIOS.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <span className="text-primary mt-0.5">✓</span>
            <span className="text-foreground/85">{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}