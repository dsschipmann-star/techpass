# TechPass Premium

Front-end MVP da Rede TechPass para a TechSoft, criado com React, TypeScript, Tailwind CSS e Supabase.

## Rotas principais

- `/` - landing page institucional Rede TechPass.
- `/techpass/:serial` - página pública do QR Code do voucher TechPass.
- `/cliente` - área do cliente TechPass com dashboard, benefícios e solicitações.
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
- Admin gerencia solicitações, benefícios, serviços, brindes, cashback, indicações e regras de uso.
- Empresas parceiras visualizam apenas suas solicitações e podem concluir atendimentos.

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
