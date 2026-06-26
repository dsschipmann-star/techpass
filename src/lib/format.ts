export const fmtBRL = (v: number | string | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(v ?? 0)
  );

export const fmtDate = (v: string | Date | null | undefined) => {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("pt-BR");
};

export const fmtDateTime = (v: string | Date | null | undefined) => {
  if (!v) return "—";
  return new Date(v).toLocaleString("pt-BR");
};

export const statusLabel: Record<string, string> = {
  AGUARDANDO_ATIVACAO: "Aguardando ativação",
  ATIVO: "Ativo",
  SUSPENSO: "Suspenso",
  CANCELADO: "Cancelado",
  EXPIRADO: "Expirado",
};

export const BENEFICIOS = [
  "30% OFF em mão de obra",
  "15% OFF em acessórios",
  "6 trocas de película durante 12 meses",
  "Consultoria gratuita para montagem de PC gamer",
  "Limpeza gratuita de alto-falantes e microfones",
  "Cashback exclusivo",
  "Programa Indique e Ganhe",
];