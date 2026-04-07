# 🧪 Guia de Testes Automatizados - SORED

Este guia reúne a suíte automatizada do SORED para validação, cobertura e deploy com segurança.

## 📋 Visão Geral

Este projeto implementa uma suíte completa de testes automatizados que garante a qualidade e confiabilidade do sistema antes do deploy em produção.

### Cobertura de Testes

✅ **DataContext** - Testes de contexto e persistência de dados
- CRUD de Materials (Create, Read, Update, Delete)
- CRUD de Clients
- Gestão de Quotes (Orçamentos)
- Gestão de Settings
- Persistência em localStorage
- Validação de integridade de dados

✅ **QuoteCalculator** - Testes de cálculos e orçamentos
- Cálculos automáticos de custos
- Soma de componentes
- Margem de lucro
- Inclusão de frete
- Gestão de itens
- Salvamento e edição de orçamentos
- Validações de formulário

✅ **ClientManagement** - Testes de gestão de clientes
- Adicionar, editar e deletar clientes
- Busca e filtros
- Estatísticas
- Validações de campos
- Persistência de dados

✅ **MaterialManagement** - Testes de gestão de materiais
- CRUD de materiais
- Gestão de componentes
- Cálculos de custos
- Controle de estoque
- Validações

✅ **Integration E2E** - Testes de integração ponta a ponta
- Fluxo completo: Material → Orçamento → PDF
- Múltiplos materiais em um orçamento
- Cálculos com frete
- Validação de integridade end-to-end

## 🚀 Execução

### Executar todos os testes
```bash
npm test
```

### Executar apenas testes de produção
```bash
npm run test:production
```

### Executar validação completa (testes + build)
```bash
npm run validate:production
```

## 📊 Script de Validação de Produção

O script `validate-production.js` executa uma validação completa do sistema:

### Checklist de Validação

1. **✓ Dependências**
   - Verifica se todas as dependências críticas estão instaladas
   - Valida versões do React, TypeScript e Tailwind

2. **✓ Estrutura de Arquivos**
   - Valida a existência de todos os arquivos principais
   - Verifica componentes, contextos e serviços

3. **✓ Testes Automatizados**
   - Executa toda a suíte de testes
   - DataContext: ~15 testes
   - QuoteCalculator: ~20 testes
   - ClientManagement: ~25 testes
   - MaterialManagement: ~20 testes
   - Integration E2E: ~6 testes

4. **✓ Build de Produção**
   - Gera build otimizado com Vite
   - Valida criação da pasta /dist
   - Verifica otimizações e minificação

### Output do Script

```
███████╗ ██████╗ ██████╗ ███████╗██████╗ 
██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔══██╗
███████╗██║   ██║██████╔╝█████╗  ██║  ██║
╚════██║██║   ██║██╔══██╗██╔══╝  ██║  ██║
███████║╚██████╔╝██║  ██║███████╗██████╔╝
╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═════╝ 

============================================================
1. VALIDANDO DEPENDÊNCIAS
============================================================
✓ Todas as dependências críticas estão instaladas

============================================================
2. VALIDANDO ESTRUTURA DE ARQUIVOS
============================================================
✓ Estrutura de arquivos OK

============================================================
3. EXECUTANDO TESTES AUTOMATIZADOS
============================================================
✓ Todos os testes passaram!

============================================================
4. GERANDO BUILD DE PRODUÇÃO
============================================================
✓ Build gerado com sucesso!

============================================================
RELATÓRIO FINAL DE VALIDAÇÃO
============================================================

✓ SISTEMA PRONTO PARA PRODUÇÃO! 🚀
```

## 📝 Estrutura

```
src/
├── context/
│   └── __tests__/
│       └── DataContext.production.test.tsx
├── components/
│   └── __tests__/
│       ├── QuoteCalculator.production.test.tsx
│       ├── ClientManagement.production.test.tsx
│       ├── MaterialManagement.production.test.tsx
│       └── Integration.e2e.test.tsx
└── scripts/
    └── validate-production.js
```

## 🎯 Casos de Teste Principais

