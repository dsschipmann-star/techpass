# TechPass Premium

Front-end MVP da Rede TechPass para a TechSoft, criado com React, TypeScript, Tailwind CSS e Supabase.

## Rotas principais

- `/` - landing page institucional Rede TechPass.
- `/seja-parceiro` - landing page comercial para empresas interessadas em entrar na Rede TechPass.
- `/techpass/:serial` - página pública do QR Code do voucher TechPass.
- `/login` - login do cliente por CPF, WhatsApp ou código TechPass.
- `/cliente/dashboard` - área do cliente TechPass com menu, ofertas, TechCash, indicações e solicitações.
- `/parceiro/login` - login exclusivo para empresas parceiras.
- `/parceiro/dashboard` - painel do parceiro com métricas, ofertas, benefícios, leads, solicitações, indicações e configurações.
- `/empresa` - painel da empresa parceira para acompanhar solicitações.
- `/admin` - painel administrativo simples com login local de MVP.

## Fluxo do cliente

1. Cliente compra o voucher TechPass em uma empresa parceira.
2. Escaneia o QR Code permanente.
3. Informa dados e o código secreto do voucher.
4. O TechPass fica com status `PENDENTE_ATIVACAO`.
5. A ativação final só acontece presencialmente na TechSoft, com documento oficial com foto.

## Central de benefícios

- Cliente acompanha status, validade, TechCash, películas restantes, código de indicação e histórico.
- Cliente solicita benefícios inclusos e serviços com desconto para empresas parceiras.
- Cliente solicita ofertas Fight Core e Super Geeks; cada clique gera um lead para a empresa responsável.
- Fight Core possui regra especial de indicação: 15 contatos enviados + 1 conversão podem liberar 6 meses de bônus.
- Admin gerencia solicitações, benefícios, serviços, brindes, cashback, indicações e regras de uso.
- Empresas parceiras entram pelo acesso parceiro, visualizam apenas dados da própria empresa e podem criar ofertas que ficam pendentes de aprovação.
- Admin TechPass aprova, reprova, solicita ajuste ou desativa ofertas antes de aparecerem para clientes.
- Landing "Seja Parceiro TechPass" apresenta vouchers, pré-formulários, WhatsApp com mensagem pronta, painel parceiro, exemplos e planos conceituais.

## Acessos demo de parceiros

- TechSoft: `techsoft@parceiro.com` / `123456`
- Super Geeks: `supergeeks@parceiro.com` / `123456`
- Fight Core: `fightcore@parceiro.com` / `123456`

## Scripts

```bash
npm install
npm run dev
npm run build
```

## Supabase

Execute `supabase/schema.sql` e, opcionalmente, `supabase/seed.sql` no SQL Editor do Supabase.

Variáveis:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```
