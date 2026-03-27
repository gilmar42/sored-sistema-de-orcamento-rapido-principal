import React from 'react';
import { render, screen, fireEvent, act, waitFor, within } from '@testing-library/react';
import { MaterialManagement } from '@/components/MaterialManagement';
import { DataProvider } from '@/context/DataContext';
import { AuthProvider } from '@/context/AuthContext';

// Mock useAuth and useLocalStorage for isolated testing
jest.spyOn(require('@/context/AuthContext'), 'useAuth').mockReturnValue({
  currentUser: { id: 'U-1', email: 'test@example.com', tenantId: 'T-1' }
});

describe('MaterialManagement', () => {
  let materials: any[] = [];
  let setMaterials: jest.Mock;
  let addMaterial: jest.Mock;

  beforeEach(() => {
    materials = [];
    setMaterials = jest.fn((newMaterials) => {
      materials = typeof newMaterials === 'function' ? newMaterials(materials) : newMaterials;
    });
    jest.spyOn(require('@/hooks/useLocalStorage'), 'useLocalStorage').mockImplementation((key: string, initialValue) => {
      if (key.includes('materials')) {
        return [materials, setMaterials];
      }
      return [initialValue, jest.fn()];
    });
    addMaterial = jest.fn((m: any) => setMaterials((prev: any[]) => [...prev, m]));
    const updateMaterial = jest.fn((m: any) => setMaterials((prev: any[]) => prev.map(item => (item.id === m.id ? m : item))));
    const deleteMaterial = jest.fn((id: string) => setMaterials((prev: any[]) => prev.filter(item => item.id !== id)));

    jest.spyOn(require('@/context/DataContext'), 'useData').mockImplementation(() => ({
      materials,
      setMaterials,
      categories: [], // Adicionado para resolver o erro de 'categories' indefinido
      addMaterial,
      updateMaterial,
      deleteMaterial,
    }));
  });
  it('should render the correct labels for adding new material', () => {
    render(
      <AuthProvider>
        <DataProvider>
          <MaterialManagement />
        </DataProvider>
      </AuthProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /Adicionar Novo Material/i }));

  // Updated labels in the component: Nome do Material, Peso Unitário, Custo Unitário (R$)
  expect(screen.getByRole('textbox', { name: 'Nome do Material' })).toBeInTheDocument();
  expect(screen.getByRole('spinbutton', { name: 'Peso Unitário' })).toBeInTheDocument();
  expect(screen.getByRole('spinbutton', { name: 'Custo Unitário (R$)' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Salvar Material' })).toBeInTheDocument();

    // Simulate user typing into the 'Nome do Material' field
    fireEvent.change(screen.getByRole('textbox', { name: 'Nome do Material' }), { target: { value: 'Novo Material' } });
  });

  it('should render the "Adicionar Componente" button', async () => {
    render(
      <AuthProvider>
        <DataProvider>
          <MaterialManagement />
        </DataProvider>
      </AuthProvider>
    );
  // Open modal to reveal the add-component button
  fireEvent.click(screen.getByRole('button', { name: /Adicionar Novo Material/i }));
  await waitFor(() => expect(screen.getByRole('button', { name: /Adicionar Componente/i })).toBeInTheDocument());
  });

  it('should add a new component field when "Adicionar Componente" button is clicked', async () => {
    render(
      <AuthProvider>
        <DataProvider>
          <MaterialManagement />
        </DataProvider>
      </AuthProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /Adicionar Novo Material/i })); // Adicionado para abrir o modal
    await waitFor(() => expect(screen.getByRole('button', { name: /Adicionar Componente/i })).toBeInTheDocument());
  const materialForm = await screen.findByTestId('material-form');
  const addComponentButton = within(materialForm).getByRole('button', { name: /Adicionar Componente/i });
    fireEvent.click(addComponentButton);
    expect(screen.getAllByLabelText(/Nome do Componente/i)).toHaveLength(1);
  });

  it('should update component field values', async () => {
    render(
      <AuthProvider>
        <DataProvider>
          <MaterialManagement />
        </DataProvider>
      </AuthProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /Adicionar Novo Material/i })); // Adicionado para abrir o modal
    const addComponentButton = screen.getByRole('button', { name: /Adicionar Componente/i });
    fireEvent.click(addComponentButton);

  // Locate component inputs by their visible labels
  const componentNameInput = screen.getAllByLabelText(/Nome do Componente/i)[0];
  const componentUnitWeightInput = screen.getAllByLabelText(/Peso Unitário/i)[0];
  const componentUnitCostInput = screen.getAllByLabelText(/Custo Unitário \(R\$\)/i)[0];

  fireEvent.change(componentNameInput, { target: { value: 'Parafuso' } });
  fireEvent.change(componentUnitWeightInput, { target: { value: '0.5' } });
  fireEvent.change(componentUnitCostInput, { target: { value: '1.2' } });

  // Fill main material fields
  fireEvent.change(screen.getByRole('textbox', { name: 'Nome do Material' }), { target: { value: 'Material Principal' } });
  fireEvent.change(screen.getByLabelText('Peso Unitário', { selector: '#unitWeight' }), { target: { value: '10' } });
  fireEvent.change(screen.getByLabelText('Custo Unitário (R$)', { selector: '#unitCost' }), { target: { value: '100' } });

    // Click Add Material button
    const materialForm = screen.getByTestId('material-form');
    await act(async () => {
      fireEvent.submit(materialForm);
    });

    // The component calls setMaterials; our mocked setMaterials updates the
    // local 'materials' variable synchronously, so assert it was called and
    // that the in-test materials array contains the new item.
  expect(addMaterial).toHaveBeenCalled();
  expect(materials.some((m) => m.name === 'Material Principal')).toBe(true);
  });
});