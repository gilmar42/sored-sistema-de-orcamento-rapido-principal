# Mercado Pago - Guia de Segurança para Produção

Este documento detalha as melhores práticas de segurança para proteger pagamentos em produção.

---

## 🔐 1. Proteção de Credenciais

### 1.1 Nunca Commite Credenciais

```bash
# ❌ ERRADO - Nunca faça isso
git add backend/.env
git commit -m "add mp credentials"

# ✅ CORRETO
# Adicione a .gitignore
echo "backend/.env" >> .gitignore
echo "frontend/.env" >> .gitignore
echo ".env.local" >> .gitignore

# Configure segredos na plataforma de deploy
# Hospedagem: Painel > Settings > Environment Variables
# Render: Painel > Environment
# AWS: AWS Secrets Manager
```

### 1.2 Rotação de Credenciais

```bash
# A cada 90 dias em produção:
# 1. No painel do Mercado Pago, gere novo Access Token
# 2. Atualize em sua plataforma de deploy
# 3. Teste que ainda funciona
# 4. Aguarde 10 minutos
# 5. Delete a credencial antiga
```

### 1.3 Environment Isolation

```javascript
// backend/src/app.js
const isProduction = process.env.NODE_ENV === 'production';

// Em produção, use credenciais diferentes
const mpConfig = isProduction ? 
  { accessToken: process.env.MP_ACCESS_TOKEN_PROD } :
  { accessToken: process.env.MP_ACCESS_TOKEN_DEV };
```

---

## 🔒 2. HTTPS e Certificados

### 2.1 Certificado SSL Válido

```nginx
# nginx.conf - exemplo
server {
    listen 443 ssl http2;
    server_name seu-backend.com;

    # Certificado Let's Encrypt (gratuito)
    ssl_certificate /etc/letsencrypt/live/seu-backend.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seu-backend.com/privkey.pem;

    # Configuração de segurança
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
}

# Redirecione HTTP para HTTPS
server {
    listen 80;
    server_name seu-backend.com;
    return 301 https://$server_name$request_uri;
}
```

### 2.2 Headers de Segurança

```javascript
// backend/src/app.js - Adicione middleware de segurança

const helmet = require('helmet');

// Instale: npm install helmet

app.use(helmet());

// Headers importantes
app.use((req, res, next) => {
  // Força HTTPS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Previne clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Desabilita MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' https://sdk.mercadopago.com; style-src 'self' 'unsafe-inline'"
  );
  
  next();
});
```

---

## 🧪 3. Validação de Webhook

### 3.1 Validação Obrigatória

```javascript
// backend/src/routes/payment.js

const crypto = require('crypto');

function validateWebhookSignature(req) {
  const signature = req.headers['x-signature'];
  if (!signature) return false;

  const [ts, v1] = signature.split(',').map(s => s.split('=')[1]);
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  
  // Reconstruct signature
  const body = req.body; // Raw body
  const data = `${ts}/api/payments/webhooks${body}`;
  
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(data);
  const computed = hmac.digest('hex');
  
  return computed === v1;
}

router.post('/webhooks', (req, res) => {
  // SEMPRE validar assinatura
  if (!validateWebhookSignature(req)) {
    console.warn('[SECURITY] Invalid webhook signature from', req.ip);
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Processamento continua apenas se válido
  // ...
});
```

### 3.2 Idempotência

```javascript
// Previne processamento duplicado de webhook

router.post('/webhooks', async (req, res) => {
  const eventId = req.body.data?.id;
  
  // Verifique se já foi processado
  const existing = await db.prepare(
    'SELECT * FROM webhook_events WHERE event_id = ?'
  ).get(eventId);
  
  if (existing) {
    return res.status(200).json({ message: 'Already processed' });
  }
  
  // Processe e marque como done
  try {
    // ... processamento ...
    
    db.prepare(
      'INSERT INTO webhook_events (event_id, processed_at) VALUES (?, ?)'
    ).run(eventId, new Date());
    
    res.status(200).json({ received: true });
  } catch (err) {
    // Log erro mas responda 200 (webhook será retentado)
    console.error('Webhook processing error:', err);
    res.status(200).json({ error: 'Processing failed' });
  }
});
```

