import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Empresas from "./pages/admin/Empresas";
import GerarLote from "./pages/admin/GerarLote";
import QrCodes from "./pages/admin/QrCodes";
import Ativar from "./pages/admin/Ativar";
import Validar from "./pages/admin/Validar";
import Cashback from "./pages/admin/Cashback";
import Indicacoes from "./pages/admin/Indicacoes";
import Clientes from "./pages/admin/Clientes";
import TechPassPublic from "./pages/TechPassPublic";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/techpass/:serial" element={<TechPassPublic />} />
          <Route element={<AdminLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/empresas" element={<Empresas />} />
            <Route path="/gerar" element={<GerarLote />} />
            <Route path="/qrcodes" element={<QrCodes />} />
            <Route path="/ativar" element={<Ativar />} />
            <Route path="/validar" element={<Validar />} />
            <Route path="/cashback" element={<Cashback />} />
            <Route path="/indicacoes" element={<Indicacoes />} />
            <Route path="/clientes" element={<Clientes />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
