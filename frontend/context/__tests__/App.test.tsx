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
    render(<App />);
  };

  beforeEach(() => {
    mockUseAuth.mockClear();
  });

  it('should render LandingPage when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      currentUser: null,
      tenantId: null,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    });
    renderApp();
    expect(screen.getByText(/Bem-vindo ao/i)).toBeInTheDocument();
    expect(screen.getByText(/Sistema de Orçamento Rápido/i)).toBeInTheDocument();
  });

  it('should render LandingPage first when authenticated user logs in', () => {
    mockUseAuth.mockReturnValue({
      currentUser: { id: 'U-1', email: 'test@example.com', tenantId: 'T-1', passwordHash: 'hashed' },
      tenantId: 'T-1',
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    });
    renderApp();
    
    // Authenticated users see welcome landing page first
    expect(screen.getByText(/Bem-vindo ao/i)).toBeInTheDocument();
  });

  // Add more integration tests for other key user flows here
});