---

## 🔑 4. Autenticação e Autorização

### 4.1 JWT Seguro

```javascript
// backend/src/routes/auth.js

const jwt = require('jsonwebtoken');

function signToken(userId, expiresIn = '24h') {
  return jwt.sign(
    { userId, iat: Math.floor(Date.now() / 1000) },
    process.env.JWT_SECRET,
    { 
      expiresIn,
      algorithm: 'HS256'
    }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });
  } catch (err) {
    return null;
  }
}

// Middleware de autenticação
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  req.userId = decoded.userId;
  next();
}
```

### 4.2 Controle de Acesso a Pagamentos

```javascript
// Usuário só pode ver/gerenciar seus próprios pagamentos

router.get('/subscriptions/:id', authMiddleware, async (req, res) => {
  const subscription = await Subscription.findById(req.params.id);
  
  // Verificar propriedade
  if (subscription.userId.toString() !== req.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  res.json(subscription);
});
```

---

## 🚫 5. Rate Limiting

### 5.1 Limite de Requisições por IP

```javascript
// backend/src/app.js

const rateLimit = require('express-rate-limit');

// Limite geral da API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições
  message: 'Muitas requisições, tente mais tarde'
});

// Limite mais restritivo para pagamentos
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5, // 5 requisições por minuto
  skipSuccessfulRequests: false,
  keyGenerator: (req) => req.userId || req.ip // Por usuário autenticado
});

app.use('/api/', limiter);
app.use('/api/payments/', paymentLimiter);
```

### 5.2 Proteção contra Força Bruta

```javascript
// Limitar tentativas de login

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 tentativas por 15 minutos
  skipSuccessfulRequests: true,
  message: 'Muitas tentativas de login, tente mais tarde'
});

router.post('/login', loginLimiter, async (req, res) => {
  // ... login logic ...
});
```

---

## 🗒️ 6. Logging e Auditoria

### 6.1 Nunca Logue Dados Sensíveis

```javascript
// ❌ ERRADO
console.log('Card:', req.body.card);

// ✅ CORRETO
console.log('Payment attempt by:', req.body.email, 'Amount:', req.body.amount);
```

### 6.2 Audit Log para Pagamentos

```javascript
// SQLite audit table
db.exec(`
  CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    user_id TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    action TEXT,
    result TEXT,
    ip_address TEXT
  )
`);

function logAudit(userId, eventType, action, result, ip) {
  db.prepare(`
    INSERT INTO audit_log (id, user_id, event_type, action, result, ip_address)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), userId, eventType, action, result, ip);
}

// Uso
logAudit(req.userId, 'SUBSCRIPTION_CREATE', 'monthly', 'success', req.ip);
```

### 6.3 Integração com Sentry/LogRocket

```javascript
// backend/src/app.js

const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0
});

app.use(Sentry.Handlers.requestHandler());

// ... suas rotas ...

app.use(Sentry.Handlers.errorHandler());
```

---

## 🧮 7. Validação de Entrada

### 7.1 Schema Validation com Zod

```javascript
// backend/src/validation/payment.js

const z = require('zod');

const SubscriptionRequestSchema = z.object({
  email: z.string().email('Email inválido'),
  planType: z.enum(['monthly', 'annual']),
  cardToken: z.string().min(20, 'Token inválido')
});

router.post('/subscriptions', authMiddleware, async (req, res) => {
  try {
    // Validação automática
    const data = SubscriptionRequestSchema.parse(req.body);
    
    // Processe dados validados
    // ...
  } catch (err) {
    // Erro de validação
    return res.status(400).json({ error: err.errors });
  }
});
```

### 7.2 Sanitização

```javascript
// Previna SQL Injection com prepared statements

// ✅ CORRETO - Prepared statement
db.prepare('SELECT * FROM users WHERE email = ?').get(email);

