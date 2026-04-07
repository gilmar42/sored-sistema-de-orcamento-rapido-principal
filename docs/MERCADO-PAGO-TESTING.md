# Mercado Pago - Guia de Testes e Validação para Produção

Este documento detalha como testar e validar completamente a integração do Mercado Pago antes e depois de ir a produção.

---

## 🧪 1. Testes Locais - Ambiente de Sandbox

### 1.1 Setup Inicial

```bash
# 1. Clone e instale
git clone seu-repo
cd sord-sistema-de-or-amento-rapido-principal-main
npm install

# 2. Configure .env com credenciais SANDBOX do MP
# Obtenha em: https://www.mercadopago.com.br/developers/panel/credentials
# Selecione TAB "Sandbox"

cp backend/.env.example backend/.env
# Edite backend/.env com:
# MP_ACCESS_TOKEN=APP_USR-<sandbox-token>
# MERCADO_PAGO_PUBLIC_KEY=APP_USR-<sandbox-public>
# MERCADO_PAGO_WEBHOOK_SECRET=<sandbox-secret>

# 3. Inicie o sistema
npm run dev:full

# 4. Acesse em desenvolvimento
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

### 1.2 Dados de Teste - Sandbox

O Mercado Pago fornece cartões de teste:

| Tipo | Número | CVV | Data |
|------|--------|-----|------|
| Mastercard (Sucess) | `5130903214662000` | `123` | 11/25 |
| Visa (Success) | `4509953546623704` | `123` | 11/25 |
| Visa (Failure) | `4539530289278948` | `123` | 11/25 |
| Visa (Pending) | `4024007134432310` | `123` | 11/25 |

> Nota: Use qualquer data futura. CPF pode ser qualquer número válido (ex: 12345678901).

---

## 📝 2. Testes Unitários

### 2.1 Rodar Testes Existentes

```bash
# Rodar todos os testes
npm test

# Rodar apenas testes de pagamento
npm test -- payment

# Rodar com watch mode (dev)
npm test -- --watch

# Gerar coverage
npm test -- --coverage
```

### 2.2 Estrutura de Teste de Pagamento

```javascript
// backend/test/payment.test.js exemplo

const request = require('supertest');
const app = require('../src/app');

