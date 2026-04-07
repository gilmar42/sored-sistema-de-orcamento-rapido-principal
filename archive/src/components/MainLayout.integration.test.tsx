import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MainLayout } from './MainLayout';
import { AuthProvider } from '../context/AuthContext';
import { DataProvider } from '../context/DataContext';

// Reuse AuthProvider/DataProvider to approximate real environment

describe('MainLayout integration', () => {
  it('clicking Novo Orçamento does not render MaterialManagement', async () => {
    render(
      <AuthProvider>
        <DataProvider>
          <MainLayout />
        </DataProvider>
      </AuthProvider>
    );

    // Ensure we're starting from a clean state
    const novoBtn = screen.getByRole('button', { name: /Novo Orçamento/i });
    expect(novoBtn).toBeInTheDocument();

    await userEvent.click(novoBtn);

    // QuoteCalculator should be present
    expect(screen.queryByTestId('quote-calculator-root')).toBeInTheDocument();

    // MaterialManagement must NOT be present inside Novo Orçamento view
    expect(screen.queryByTestId('material-management-root')).not.toBeInTheDocument();
  });
});
