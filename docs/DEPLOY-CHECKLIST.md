# 📋 Checklist de Deploy para Produção

## Pré-Deploy

### ✅ Validação do Código

- [ ] Todos os testes passando
  ```powershell
  npm run test:production
  ```
  
- [ ] Build de produção sem erros
  ```powershell
  npm run build
  ```
  
- [ ] Sem erros TypeScript
  ```powershell
  npx tsc --noEmit
  ```
  
- [ ] Código versionado no Git
  ```powershell
  git status
  git add .
  git commit -m "Preparando para deploy"
  git push origin main
  ```

### ✅ Configurações

- [ ] Variáveis de ambiente configuradas (se necessário)
- [ ] URLs de API atualizadas para produção
- [ ] Configurações de segurança revisadas
- [ ] Logs de debug removidos/desabilitados

### ✅ Performance

- [ ] Build otimizado (CSS minificado, JS comprimido)
- [ ] Imagens otimizadas
- [ ] Lazy loading implementado onde necessário
- [ ] Cache configurado

### ✅ Testes no Navegador

- [ ] Chrome - Funcionamento OK
- [ ] Firefox - Funcionamento OK
- [ ] Edge - Funcionamento OK
- [ ] Safari - Funcionamento OK (se disponível)
- [ ] Mobile Chrome - Funcionamento OK
- [ ] Mobile Safari - Funcionamento OK (se disponível)

### ✅ Funcionalidades Core

- [ ] Criar material com componentes
- [ ] Cadastrar cliente
- [ ] Criar orçamento com cálculos corretos
- [ ] Gerar PDF do orçamento
- [ ] Editar material existente
- [ ] Editar cliente existente
- [ ] Editar orçamento existente
- [ ] Deletar registros
- [ ] Busca de clientes funcionando
- [ ] Filtros funcionando
- [ ] Dark mode funcionando
- [ ] Persistência de dados funcionando

## Deploy

### Opção 1: Hostinger (Recomendado)

```powershell
# Publicar o build pelo painel de hospedagem
# Envie a pasta de build gerada pelo projeto
```

### Opção 2: Netlify

```powershell
# Instalar Netlify CLI
npm i -g netlify-cli

# Fazer deploy
netlify deploy --prod --dir=dist
```

### Opção 3: GitHub Pages

```powershell
# Adicionar ao package.json
"homepage": "https://seu-usuario.github.io/repo-name"

# Instalar gh-pages
npm install --save-dev gh-pages

# Adicionar script
"deploy": "npm run build && gh-pages -d dist"

# Deploy
npm run deploy
```

### Opção 4: AWS S3 + CloudFront

1. Criar bucket S3
2. Habilitar hosting estático
3. Upload dos arquivos da pasta `dist/`
4. Configurar CloudFront (opcional, para HTTPS)

### Opção 5: Azure Static Web Apps

```powershell
# Instalar Azure CLI
# Download em: https://aka.ms/installazurecliwindows

# Login
az login

# Criar Static Web App
az staticwebapp create \
  --name sored \
  --resource-group seu-resource-group \
  --source dist/ \
  --location "East US"
```

## Pós-Deploy

### ✅ Verificação Inicial

- [ ] Site acessível via URL de produção
- [ ] Não há erros no console do navegador
- [ ] Todas as páginas carregam corretamente
- [ ] Imagens e assets carregam
- [ ] Fontes carregam corretamente

### ✅ Testes de Funcionalidade

- [ ] Login/Autenticação funciona
- [ ] CRUD de materiais funciona
- [ ] CRUD de clientes funciona
- [ ] Criação de orçamentos funciona
- [ ] Geração de PDF funciona
- [ ] Cálculos estão corretos
- [ ] Busca funciona
- [ ] Filtros funcionam
- [ ] Dark mode funciona

### ✅ Testes de Performance

- [ ] Lighthouse Score > 90 (Performance)
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3.5s
- [ ] Cumulative Layout Shift < 0.1

```powershell
# Testar com Lighthouse
# Abrir Chrome DevTools > Lighthouse > Generate Report
```

### ✅ Testes de Responsividade

- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Mobile (360x640)

### ✅ SEO (Se aplicável)

- [ ] meta tags configuradas
- [ ] Open Graph tags
- [ ] Twitter Cards
- [ ] favicon configurado
- [ ] robots.txt (se necessário)
- [ ] sitemap.xml (se necessário)

### ✅ Segurança

- [ ] HTTPS habilitado
- [ ] Headers de segurança configurados
- [ ] CSP (Content Security Policy) configurado
- [ ] Sem dados sensíveis no código fonte

### ✅ Monitoramento

- [ ] Analytics configurado (Google Analytics, Plausible, etc)
- [ ] Error tracking configurado (Sentry, etc)
- [ ] Uptime monitoring (UptimeRobot, etc)

### ✅ Backup

- [ ] Código no GitHub
- [ ] Build da pasta dist/ salvo
- [ ] Documentação atualizada
- [ ] Changelog atualizado

## Rollback Plan

Se algo der errado:

### Hostinger
```powershell
# Restaurar a versão anterior pelo painel da hospedagem
```

### Netlify
```powershell
netlify rollback
```

### Manual
```powershell
# Fazer checkout da versão anterior
git checkout <commit-anterior>

# Rebuild
npm run build

# Redeploy
# Publicar novamente pelo painel da hospedagem
# ou
netlify deploy --prod --dir=dist
```

## Comunicação

### ✅ Stakeholders

- [ ] Notificar equipe sobre deploy
- [ ] Enviar notas de release
- [ ] Atualizar documentação pública
- [ ] Atualizar status page (se houver)

### ✅ Usuários

- [ ] Notificar sobre novas features (se aplicável)
- [ ] Avisar sobre downtime planejado (se houver)
- [ ] Disponibilizar changelog

## Manutenção Pós-Deploy

### Primeira Semana

- [ ] Monitorar erros diariamente
- [ ] Verificar performance
- [ ] Coletar feedback dos usuários
- [ ] Corrigir bugs críticos imediatamente

### Primeiro Mês

- [ ] Revisar analytics
- [ ] Identificar gargalos de performance
- [ ] Planejar melhorias
- [ ] Atualizar documentação baseado no uso real

## 📝 Notas

**Data do Deploy**: _______________

**Versão Deployada**: _______________

**URL de Produção**: _______________

**Responsável**: _______________

**Tempo de Deploy**: _______________

**Problemas Encontrados**: 
_______________________________________________
_______________________________________________
_______________________________________________

**Ações Corretivas**:
_______________________________________________
_______________________________________________
_______________________________________________

---

**Assinatura**: _______________  **Data**: _______________
