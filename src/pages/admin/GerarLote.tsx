import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Boxes } from "lucide-react";

interface Empresa { id: string; nome: string; status: string; }

export default function GerarLote() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaId, setEmpresaId] = useState("");
  const [prefixo, setPrefixo] = useState("TP-");
  const [quantidade, setQuantidade] = useState(10);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<string[]>([]);

  useEffect(() => {
    supabase.from("empresas").select("id,nome,status").eq("status", "ativa").order("nome")
      .then(({ data }) => setEmpresas((data as Empresa[]) ?? []));
  }, []);

  const gerar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaId) return toast.error("Selecione uma empresa");
    if (!prefixo.trim()) return toast.error("Informe o prefixo");
    if (quantidade < 1 || quantidade > 500) return toast.error("Quantidade entre 1 e 500");

    setLoading(true);
    try {
      // Procura último serial com mesmo prefixo
      const { data: existing } = await supabase
        .from("techpass").select("serial")
        .like("serial", `${prefixo}%`).order("serial", { ascending: false }).limit(1);
      let proxN = 1;
      if (existing && existing[0]) {
        const m = existing[0].serial.match(/(\d+)$/);
        if (m) proxN = parseInt(m[1], 10) + 1;
      }
      const inserts = Array.from({ length: quantidade }, (_, i) => {
        const serial = `${prefixo}${String(proxN + i).padStart(6, "0")}`;
        return {
          serial,
          empresa_id: empresaId,
          qr_code_url: `/techpass/${serial}`,
          status: "AGUARDANDO_ATIVACAO" as const,
        };
      });
      const { error } = await supabase.from("techpass").insert(inserts);
      if (error) throw error;
      setResultado(inserts.map((i) => i.serial));
      toast.success(`${quantidade} TechPass gerados`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-1">
            <Boxes className="h-5 w-5 text-primary" /> Gerar TechPass em lote
          </h2>
          <p className="text-xs text-muted-foreground mb-5">
            Cada TechPass recebe serial único, QR Code e página pública própria.
          </p>
          <form onSubmit={gerar} className="space-y-4">
            <div>
              <Label>Empresa parceira</Label>
              <Select value={empresaId} onValueChange={setEmpresaId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {empresas.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prefixo do serial</Label>
              <Input value={prefixo} onChange={(e) => setPrefixo(e.target.value.toUpperCase())}
                placeholder="TP-SG-" />
              <p className="text-[11px] text-muted-foreground mt-1">
                Ex.: <code className="text-primary">TP-SG-</code> gera <code>TP-SG-000001</code>, <code>TP-SG-000002</code>…
              </p>
            </div>
            <div>
              <Label>Quantidade</Label>
              <Input type="number" min={1} max={500} value={quantidade}
                onChange={(e) => setQuantidade(parseInt(e.target.value) || 0)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Gerando..." : `Gerar ${quantidade} TechPass`}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3">Último lote gerado</h3>
          {resultado.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum lote gerado nesta sessão.</p>
          ) : (
            <div className="max-h-[440px] overflow-auto rounded-lg border border-border bg-muted/30">
              <ul className="divide-y divide-border text-sm font-mono">
                {resultado.map((s) => (
                  <li key={s} className="px-4 py-2 flex justify-between">
                    <span>{s}</span>
                    <span className="text-primary text-xs">/techpass/{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}