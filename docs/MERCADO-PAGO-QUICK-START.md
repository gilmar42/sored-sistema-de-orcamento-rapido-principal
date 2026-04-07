# Mercado Pago - Quick Start Produção

Guia rápido para colocar Mercado Pago em produção em 30 minutos.

---

## 📋 Checklist Rápido (30 min)

```
⏱️ Tempo estimado: 30 minutos
✅ Itens essenciais: 8
📋 Total: 15 passos
```

---

## 🔐 PASSO 1: Obter Credenciais (5 min)

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Login com sua conta Mercado Pago
3. Clique em **Credenciales** (lado direito)
4. Selecione aba **PRODUCCIÓN** (não sandbox)
5. Copie:
   - `Access Token` → `MP_ACCESS_TOKEN`
   - `Public Key` → `MERCADO_PAGO_PUBLIC_KEY`

```bash
# Exemplo (use seus valores reais):
export MP_ACCESS_TOKEN="APP_USR-1234567890-prodtoken"
export MERCADO_PAGO_PUBLIC_KEY="APP_USR-publickey123"
```

---

## 🌐 PASSO 2: Configurar Backend (5 min)

### 2.1 Atualizar `.env` do Backend

```bash
cd seu-repo
nano backend/.env
```

```dotenv
# Mude essas variáveis para PRODUÇÃO:
NODE_ENV=production
MP_ACCESS_TOKEN=APP_USR-seu-access-token
MERCADO_PAGO_PUBLIC_KEY=APP_USR-sua-public-key
MERCADO_PAGO_WEBHOOK_SECRET=seu-webhook-secret
JWT_SECRET=sua-chave-super-secreta-mude-isso
FRONTEND_URL_PRODUCTION=https://seu-dominio.com
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/sored
```

### 2.2 Validar

```bash
# Verifique que nenhuma variável está vazia
cat backend/.env | grep "^\w" | wc -l
# Deve ter ~10+ variáveis

# Verifique que não há placeholder "seu-"
grep "seu-\|your-\|change-this" backend/.env
# Não deve retornar nada
```

---

## 🎨 PASSO 3: Configurar Frontend (5 min)

### 3.1 Atualizar `.env` do Frontend

```bash
nano frontend/.env
```

```dotenv
VITE_API_URL=https://seu-backend-url.com/api
VITE_MP_PUBLIC_KEY=APP_USR-sua-public-key
VITE_FRONTEND_URL=https://seu-dominio.com
```

### 3.2 Test Build

```bash
npm run build
# ✅ Não deve ter erros
```

---

## 🔗 PASSO 4: Webhook (5 min)

1. Acesse painel do Mercado Pago
2. Vá em **Webhooks** ou **Notificaciones**
3. Adicione URL:
   ```
   https://seu-backend.com/api/payments/webhooks
   ```
4. Selecione eventos:
   - ✅ `payment`
   - ✅ `preapproval`
5. **Salve**

---

## 🚀 PASSO 5: Deploy Backend (5 min)

### Opção A: Hostinger (Recomendado)

```bash
# 1. Publique o build pelo painel de hospedagem





# 2. Configure variáveis de ambiente no painel da hospedagem:

#    Adicione: MP_ACCESS_TOKEN, MERCADO_PAGO_PUBLIC_KEY, etc
```

### Opção B: Render.com

1. Conecte seu GitHub
2. Crie novo Web Service
3. Configure variables em Environment
4. Deploy

### Opção C: AWS/EC2

```bash
# SSH para seu servidor
ssh -i key.pem user@seu-ip

# Clone repositório
git clone seu-repo
cd seu-repo

# Configure .env com valores de produção
# Instale PM2
npm install -g pm2
pm2 start backend/src/app.js --name "sored"

# Configure HTTPS com Let's Encrypt (ngrok ou Certbot)
```

---

## 🎀 PASSO 6: Deploy Frontend (3 min)

**Se usando Hostinger**:
- Publique o build atualizado quando fizer push no main
- Adicione variáveis `VITE_*` no painel

