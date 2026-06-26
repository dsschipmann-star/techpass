import { cn } from "@/lib/utils";
import { statusLabel } from "@/lib/format";

const styles: Record<string, string> = {
  AGUARDANDO_ATIVACAO: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  ATIVO: "bg-primary/15 text-primary border-primary/40 shadow-[0_0_12px_-4px_hsl(var(--primary)/0.6)]",
  SUSPENSO: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  CANCELADO: "bg-destructive/10 text-destructive border-destructive/30",
  EXPIRADO: "bg-muted text-muted-foreground border-border",
  ativa: "bg-primary/15 text-primary border-primary/40",
  inativa: "bg-muted text-muted-foreground border-border",
  pendente: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  aprovado: "bg-primary/15 text-primary border-primary/40",
  recusado: "bg-destructive/10 text-destructive border-destructive/30",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide",
        styles[status] ?? "bg-muted text-muted-foreground border-border"
      )}
    >
      {statusLabel[status] ?? status}
    </span>
  );
}