// ❌ ERRADO - String interpolation
db.exec(`SELECT * FROM users WHERE email = '${email}'`);
```

---

## 🔍 8. Dados Sensíveis - PCI Compliance

### 8.1 Nunca Armazene Cartão Completo

```javascript
// ❌ NUNCA faça isso
db.prepare('INSERT INTO cards (number, cvv) VALUES (?, ?)');

// ✅ SEMPRE use token do Mercado Pago
const { cardTokenId } = await mp.createCardToken({
  // ...
});

// Armazene apenas o token, não o cartão
db.prepare('INSERT INTO subscriptions (mp_card_token) VALUES (?)').run(cardTokenId);
```

### 8.2 Máscara para Exibição

```javascript
function maskCardNumber(token) {
  // Exiba apenas últimos 4 dígitos se necessário
  return `****-****-****-${token.slice(-4)}`;
}

// Frontend: Nunca mostre o número do cartão completo
return (
  <div>
    Card: {maskCardNumber(cardToken)}
  </div>
);
```

---

## 🔄 9. Handled Errors - Não Exponha Detalhes

### 9.1 Erro Genérico em Produção

```javascript
// ❌ ERRADO - Exponha detalhes do erro
app.use((err, req, res, next) => {
  res.status(500).json({ 
    error: err.message,
    stack: err.stack // Nunca em produção!
  });
});

// ✅ CORRETO - Genérico em produção, detalhe apenas em dev
app.use((err, req, res, next) => {
  console.error('[ERROR]', err); // Log em servidor
  
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error'
    : err.message;
    
  res.status(500).json({ error: message });
});
```

### 9.2 Validação de Resposta

```javascript
// Nunca retorne dados sensíveis do banco
router.get('/user/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  
  // ❌ ERRADO
  // res.json(user); // Expõe password_hash
  
  // ✅ CORRETO - Retorne apenas o necessário
  res.json({
    id: user.id,
    email: user.email,
    name: user.name
  });
});
```

---

## 🚨 10. Monitoramento de Segurança

### 10.1 Alertas de Anomalias

```javascript
// Detecte padrões suspeitos

function checkAnomalies(payment) {
  const recentPayments = db.prepare(`
    SELECT COUNT(*) as count FROM payments 
    WHERE payer_email = ? AND created_at > datetime('now', '-1 hour')
  `).get(payment.email);
  
  // Alerta se muitos pagamentos do mesmo email em 1 hora
  if (recentPayments.count > 5) {
    console.warn('[SECURITY ALERT] Possible fraud:', payment.email);
    // Envie alerta para admin
  }
}
```

### 10.2 Monitoramento de Webhook

```javascript
// Rastrear sucesso/falha de webhooks

db.exec(`
  CREATE TABLE IF NOT EXISTS webhook_log (
    id TEXT PRIMARY KEY,
    event_type TEXT,
    status TEXT, -- success, failed, timeout
    response_code INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Monitore taxa de sucesso
function webhookHealthCheck() {
  const last24h = db.prepare(`
    SELECT status, COUNT(*) as count FROM webhook_log
    WHERE timestamp > datetime('now', '-1 day')
    GROUP BY status
  `).all();
  
  // Alerte se muitas falhas
}
```

---

## 📋 Checklist de Segurança Pré-Produção

- [ ] Credenciais em `.gitignore`
- [ ] HTTPS em ambos domínios
- [ ] Certificado SSL válido
- [ ] JWT_SECRET forte (20+ caracteres aleatórios)
- [ ] Headers de segurança configurados
- [ ] Webhook signature validation implementado
- [ ] Rate limiting ativo
- [ ] Validação de entrada com Zod
- [ ] Nunca armazene cartão completo (use token MP)
- [ ] Audit log configurado
- [ ] Sentry/LogRocket integrados
- [ ] Erro handler não exponha detalhes
- [ ] CORS restritivo
- [ ] Database backups automáticos
- [ ] Monitoramento ativo

---

## 🔗 Referências

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PCI Compliance](https://www.pcisecuritystandards.org/)
- [Mercado Pago Security](https://developers.mercadopago.com.br/en/guides/security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

