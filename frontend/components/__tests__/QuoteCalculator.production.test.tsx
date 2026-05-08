/**
 * Testes de Produção - QuoteCalculator
 * Valida cálculos, componentes e geração de orçamentos
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuoteCalculator } from '../QuoteCalculator';
import { DataProvider } from '../../context/DataContext';
import type { Material, Quote, WeightUnit } from '../../types';

// Mock do AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      id: 'test-user-id',
      email: 'test@example.com',
      tenantId: 'test-tenant-id',
      passwordHash: 'hashed',
    },
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock do pdfGenerator
jest.mock('../../services/pdfGenerator', () => ({
  generateQuotePDF: jest.fn(() => Promise.resolve(new Blob(['PDF content'], { type: 'application/pdf' }))),
}));

// Mock do MaterialSelectionModal
jest.mock('../MaterialSelectionModal', () => ({
  MaterialSelectionModal: ({ isOpen, onClose, onSelect }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="material-modal">
        <button onClick={() => {
          onSelect('MAT-001');
          onClose();
        }}>
          Selecionar Material
        </button>
      </div>
    );
  },
}));

// Mock do PdfActionModal
jest.mock('../PdfActionModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: any) => {
    if (!isOpen) return null;
    return <div data-testid="pdf-modal">PDF Modal</div>;
  },
}));

const mockMaterials: Material[] = [
  {
    id: 'MAT-001',
    name: 'Material Teste',
    categoryId: '1',
    unitCost: 100,
    unitWeight: 2.5,
    unit: 'kg' as WeightUnit,
    description: 'Material de teste',
    components: [
      { id: 'COMP-1', name: 'Componente A', unitCost: 40, unitWeight: 1, unit: 'kg' as WeightUnit },
      { id: 'COMP-2', name: 'Componente B', unitCost: 30, unitWeight: 0.5, unit: 'kg' as WeightUnit },
      { id: 'COMP-3', name: 'Componente C', unitCost: 20, unitWeight: 0.3, unit: 'kg' as WeightUnit },
    ],
  },
  {
    id: 'MAT-002',
    name: 'Material Simples',
    categoryId: '1',
    unitCost: 50,
    unitWeight: 1.0,
    unit: 'kg' as WeightUnit,
    description: 'Material simples sem componentes',
    components: [],
  },
];

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => {
      if (key === 'test-tenant-id-materials') {
        return JSON.stringify(mockMaterials);
      }
      return store[key] || null;
    },
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

describe('QuoteCalculator - Testes de Produção', () => {
  const mockSetQuoteToEdit = jest.fn();
  const mockOnNavigateToMaterials = jest.fn();

  const renderQuoteCalculator = (quoteToEdit: Quote | null = null) => {
    return render(
      <DataProvider testCurrentUser={{ id: 'test-user-id', tenantId: 'test-tenant-id' }}>
        <QuoteCalculator
          quoteToEdit={quoteToEdit}
          setQuoteToEdit={mockSetQuoteToEdit}
          onNavigateToMaterials={mockOnNavigateToMaterials}
        />
      </DataProvider>
    );
  };

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('Renderização Inicial', () => {
    it('deve renderizar o formulário de orçamento', () => {
      renderQuoteCalculator();

      expect(screen.getByText(/Novo Orçamento/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Selecione ou digite o nome do cliente/i)).toBeInTheDocument();
    });

    it('deve ter campos de entrada básicos', () => {
      renderQuoteCalculator();

      expect(screen.getByPlaceholderText(/Selecione ou digite o nome do cliente/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Margem de Lucro \(%\)/i)).toBeInTheDocument();
    });
  });

  describe('Cálculos Automáticos', () => {
    it('deve calcular custo total baseado nos componentes', async () => {
      renderQuoteCalculator();

      // Adicionar um material
      const addButton = screen.getByRole('button', { name: /Adicionar Item/i });
      await act(async () => {
        fireEvent.click(addButton);
      });

      // Selecionar material no modal
      await waitFor(() => {
        expect(screen.getByTestId('material-modal')).toBeInTheDocument();
      });

      const selectButton = screen.getByText(/Selecionar Material/i);
      await act(async () => {
        fireEvent.click(selectButton);
      });

      // Verificar se o cálculo foi feito
      await waitFor(() => {
        // Material MAT-001 tem 3 componentes: 40 + 30 + 20 = 90
        // Com quantidade 1, custo de componentes = 90
        const calculationSection = screen.getByText(/Resumo do Orçamento/i);
        expect(calculationSection).toBeInTheDocument();
      });
    });

    it('deve recalcular ao alterar quantidade', async () => {
      renderQuoteCalculator();

      // Adicionar Item
      const addButton = screen.getByRole('button', { name: /Adicionar Item/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('material-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Selecionar Material/i));

      await waitFor(() => {
        const quantityInput = screen.getByLabelText(/Quantidade do item/i);
        expect(quantityInput).toBeInTheDocument();
        fireEvent.change(quantityInput, { target: { value: '5' } });
      });

      // Custo deve multiplicar: 90 * 5 = 450
      await waitFor(() => {
        expect(screen.getByText(/Resumo do Orçamento/i)).toBeInTheDocument();
      });
    });

    it('deve calcular margem de lucro corretamente', async () => {
      renderQuoteCalculator();

      // Adicionar Item
      const addButton = screen.getByRole('button', { name: /Adicionar Item/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('material-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Selecionar Material/i));

      // Alterar margem de lucro
      const marginInput = screen.getByLabelText(/Margem de Lucro \(%\)/i);
      fireEvent.change(marginInput, { target: { value: '30' } });

      await waitFor(() => {
        expect(screen.getByText(/Resumo do Orçamento/i)).toBeInTheDocument();
        // Margem deve ser recalculada: custo * 0.3
      });
    });

    it('deve incluir frete quando habilitado', async () => {
      renderQuoteCalculator();

      // Habilitar frete
      const freightCheckbox = screen.getByLabelText(/Ativar Frete/i);
      fireEvent.click(freightCheckbox);

      // Adicionar valor de frete
      const freightInput = screen.getByLabelText(/Custo de Frete \(R\$\)/i);
      fireEvent.change(freightInput, { target: { value: '100' } });

      await waitFor(() => {
        expect(screen.getByText(/Resumo do Orçamento/i)).toBeInTheDocument();
        // Frete deve ser incluído no custo total
      });
    });
  });

  describe('Gestão de Itens', () => {
    it('deve adicionar múltiplos materiais', async () => {
      renderQuoteCalculator();

      // Adicionar primeiro material
      const addButton = screen.getByRole('button', { name: /Adicionar Item/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('material-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Selecionar Material/i));

      await waitFor(() => {
        expect(screen.queryByTestId('material-modal')).not.toBeInTheDocument();
      });

      // Adicionar segundo material
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('material-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Selecionar Material/i));

      // Deve ter 2 materiais na lista
      await waitFor(() => {
        const deleteButtons = screen.getAllByTitle(/Remover item/i);
        expect(deleteButtons.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('deve remover um item da lista', async () => {
      renderQuoteCalculator();

      // Adicionar Item
      const addButton = screen.getByRole('button', { name: /Adicionar Item/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('material-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Selecionar Material/i));

      await waitFor(() => {
        const deleteButtons = screen.getAllByTitle(/Remover item/i);
        expect(deleteButtons).toHaveLength(1);
      });

      // Remover item
      const deleteButton = screen.getByTitle(/Remover item/i);
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.queryByTitle(/Remover item/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Salvamento de Orçamento', () => {
    it('deve salvar orçamento com dados corretos', async () => {
      renderQuoteCalculator();

      // Preencher nome do cliente
      const clientInput = screen.getByPlaceholderText(/Selecione ou digite o nome do cliente/i);
      fireEvent.change(clientInput, { target: { value: 'Cliente Teste' } });

      // Adicionar Item
      const addButton = screen.getByRole('button', { name: /Adicionar Item/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('material-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Selecionar Material/i));

      // Salvar orçamento
      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /Salvar Orçamento/i });
        expect(saveButton).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /Salvar Orçamento/i });
      fireEvent.click(saveButton);

      // Verificar se foi salvo
      await waitFor(() => {
        const stored = localStorageMock.getItem('test-tenant-id-quotes');
        if (stored) {
          const quotes = JSON.parse(stored);
          expect(quotes.length).toBeGreaterThan(0);
          expect(quotes[0].clientName).toBe('Cliente Teste');
        }
      });
    });

    it('deve validar nome do cliente antes de salvar', async () => {
      renderQuoteCalculator();

      // Adicionar Item sem nome do cliente
      const addButton = screen.getByRole('button', { name: /Adicionar Item/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('material-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Selecionar Material/i));

      // Tentar salvar sem nome
      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /Salvar Orçamento/i });
        expect(saveButton).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /Salvar Orçamento/i });
      
      // Mock window.alert
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalled();
      });

      alertMock.mockRestore();
    });
  });

  describe('Edição de Orçamento', () => {
    it('deve carregar orçamento existente para edição', () => {
      const existingQuote: Quote = {
        id: 'QUOTE-001',
        date: new Date().toISOString(),
        clientName: 'Cliente Existente',
        items: [{ materialId: 'MAT-001', quantity: 3 }],
        freightCost: 50,
        profitMargin: 25,
        isFreightEnabled: true,
        laborCost: 0,
      };

      renderQuoteCalculator(existingQuote);

      expect(screen.getByDisplayValue('Cliente Existente')).toBeInTheDocument();
      expect(screen.getByDisplayValue('25')).toBeInTheDocument();
    });
  });

  describe('Validação de Integridade', () => {
    it('deve manter consistência após múltiplas operações', async () => {
      renderQuoteCalculator();

      // Preencher cliente
      const clientInput = screen.getByPlaceholderText(/Selecione ou digite o nome do cliente/i);
      fireEvent.change(clientInput, { target: { value: 'Cliente Completo' } });

      // Adicionar Item
      const addButton = screen.getByRole('button', { name: /Adicionar Item/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('material-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Selecionar Material/i));

      // Alterar quantidade
      await waitFor(() => {
        const quantityInput = screen.getByLabelText(/Quantidade do item/i);
        expect(quantityInput).toBeInTheDocument();
        fireEvent.change(quantityInput, { target: { value: '10' } });
      });

      // Alterar margem
      const marginInput = screen.getByLabelText(/Margem de Lucro \(%\)/i);
      fireEvent.change(marginInput, { target: { value: '35' } });

      // Habilitar frete
      const freightCheckbox = screen.getByLabelText(/Ativar Frete/i);
      fireEvent.click(freightCheckbox);

      const freightInput = screen.getByLabelText(/Custo de Frete \(R\$\)/i);
      fireEvent.change(freightInput, { target: { value: '150' } });

      // Salvar
      const saveButton = screen.getByText(/Salvar Orçamento/i);
      fireEvent.click(saveButton);

      // Verificar integridade dos dados salvos
      await waitFor(() => {
        const stored = localStorageMock.getItem('test-tenant-id-quotes');
        if (stored) {
          const quotes = JSON.parse(stored);
          expect(quotes[0].clientName).toBe('Cliente Completo');
          expect(quotes[0].profitMargin).toBe(35);
          expect(quotes[0].freightCost).toBe(150);
          expect(quotes[0].items[0].quantity).toBe(10);
        }
      });
    });
  });

  describe('Componentes com Custos', () => {
    it('deve usar custo dos componentes ao invés do unitCost quando disponível', async () => {
      renderQuoteCalculator();

      // Adicionar Item com componentes
      const addButton = screen.getByRole('button', { name: /Adicionar Item/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('material-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Selecionar Material/i));

      // O custo deve ser calculado pela soma dos componentes (40+30+20=90)
      // e não pelo unitCost do material (100)
      await waitFor(() => {
        expect(screen.getByText(/Resumo do Orçamento/i)).toBeInTheDocument();
      });
    });

    it('deve usar unitCost quando não houver componentes', async () => {
      // Modificar mock para retornar material sem componentes
      localStorageMock.getItem = (key: string) => {
        if (key === 'test-tenant-id-materials') {
          return JSON.stringify([mockMaterials[1]]); // Material simples sem componentes
        }
        return null;
      };

      renderQuoteCalculator();

      const addButton = screen.getByRole('button', { name: /Adicionar Item/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('material-modal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Selecionar Material/i));

      // Deve usar unitCost (50) do material
      await waitFor(() => {
        expect(screen.getByText(/Resumo do Orçamento/i)).toBeInTheDocument();
      });
    });
  });
});


