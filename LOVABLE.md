# Guia para continuar na Lovable

Projeto: TechPass Premium, clube de benefícios da TechSoft.

## Regras que devem permanecer

- Cliente não ativa TechPass pelo site.
- Ativação apenas presencial por funcionário TechSoft.
- Exigir documento oficial com foto antes de ativar ou liberar benefícios.
- Mesmo CPF não pode ter dois TechPass ativos.
- Mesmo TechPass não pode ser ativado duas vezes.
- QR Code é permanente e aponta para /techpass/:serial.
- Empresa parceira inativa suspende TechPass vinculados.

## Conectar Supabase

1. Rodar supabase/schema.sql.
2. Opcional: rodar supabase/seed.sql.
3. Configurar variáveis no ambiente da Lovable:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY

## Principais telas

- Dashboard
- Empresas parceiras
- Gerar TechPass em lote
- Exportar QR Codes
- Ativar TechPass
- Validar TechPass
- Cashback
- Indicações
- Clientes
- Página pública /techpass/:serial

## Próximos passos recomendados

- Adicionar autenticação de funcionários TechSoft.
- Criar políticas RLS antes de produção.
- Separar permissões entre painel administrativo e página pública.
- Melhorar máscara de CPF/telefone e validação de campos.
