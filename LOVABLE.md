# Lovable - TechPass Premium

Use este projeto como MVP React/Vite importado pelo GitHub.

## Rotas

- `/` landing pública Rede TechPass.
- `/techpass/TP-SG-000001` exemplo de QR Code com TechPass disponível.
- `/techpass/TP-SG-000002` exemplo de TechPass ativo.
- `/admin` painel administrativo MVP.

## Regras críticas

- Cliente não ativa sozinho.
- Cliente apenas solicita ativação com o código físico secreto.
- Código físico só pode ser usado uma vez.
- CPF não pode ter TechPass ativo ou pendente duplicado.
- Ativação final é feita somente no painel administrativo, após conferência de documento oficial com foto.

## Build

```bash
npm install
npm run build
```