describe('Payment Integration', () => {
  it('should create a subscription', async () => {
    const res = await request(app)
      .post('/api/payments/subscriptions')
      .send({
        email: 'test@example.com',
        token: 'valid-card-token',
        planType: 'monthly'
      });
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('mpSubscriptionId');
  });

  it('should reject invalid plan type', async () => {
    const res = await request(app)
      .post('/api/payments/subscriptions')
      .send({
        email: 'test@example.com',
        token: 'valid-token',
        planType: 'invalid'
      });
    
    expect(res.status).toBe(400);
  });

  it('should handle network errors gracefully', async () => {
    // Mock MP API failure
    jest.spyOn(MP, 'preApproval').mockRejectedValueOnce(
      new Error('Network error')
    );
    
    const res = await request(app)
      .post('/api/payments/subscriptions')
      .send({ email: 'test@test.com', token: 'token', planType: 'monthly' });
    
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});
```

---

## 🔄 3. Testes de Integração

### 3.1 Fluxo Completo de Pagamento

```bash
# Teste end-to-end completo

# 1. Abra frontend em navegador
open http://localhost:3000

# 2. Clique em "Assinar Plano"

# 3. Preencha formulário:
#    Email: seu-email@test.com
#    Número: 4509953546623704
#    Holder: Test User
#    Exp: 11/25
#    CVV: 123

# 4. Clique em "Assinar"

# 5. Aguarde resposta
# Deve redirecionar para sucesso após 2-3 segundos

# 6. Verifique pelo painel:
# - Acesse https://www.mercadopago.com.br/admin
# - Vá em "Movimientos" (Movement)
# - Deve aparecer a transação com status "Aprobada"
```

### 3.2 Teste de Webhook

```bash
# 1. Webhook local com ngrok (simula URL pública)

# Instale ngrok
brew install ngrok  # macOS
# ou download de https://ngrok.com

# 2. Inicie ngrok
ngrok http 5000
# Output:
# Forwarding: https://abc123.ngrok.io -> http://localhost:5000

# 3. Configure no Mercado Pago:
# Webhook URL: https://abc123.ngrok.io/api/payments/webhooks

# 4. Faça um pagamento de teste

# 5. Verifique se webhook foi recebido:
tail -f ngrok-logs.txt
# Deve ver POST /api/payments/webhooks
```

### 3.3 Teste de Assinatura Recorrente

```bash
# Simule renovação de assinatura (próximo período de cobrança)

# No painel do Mercado Pago em sandbox:
# 1. Find sua subscription em "Preapprovals"
# 2. Simule cobrança (caso a ação exista)
# 3. Ou aguarde data de próxima cobrança automática

# Verifique no banco:
mysql -h seu-host-mysql -u seu-usuario -p sored
> SELECT * FROM payments WHERE status='approved' LIMIT 1;
```

---

## ✔️ 4. Testes de Validação de Produção

### 4.1 Validação Pré-Deploy

```bash
# Script completo de validação
npm run validate:production

# Ou manualmente:

# 1. Teste de Build
npm run build
# Não deve ter erros

# 2. Teste de Tipos TypeScript
npx tsc --noEmit
# Não deve ter erros de tipo

# 3. Teste de Lint
npm run lint
# Não deve ter warnings críticos

# 4. Teste de Unit Tests
npm test -- --coverage --watchAll=false
# Cobertura deve estar > 70%

# 5. Teste de Segurança
npm audit
# Não deve ter vulnerabilidades críticas

# 6. Teste de Build de Produção
npm run preview
# Acesse http://localhost:4173
# Frontend deve carregar normalmente
```

### 4.2 Health Check Script

```bash
#!/bin/bash
# scripts/health-check.sh

echo "🔍 Health Check - Mercado Pago Setup"
echo ""

# 1. Variáveis de ambiente
echo "✓ Checking environment variables..."
required_vars=(
  "MP_ACCESS_TOKEN"
  "MERCADO_PAGO_PUBLIC_KEY"
  "MERCADO_PAGO_WEBHOOK_SECRET"
  "JWT_SECRET"
  "DB_HOST"
  "DB_USER"
  "DB_PASSWORD"
  "DB_NAME"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "  ❌ Missing: $var"
  else
    echo "  ✅ $var configured"
  fi
done

echo ""

# 2. Testes
echo "✓ Running tests..."
npm test -- --passWithNoTests --watchAll=false

echo ""

# 3. Build
echo "✓ Building frontend..."
npm run build

echo ""
echo "✅ Health check complete!"
```

```bash
# Execute
chmod +x scripts/health-check.sh
./scripts/health-check.sh
```

---

## 🌍 5. Testes em Staging (Pré-Produção)

### 5.1 Ambiente de Staging

```bash
# Deploy para staging com credenciais de PRODUÇÃO (mas URL diferente)

# 1. Setup staging server
# Você pode usar staging branch ou ambiente de homologação

# 2. Configure com credenciais PRODUÇÃO do MP
# Mas use staging frontend URL:
VITE_FRONTEND_URL=https://staging.seu-dominio.com

# 3. Execute testes de produção em staging
npm run validate:production

# 4. Teste pagamento real em staging
# Use cartão de teste com dados reais de payer
```

### 5.2 Monitoramento de Staging

```bash
# Monitore logs em tempo real
# Consulte os logs no painel da hospedagem

# Ou use Sentry se configurado:
# https://sentry.io/organizations/seu-org/issues/

# Monitore webhooks em staging:
curl -X GET https://staging-seu-dominio.com/api/health
# Deve retornar 200 com mensagem de sucesso
```

---

## ✅ 6. Testes de Cenários Críticos

### 6.1 Teste de Falha de Cartão

```javascript
// frontend/test/payment-scenarios.test.tsx

describe('Payment Failure Scenarios', () => {
  it('should handle rejected card', async () => {
    // Use cartão de teste que rejeita: 4539530289278948
    const result = await createSubscription({
      email: 'test@test.com',
      cardToken: rejectCardToken,
      planType: 'monthly'
    });
    
    expect(result.error).toBe('Card rejected');
    expect(result.status).toBe('rejected');
  });

  it('should handle timeout error', async () => {
    // Simule timeout de API
    jest.spyOn(api, 'createSubscription')
      .mockRejectedValueOnce(new TimeoutError());
    
    const result = await createSubscription({...});
    
    expect(result.error).toContain('timeout');
  });

  it('should retry failed webhook', async () => {
    // Simule webhook que falha na primeira tentativa
    let attempts = 0;
    jest.spyOn(server, 'processWebhook', 'get').mockImplementation(() => {
      attempts++;
      if (attempts === 1) throw new Error('Server error');
      return { success: true };
    });
    
    // Mercado Pago tetará até 3x
    // Esperamos que passe na segunda tentativa
  });
});
```

### 6.2 Teste de Concorrência

```javascript
// Simule múltiplos pagamentos simultâneos

async function testConcurrency() {
  const payments = Array(10).fill(null).map((_, i) => 
    createSubscription({
      email: `user${i}@test.com`,
      cardToken: validToken,
      planType: 'monthly'
    })
  );
  
  const results = await Promise.all(payments);
  
  // Todos devem ter sucesso
  expect(results.every(r => r.status === 'approved')).toBe(true);
  
  // Database deve estar consistente
  const [rows] = await db.query('SELECT COUNT(*) AS count FROM subscriptions');
  expect(rows[0].count).toBe(10);
}
```

### 6.3 Teste de Rate Limiting

```javascript
// Verifique se rate limiting está funcionando

async function testRateLimit() {
  const attempts = Array(10).fill(null).map(() =>
    createSubscription({
      email: 'test@test.com',
      cardToken: validToken,
      planType: 'monthly'
    })
  );
  
  const results = await Promise.allSettled(attempts);
  
  // Deve falhar após limite (configurado em rate limiter)
  const failures = results.filter(r => r.status === 'rejected');
  expect(failures.length).toBeGreaterThan(0);
}
```

---

## 🚀 7. Testes Pós-Deploy (Produção)

### 7.1 Smoke Test - Logo Após Deploy

```bash
#!/bin/bash
# Run dentro de 10 minutos após deploy em produção

echo "🔥 Smoke Test - Mercado Pago Production"
echo ""

# 1. Health check
echo "✓ Frontend:"
curl -s https://seu-dominio.com | grep -q "SORED" && echo "  ✅ Frontend up" || echo "  ❌ Frontend down"

echo ""
echo "✓ Backend:"
curl -s https://seu-backend.com/api/health && echo "  ✅ Backend up" || echo "  ❌ Backend down"

echo ""
echo "✓ Database:"
# Tente conectar MySQL
mysql -h seu-host-mysql -u seu-usuario -p sored -e "SELECT 1;" && echo "  ✅ MySQL up" || echo "  ❌ MySQL down"

echo ""
echo "✓ Mercado Pago:"
# Tente criar preferência
curl -s -X POST https://seu-backend.com/api/payments/pix \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "planType": "monthly"}' | grep -q "paymentId" && echo "  ✅ MP connected" || echo "  ❌ MP down"

echo ""
echo "✅ Smoke test complete!"
```

### 7.2 Transação Real de Teste

```javascript
// Test payment com cartão de crédito REAL em produção

async function productionTest() {
  const response = await fetch('https://seu-backend.com/api/payments/subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'suporte@seu-empresa.com',
      cardToken: realCardToken, // Use seu cartão real
      planType: 'monthly'
    })
  });
  
  const result = await response.json();
  
  console.log('✅ Production test payment:', {
    subscriptionId: result.mpSubscriptionId,
    status: result.status,
    timestamp: new Date().toISOString()
  });
  
  // Verifique no painel do Mercado Pago
  // Deve aparecer em Movimientos na próxima atualização
}
```

### 7.3 Monitoramento Contínuo (24h)

```javascript
// Monitor e alerta para problemas

