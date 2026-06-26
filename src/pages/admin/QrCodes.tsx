import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { QrCanvas, qrToDataUrl } from "@/components/QrCanvas";
import { Copy, Download, ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";

interface Row {
  id: string;
  serial: string;
  status: string;
  empresa: { nome: string } | null;
}

export default function QrCodes() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.from("techpass")
      .select("id,serial,status,empresa:empresas(nome)")
      .order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => setRows((data as unknown as Row[]) ?? []));
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(
      (r) => r.serial.toLowerCase().includes(t) || r.empresa?.nome.toLowerCase().includes(t)
    );
  }, [rows, q]);

  const fullUrl = (serial: string) => `${window.location.origin}/techpass/${serial}`;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado");
  };

  const download = async (serial: string) => {
    const url = await qrToDataUrl(fullUrl(serial), 600);
    const a = document.createElement("a");
    a.href = url; a.download = `${serial}.png`; a.click();
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por serial ou empresa..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </CardContent>
      </Card>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((r) => (
          <Card key={r.id} className="overflow-hidden">
            <CardContent className="p-5 flex flex-col items-center gap-3">
              <div className="rounded-lg bg-white p-2">
                <QrCanvas value={fullUrl(r.serial)} size={160} />
              </div>
              <div className="text-center w-full">
                <div className="font-mono font-semibold text-sm">{r.serial}</div>
                <div className="text-xs text-muted-foreground mb-2">{r.empresa?.nome ?? "—"}</div>
                <StatusBadge status={r.status} />
              </div>
              <div className="grid grid-cols-3 gap-1.5 w-full">
                <Button size="sm" variant="outline" onClick={() => download(r.serial)} title="Baixar PNG">
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => copy(r.serial)} title="Copiar serial">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="outline" asChild title="Abrir página pública">
                  <a href={`/techpass/${r.serial}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-sm text-muted-foreground py-12">
            Nenhum TechPass encontrado.
          </p>
        )}
      </div>
    </div>
  );
}