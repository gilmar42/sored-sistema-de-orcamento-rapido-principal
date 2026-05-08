# Teste de integração Mercado Pago - SORED

## 1. Criar preferência de pagamento

```
curl -X POST http://localhost:5000/api/payments/preference \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: teste-123" \
  -d '{
    "planType": "monthly",
    "customerEmail": "teste@exemplo.com"
  }'
```

## 2. Consultar status do pagamento

Substitua <PREFERENCE_ID> pelo valor retornado no passo 1.

```
curl http://localhost:5000/api/payments/status/<PREFERENCE_ID>
```

## 3. Simular webhook Mercado Pago

Monte o payload conforme esperado pelo backend. Exemplo:

```
PAYLOAD='{
  "type": "payment",
  "data": { "id": "123456789" },
  "action": "payment.created"
}'

# Gere a assinatura HMAC SHA256
TIMESTAMP=$(date +%s)
SECRET="SUA_MP_WEBHOOK_SECRET"
URL="/api/payments/webhooks"
SIGNATURE=$(echo -n "$TIMESTAMP$URL$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')

curl -X POST http://localhost:5000/api/payments/webhooks \
  -H "x-signature: ts=$TIMESTAMP, v1=$SIGNATURE" \
  -H "x-event-type: payment" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
```

> Altere SECRET para o valor real de sua variável de ambiente MERCADO_PAGO_WEBHOOK_SECRET.

---

Se precisar de um script automatizado em Node.js ou Jest, avise!