### DataContext (15+ testes)
- ✅ Adicionar material com componentes
- ✅ Atualizar material existente
- ✅ Deletar material
- ✅ Manter múltiplos materiais com IDs únicos
- ✅ CRUD completo de clientes
- ✅ Persistência no localStorage
- ✅ Integridade após múltiplas operações

### QuoteCalculator (20+ testes)
- ✅ Renderização inicial correta
- ✅ Cálculo automático baseado em componentes
- ✅ Recálculo ao alterar quantidade
- ✅ Aplicação de margem de lucro
- ✅ Inclusão de frete quando habilitado
- ✅ Adicionar/remover múltiplos materiais
- ✅ Validação de campos obrigatórios
- ✅ Edição de orçamento existente
- ✅ Uso de custo de componentes vs unitCost

### ClientManagement (25+ testes)
- ✅ Exibição de lista e estatísticas
- ✅ Busca por nome, email e telefone (case insensitive)
- ✅ Adicionar cliente com todos os campos
- ✅ Adicionar cliente apenas com nome
- ✅ Editar cliente mantendo dados não alterados
- ✅ Deletar com confirmação
- ✅ Modal de formulário (abrir/fechar/limpar)
- ✅ Atualização de estatísticas em tempo real

### MaterialManagement (20+ testes)
- ✅ Exibição de materiais com componentes
- ✅ CRUD completo de materiais
- ✅ Cálculo de custo total dos componentes
- ✅ Validação de estoque
- ✅ Material sem componentes (usa unitCost)
- ✅ Dimensões formatadas corretamente
- ✅ Animações e UX
- ✅ Responsividade

### Integration E2E (6+ testes)
- ✅ Fluxo completo: Material → Orçamento → PDF
- ✅ Cálculos corretos no fluxo completo
- ✅ Múltiplos materiais em orçamento
- ✅ Orçamento com frete
- ✅ Integridade de dados end-to-end
- ✅ Visualização de orçamentos salvos

## 🔧 Configuração

### Jest Configuration (`jest.config.cjs`)

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
};
```

### Babel Configuration (`babel.config.cjs`)

```javascript
module.exports = {
  presets: [
    '@babel/preset-env',
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
};
```

## 📈 Métricas

- **Total de Testes**: ~86+ casos de teste
- **Cobertura**: Componentes principais, contextos e integrações
- **Tempo de Execução**: ~15-30 segundos
- **Confiabilidade**: Testes isolados com mocks apropriados

## 🐛 Depuração

### Executar testes com output detalhado
```bash
npm test -- --verbose
```

### Executar teste específico
```bash
npm test -- DataContext.production.test.tsx
```

### Executar em modo watch
```bash
npm test -- --watch
```

## ✅ Critérios de Aprovação

Para o sistema ser aprovado para produção, todos os seguintes critérios devem ser atendidos:

1. ✅ **Todos os testes passando** (86+ testes)
2. ✅ **Build gerado sem erros**
3. ✅ **Dependências atualizadas e sem vulnerabilidades**
4. ✅ **Estrutura de arquivos completa**
5. ✅ **Funcionalidades core validadas**:
   - Gestão de Materiais
   - Gestão de Clientes
   - Cálculo de Orçamentos
   - Geração de PDF
   - Persistência de Dados

## 🚀 Deploy

Após validação bem-sucedida:

```bash
# 1. Executar validação completa
npm run validate:production

# 2. Se todos os testes passarem, o build estará em /dist
# 3. Deploy da pasta /dist para seu servidor/hosting

# Exemplos de deploy:
# Publicar o build pela plataforma de hospedagem
# Netlify: netlify deploy --prod --dir=dist
# AWS S3: aws s3 sync dist/ s3://seu-bucket/
```

## 📚 Documentação Adicional

- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)

## 🤝 Contribuindo

Ao adicionar novos componentes ou funcionalidades:

1. Crie testes correspondentes em `__tests__/`
2. Nomeie arquivos como `ComponentName.production.test.tsx`
3. Execute `npm run validate:production` antes de commit
4. Garanta que todos os testes passem

## 📞 Suporte

Para questões sobre testes ou validação de produção, consulte a documentação ou entre em contato com a equipe de desenvolvimento.

---

**Status**: ✅ Sistema validado e pronto para produção
**Última Validação**: Executar `npm run validate:production` para status atual