async function monitorProduction() {
  const checks = setInterval(async () => {
    try {
      // 1. Health check
      const health = await fetch('https://seu-backend.com/api/health');
      if (!health.ok) throw new Error(`Health check failed: ${health.status}`);
      
      // 2. Database check
      const dbStatus = await fetch('https://seu-backend.com/api/db-health');
      if (!dbStatus.ok) throw new Error('Database unavailable');
      
      // 3. Webhook status
      const webhooks = await getRecentWebhooks();
      const failureRate = webhooks.filter(w => w.status === 'failed').length / webhooks.length;
      if (failureRate > 0.1) console.warn(`⚠️ Webhook failure rate: ${failureRate * 100}%`);
      
      console.log('✅ All systems operational');
    } catch (err) {
      console.error('❌ ALERT:', err.message);
      // Envie notificação (Slack, PagerDuty, etc)
      notifyAdmin(err);
    }
  }, 5 * 60 * 1000); // A cada 5 minutos
  
  return () => clearInterval(checks);
}

// Inicie monitoramento
const stopMonitoring = await monitorProduction();

// Para quando necessário
// stopMonitoring();
```

---

## 📊 8. Relatório de Testes

### 8.1 Template de Relatório

```markdown
# Mercado Pago - Relatório de Testes de Produção

