# Campos do `.env` de Produção

Clique no campo para ir direto à explicação.

Veja também o checklist prático de deploy em [docs/HOSTINGER-MYSQL-CHECKLIST.md](../docs/HOSTINGER-MYSQL-CHECKLIST.md).

## Índice

- [`NODE_ENV`](#node_env)
- [`PORT`](#port)
- [`JWT_SECRET`](#jwt_secret)
- [`DB_HOST`](#db_host)
- [`DB_PORT`](#db_port)
- [`DB_USER`](#db_user)
- [`DB_PASSWORD`](#db_password)
- [`DB_NAME`](#db_name)
- [`FRONTEND_URL`](#frontend_url)
- [`FRONTEND_URL_PRODUCTION`](#frontend_url_production)
- [`MERCADO_PAGO_ACCESS_TOKEN`](#mercado_pago_access_token)
- [`MP_ACCESS_TOKEN`](#mp_access_token)
- [`MERCADO_PAGO_PUBLIC_KEY`](#mercado_pago_public_key)
- [`MERCADO_PAGO_WEBHOOK_SECRET`](#mercado_pago_webhook_secret)
- [`MP_SUCCESS_URL`](#mp_success_url)
- [`MP_FAILURE_URL`](#mp_failure_url)
- [`MP_PENDING_URL`](#mp_pending_url)
- [`MERCADO_PAGO_WEBHOOK_URL`](#mercado_pago_webhook_url)
- [`CURRENCY`](#currency)
- [`PAYMENT_ACTIVATION_AMOUNT`](#payment_activation_amount)

## `NODE_ENV`

Use `production` no ambiente real. Isso ativa o comportamento de produção do backend.

## `PORT`

Porta em que o backend vai escutar. O padrão do projeto é `9000`.

## `JWT_SECRET`

Segredo usado para assinar tokens de autenticação. Deve ser forte e diferente em cada ambiente.

## `DB_HOST`

Host do MySQL. Não inclua `:3306` aqui. A porta fica em `DB_PORT`.

## `DB_PORT`

Porta do MySQL. O valor padrão é `3306`.

## `DB_USER`

Usuário do banco de dados.

## `DB_PASSWORD`

Senha do banco de dados.

## `DB_NAME`

Nome do banco de dados que o backend vai usar.

## `FRONTEND_URL`

URL do frontend usada para CORS e para links de ambiente.

## `FRONTEND_URL_PRODUCTION`

URL pública do frontend em produção. Deve apontar para o domínio real.

## `MERCADO_PAGO_ACCESS_TOKEN`

Token de acesso do Mercado Pago para o backend.

## `MP_ACCESS_TOKEN`

Alias compatível com o token do Mercado Pago. O projeto aceita os dois nomes.

## `MERCADO_PAGO_PUBLIC_KEY`

Chave pública usada no frontend para integrações de pagamento.

## `MERCADO_PAGO_WEBHOOK_SECRET`

Segredo usado para validar webhooks do Mercado Pago.

## `MP_SUCCESS_URL`

URL para redirecionamento quando o pagamento for aprovado.

## `MP_FAILURE_URL`

URL para redirecionamento quando o pagamento falhar.

## `MP_PENDING_URL`

URL para redirecionamento quando o pagamento ficar pendente.

## `MERCADO_PAGO_WEBHOOK_URL`

URL pública do webhook no backend.

## `CURRENCY`

Moeda usada no checkout. Neste projeto, `BRL`.

## `PAYMENT_ACTIVATION_AMOUNT`

Valor da ativação do pagamento.
