# Integração Mercado Pago em Produção (SORED)

Este documento descreve os passos para ativar a integração com o Mercado Pago em **produção**.

## 1) Credenciais de Produção

No painel do Mercado Pago:
- Ative o modo **Produção**.
- Gere as chaves:
  - `MP_ACCESS_TOKEN` (backend)
  - `MP_PUBLIC_KEY` (frontend)

## 2) Variáveis de Ambiente

### Backend
Defina no ambiente (ex.: `.env` do servidor):
- `MP_ACCESS_TOKEN` (ou `MERCADO_PAGO_ACCESS_TOKEN`)
- `MERCADO_PAGO_WEBHOOK_SECRET` (se for validar assinatura HMAC)
- `MP_SUCCESS_URL` (URL de retorno pós-pagamento)
- `PORT`

### Frontend
Defina no ambiente de build (ex.: Hostinger/Netlify/Render):
- `VITE_API_URL` (URL pública do backend, ex.: `https://api.seudominio.com`)
- `VITE_MP_PUBLIC_KEY`

## 3) Endpoints Ativos

### Assinaturas (Cartão)
- `POST /api/payments/subscriptions`
- `GET  /api/payments/subscriptions/:id`

### PIX
- `POST /api/payments/pix`
- `GET  /api/payments/pix/status/:paymentId`

### Webhooks
- `POST /api/payments/webhooks`

O webhook processa atualizações de assinaturas e pagamentos. Configure no painel os eventos de pré-aprovação e pagamentos autorizados. O backend consulta o status diretamente na API do Mercado Pago antes de atualizar o acesso.

Os planos mensal e anual são criados no Mercado Pago e persistidos no banco na primeira chamada a `GET /api/payments/plans`. A assinatura de cartão usa a data de encerramento do trial cadastrado no SORED como início da cobrança; assim, cadastrar o cartão durante o trial não reinicia os cinco dias.

O Pix é um pagamento avulso e não permite cobrança recorrente automática. No período de trial, a tela prioriza assinatura por cartão. Pagamentos Pix aprovados liberam somente o período comprado e o acesso é bloqueado quando esse período vencer sem renovação.

## 4) URLs e Webhooks no Mercado Pago

No painel do Mercado Pago, configure o webhook:
- **URL**: `https://SEU_BACKEND_URL/api/payments/webhooks`
- **Eventos**: assinaturas/preapproval

> Garanta que o backend esteja acessível publicamente via HTTPS.

## 5) Ajustes no Código

### Backend
Atualize a URL de retorno (`back_url`) no arquivo:
- [backend/src/routes/payment.js](backend/src/routes/payment.js)

Exemplo (produção):
- `https://SEU_FRONTEND_URL/sucesso`

### CORS
Inclua o domínio do frontend em:
- [backend/src/app.js](backend/src/app.js)

## 6) Checklist de Produção

- [ ] Backend com HTTPS e URL pública
- [ ] `MP_ACCESS_TOKEN` válido em produção
- [ ] `VITE_MP_PUBLIC_KEY` válido em produção
- [ ] `VITE_API_URL` apontando para o backend público
- [ ] Webhook configurado no painel Mercado Pago
- [ ] CORS liberando domínio do frontend
- [ ] `back_url` atualizado

## 7) Referência de Testes Locais

Veja exemplos de chamadas cURL:
- [backend/test/mercadopago_integration_curl.md](backend/test/mercadopago_integration_curl.md)
