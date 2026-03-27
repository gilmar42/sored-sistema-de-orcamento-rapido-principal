/**
 * Testes de Produção - QuoteCalculator - Validação de Tamanho de Componente
 * Verifica se o componente renderiza corretamente com diferentes estruturas de dados de tamanho.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuoteCalculator } from './QuoteCalculator';
import { DataProvider, DataContext } from '@/context/DataContext';
import { AuthProvider } from '@/context/AuthContext';
import type { Material, Category, AppSettings } from '@/types';

// Mocking hooks and context
jest.mock('@/hooks/useCategories', () => ({
  useCategories: jest.fn(),
}));

// Access mocked useCategories without importing the module directly (avoids TS path resolution issues)
const { useCategories: mockUseCategories } = jest.requireMock('@/hooks/useCategories') as { useCategories: jest.Mock };

let mockContext: any = {};
jest.mock('@/context/DataContext', () => {
  const React = require('react');
  return {
    DataProvider: ({ children }: { children: React.ReactNode }) => children,
    DataContext: React.createContext({}),
    useData: () => mockContext,
  };
});

// use the mocked function from requireMock

beforeEach(() => {
  mockContext = {
    materials: [materialWithSizeObject, materialWithExplicitFields, materialWithRawString],
    normalizedMaterials: [materialWithSizeObject, materialWithExplicitFields, materialWithRawString],
    setMaterials: jest.fn(),
    categories: [],
    setCategories: jest.fn(),
    quotes: [],
    setQuotes: jest.fn(),
    settings: { companyName: '', companyContact: '', companyLogo: '', defaultTax: 0 },
    setSettings: jest.fn(),
    clients: [],
    setClients: jest.fn(),
    addClient: jest.fn(),
    updateClient: jest.fn(),
    deleteClient: jest.fn(),
    addMaterial: jest.fn(),
    updateMaterial: jest.fn(),
    deleteMaterial: jest.fn(),
    setQuoteToEdit: jest.fn(),
  };
});

// Mock data with different size structures
const materialWithSizeObject: Material = {
  id: 'mat-1',
  name: 'Parafuso',
  description: 'Parafuso M10',
  unit: 'kg',
  unitCost: 2.50,
  unitWeight: 0.25,
  categoryId: 'cat-1',
  components: [
    {
      id: 'comp-1',
      name: 'Corpo do Parafuso',
      unit: 'kg',
      unitCost: 2.50,
      unitWeight: 0.1,
      sizeValue: {
        widthValue: 10,
        widthUnit: 'mm',
        diameterValue: 5,
        diameterUnit: 'mm',
      },
    },
  ],
};

const materialWithExplicitFields: Material = {
  id: 'mat-2',
  name: 'Pino',
  description: 'Pino cilíndrico',
  unit: 'kg',
  unitCost: 1.50,
  unitWeight: 0.30,
  categoryId: 'cat-1',
  components: [
    {
      id: 'comp-2',
      name: 'Pino Principal',
      unit: 'kg',
      unitCost: 1.50,
      unitWeight: 0.15,
      widthValue: 20,
      widthUnit: 'mm',
      diameterValue: 8,
      diameterUnit: 'mm',
    },
  ],
};

const materialWithRawString: Material = {
  id: 'mat-3',
  name: 'Porca',
  description: 'Porca sextavada',
  unit: 'kg',
  unitCost: 1.00,
  unitWeight: 0.15,
  categoryId: 'cat-1',
  components: [
    {
      id: 'comp-3',
      name: 'Porca Hex',
      unit: 'kg',
      unitCost: 1.00,
      unitWeight: 0.05,
      sizeValue: '3/8',
    },
  ],
};

const mockMaterials = [
  materialWithSizeObject,
  materialWithExplicitFields,
  materialWithRawString,
];

const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Fixadores' },
];

const mockDataContextValue = {
  clients: [],
  setClients: jest.fn(),
  addClient: jest.fn(),
  updateClient: jest.fn(),
  deleteClient: jest.fn(),
  materials: mockMaterials,
  setMaterials: jest.fn(),
  normalizedMaterials: mockMaterials,
  addMaterial: jest.fn(),
  updateMaterial: jest.fn(),
  deleteMaterial: jest.fn(),
  categories: mockCategories,
  setCategories: jest.fn(),
  quotes: [],
  setQuotes: jest.fn(),
  settings: {
    companyName: 'Test Co',
    companyContact: 'test@example.com',
    companyLogo: '',
    defaultTax: 10,
  } as AppSettings,
  setSettings: jest.fn(),
  tenantId: 'test-tenant',
  userId: 'test-user',
  setQuoteToEdit: jest.fn(),
};

const renderQuoteCalculator = (materials: Material[]) => {
  mockUseCategories.mockReturnValue({
    categories: mockCategories,
    setCategories: jest.fn(),
  });

  const contextValue = { ...mockDataContextValue, materials };

  return render(
    <AuthProvider>
      <DataContext.Provider value={contextValue as any}>
        <QuoteCalculator quoteToEdit={null} setQuoteToEdit={jest.fn()} onNavigateToMaterials={jest.fn()} />
      </DataContext.Provider>
    </AuthProvider>
  );
};

describe('QuoteCalculator - Component Size Rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly render size from a sizeValue object', async () => {
    renderQuoteCalculator([materialWithSizeObject]);

    fireEvent.click(screen.getByRole('button', { name: /Adicionar Item/i }));

    await waitFor(() => {
      expect(screen.getByTestId('material-selection-modal')).toBeInTheDocument();
    });

    // Select the correct material for this test case: Parafuso
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Parafuso/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Parafuso/i }));

    // Wait for modal to close and components table to render
    await waitFor(() => {
      expect(screen.queryByTestId('material-selection-modal')).not.toBeInTheDocument();
    });

    // Ensure the components table section is visible
    await waitFor(() => {
      expect(screen.getByText(/Componentes do Produto Final/i)).toBeInTheDocument();
    });

    // Check for the rendered size string in components table (matches formatComponentSize output)
    await waitFor(() => {
      expect(screen.getByText(/Ø: 5mm × L: 10mm/i)).toBeInTheDocument();
    });
  });

  it('should correctly render size from explicit length/diameter fields', async () => {
    renderQuoteCalculator([materialWithExplicitFields]);

    fireEvent.click(screen.getByRole('button', { name: /Adicionar Item/i }));

    await waitFor(() => {
      expect(screen.getByTestId('material-selection-modal')).toBeInTheDocument();
    });

    // Select the correct material for this test case: Pino
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Pino/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Pino/i }));

    // Wait for modal to close and components table to render
    await waitFor(() => {
      expect(screen.queryByTestId('material-selection-modal')).not.toBeInTheDocument();
    });

    // Ensure the components table section is visible
    await waitFor(() => {
      expect(screen.getByText(/Componentes do Produto Final/i)).toBeInTheDocument();
    });

    // Check for the rendered size string in components table (matches formatComponentSize output)
    await waitFor(() => {
      expect(screen.getByText(/Ø: 8mm × L: 20mm/i)).toBeInTheDocument();
    });
  });

  it('should correctly render size from a raw string in sizeValue', async () => {
    renderQuoteCalculator([materialWithRawString]);

    fireEvent.click(screen.getByRole('button', { name: /Adicionar Item/i }));

    await waitFor(() => {
      expect(screen.getByTestId('material-selection-modal')).toBeInTheDocument();
    });

    // Select the correct material for this test case: Porca
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Porca/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Porca/i }));

    // Wait for modal to close and components table to render
    await waitFor(() => {
      expect(screen.queryByTestId('material-selection-modal')).not.toBeInTheDocument();
    });

    // Ensure the components table section is visible
    await waitFor(() => {
      expect(screen.getByText(/Componentes do Produto Final/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('3/8')).toBeInTheDocument();
    });
  });

  it('should not render "[object Object]" for any size format', async () => {
    renderQuoteCalculator(mockMaterials);

    // Add each material by opening modal and selecting its button
    const names = ['Parafuso', 'Pino', 'Porca'];
    for (const name of names) {
      fireEvent.click(screen.getByRole('button', { name: /Adicionar Item/i }));
      await waitFor(() => {
        expect(screen.getByTestId('material-selection-modal')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: new RegExp(name, 'i') }));
      await waitFor(() => {
        expect(screen.queryByTestId('material-selection-modal')).not.toBeInTheDocument();
      });
    }

    // Ensure no "[object Object]" is rendered anywhere
    expect(screen.queryByText(/\[object Object\]/)).not.toBeInTheDocument();
  });
});
