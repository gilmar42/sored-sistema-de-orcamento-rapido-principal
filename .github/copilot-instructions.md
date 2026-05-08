# SORED - Sistema de Orçamento Rápido

## Arquitetura Geral

Este é um **sistema fullstack monorepo** de gestão de orçamentos em React + TypeScript + Node.js:
- **Frontend**: React 18.2 + TypeScript + Vite + Tailwind v4 (pasta `frontend/`)
- **Backend**: Node.js + Express + SQLite (pasta `backend/`) - _parcialmente implementado_
- **Persistência atual**: LocalStorage com isolamento por tenant
- **Raiz do projeto**: comandos npm executam na raiz; Vite roda com `root: 'frontend'`

### Fluxo de Dados Principal

```
DataContext (useLocalStorage) → Materials/Clients/Quotes → QuoteCalculator → PDF Generator
                ↓
    Normalização de componentes (normalizeMaterials)
```

**Isolamento multi-tenant**: Cada usuário tem dados isolados via `tenantId` no AuthContext. Todas as chaves do localStorage usam padrão `sored_{entity}_{tenantId}`.

## Comandos Essenciais

```bash
# Desenvolvimento
npm run dev              # Frontend apenas (porta 3000)
npm run dev:full         # Frontend + Backend juntos (recomendado)
npm run backend          # Backend apenas (porta 5000)

# Testes
npm test                 # Todos os testes (86+ casos)
npm run test:production  # Apenas testes de produção/e2e
npm run validate:production  # Validação completa (testes + build + checks)

# Build
npm run build           # Build otimizado com Vite → dist/
npm run preview         # Preview do build de produção
```

**Importante**: Os testes usam Jest + Testing Library com configuração em `jest.config.cjs`. Todos os testes ficam em `frontend/**/*.test.tsx`.

## Convenções de Código

### Estrutura de Componentes
- **Padrão**: Componentes funcionais com TypeScript tipado explicitamente
- **Props**: Sempre definir interface `{ComponentName}Props`
- **Estado**: Preferir `useMemo` para cálculos derivados (veja `QuoteCalculator.tsx` linha 64-102)
- **Context**: `DataContext` centraliza TODOS os dados (materials, quotes, clients, settings)

### Gestão de Estado
```typescript
// Exemplo de integração com DataContext
const { materials, setMaterials, addMaterial, updateMaterial } = useData();

// Normalização automática de componentes
const normalizedMaterials = useMemo(() => {
  // normalizeMaterials garante que componentes tenham unitCost/unitWeight atualizados
}, [materials]);
```

### Cálculos de Orçamento
**Lógica crítica** em `QuoteCalculator.tsx` (linha 64-102):
1. **Material Cost**: Soma `unitCost` de todos os componentes × quantidade
2. **Manufacturing Cost**: Mesmo cálculo (duplicado para separação contábil)
3. **Freight**: Condicional via `isFreightEnabled`
4. **Profit**: `(materialCost + manufacturingCost + freight) * (profitMargin/100)`
5. **Final Value**: Total + Profit

**⚠️ Regra**: Se material não tem componentes, usar `material.unitCost` diretamente.

## Estrutura de Dados Chave

### Material com Componentes
```typescript
interface Material {
  id: string;
  name: string;
  components: ProductComponent[];  // Componentes que formam o material
  unitCost: number;  // Calculado como soma dos components.unitCost
  unitWeight: number;
  categoryId: string;
  // Dimensões opcionais: diameterValue/Unit, lengthValue/Unit, widthValue/Unit
}
```

### Quote (Orçamento)
```typescript
interface Quote {
  id: string;
  clientName: string;
  items: QuoteItem[];  // Array de { materialId, quantity }
  freightCost: number;
  profitMargin: number;
  isFreightEnabled: boolean;
  // Campos calculados não são persistidos
}
```

## Fluxos de Trabalho Críticos

