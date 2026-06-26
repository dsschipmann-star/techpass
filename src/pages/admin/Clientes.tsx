import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { fmtDate } from "@/lib/format";

interface Cli {
  id: string;
  nome: string;
  cpf: string;
  telefone: string | null;
  email: string | null;
  codigo_indicacao: string | null;
  techpass: { serial: string; status: string; expires_at: string | null }[];
}

export default function Clientes() {
  const [list, setList] = useState<Cli[]>([]);
  useEffect(() => {
    supabase.from("clientes")
      .select("id,nome,cpf,telefone,email,codigo_indicacao,techpass(serial,status,expires_at)")
      .order("nome")
      .then(({ data }) => setList((data as unknown as Cli[]) ?? []));
  }, []);

  return (
    <div className="grid gap-3">
      {list.map((c) => (
        <Card key={c.id}>
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{c.nome}</p>
                <p className="text-xs text-muted-foreground">CPF {c.cpf} · {c.telefone || "—"} · {c.email || "—"}</p>
                <p className="text-xs text-muted-foreground mt-1">Código de indicação: <span className="font-mono text-primary">{c.codigo_indicacao ?? "—"}</span></p>
              </div>
              <div className="space-y-1.5">
                {c.techpass.map((t) => (
                  <div key={t.serial} className="flex items-center gap-2 text-sm">
                    <span className="font-mono">{t.serial}</span>
                    <StatusBadge status={t.status} />
                    <span className="text-xs text-muted-foreground">val. {fmtDate(t.expires_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {list.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-12">Nenhum cliente cadastrado.</p>
      )}
    </div>
  );
}