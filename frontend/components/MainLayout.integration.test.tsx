import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MainLayout } from './MainLayout';
import { AuthContext } from '../context/AuthContext';
import { DataProvider } from '../context/DataContext';

// Reuse AuthProvider/DataProvider to approximate real environment

describe('MainLayout integration', () => {
  it('clicking Novo Orçamento does not render MaterialManagement', async () => {
    // Mock AuthContext to simulate authenticated user
    const mockAuth = {
      currentUser: { id: 'U-1', email: 'test@example.com', tenantId: 'T-1', passwordHash: '' },
      tenantId: 'T-1',
      login: jest.fn(),
      logout: jest.fn(),
      signup: jest.fn(),
      isLoading: false,
    };
    render(
      <AuthContext.Provider value={mockAuth}>
        <DataProvider>
          <MainLayout />
        </DataProvider>
      </AuthContext.Provider>
    );

    // Ensure we're starting from a clean state
    const novoBtn = screen.getByRole('button', { name: /Novo Orçamento/i });
    expect(novoBtn).toBeInTheDocument();

    await userEvent.click(novoBtn);

    // QuoteCalculator should be present (aguarda renderização)
    expect(await screen.findByTestId('quote-calculator-root')).toBeInTheDocument();

    // MaterialManagement must NOT be present inside Novo Orçamento view
    expect(screen.queryByTestId('material-management-root')).not.toBeInTheDocument();
  });
});