### 1. Criar/Editar Orçamento
1. Usuário seleciona materiais via `MaterialSelectionModal`
2. Define quantidades e margem de lucro
3. `QuoteCalculator` recalcula custos automaticamente (via `useMemo`)
4. Salvar persiste no `DataContext` → localStorage
5. PDF gerado via `pdfGenerator.ts` (jsPDF)

### 2. Gestão de Materiais
- Materiais podem ter N componentes (ex: "Portão" = Chapa + Tubo + Tinta)
- **Normalização**: `normalizeMaterials.ts` garante que `components[].unitCost` reflita o custo do material referenciado
- CRUD completo em `MaterialManagement.tsx` com modal `MaterialFormModal`

### 3. Testes
- **Unit tests**: Componentes individuais + DataContext
- **Integration tests**: Fluxos end-to-end (Material → Quote → PDF)
- **Padrão de mock**: `__mocks__/` para uuid e api.ts
- **Importante**: Setup em `setupTests.ts` configura Testing Library + Jest DOM

## Padrões de Teste

```typescript
// Estrutura padrão de teste
describe('ComponentName', () => {
  it('should do something specific', () => {
    // Arrange: Setup com DataProvider e AuthProvider
    const mockData = { /* ... */ };
    
    // Act: render + userEvent
    render(<Component />, { wrapper: Wrapper });
    
    // Assert: expect + waitFor para async
  });
});
```

**Mocks essenciais**:
- `AuthContext`: Sempre fornecer `tenantId` nos testes
- `DataContext`: Fornecer dados iniciais via props `testClients`, `testCurrentUser`
- `uuid`: Mockado em `__mocks__/uuid.js` para IDs previsíveis

## Integrações Externas

### Backend (Futuro/Parcial)
- API REST em `backend/src/app.js` (Express + SQLite)
- Endpoints: `/api/auth`, `/api/materials`, `/api/quotes`, `/api/clients`
- **Atual**: Frontend usa localStorage; backend disponível mas não conectado
- Veja `BACKEND-INTEGRATION.md` para instruções completas

### PDF Generation
- Biblioteca: jsPDF
- Service: `frontend/services/pdfGenerator.ts`
- Inclui: Logo da empresa, detalhes do orçamento, tabela de materiais, totais

## Configurações Importantes

### Vite (`vite.config.ts`)
- `root: 'frontend'` - Todos os paths relativos à pasta frontend
- Alias `@/` → `frontend/`
- Build otimizado: manualChunks (vendor, utils), terser minify
- Porta 3000 (não 5173)

### Jest (`jest.config.cjs`)
- Preset: ts-jest + jsdom
- ModuleNameMapper: `@/` → `<rootDir>/frontend/`
- TransformIgnorePatterns: Processa `uuid` do node_modules
- TestMatch: `frontend/**/*.test.{ts,tsx}`

### Tailwind v4
- Config: `tailwind.config.js` + `@tailwindcss/vite` plugin
- Tema customizado: Cores ice/blue profissionais
- Dark mode suportado via `useDarkMode` hook

## Troubleshooting Comum

### "Cannot find module" em testes
- Verificar `moduleNameMapper` no jest.config.cjs
- Checar se mock existe em `__mocks__/`

### Cálculos errados no orçamento
- Verificar normalização de materiais (`normalizeMaterials.ts`)
- Validar que componentes têm `unitCost` populado
- Debugar `calculated` object no `QuoteCalculator` (linha 64)

### Build falha
- Executar `npm run validate:production` para diagnóstico completo
- Checar imports circulares
- Validar tipos TypeScript com `tsc --noEmit`

## Documentação Adicional

- `TESTING.md` - Guia completo de testes
- `BACKEND-INTEGRATION.md` - Integração frontend/backend
- `PRODUCTION-GUIDE.md` - Checklist de deploy
- `DEPLOY-CHECKLIST.md` - Validações pré-deploy
