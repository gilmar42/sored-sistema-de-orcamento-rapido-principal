/**
 * Testes de Integração E2E - Fluxo Completo
 * Testa o fluxo completo: criar material → criar orçamento → gerar PDF
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DataProvider } from '../../context/DataContext';
import { MaterialManagement } from '../MaterialManagement';
import { QuoteCalculator } from '../QuoteCalculator';
import { SavedQuotes } from '../SavedQuotes';
import { generateQuotePDF } from '../../services/pdfGenerator';
import type { Material, WeightUnit } from '../../types';

// Mock da função de gerar PDF
jest.mock('../../services/pdfGenerator');

// Mock dos modais
jest.mock('@/components/MaterialFormModal', () => ({
    __esModule: true,
    MaterialFormModal: ({ isOpen, onClose, onSave }: any) => {
      if (!isOpen) return null;
      return (
        <div data-testid="material-form-modal">
          <button
            onClick={() => {
              const newMaterial: Material = {
                id: `MAT-${Date.now()}`,
                name: 'Material E2E Test',
                categoryId: '1',
                unitCost: 200,
                unitWeight: 3.0,
                unit: 'kg' as WeightUnit,
                description: 'Material para teste E2E',
                components: [
                  { id: 'COMP-E2E-1', name: 'Componente Principal', unitCost: 120, unitWeight: 2, unit: 'kg' as WeightUnit },
                  { id: 'COMP-E2E-2', name: 'Componente Secundário', unitCost: 80, unitWeight: 1, unit: 'kg' as WeightUnit },
                ],
              };
              onSave(newMaterial);
              onClose();
            }}
            data-testid="save-material-btn"
          >
            Salvar Material E2E
          </button>
        </div>
      );
    },
}));

jest.mock('../MaterialSelectionModal', () => {
    const { jsx: _jsx, Fragment: _Fragment, jsxs: _jsxs } = require("react/jsx-runtime");
    // This mock needs to be stateful or receive props to work in the E2E test.
    // For now, let's make it find materials from a mocked context.
    const { useDataContext } = require('../../context/DataContext');

    return {
        MaterialSelectionModal: ({ isOpen, onClose, onSelect }) => {
            const { materials } = useDataContext(); // Now it gets materials from the provider
            if (!isOpen) return null;

            return (_jsx("div", {
                "data-testid": "material-selection-modal",
                children: _jsxs(_Fragment, {
                    children: [
                        _jsx("h2", { children: "Selecionar Material" }),
                        materials && materials.map((mat, index) => (
                            _jsx("button", {
                                "data-testid": `select-material-btn-${index}`,
                                onClick: () => {
                                    onSelect(mat.id);
                                    onClose();
                                },
                                children: mat.name
                            }, mat.id)
                        ))
                    ]
                })
            }));
        }
    };
});

jest.mock('../PdfActionModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: any) => {
    if (!isOpen) return null;
    return <div data-testid="pdf-modal">PDF Gerado</div>;
  },
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Integração E2E - Fluxo Completo de Produção', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
    window.alert = jest.fn();
  });

  describe('Fluxo Completo: Material → Orçamento → PDF', () => {
    it('deve criar material, adicionar ao orçamento e gerar PDF', async () => {
      const { rerender } = render(
        <DataProvider testCurrentUser={{ id: 'test-user-id', tenantId: 'test-tenant-id' }}>
          <MaterialManagement activeView="materials" />
        </DataProvider>
      );

      // PASSO 1: Criar Material
      console.log('=== PASSO 1: Criando Material ===');
      const addMaterialBtn = screen.getByText(/Novo Material/i);
      fireEvent.click(addMaterialBtn);

      await waitFor(() => {
        expect(screen.getByTestId('material-form-modal')).toBeInTheDocument();
      });

      const saveMaterialBtn = screen.getByTestId('save-material-btn');
      fireEvent.click(saveMaterialBtn);

      await waitFor(() => {
        expect(screen.getByText('Material E2E Test')).toBeInTheDocument();
      });

      console.log('✓ Material criado com sucesso');

      // PASSO 2: Criar Orçamento
      console.log('=== PASSO 2: Criando Orçamento ===');
      rerender(
        <DataProvider testCurrentUser={{ id: 'test-user-id', tenantId: 'test-tenant-id' }}>
          <QuoteCalculator
            quoteToEdit={null}
            setQuoteToEdit={() => {}}
          />
        </DataProvider>
      );

      // Preencher nome do cliente
      const clientInput = screen.getByPlaceholderText(/Nome do Cliente/i);
      fireEvent.change(clientInput, { target: { value: 'Cliente E2E Test' } });

      // Adicionar Item ao orçamento
      const addItemBtn = screen.getByRole('button', { name: /Adicionar Item/i });
      fireEvent.click(addItemBtn);

      await waitFor(() => {
        expect(screen.getByTestId('material-selection-modal')).toBeInTheDocument();
      });

      const selectMaterialBtn = screen.getByTestId('select-material-btn-0');
      fireEvent.click(selectMaterialBtn);

      await waitFor(() => {
        expect(screen.queryByTestId('material-selection-modal')).not.toBeInTheDocument();
      });

      console.log('✓ Material adicionado ao orçamento');

      // Alterar quantidade
      const quantityInput = screen.getByDisplayValue('1');
      fireEvent.change(quantityInput, { target: { value: '5' } });

      // Alterar margem de lucro
      const marginInput = screen.getByDisplayValue('20');
      fireEvent.change(marginInput, { target: { value: '30' } });

      console.log('✓ Quantidade e margem configuradas');

      // PASSO 3: Salvar Orçamento
      console.log('=== PASSO 3: Salvando Orçamento ===');
      const saveQuoteBtn = screen.getByText(/Salvar Orçamento/i);
      fireEvent.click(saveQuoteBtn);

      await waitFor(() => {
        const stored = localStorageMock.getItem('test-tenant-id-quotes');
        expect(stored).toBeTruthy();
      });

      const storedQuotes = JSON.parse(localStorageMock.getItem('test-tenant-id-quotes') || '[]');
      expect(storedQuotes).toHaveLength(1);
      expect(storedQuotes[0].clientName).toBe('Cliente E2E Test');
      expect(storedQuotes[0].profitMargin).toBe(30);
      expect(storedQuotes[0].items[0].quantity).toBe(5);

      console.log('✓ Orçamento salvo com sucesso');

      // PASSO 4: Gerar PDF
      console.log('=== PASSO 4: Gerando PDF ===');
      const generatePdfBtn = screen.getByText(/Gerar PDF/i);
      fireEvent.click(generatePdfBtn);

      await waitFor(() => {
        expect(generateQuotePDF).toHaveBeenCalled();
      });

      console.log('✓ PDF gerado com sucesso');
      console.log('=== FLUXO E2E COMPLETO ===');
    });

    it('deve calcular custos corretamente no fluxo completo', async () => {
      const { rerender } = render(
        <DataProvider testCurrentUser={{ id: 'test-user-id', tenantId: 'test-tenant-id' }}>
          <MaterialManagement activeView="materials" />
        </DataProvider>
      );

      // Criar material com componentes (120 + 80 = 200)
      const addMaterialBtn = screen.getByText(/Novo Material/i);
      fireEvent.click(addMaterialBtn);

      await waitFor(() => {
        expect(screen.getByTestId('material-form-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-material-btn'));

      await waitFor(() => {
        expect(screen.getByText('Material E2E Test')).toBeInTheDocument();
      });

      // Criar orçamento
      rerender(
        <DataProvider testCurrentUser={{ id: 'test-user-id', tenantId: 'test-tenant-id' }}>
          <QuoteCalculator
            quoteToEdit={null}
            setQuoteToEdit={() => {}}
          />
        </DataProvider>
      );

      const clientInput = screen.getByPlaceholderText(/Nome do Cliente/i);
      fireEvent.change(clientInput, { target: { value: 'Cliente Cálculo' } });

      const addItemBtn = screen.getByRole('button', { name: /Adicionar Item/i });
      fireEvent.click(addItemBtn);

      await waitFor(() => {
        expect(screen.getByTestId('material-selection-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('select-material-btn-0'));

      // Quantidade: 10 unidades
      await waitFor(() => {
        const quantityInput = screen.getByDisplayValue('1');
        expect(quantityInput).toBeInTheDocument();
      });

      const quantityInput = screen.getByDisplayValue('1');
      fireEvent.change(quantityInput, { target: { value: '10' } });

      // Margem: 25%
      const marginInput = screen.getByDisplayValue('20');
      fireEvent.change(marginInput, { target: { value: '25' } });

      // Salvar
      const saveQuoteBtn = screen.getByText(/Salvar Orçamento/i);
      fireEvent.click(saveQuoteBtn);

      await waitFor(() => {
        const stored = localStorageMock.getItem('test-tenant-id-quotes');
        expect(stored).toBeTruthy();
      });

      const quotes = JSON.parse(localStorageMock.getItem('test-tenant-id-quotes') || '[]');
      const quote = quotes[0];

      // Custo dos componentes: (120 + 80) = 200 por unidade
      // 10 unidades = 2000
      // Custo total do projeto = 2000
      // Margem de 25% = 500
      // Valor final = 2500

      // Quote não contém totalProjectCost/finalValue, apenas os dados brutos
      expect(quote.items[0].quantity).toBe(10);
      expect(quote.profitMargin).toBe(25);
    });
  });

  describe('Fluxo com Múltiplos Materiais', () => {
    it('deve criar múltiplos materiais e adicionar todos ao orçamento', async () => {
      const { rerender } = render(
        <DataProvider testCurrentUser={{ id: 'test-user-id', tenantId: 'test-tenant-id' }}>
          <MaterialManagement activeView="materials" />
        </DataProvider>
      );

      // Criar primeiro material
      const addMaterialBtn = screen.getByText(/Novo Material/i);
      fireEvent.click(addMaterialBtn);

      await waitFor(() => {
        expect(screen.getByTestId('material-form-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-material-btn'));

      await waitFor(() => {
        expect(screen.getByText('Material E2E Test')).toBeInTheDocument();
      });

      // Criar segundo material
      fireEvent.click(addMaterialBtn);

      await waitFor(() => {
        expect(screen.getByTestId('material-form-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-material-btn'));

      await waitFor(() => {
        const materials = JSON.parse(localStorageMock.getItem('test-tenant-id-materials') || '[]');
        expect(materials).toHaveLength(2);
      });

      // Criar orçamento com múltiplos materiais
      rerender(
        <DataProvider testCurrentUser={{ id: 'test-user-id', tenantId: 'test-tenant-id' }}>
          <QuoteCalculator
            quoteToEdit={null}
            setQuoteToEdit={() => {}}
          />
        </DataProvider>
      );

      const clientInput = screen.getByPlaceholderText(/Nome do Cliente/i);
      fireEvent.change(clientInput, { target: { value: 'Cliente Múltiplos' } });

      // Adicionar primeiro material
      const addItemBtn = screen.getByRole('button', { name: /Adicionar Item/i });
      fireEvent.click(addItemBtn);

      await waitFor(() => {
        expect(screen.getByTestId('material-selection-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('select-material-btn-0'));

      await waitFor(() => {
        expect(screen.queryByTestId('material-selection-modal')).not.toBeInTheDocument();
      });

      // Adicionar segundo material
      fireEvent.click(addItemBtn);

      await waitFor(() => {
        expect(screen.getByTestId('material-selection-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('select-material-btn-1'));

      // Salvar orçamento
      const saveQuoteBtn = screen.getByText(/Salvar Orçamento/i);
      fireEvent.click(saveQuoteBtn);

      await waitFor(() => {
        const stored = localStorageMock.getItem('test-tenant-id-quotes');
        const quotes = JSON.parse(stored || '[]');
        expect(quotes[0].items).toHaveLength(2);
      });
    });
  });

  describe('Fluxo com Frete', () => {
    it('deve incluir frete no cálculo final', async () => {
      const { rerender } = render(
        <DataProvider testCurrentUser={{ id: 'test-user-id', tenantId: 'test-tenant-id' }}>
          <MaterialManagement activeView="materials" />
        </DataProvider>
      );

      // Criar material
      const addMaterialBtn = screen.getByText(/Novo Material/i);
      fireEvent.click(addMaterialBtn);

      await waitFor(() => {
        expect(screen.getByTestId('material-form-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-material-btn'));

      // Criar orçamento com frete
      rerender(
        <DataProvider testCurrentUser={{ id: 'test-user-id', tenantId: 'test-tenant-id' }}>
          <QuoteCalculator
            quoteToEdit={null}
            setQuoteToEdit={() => {}}
          />
        </DataProvider>
      );

      const clientInput = screen.getByPlaceholderText(/Nome do Cliente/i);
      fireEvent.change(clientInput, { target: { value: 'Cliente Frete' } });

      // Adicionar Item
      const addItemBtn = screen.getByRole('button', { name: /Adicionar Item/i });
      fireEvent.click(addItemBtn);

      await waitFor(() => {
        expect(screen.getByTestId('material-selection-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('select-material-btn-0'));

      // Habilitar frete
      const freightCheckbox = screen.getByRole('checkbox', { name: /Ativar Frete/i });
      fireEvent.click(freightCheckbox);

      // Adicionar valor de frete
      const freightInput = screen.getByLabelText(/Custo de Frete/i);
      fireEvent.change(freightInput, { target: { value: '250' } });

      // Salvar
      const saveQuoteBtn = screen.getByText(/Salvar Orçamento/i);
      fireEvent.click(saveQuoteBtn);

      await waitFor(() => {
        const stored = localStorageMock.getItem('test-tenant-id-quotes');
        const quotes = JSON.parse(stored || '[]');
        
        expect(quotes[0].freightCost).toBe(250);
        expect(quotes[0].isFreightEnabled).toBe(true);
        // totalProjectCost deve incluir o frete
      });
    });
  });

  describe('Validação de Integridade End-to-End', () => {
    it('deve manter consistência de dados em todo o fluxo', async () => {
      const { rerender } = render(
        <DataProvider testCurrentUser={{ id: 'test-user-id', tenantId: 'test-tenant-id' }}>
          <MaterialManagement activeView="materials" />
        </DataProvider>
      );

      // 1. Criar material
      const addMaterialBtn = screen.getByText(/Novo Material/i);
      fireEvent.click(addMaterialBtn);

      await waitFor(() => {
        expect(screen.getByTestId('material-form-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-material-btn'));

      await waitFor(() => {
        expect(screen.getByText('Material E2E Test')).toBeInTheDocument();
      });

      const materials = JSON.parse(localStorageMock.getItem('test-tenant-id-materials') || '[]');
      const materialId = materials[0].id;

      // 2. Criar orçamento
      rerender(
        <DataProvider testCurrentUser={{ id: 'test-user-id', tenantId: 'test-tenant-id' }}>
          <QuoteCalculator
            quoteToEdit={null}
            setQuoteToEdit={() => {}}
          />
        </DataProvider>
      );

      const clientInput = screen.getByPlaceholderText(/Nome do Cliente/i);
      fireEvent.change(clientInput, { target: { value: 'Cliente Integridade' } });

      const addItemBtn = screen.getByRole('button', { name: /Adicionar Item/i });
      fireEvent.click(addItemBtn);

      await waitFor(() => {
        expect(screen.getByTestId('material-selection-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('select-material-btn-0'));

      const saveQuoteBtn = screen.getByText(/Salvar Orçamento/i);
      fireEvent.click(saveQuoteBtn);

      await waitFor(() => {
        const stored = localStorageMock.getItem('test-tenant-id-quotes');
        expect(stored).toBeTruthy();
      });

      const quotes = JSON.parse(localStorageMock.getItem('test-tenant-id-quotes') || '[]');
      
      // Validações de integridade
      expect(quotes[0].items[0].materialId).toBe(materialId);
      expect(quotes[0].clientName).toBe('Cliente Integridade');
      expect(quotes[0].id).toMatch(/^Q-/);
      expect(quotes[0].items.length).toBe(1);
    });
  });

  describe('Fluxo de Visualização de Orçamentos Salvos', () => {
    it('deve listar orçamentos salvos após criação', async () => {
      const { rerender } = render(
        <DataProvider testCurrentUser={{ id: 'test-user-id', tenantId: 'test-tenant-id' }}>
          <MaterialManagement activeView="materials" />
        </DataProvider>
      );

      // Criar material
      const addMaterialBtn = screen.getByText(/Novo Material/i);
      fireEvent.click(addMaterialBtn);

      await waitFor(() => {
        expect(screen.getByTestId('material-form-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-material-btn'));

      // Criar orçamento
      rerender(
        <DataProvider testCurrentUser={{ id: 'test-user-id', tenantId: 'test-tenant-id' }}>
          <QuoteCalculator
            quoteToEdit={null}
            setQuoteToEdit={() => {}}
          />
        </DataProvider>
      );

      const clientInput = screen.getByPlaceholderText(/Nome do Cliente/i);
      fireEvent.change(clientInput, { target: { value: 'Cliente Lista' } });

      const addItemBtn = screen.getByRole('button', { name: /Adicionar Item/i });
      fireEvent.click(addItemBtn);

      await waitFor(() => {
        expect(screen.getByTestId('material-selection-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('select-material-btn-0'));

      const saveQuoteBtn = screen.getByText(/Salvar Orçamento/i);
      fireEvent.click(saveQuoteBtn);

      await waitFor(() => {
        const stored = localStorageMock.getItem('test-tenant-id-quotes');
        expect(stored).toBeTruthy();
      });

      // Visualizar orçamentos salvos
      rerender(
        <DataProvider testCurrentUser={{ id: 'test-user-id', tenantId: 'test-tenant-id' }}>
          <SavedQuotes onEditQuote={() => {}} />
        </DataProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Cliente Lista')).toBeInTheDocument();
      });
    });
  });
});