**Se usando Netlify**:
```bash
npm run build
# Faça upload da pasta `dist/` ao Netlify
# Configure variáveis de ambiente
```

---

## ✅ PASSO 7: Testar (3 min)

```bash
# 1. Acesse frontend
open https://seu-dominio.com

# 2. Clique em "Assinar Plano"

# 3. Preencha com:
#    Email: seu-email@test.com
#    Cartão: 5130903214662000 (cartão de teste Mercado Pago)
#    CVV: 123
#    Data: 11/25

# 4. Clique em "Assinar"

# 5. Aguarde confirmação (2-3 segundos)
# Deve redirecionar para sucesso

# 6. Verifique no painel do Mercado Pago:
# https://www.mercadopago.com.br/admin
# Deve aparecer a transação
```

---

## 🔍 PASSO 8: Validar (2 min)

```bash
# Teste health check do backend
curl https://seu-backend.com/api/health

# Deve retornar:
# { "message": "SORED API is running! 🚀" }

# Se erro, verifique:
# 1. URL está correta?
# 2. HTTPS está configurado?
# 3. Backend está rodando? (check logs)
# 4. Firewall liberou a porta?
```

---

## 🚨 Troubleshooting (2 min)

### Erro: "Public Key não carregou"

```bash
# 1. Verifique variável
echo $VITE_MP_PUBLIC_KEY

# 2. Se vazio, adicione ao .env do frontend
nano frontend/.env
# VITE_MP_PUBLIC_KEY=APP_USR-sua-key

# 3. Rebuilde
npm run build
```

### Erro: "Webhook não recebe notificações"

```bash
# 1. Teste se URL é acessível
curl https://seu-backend.com/api/health
# Deve retornar 200

# 2. Se erro, verifique firewall/DNS

# 3. Reconfigure webhook no painel MP
```

### Erro: "Database connection failed"

```bash
# 1. Verifique string MongoDB
echo $MONGODB_URI

# 2. Teste conexão
mongo "seu-mongodb-uri"

# 3. Verifique credenciais em MongoDB Atlas
```

---

## 📊 Status Checklist

```
✅ Credenciais obtidas
✅ Backend configurado (.env)
✅ Frontend configurado (.env)
✅ Webhook registrado
✅ Backend deployado
✅ Frontend deployado
✅ Primeira transação testada
✅ Pronto para produção!
```

---

## 🔐 Reminders de Segurança

- [ ] **NUNCA** commite `.env` com credenciais no Git
- [ ] Use credenciais de **PRODUÇÃO** (não sandbox)
- [ ] `JWT_SECRET` deve ser forte (20+ caracteres aleatórios)
- [ ] HTTPS em ambos frontend e backend
- [ ] Webhook Secret está configurado
- [ ] Rate limiting ativo no backend

---

## 📚 Documentação Completa

Para detalhes completos, veja:

- [MERCADO-PAGO-PRODUCTION-SETUP.md](MERCADO-PAGO-PRODUCTION-SETUP.md) - Setup detalhado
- [MERCADO-PAGO-DEPLOY-CHECKLIST.md](MERCADO-PAGO-DEPLOY-CHECKLIST.md) - Checklist completo
- [MERCADO-PAGO-SECURITY.md](MERCADO-PAGO-SECURITY.md) - Segurança
- [MERCADO-PAGO-TESTING.md](MERCADO-PAGO-TESTING.md) - Testes

---

## 💬 Suporte

Encontrou um problema?

1. Verifique a documentação acima
2. Consulte [docs/DEBUG_REPORT.md](DEBUG_REPORT.md)
3. Abra issue no GitHub
4. Contate suporte do Mercado Pago: https://help.mercadopago.com.br

---

## 🎯 Próximos Passos

- [ ] Completar setup (este guia)
- [ ] Testar pagamento real em produção
- [ ] Configurar alertas de erro
- [ ] Documentar para o time
- [ ] Publicar para usuários reais

**Status**: 🟢 Pronto para produção! 🚀


