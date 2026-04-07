import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { MainLayout } from './MainLayout';
import { AuthContext } from '../context/AuthContext';
// Mock AuthProvider para garantir usuário autenticado
const MockAuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <AuthContext.Provider value={{
    currentUser: { id: 'u1', email: 'user@mock.com', tenantId: 't1', passwordHash: 'hashed' },
    tenantId: 't1',
    login: jest.fn(),
    logout: jest.fn(),
    signup: jest.fn(),
    isLoading: false
  }}>
    {children}
  </AuthContext.Provider>
);
import { DataContext } from '../context/DataContext';
import type { Material, AppSettings, Category, Quote } from '../types';

const defaultSettings: AppSettings = {
  companyName: 'Teste',
  companyContact: 'contato@teste',
  companyLogo: '',
  defaultTax: 0,
};

function makeMaterial(id: string, categoryId = '1'): Material {
  return {
    id,
    name: `Material ${id}`,
    description: 'desc',
    categoryId,
    unitWeight: 1,
    unit: 'kg',
    unitCost: 10,
    components: [{ id: 'c1', name: 'Comp', unitWeight: 1, unit: 'kg', unitCost: 10 }],
  } as Material;
}

const mockCategories: Category[] = [{ id: '1', name: 'Geral' }];

describe('MainLayout varied data scenarios', () => {
  it('with non-empty materials, clicking Novo Orçamento still shows QuoteCalculator and not MaterialManagement', async () => {
    const mockData = {
      materials: [makeMaterial('m1')],
      setMaterials: jest.fn(),
      categories: mockCategories,
      setCategories: jest.fn(),
      quotes: [] as Quote[],
      setQuotes: jest.fn(),
      settings: defaultSettings,
      setSettings: jest.fn(),
      deleteMaterial: jest.fn(),
      addMaterial: jest.fn(),
      updateMaterial: jest.fn(),
    } as any;

    render(
      <MockAuthProvider>
        <DataContext.Provider value={mockData}>
          <MainLayout />
        </DataContext.Provider>
      </MockAuthProvider>
    );

    const novoBtn = screen.getByRole('button', { name: /Novo Orçamento/i });
    expect(novoBtn).toBeInTheDocument();
    await userEvent.click(novoBtn);

    // Quote calculator root should be present
    expect(screen.queryByTestId('quote-calculator-root')).toBeInTheDocument();

    // Material management should NOT be present
    expect(screen.queryByTestId('material-management-root')).not.toBeInTheDocument();
  });

  it('switching to Materiais then back to Novo Orçamento hides MaterialManagement', async () => {
    const mockData = {
      materials: [makeMaterial('m1'), makeMaterial('m2')],
      setMaterials: jest.fn(),
      categories: mockCategories,
      setCategories: jest.fn(),
      quotes: [] as Quote[],
      setQuotes: jest.fn(),
      settings: defaultSettings,
      setSettings: jest.fn(),
      deleteMaterial: jest.fn(),
      addMaterial: jest.fn(),
      updateMaterial: jest.fn(),
    } as any;

    render(
      <MockAuthProvider>
        <DataContext.Provider value={mockData}>
          <MainLayout />
        </DataContext.Provider>
      </MockAuthProvider>
    );

    const materiaisBtn = screen.getByRole('button', { name: /Materiais/i });
    expect(materiaisBtn).toBeInTheDocument();
    await userEvent.click(materiaisBtn);

    // MaterialManagement should be present now
    expect(screen.queryByTestId('material-management-root')).toBeInTheDocument();

    // Now click Novo Orçamento and assert MaterialManagement is gone
    const novoBtn = screen.getByRole('button', { name: /Novo Orçamento/i });
    await userEvent.click(novoBtn);

    expect(screen.queryByTestId('quote-calculator-root')).toBeInTheDocument();
    expect(screen.queryByTestId('material-management-root')).not.toBeInTheDocument();
  });

  it('rapidly toggling views does not leave MaterialManagement mounted while on Novo Orçamento', async () => {
    const mockData = {
      materials: [makeMaterial('m1')],
      setMaterials: jest.fn(),
      categories: mockCategories,
      setCategories: jest.fn(),
      quotes: [] as Quote[],
      setQuotes: jest.fn(),
      settings: defaultSettings,
      setSettings: jest.fn(),
      deleteMaterial: jest.fn(),
      addMaterial: jest.fn(),
      updateMaterial: jest.fn(),
    } as any;

    render(
      <MockAuthProvider>
        <DataContext.Provider value={mockData}>
          <MainLayout />
        </DataContext.Provider>
      </MockAuthProvider>
    );

    const materiaisBtn = screen.getByRole('button', { name: /Materiais/i });
    const novoBtn = screen.getByRole('button', { name: /Novo Orçamento/i });

    // Click materials, then immediately click novo several times
    await userEvent.click(materiaisBtn);
    await userEvent.click(novoBtn);
    await userEvent.click(materiaisBtn);
    await userEvent.click(novoBtn);

    // Final expected state: Novo Orçamento active, MaterialManagement unmounted
    expect(screen.queryByTestId('quote-calculator-root')).toBeInTheDocument();
    expect(screen.queryByTestId('material-management-root')).not.toBeInTheDocument();
  });
});
