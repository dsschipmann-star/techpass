# TechPass Premium

MVP web da TechSoft para empresas parceiras emitirem e validarem TechPass Premium com QR Code, ativação presencial, clientes, cashback, indicações e validação interna.

## Stack

- React
- TypeScript
- Tailwind CSS
- Supabase
- Vite

## Rodar localmente

1. npm install
2. npm run dev
3. Acesse o endereço mostrado no terminal.

Rota pública de exemplo: /techpass/TP-SG-000001

## GitHub + Lovable

Este diretório já está pronto para virar um repositório GitHub. Depois de subir o projeto, importe o repositório na Lovable e conecte as variáveis do Supabase no ambiente da Lovable.

## Supabase

1. Crie um projeto no Supabase.
2. Execute supabase/schema.sql no SQL Editor.
3. Opcionalmente execute supabase/seed.sql para carregar dados de demonstração.
4. Copie .env.example para .env e preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.

Sem variáveis de ambiente, o MVP roda em modo demonstração com localStorage, preservando os fluxos principais para validação do produto. Com as variáveis configuradas, o app carrega e sincroniza dados nas tabelas do Supabase.

## Fluxos do MVP

- Cadastro e inativação de empresas parceiras.
- Geração de TechPass em lote com serial único e QR Code permanente.
- Exportação de QR Codes em PNG, cópia de serial e abertura da página pública.
- Página pública por serial com mensagens por status.
- Ativação presencial apenas pelo painel administrativo.
- Regra de um TechPass ativo por CPF.
- Gestão de cliente vinculado, cashback, indicações e trocas de película.
- Tela interna de validação com ações rápidas para funcionário TechSoft.

## Dados iniciais

O MVP já vem com as empresas Super Geeks e Fight Core e alguns TechPass de demonstração.
