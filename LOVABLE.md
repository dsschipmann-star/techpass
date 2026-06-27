# Lovable - TechPass Premium

Use este projeto como MVP React/Vite importado pelo GitHub.

## Rotas

- `/` landing pública Rede TechPass.
- `/seja-parceiro` landing comercial para captação de empresas parceiras.
- `/techpass/TP-SG-000001` exemplo de QR Code com TechPass disponível.
- `/techpass/TP-SG-000002` exemplo de TechPass ativo.
- `/login` login do cliente por CPF, WhatsApp ou código TechPass.
- `/cliente/dashboard` área do cliente com menu e login demo.
- `/parceiro/login` login da empresa parceira.
- `/parceiro/dashboard` painel restrito por empresa parceira.
- `/empresa` painel de empresa parceira filtrado por empresa.
- `/admin` painel administrativo MVP.

## Regras críticas

- Cliente não ativa sozinho.
- Cliente apenas solicita ativação com o código secreto do voucher.
- Código do voucher só pode ser usado uma vez.
- CPF não pode ter TechPass ativo ou pendente duplicado.
- Ativação final é feita somente no painel administrativo, após conferência de documento oficial com foto.
- Solicitações de serviços e benefícios ficam vinculadas à empresa responsável.
- Concluir troca de película reduz automaticamente o saldo de 6 para 0, sem permitir negativo.
- Apenas TechPass ativo solicita ofertas exclusivas.
- Leads de ofertas são enviados para a empresa responsável.
- Fight Core tem bônus de 6 meses quando houver 15 contatos enviados e pelo menos 1 conversão.
- Parceiro só vê leads, solicitações, ofertas, benefícios e indicações da própria empresa.
- Oferta criada ou editada por parceiro fica como `PENDENTE_APROVACAO`.
- Apenas ofertas `ativo` de empresas `ativa` aparecem para clientes.
- Admin pode aprovar, reprovar, solicitar ajuste ou desativar ofertas.
- A landing principal deve apontar para `/seja-parceiro` como CTA de captação B2B.
- `/seja-parceiro` é front-end estático nesta etapa, sem backend ou login funcional.

## Acessos parceiros demo

- `techsoft@parceiro.com` / `123456`
- `supergeeks@parceiro.com` / `123456`
- `fightcore@parceiro.com` / `123456`

## Build

```bash
npm install
npm run build
```
