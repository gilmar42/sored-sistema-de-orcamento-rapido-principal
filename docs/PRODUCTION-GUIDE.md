# 🚀 Guia Rápido - Validação de Produção

## Comandos Disponíveis

### Executar Testes de Produção
```powershell
npm run test:production
```

### Executar Todos os Testes
```powershell
npm test
```

### Listar Testes Disponíveis
```powershell
npm test -- --listTests
```

### Executar Teste Específico
```powershell
npm test -- DataContext.production.test.tsx
```

## 📊 Testes Implementados

### ✅ Testes de Produção (86+ casos)

#### 1. **DataContext.production.test.tsx** (~15 testes)
- ✓ CRUD de Materials
- ✓ CRUD de Clients
- ✓ Gestão de Quotes
- ✓ Persistência no localStorage
- ✓ Integridade de dados

#### 2. **QuoteCalculator.production.test.tsx** (~20 testes)
- ✓ Renderização inicial
- ✓ Cálculos automáticos de componentes
- ✓ Margem de lucro
- ✓ Inclusão de frete
- ✓ Gestão de itens
- ✓ Validações

#### 3. **ClientManagement.production.test.tsx** (~25 testes)
- ✓ CRUD completo de clientes
- ✓ Busca e filtros
- ✓ Estatísticas
- ✓ Validações de formulário
- ✓ Modal de edição

#### 4. **MaterialManagement.production.test.tsx** (~20 testes)
- ✓ CRUD de materiais
- ✓ Gestão de componentes
- ✓ Cálculos de custos
- ✓ Controle de estoque
- ✓ UX e animações

#### 5. **Integration.e2e.test.tsx** (~6 testes)
- ✓ Fluxo completo: Material → Orçamento → PDF
- ✓ Múltiplos materiais
- ✓ Cálculos com frete
- ✓ Integridade end-to-end

## 🎯 Checklist de Produção

Antes de fazer deploy, verifique:

- [ ] Todos os testes de produção passando
- [ ] Build gerado sem erros (`npm run build`)
- [ ] Dependências atualizadas
- [ ] Sem erros no console do navegador
- [ ] Funcionalidades core validadas

## 🔧 Troubleshooting

### Problema: Testes falhando
```powershell
# Limpar cache do Jest
npm test -- --clearCache

# Executar com mais informações
npm test -- --verbose
```

### Problema: Build falhando
```powershell
# Verificar erros TypeScript
npx tsc --noEmit

# Limpar e rebuildar
Remove-Item -Recurse -Force dist
npm run build
```

### Problema: Dependências
```powershell
# Reinstalar dependências
Remove-Item -Recurse -Force node_modules
npm install
```

## 📈 Status Atual

**Total de Testes**: 86+ casos de teste
**Cobertura**: Componentes principais, contextos e integrações
**Framework**: Jest + React Testing Library
**Build**: Vite 5.4.21

## 🚀 Deploy

Após todos os testes passarem:

1. **Gerar build de produção**
   ```powershell
   npm run build
   ```

2. **A pasta `dist/` estará pronta para deploy**

3. **Opções de deploy**:
   - Hostinger
   - Netlify
   - AWS S3 + CloudFront
   - Azure Static Web Apps
   - GitHub Pages

## 📚 Documentação Completa

Consulte `TESTING.md` para documentação detalhada dos testes.

---

**Sistema**: SORED - Sistema de Orçamento Rápido
**Status**: ✅ Pronto para testes