**Data**: 2024-02-03
**Ambiente**: Production
**Status**: ✅ APROVADO

## Resultados dos Testes

| Teste | Resultado | Detalhes |
|-------|-----------|----------|
| Unit Tests | ✅ Pass (86 casos) | Cobertura: 82% |
| Integration Tests | ✅ Pass | Webhook simulado: OK |
| Load Test | ✅ Pass | 100 req/s: OK |
| Security Audit | ✅ Pass | 0 vulnerabilidades críticas |
| Webhook Validation | ✅ Pass | Assinatura HMAC: OK |
| Payment Flow | ✅ Pass | Cartão de teste: Aprovado |
| Error Handling | ✅ Pass | Falhas tratadas corretamente |

## Transações de Teste

| Descrição | Status | ID | Timestamp |
|-----------|--------|----|-----------| | Cartão Visa teste | Aprovado | PAY_12345 | 2024-02-03T10:30:00Z |
| Webhook simulado | Recebido | WH_67890 | 2024-02-03T10:31:00Z |

## Conclusão

Sistema pronto para produção. Todos os testes passaram com sucesso.

**Aprovado por**: Seu Nome
**Data**: 2024-02-03
```

---

## 📋 Checklist Final de Testes

- [ ] Testes unitários passam: `npm test`
- [ ] Build de produção compila: `npm run build`
- [ ] Validação de produção passa: `npm run validate:production`
- [ ] Transação de teste bem-sucedida em sandbox
- [ ] Webhook recebido e processado em sandbox
- [ ] Rate limiting testado
- [ ] Erro handling testado
- [ ] Deploy em staging bem-sucedido
- [ ] Smoke test pós-deploy passou
- [ ] Transação real processada em produção
- [ ] Webhook recebido em produção
- [ ] Monitoramento ativo
- [ ] Alertas configurados
- [ ] Suporte notificado
- [ ] Documentação atualizada

---

## 🎓 Next Steps

1. ✅ Completar testes local em sandbox
2. ✅ Deploy em staging com credenciais de produção
3. ✅ Transação de teste em staging
4. ✅ Deploy em produção
5. ✅ Smoke test pós-deploy
6. ✅ Transação real em produção
7. ✅ Monitoramento 24h

**Status**: Pronto para testes! 🚀
