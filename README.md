# TechPass Premium

Front-end MVP da Rede TechPass para a TechSoft, criado com React, TypeScript, Tailwind CSS e Supabase.

## Rotas principais

- `/` - landing page institucional Rede TechPass.
- `/techpass/:serial` - página pública do QR Code do voucher TechPass.
- `/admin` - painel administrativo simples com login local de MVP.

## Fluxo do cliente

1. Cliente compra o voucher TechPass em uma empresa parceira.
2. Escaneia o QR Code permanente.
3. Informa dados e o código secreto do voucher.
4. O TechPass fica com status `PENDENTE_ATIVACAO`.
5. A ativação final só acontece presencialmente na TechSoft, com documento oficial com foto.

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
