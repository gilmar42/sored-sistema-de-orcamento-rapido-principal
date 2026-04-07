# Mercado Pago - Setup Completo para Produção

## 📋 Pré-requisitos

- [ ] Conta ativa no Mercado Pago
- [ ] Dados verificados (pessoa física ou jurídica)
- [ ] Acesso ao painel de desenvolvedor do Mercado Pago
- [ ] Servidor backend com acesso HTTPS público
- [ ] Frontend deployado em domínio com HTTPS
- [ ] MongoDB em produção (Atlas ou self-hosted)
- [ ] SQLite configurado para pagamentos

---

## 🔐 1. Obtenha as Credenciais do Mercado Pago

### 1.1 Acessar o Painel de Credenciais

1. Acesse: [Mercado Pago Desarrolladores](https://www.mercadopago.com.br/developers/panel)
2. Faça login com sua conta
3. Clique em **Credenciales** no menu lateral
4. Selecione o ambiente **Produção** (não desenvolvimento)

### 1.2 Credenciais Necessárias

Você precisará de:

| Credencial | Descrição | Uso |
|-----------|-----------|-----|
| `Access Token` (Produção) | Token de acesso da API | Backend (servidor) |
| `Public Key` (Produção) | Chave pública | Frontend (navegador) |
| `Webhook Secret` | Segredo para validar webhooks | Backend (validação de assinatura) |

> ⚠️ **IMPORTANTE**: 
> - Nunca compartilhe o Access Token
> - Não commite as credenciais no Git
> - Use variáveis de ambiente para armazenar

### 1.3 Teste as Credenciais (Sandbox)

Antes de ir para produção, teste com as chaves de **Desenvolvimento** usando dados de teste:
- Cartão: `4509 9535 6623 3704`
- CVV: qualquer número de 3 dígitos
- Data: qualquer data futura

---

## 🌍 2. Configuração de Ambiente - Backend

### 2.1 Atualize `.env` do Backend

Crie/atualize o arquivo `backend/.env`:

```dotenv
# ============ SEGURANÇA ============
JWT_SECRET=sua-chave-super-secreta-aqui-mude-isso
NODE_ENV=production

# ============ SERVIDOR ============
PORT=5000
FRONTEND_URL=http://localhost:5173
FRONTEND_URL_PRODUCTION=https://seu-dominio.com

# ============ MERCADO PAGO (PRODUÇÃO) ============
# Copie do painel de credenciais - AMBIENTE PRODUÇÃO
MP_ACCESS_TOKEN=APP_USR-seu-access-token-aqui
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-seu-access-token-aqui
MERCADO_PAGO_PUBLIC_KEY=APP_USR-sua-public-key-aqui
MERCADO_PAGO_WEBHOOK_SECRET=seu-webhook-secret-aqui

# URLs de Retorno
MP_SUCCESS_URL=https://seu-dominio.com/sucesso
MP_FAILURE_URL=https://seu-dominio.com/falha
MP_PENDING_URL=https://seu-dominio.com/pendente

# ============ BANCO DE DADOS ============
MONGODB_URI=mongodb+srv://usuario:senha@seu-cluster.mongodb.net/sored?retryWrites=true&w=majority
# Ou para MongoDB local em produção:
# MONGODB_URI=mongodb://seu-server-mongodb:27017/sored

# ============ CURRENCY & PAGAMENTO ============
CURRENCY=BRL
```

### 2.2 Variáveis de Ambiente - Notas Importantes

```bash
# Para ambiente local de testes (NUNCA em produção):
export MP_ACCESS_TOKEN="APP_USR-test-..."
export MERCADO_PAGO_PUBLIC_KEY="APP_USR-test-..."

# Para produção (Vercel, Render, AWS, etc):
# Use o painel da plataforma para configurar secrets
```

---

## 🎨 3. Configuração de Ambiente - Frontend

### 3.1 Atualize `.env` do Frontend

Crie/atualize o arquivo `frontend/.env`:

```dotenv
# Backend API
VITE_API_URL=https://seu-backend-url.com/api

# Mercado Pago (PRODUÇÃO)
VITE_MP_PUBLIC_KEY=APP_USR-sua-public-key-aqui

# Frontend URL
VITE_FRONTEND_URL=https://seu-dominio.com
```

### 3.2 Publicar as Variáveis para Build

Ao fazer build do Vite, as variáveis `VITE_*` são incluídas como strings:

```bash
# Local
VITE_API_URL=http://localhost:5000/api npm run build

# Produção (Vercel)
# Defina as variáveis no painel de variáveis de ambiente da Vercel
```

---

## 🔗 4. Configurar Webhook do Mercado Pago

### 4.1 Adicionar URL do Webhook no Painel

1. Acesse o painel: [Webhooks](https://www.mercadopago.com.br/developers/panel/applications)
2. Selecione sua aplicação
3. Na seção **Webhooks**, clique em **Adicionar URL**
4. Cole a URL:
   ```
   https://seu-backend-url.com/api/payments/webhooks
   ```
5. Selecione os eventos:
   - ✅ `payment`
   - ✅ `preapproval` (para assinaturas)
6. Salve

### 4.2 Teste o Webhook

O backend validará automaticamente a assinatura HMAC. Para testar:

```bash
# 1. Simule um webhook localmente (substitua valores):
curl -X POST http://localhost:5000/api/payments/webhooks \
  -H "x-signature: ts=1707041000, v1=sua-assinatura-hmac" \
  -H "x-event-type: payment" \
  -H "Content-Type: application/json" \
  -d '{"type":"payment","data":{"id":"123"}}'

# 2. O backend deve responder com status 200-201
```

---

## 🛡️ 5. Configurar CORS para Produção

### 5.1 Atualize `backend/src/app.js`

O CORS já está configurado para ler variáveis de ambiente:

```javascript
// Em backend/src/app.js (linha ~30)
const envOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_PRODUCTION
].filter(Boolean);
```

Certifique-se de que estas variáveis estão definidas:
- ✅ `FRONTEND_URL_PRODUCTION=https://seu-dominio.com`

---

## 🗄️ 6. Configurar MongoDB para Produção

### 6.1 Opção A: MongoDB Atlas (Recomendado)

1. Acesse [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crie um cluster gratuito ou pago
3. Configure credenciais de usuário
4. Obtenha a string de conexão:
   ```
   mongodb+srv://user:password@cluster.mongodb.net/sored?retryWrites=true&w=majority
   ```
5. Defina em `backend/.env`:
   ```dotenv
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/sored?retryWrites=true&w=majority
   ```

### 6.2 Opção B: MongoDB Self-Hosted

Certifique-se de que seu servidor MongoDB está:
- Acessível apenas internamente (não exponha para internet)
- Com autenticação habilitada
- Com backups automáticos

---

## 📦 7. Deploy - Backend

### 7.1 Vercel (Recomendado para Node.js)

```bash
# 1. Instale vercel CLI
npm install -g vercel

# 2. Deploy
vercel

# 3. Configure variáveis de ambiente no painel
# Vá em Project Settings > Environment Variables
# Adicione todas as variáveis de .env
```

### 7.2 Render.com

```bash
# 1. Conecte seu repositório GitHub
# 2. Crie um novo Web Service
# 3. Configure:
#    - Start Command: node backend/src/app.js
#    - Environment: Node
#    - Add environment variables
```

### 7.3 AWS / EC2

```bash
# 1. SSH para sua instância
ssh -i seu-key.pem ec2-user@seu-ip

# 2. Instale Node
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Clone o repositório
git clone https://seu-repo.git
cd seu-repo

# 4. Instale dependências
npm install --production

# 5. Configure .env com os valores de produção

# 6. Use PM2 para manter a aplicação rodando
npm install -g pm2
pm2 start backend/src/app.js --name "sored-api"
pm2 save

# 7. Configure HTTPS (Ex: Let's Encrypt + Nginx)
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d seu-backend-url.com
```

---

## 🎀 8. Deploy - Frontend

### 8.1 Vercel (Recomendado)

```bash
# 1. Conecte seu repositório em vercel.com
# 2. Configure Build Settings:
#    - Framework: Vite
#    - Build Command: npm run build
#    - Output Directory: dist
#    - Root Directory: frontend/

# 3. Adicione variáveis de ambiente:
VITE_API_URL = https://seu-backend-url.com/api
VITE_MP_PUBLIC_KEY = APP_USR-sua-public-key-aqui
```

### 8.2 Netlify

```bash
# 1. Conecte seu repositório
# 2. Configure build:
#    - Build command: npm run build
#    - Publish directory: frontend/dist
#    - Base directory: .

# 3. Adicione variáveis de ambiente no painel
```

---

## ✅ 9. Checklist de Produção

### Mercado Pago
- [ ] Credenciais de **Produção** obtidas
- [ ] Access Token configurado no backend
- [ ] Public Key configurado no frontend
- [ ] Webhook Secret configurado no backend
- [ ] URL do Webhook registrada no painel
- [ ] URLs de sucesso/falha/pendente configuradas
- [ ] Testado com dados reais (cartão de crédito)

### Backend
- [ ] Variáveis de ambiente todas definidas
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` forte (20+ caracteres aleatórios)
- [ ] CORS configurado com domínio de produção
- [ ] MongoDB em produção (Atlas ou self-hosted)
- [ ] HTTPS habilitado
- [ ] Rate limiting configurado
- [ ] Logs configurados (journald, PM2, CloudWatch)

### Frontend
- [ ] Variáveis `VITE_*` definidas
- [ ] `VITE_API_URL` apontando para backend de produção
- [ ] `VITE_MP_PUBLIC_KEY` com chave de produção
- [ ] Build otimizado: `npm run build`
- [ ] Teste a SubscriptionModal após build

### Segurança
- [ ] HTTPS em ambos frontend e backend
- [ ] Certificado SSL válido
- [ ] Headers de segurança (HSTS, X-Frame-Options, CSP)
- [ ] CORS restritivo (apenas domínios necessários)
- [ ] Webhook validação habilitada
- [ ] Logs de pagamento audit-ready
- [ ] Sem credenciais em logs
- [ ] Rate limiting em endpoints de pagamento

### Monitoramento
- [ ] Alertas de falhas de pagamento
- [ ] Logs centralizados (Sentry, LogRocket, CloudWatch)
- [ ] Métricas de webhook (sucesso/falha/latência)
- [ ] Uptime monitoring
- [ ] Backup automático do banco de dados

---

## 🚀 10. Deploy Seguro - Passo a Passo

### 10.1 Simulação de Deploy (Teste Completo)

```bash
# 1. No seu ambiente de staging
cd seu-repo

# 2. Instale dependências
npm install

# 3. Configure .env com credenciais de teste
cp backend/.env.example backend/.env
# Edite com credenciais de SANDBOX do MP

# 4. Rode testes de produção
npm run validate:production

# 5. Teste a integração de pagamento
npm test -- payment

# 6. Build do frontend
npm run build
npm run preview  # Teste o build
```

### 10.2 Deploy Real

```bash
# 1. Commit e Push
git add .
git commit -m "chore: production mercado pago setup"
git push origin main

# 2. Deploy Backend
# Via Vercel CLI ou painel da plataforma
vercel deploy --prod

# 3. Deploy Frontend
# Vercel auto-deploya ao fazer push

# 4. Valide o webhook
curl https://seu-backend-url.com/api/health
# Response: { message: "SORED API is running! 🚀" }
```

---

## 🔍 11. Validação Pós-Deploy

### 11.1 Teste Completo de Pagamento

1. **Frontend**:
   - Acesse `https://seu-dominio.com`
   - Clique em "Assinar"
   - Complete o formulário

2. **Webhook**:
   - O Mercado Pago enviará notificação
   - Backend receberá e processará
   - Status do pagamento atualizará em tempo real

3. **Verificação no Painel MP**:
   - Acesse [Mercado Pago Panel](https://www.mercadopago.com.br/admin/home)
   - Verifique a transação em "Movimientos"

### 11.2 Testes Automatizados

```bash
# Testar endpoints de pagamento
npm test -- payment.integration.test.js

# Validar build de produção
npm run validate:production

# Checar variáveis de ambiente
node -e "console.log(process.env.MERCADO_PAGO_ACCESS_TOKEN ? '✅' : '❌')"
```

---

## 📞 12. Suporte e Troubleshooting

### Erro: "Public Key não configurada"

```javascript
// Em frontend/SubscriptionModal.tsx
const mpKey = process.env.VITE_MP_PUBLIC_KEY || '';
// console.log('MP Key:', mpKey); // Verifique se não vazio
```

### Webhook não recebe notificações

1. Verifique se URL está correta no painel MP
2. Verifique se servidor está acessível via HTTPS público
3. Valide a assinatura HMAC:
   ```bash
   echo -n "timestamp|url|payload" | openssl dgst -sha256 -hmac "sua-secret"
   ```

### Pagamento não integra com MongoDB

```bash
# Verifique conexão MongoDB
mongo "mongodb+srv://user:pass@cluster.mongodb.net/sored"
# Deverá conectar sem erro
```

### Rate Limiting de API

Configure nginx para limitar requisições:

```nginx
limit_req_zone $binary_remote_addr zone=apizone:10m rate=10r/s;
location /api/payments/ {
  limit_req zone=apizone burst=20 nodelay;
}
```

---

## 📚 Referências

- [Docs Mercado Pago API](https://developers.mercadopago.com.br/pt-BR/reference)
- [SDK JavaScript MP](https://developers.mercadopago.com.br/pt-BR/guides/sdks/official/js)
- [Webhook Reference](https://developers.mercadopago.com.br/pt-BR/guides/webhooks)
- [Testes de Integração](../backend/test/mercadopago_integration_curl.md)

---

## 🎯 Próximos Passos

1. ✅ Obtenha credenciais de produção
2. ✅ Configure variáveis de ambiente
3. ✅ Configure webhook
4. ✅ Teste em staging/sandbox
5. ✅ Deploy backend
6. ✅ Deploy frontend
7. ✅ Teste pagamento real
8. ✅ Configure monitoramento
9. ✅ Ative alertas

**Status**: Pronto para produção ✨

