import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Boxes,
  QrCode,
  CheckCircle2,
  ShieldCheck,
  Wallet,
  Gift,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/empresas", label: "Empresas parceiras", icon: Building2 },
  { to: "/gerar", label: "Gerar TechPass", icon: Boxes },
  { to: "/qrcodes", label: "QR Codes", icon: QrCode },
  { to: "/ativar", label: "Ativar TechPass", icon: CheckCircle2 },
  { to: "/validar", label: "Validar TechPass", icon: ShieldCheck },
  { to: "/cashback", label: "Cashback", icon: Wallet },
  { to: "/indicacoes", label: "Indique e Ganhe", icon: Gift },
  { to: "/clientes", label: "Clientes", icon: Users },
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const current = nav.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)));
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-64 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col">
        <div className="px-5 py-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg gradient-neon flex items-center justify-center glow-neon">
              <Zap className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="font-bold tracking-tight">TechPass</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-primary">Premium</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-primary font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 text-[10px] text-muted-foreground border-t border-sidebar-border">
          TechSoft · MVP
        </div>
      </aside>
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-border px-8 flex items-center justify-between bg-background/60 backdrop-blur">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{current?.label ?? "Painel"}</h1>
            <p className="text-xs text-muted-foreground">Clube de benefícios TechPass Premium</p>
          </div>
          <div className="text-xs text-muted-foreground hidden md:block">
            Atendimento presencial · TechSoft
          </div>
        </header>
        <div className="flex-1 p-8 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}