# Lovable - TechPass Premium

Use este projeto como MVP React/Vite importado pelo GitHub.

## Rotas

- `/` landing pública Rede TechPass.
- `/techpass/TP-SG-000001` exemplo de QR Code com TechPass disponível.
- `/techpass/TP-SG-000002` exemplo de TechPass ativo.
- `/login` login do cliente por CPF, WhatsApp ou código TechPass.
- `/cliente/dashboard` área do cliente com menu e login demo.
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

## Build

```bash
npm install
npm run build
```
