# Mercado Pago - Checklist de Deploy para Produção

## 📋 Antes de Fazer Deploy

### Segurança de Credenciais
- [ ] `.env` está em `.gitignore`
- [ ] Nenhuma credencial foi commitada no Git (`git log --all -p | grep -i "access_token\|webhook_secret"`)
- [ ] Credenciais de produção diferentes das de desenvolvimento
- [ ] Foram obtidas do painel Mercado Pago em ambiente **PRODUÇÃO**

### Configuração do Backend

#### Variáveis de Ambiente
```bash
# Validar que todas essas variáveis estão configuradas
NODE_ENV=production                      # ✅
JWT_SECRET=<valor-forte-20+chars>       # ✅
PORT=5000                                # ✅
MP_ACCESS_TOKEN=APP_USR-<valor>          # ✅ PRODUÇÃO
MERCADO_PAGO_PUBLIC_KEY=APP_USR-<valor>  # ✅ PRODUÇÃO
MERCADO_PAGO_WEBHOOK_SECRET=<valor>      # ✅ PRODUÇÃO
FRONTEND_URL_PRODUCTION=https://...      # ✅
DB_HOST=...                              # ✅ PRODUÇÃO
DB_USER=...                              # ✅ PRODUÇÃO
DB_PASSWORD=...                          # ✅ PRODUÇÃO
DB_NAME=sored                            # ✅ PRODUÇÃO
DB_PORT=3306                             # ✅ PRODUÇÃO
```

**Validar**:
- [ ] Nenhuma variável vazia ou com placeholder
- [ ] `NODE_ENV` é `production`
- [ ] URLs usam HTTPS
- [ ] Credenciais são do ambiente de **PRODUÇÃO** do Mercado Pago (não sandbox)

#### CORS
- [ ] `FRONTEND_URL_PRODUCTION` está definida
- [ ] Apenas domínios necessários no CORS
- [ ] `credentials: true` habilitado para requisições autenticadas

#### HTTPS
- [ ] Certificado SSL válido
- [ ] Redirecionamento de HTTP → HTTPS
- [ ] Headers de segurança configurados:
  - [ ] `Strict-Transport-Security` (HSTS)
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `X-Frame-Options: DENY`
  - [ ] `Content-Security-Policy` restritiva

#### Banco de Dados
- [ ] MySQL em produção configurado
  - [ ] com autenticação
  - [ ] sem acesso público na internet
  - [ ] backups automáticos habilitados
- [ ] Tabelas de pagamento intactas
- [ ] `payments` table criada
- [ ] `subscriptions` table criada

#### Logs
- [ ] Logs configurados para arquivo ou serviço centralizado
- [ ] Nenhuma credencial nos logs
- [ ] Erro 500 não exponha detalhes sensíveis
- [ ] Audit log para pagamentos

---

### Configuração do Frontend

#### Variáveis de Ambiente
```bash
# Validar no tempo de build
VITE_API_URL=https://seu-backend.com/api          # ✅
VITE_MP_PUBLIC_KEY=APP_USR-<valor>                # ✅ PRODUÇÃO
VITE_FRONTEND_URL=https://seu-dominio.com         # ✅
```

**Validar**:
- [ ] `VITE_API_URL` aponta para backend de produção
- [ ] `VITE_MP_PUBLIC_KEY` é da **PRODUÇÃO** do Mercado Pago
- [ ] URLs usam HTTPS
- [ ] Build incluiu as variáveis: `npm run build`

#### Build
- [ ] `npm run build` completa sem erros
- [ ] Tamanho do build é razoável (< 500KB gzipped)
- [ ] Fonte maps desabilitados em produção
- [ ] Assets otimizados

#### Tests
- [ ] `npm test` passa com sucesso
- [ ] `npm run validate:production` passa com sucesso
- [ ] Testes de pagamento passam

---

### Mercado Pago

#### Credenciais
- [ ] Access Token válido em **PRODUÇÃO**
- [ ] Public Key válida em **PRODUÇÃO**
- [ ] Webhook Secret configurado
- [ ] **NÃO** usar credenciais de sandbox

#### Webhook
- [ ] URL do webhook registrada: `https://seu-backend.com/api/payments/webhooks`
- [ ] Eventos configurados:
  - [ ] `payment`
  - [ ] `preapproval` (para assinaturas)
- [ ] Webhook foi testado com sucesso
- [ ] URL é acessível via HTTPS público

#### Testes de Transação
- [ ] Transação de teste completa com dados reais
- [ ] Cartão de crédito processou corretamente
- [ ] Webhook foi recebido e processado
- [ ] Status da assinatura foi atualizado no banco

---

### Servidor / Deployment

