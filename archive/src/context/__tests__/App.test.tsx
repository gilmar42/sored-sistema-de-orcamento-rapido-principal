import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../App';
import { AuthProvider } from '../AuthContext';
import { DataProvider } from '../DataContext';

// Mock the useAuth hook to simulate a logged-in user
jest.mock('../AuthContext', () => ({
  ...jest.requireActual('../AuthContext'),
  useAuth: jest.fn(),
}));

// Mock MaterialFormModal
jest.mock('../../components/MaterialFormModal');

// Mock the useData hook to provide some initial data
jest.mock('../DataContext', () => ({
  ...jest.requireActual('../DataContext'),
  useData: () => ({
    materials: [
      { id: 'M-1', name: 'Material A', unitCost: 100, unit: 'm', components: [], categoryId: 'C-1' },
      { id: 'M-2', name: 'Material B', unitCost: 200, unit: 'm', components: [], categoryId: 'C-1' },
    ],
    categories: [
      { id: 'C-1', name: 'Test Category' }
    ],
    quotes: [
      { id: 'Q-1', clientName: 'Quote 1', items: [{ materialId: 'M-1', quantity: 1 }], laborCost: 10, freightCost: 5, profitMargin: 20, date: '2023-01-01T10:00:00Z' },
      { id: 'Q-2', clientName: 'Quote 2', items: [{ materialId: 'M-2', quantity: 2 }], laborCost: 15, freightCost: 7, profitMargin: 25, date: '2023-01-02T11:00:00Z' },
    ],
    settings: { companyName: 'Test Company', companyContact: '', companyLogo: '', defaultTax: 0 },
    setQuotes: jest.fn(),
    setMaterials: jest.fn(),
    setCategories: jest.fn(),
    setSettings: jest.fn(),
    createMaterial: jest.fn(),
    createQuote: jest.fn(),
    updateQuote: jest.fn(),
    deleteQuote: jest.fn(),
  }),
}));

const mockUseAuth = require('../AuthContext').useAuth;

describe('App Integration Tests', () => {
  const renderApp = () => {
    render(
      <AuthProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </AuthProvider>
    );
  };

  beforeEach(() => {
    mockUseAuth.mockClear();
    // Default mock for authenticated user with tenantId
    mockUseAuth.mockReturnValue({
      currentUser: { id: 'U-1', email: 'test@example.com', tenantId: 'T-1' },
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
    });
  });

  it('should render AuthPage when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      currentUser: null,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
    });
    renderApp();
    expect(screen.getByText('Acessar sua Conta')).toBeInTheDocument();
    expect(screen.queryByText('Lista de Materiais')).not.toBeInTheDocument();
  });

  it('should render MainLayout when user is authenticated', () => {
    // This test will now use the default mock set in beforeEach
    renderApp();
    expect(screen.queryByText('Acessar sua Conta')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Materiais/i })).toBeInTheDocument();
  });

  it('should navigate to Quote Calculator and add an item', async () => {
    // This test will now use the default mock set in beforeEach
    renderApp();

    // Navigate to Quote Calculator
    const newQuoteButton = screen.getByRole('button', { name: /Novo Orçamento/i });
    expect(newQuoteButton).toBeInTheDocument();
    fireEvent.click(newQuoteButton);

    // Wait for Quote Calculator to load
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Novo Orçamento' })).toBeInTheDocument(), {
      timeout: 10000
    });

    // Add an item
    const addItemButton = await screen.findByText(/Adicionar Item/i, {}, { timeout: 10000 });
    expect(addItemButton).toBeInTheDocument();
    fireEvent.click(addItemButton);

    // Wait for material selection modal
    await waitFor(() => {
      expect(screen.getByText('Selecionar Material')).toBeInTheDocument();
      expect(screen.getByText('Material A')).toBeInTheDocument();
    }, { timeout: 10000 });

    // Select material
    const materialOption = screen.getByText('Material A');
    fireEvent.click(materialOption);
    
    // Verify material was added
    expect(screen.getByText('Material A')).toBeInTheDocument();
  }, 30000);

  test('should navigate to Saved Quotes and display them', async () => {
    mockUseAuth.mockReturnValue({
      currentUser: { id: 'U-1', email: 'test@example.com', tenantId: 'T-1' },
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
    });
    renderApp();

    // Navigate to Saved Quotes
    fireEvent.click(screen.getByRole('button', { name: /Orçamentos/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Orçamentos Salvos' })).toBeInTheDocument());

    // Verify saved quotes are displayed
    expect(screen.getByText('Quote 1')).toBeInTheDocument();
    expect(screen.getByText('Quote 2')).toBeInTheDocument();
  });

  // Add more integration tests for other key user flows here
});