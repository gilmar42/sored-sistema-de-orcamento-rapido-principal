# SORED – Sistema de Orçamento Rápido

## 1. Visão Geral e Arquitetura

- **Monorepo fullstack**: React 18 + TypeScript + Vite + Tailwind (frontend), Node.js + Express + SQLite (backend parcial)
- **Persistência**: LocalStorage (multi-tenant via tenantId)
- **Fluxo principal**: DataContext → Materiais/Clientes/Orçamentos → QuoteCalculator → PDF
- **Comandos principais**: `npm run dev:full`, `npm run dev`, `npm run backend`, `npm test`, `npm run build`

## 2. Fases do Sistema

### Fase 1: Estruturação
- Criação do monorepo, configuração do Vite, Tailwind, Jest, ESLint
- Definição de aliases, estrutura de pastas e providers globais

### Fase 2: Funcionalidades Core
- CRUD de Materiais, Clientes, Orçamentos
- Normalização de componentes (normalizeMaterials)
- Cálculo de orçamento (QuoteCalculator)
- Geração de PDF (jsPDF)

### Fase 3: Multi-tenant e Segurança
- Isolamento de dados por tenantId
- Mock de AuthContext e DataContext para testes

### Fase 4: Testes e Validação
- Testes unitários e integração (Jest + Testing Library)
- Mocks essenciais (__mocks__/uuid.js, api.ts)
- Validação de build e produção

### Fase 5: Backend e Integração
- API REST Express/SQLite (parcial)
- Endpoints: /api/auth, /api/materials, /api/quotes, /api/clients
- Integração futura com frontend

## 3. Fluxos Críticos

### Orçamento
1. Seleção de materiais (MaterialSelectionModal)
2. Definição de quantidades e margem
3. Cálculo automático (QuoteCalculator)
4. Salvar e gerar PDF

### Materiais
- CRUD completo, normalização automática de custos

### Testes
- Unitários: componentes, hooks, contextos
- Integração: fluxo Material → Orçamento → PDF

## 4. Comandos Essenciais

```bash
npm run dev:full         # Frontend + Backend
npm run dev              # Apenas frontend
npm run backend          # Apenas backend
npm test                 # Testes
npm run build            # Build produção
npm run preview          # Preview build
```

## 5. Convenções e Recomendações

- **Componentes**: Sempre tipados, interface {ComponentName}Props
- **Estado derivado**: useMemo para cálculos
- **Contexto**: DataContext centraliza dados
- **Alias**: @ aponta para frontend/ (Vite + tsconfig)
- **Testes**: Sempre mockar AuthContext/DataContext
- **PDF**: Geração via jsPDF, inclui logo, totais, tabela

## 6. Troubleshooting

- Erro de import/alias: verifique vite.config.ts e tsconfig.json
- Cálculo errado: revise normalizeMaterials e QuoteCalculator
- Testes falhando: confira mocks e moduleNameMapper
- Build falha: rode `npm run validate:production`

## 7. PRD – Product Requirements Document (Resumo)

### Objetivo
Sistema web para gestão e geração rápida de orçamentos industriais, com cálculo automático, multi-tenant, PDF e controle de materiais/componentes.

### Requisitos Funcionais
- Cadastro e edição de materiais, clientes e orçamentos
- Cálculo automático de custos, frete, lucro
- Geração de PDF profissional
- Isolamento de dados por usuário (tenant)
- Testes automatizados e cobertura mínima 80%

### Requisitos Não Funcionais
- Interface responsiva e moderna (Tailwind)
- Build otimizado (Vite)
- Testes robustos (Jest + Testing Library)
- Backend desacoplado e pronto para integração

### Restrições
- Persistência localStorage (atual)
- Backend Express/SQLite parcial

### Critérios de Aceite
- Orçamento gerado corretamente e PDF fiel
- Dados isolados por tenant
- Testes automatizados passando
- Build de produção sem erros

## 8. Recomendações Finais

- Para produção, conectar frontend ao backend Express/SQLite
- Validar todos os fluxos críticos com testes de integração
- Manter documentação e PRD atualizados
- Usar comandos de validação antes de deploy

---

*Gerado automaticamente por GitHub Copilot – GPT-4.1*