#### Infraestrutura
- [ ] Servidor em produção (Hostinger, Render, AWS, etc)
- [ ] HTTPS habilitado e certificado válido
- [ ] DNS configurado e apontando para servidor
- [ ] Rate limiting habilitado

#### Health Checks
- [ ] Endpoint `/` responde com status 200
- [ ] Endpoint `/api/auth` responde (ou redirecionado com 401)
- [ ] Frontend carrega sem erros
- [ ] Console do browser sem erros críticos

#### Monitoramento
- [ ] Alerts configurados para erros 5xx
- [ ] Logs centralizados (Sentry, LogRocket, CloudWatch, etc)
- [ ] Uptime monitoring ativo
- [ ] Metricas de performance monitoradas

---

### Dados Sensíveis

- [ ] Nenhuma credencial no repositório Git
- [ ] `.env` está em `.gitignore`
- [ ] Nenhum arquivo sensível nos commits históricos
- [ ] Secrets configuradas apenas em plataformas de deployment
- [ ] Logs em produção não expõem credenciais

---

## 🚀 Processo de Deploy

### 1. Validação Pré-Deploy

```bash
# No seu repositório local
npm run validate:production

# Deve passar em:
# ✅ Testes
# ✅ Build
# ✅ Lint/Type checking
```

### 2. Commit Final

```bash
git add .
git commit -m "chore: ready for mercado pago production"
git push origin main
```

### 3. Deploy Backend

**Hostinger**:
```bash
# Publicar o build pela plataforma de hospedagem
# Confirme variáveis de ambiente no painel
```

**Render/outros**:
- Conecte repositório
- Configure variáveis de ambiente
- Clique em "Deploy"

### 4. Deploy Frontend

- A hospedagem pode fazer deploy automático ao push no main
- Ou manualmente se usando outra plataforma

### 5. Validação Pós-Deploy

```bash
# Teste (2-3 minutos após deploy)
curl https://seu-backend.com/
# Response: { message: "SORED API is running! 🚀" }

# Acesse o frontend
# https://seu-dominio.com

# Teste o modal de assinatura
# Clique em "Assinar Plano"
# Preencha formulário
# Processe pagamento
```

### 6. Monitoramento Inicial (24h)

- [ ] Acompanhe os logs da primeira transação
- [ ] Monitore webhook recebimento
- [ ] Verifique se subscriber foi criado no banco
- [ ] Confirme email de sucesso foi enviado (se configurado)

---

## ⚠️ Problemas Comuns e Soluções

### "Public Key não foi carregada"
**Causa**: `VITE_MP_PUBLIC_KEY` não definida no build
**Solução**: 
```bash
# Hospedagem: adicione em Settings > Environment Variables
# Render: Adicione em Environment
# Local: echo "VITE_MP_PUBLIC_KEY=..." >> frontend/.env
```

### "Webhook não está recebendo notificações"
**Causa**: URL não está acessível publicamente
**Solução**:
```bash
# Teste se URL é acessível
curl https://seu-backend.com/api/health

# Se 4xx ou timeout, webhook não funcionará
# Verifique firewall/segurança

# Reconfigure webhook no painel MP
```

### "Erro ao conectar MySQL"
**Causa**: Credenciais inválidas ou servidor inacessível
**Solução**:
```bash
# Teste conexão localmente
mysql -h seu-host-mysql -u seu-usuario -p sored

# Verifique:
# - Username/password corretos
# - Firewall/IP whitelist do provedor MySQL
# - Nome do database correto
```

### "503 Service Unavailable"
**Causa**: Backend fora do ar ou banco de dados inacessível
**Solução**:
1. Verifique logs no painel de deployment
2. Cheque se variáveis de ambiente estão todas presentes
3. Teste localmente: `npm run backend`

---

## ✅ Checklist Final - Pronto para Ir ao Vivo

- [ ] Credenciais obtidas do Mercado Pago (PRODUÇÃO)
- [ ] Variáveis de ambiente todas configuradas
- [ ] Build de produção compila sem erros
- [ ] Testes passam: `npm test` e `npm run validate:production`
- [ ] Deploy do backend concluído
- [ ] Deploy do frontend concluído
- [ ] Webhook registrado e testado
- [ ] Transação de teste bem-sucedida
- [ ] HTTPS funcional em ambos domínios
- [ ] CORS configurado corretamente
- [ ] Monitoramento ativo
- [ ] Suporte/contato configurado
- [ ] Documentação atualizada para o time

---

## 📞 Próximos Passos

1. **Hoje**: Completar este checklist
2. **Amanhã**: Deploy em staging/teste
3. **24h depois**: Deploy em produção
4. **Contínuo**: Monitorar logs e métricas

**Status**: 🟡 Em progresso → 🟢 Pronto para produção
