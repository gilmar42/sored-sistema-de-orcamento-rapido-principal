import React from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MaterialFormModal } from './MaterialFormModal';
import { DataContext } from '../context/DataContext';
import type { Material, Category, ProductComponent } from '../types';

// Mock uuid module to avoid ES module syntax error
jest.mock('uuid', () => ({
  v4: () => 'mock-uuid'
}));

// Mock DataContext
const mockCategories: Category[] = [
  { id: 'cat1', name: 'Category 1' },
  { id: 'cat2', name: 'Category 2' },
];

const mockDataContextValue = {
  materials: [],
  normalizedMaterials: [],
  categories: mockCategories,
  setMaterials: jest.fn(),
  setCategories: jest.fn(),
  quotes: [],
  setQuotes: jest.fn(),
  settings: { companyName: 'Test', companyContact: '', companyLogo: '', defaultTax: 0 },
  setSettings: jest.fn(),
  clients: [],
  setClients: jest.fn(),
  addMaterial: jest.fn(),
  updateMaterial: jest.fn(),
  deleteMaterial: jest.fn(),
  addClient: jest.fn(),
  updateClient: jest.fn(),
  deleteClient: jest.fn(),
  addCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
};

const renderWithContext = (ui: React.ReactElement) => {
  return render(
    <DataContext.Provider value={mockDataContextValue}>
      {ui}
    </DataContext.Provider>
  );
};

describe('MaterialFormModal Dimension Input Integration', () => {
  const mockOnSave = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly parse and save dimension inputs with units', async () => {
    renderWithContext(
      <MaterialFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        materialToEdit={null}
      />
    );

    // Esperar pelo título do modal de adição
    await screen.findByRole('dialog'); // Wait for the modal to be present
    await waitFor(() => {
      expect(screen.getByText('Adicionar Material')).toBeInTheDocument();
    });

    const materialForm = screen.getByTestId('material-form');

    // Preencher os campos do material
    await userEvent.type(within(materialForm).getByLabelText(/Nome do Material/i), 'Material com Dimensões');
    await userEvent.type(within(materialForm).getByLabelText('Peso Unitário', { selector: '#unitWeight' }), '10');
    await userEvent.selectOptions(within(materialForm).getByLabelText('Unidade de Peso'), 'kg');
    await userEvent.type(within(materialForm).getByLabelText('Custo Unitário (R$)'), '100');
    await userEvent.selectOptions(within(materialForm).getByLabelText('Categoria'), 'cat1');

  // Adicionar um componente
  await userEvent.click(within(materialForm).getByRole('button', { name: /adicionar componente/i }));

    // Preencher os campos do componente
    const componentNameInput = screen.getByLabelText(/nome do componente/i);
    await userEvent.type(componentNameInput, 'Componente A');

    const newComponentSection = screen.getByDisplayValue('Componente A').closest('.mb-4.p-3.border.border-border.rounded-md');
    if (!newComponentSection) throw new Error('New component section not found');
    await userEvent.type(within(newComponentSection as HTMLElement).getByLabelText(/peso unitário/i, { selector: 'input[id^="component-unitWeight-"]' }), '5');
    await userEvent.selectOptions(within(newComponentSection as HTMLElement).getByLabelText(/unidade de peso/i, { selector: 'select' }), 'g');
    await userEvent.type(within(newComponentSection as HTMLElement).getByLabelText(/custo unitário \(r\$\)/i, { selector: 'input[id^="component-unitCost-"]' }), '50');

    // Preencher dimensões com unidades
    await userEvent.type(screen.getByLabelText('Comprimento'), '10cm');
    await userEvent.selectOptions(screen.getByLabelText('Unidade de Comprimento'), 'cm');

    await userEvent.type(screen.getByLabelText('Diâmetro'), '2in');
    await userEvent.selectOptions(screen.getByLabelText('Unidade de Diâmetro'), 'in');

    await userEvent.type(screen.getByLabelText('Largura'), '30mm');
    await userEvent.selectOptions(screen.getByLabelText('Unidade de Largura'), 'mm');

    // Click Save Material button
    const saveButton = screen.getByRole('button', { name: /criar material/i });
    await act(async () => {
      await userEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1);
      const savedMaterial: Material = mockOnSave.mock.calls[0][0];
      expect(savedMaterial.name).toBe('Material com Dimensões');
      expect(savedMaterial.unitWeight).toBe(10);
      expect(savedMaterial.unit).toBe('kg');
      expect(savedMaterial.unitCost).toBe(100);
      expect(savedMaterial.categoryId).toBe('cat1');

      expect(savedMaterial.components).toHaveLength(1);
      const savedComponent: ProductComponent = savedMaterial.components[0];
      expect(savedComponent.name).toBe('Componente A');
      expect(savedComponent.unitWeight).toBe(5);
      expect(savedComponent.unit).toBe('g');
      expect(savedComponent.unitCost).toBe(50);
      expect(savedComponent.lengthValue).toBe(10);
      expect(savedComponent.lengthUnit).toBe('cm');
      expect(savedComponent.diameterValue).toBe(2);
      expect(savedComponent.diameterUnit).toBe('in');
      expect(savedComponent.widthValue).toBe(30);
      expect(savedComponent.widthUnit).toBe('mm');
    });
  }, 10000);

  it('should add and edit a component correctly', async () => {
    const materialToEdit: Material = {
      id: 'mat1',
      name: 'Material Existente',
      description: 'Descrição existente',
      unitCost: 50,
      unitWeight: 5,
      unit: 'g',
      categoryId: 'cat1',
      components: [
        {
          id: 'comp1',
          name: 'Componente Antigo',
          unitWeight: 2,
          unit: 'g',
          unitCost: 20,
          rawLengthInput: '5cm',
          lengthValue: 5,
          lengthUnit: 'cm',
          rawDiameterInput: '',
          diameterValue: undefined,
          diameterUnit: '',
          rawWidthInput: '',
          widthValue: undefined,
          widthUnit: '',
        },
      ],
    };

    renderWithContext(
      <MaterialFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        materialToEdit={materialToEdit}
      />
    );

    await screen.findByRole('dialog');
    await waitFor(() => {
      expect(screen.getByText('Editar Material')).toBeInTheDocument();
    });

    const materialForm = screen.getByTestId('material-form');

    // Verificar valores existentes
    expect(within(materialForm).getByLabelText(/Nome do Material/i)).toHaveValue('Material Existente');
    expect(within(materialForm).getByLabelText('Descrição (Opcional)')).toHaveValue('Descrição existente');
    expect(within(materialForm).getByLabelText('Peso Unitário', { selector: '#unitWeight' })).toHaveValue(5);
    expect(within(materialForm).getByLabelText('Unidade de Peso', { selector: '#unit' })).toHaveValue('g');
    expect(within(materialForm).getByLabelText('Custo Unitário (R$)', { selector: '#unitCost' })).toHaveValue(50);
    expect(within(materialForm).getByLabelText('Categoria')).toHaveValue('cat1');

    // Verificar componente existente
    expect(screen.getByDisplayValue('Componente Antigo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5cm')).toBeInTheDocument();

    // Editar componente existente
    const componentNameInput = screen.getByDisplayValue('Componente Antigo');
    await userEvent.clear(componentNameInput);
    await userEvent.type(componentNameInput, 'Componente Editado');
    await userEvent.clear(screen.getByDisplayValue('5cm'));
    await userEvent.type(screen.getByLabelText('Comprimento'), '10mm');
    await userEvent.selectOptions(screen.getByLabelText('Unidade de Comprimento'), 'mm');

  // Adicionar novo componente
  await userEvent.click(screen.getByRole('button', { name: /adicionar componente/i }));

    // Encontrar todas as seções de componente e selecionar a última (a recém-adicionada)
    const componentSections = screen.getAllByText(/nome do componente/i).map(input => input.closest('.mb-4.p-3.border.border-border.rounded-md'));
    const newComponentSection = componentSections[componentSections.length - 1];

    // Agora, encontrar os inputs dentro da nova seção de componente
    const newComponentNameInput = within(newComponentSection as HTMLElement).getByLabelText(/nome do componente/i);
    await userEvent.type(newComponentNameInput, 'Novo Componente');

    const newComponentUnitWeightInput = within(newComponentSection as HTMLElement).getByLabelText(/peso unitário/i, { selector: 'input[type="number"]' });
    await userEvent.type(newComponentUnitWeightInput, '1');
    await userEvent.selectOptions(within(newComponentSection as HTMLElement).getByLabelText(/unidade de peso/i, { selector: 'select' }), 'kg');
    await userEvent.type(within(newComponentSection as HTMLElement).getByLabelText(/custo unitário \(r\$\)/i, { selector: 'input[id^="component-unitCost-"]' }), '10');
    await userEvent.type(within(newComponentSection as HTMLElement).getByLabelText('Diâmetro'), '1.5in');
    await userEvent.selectOptions(within(newComponentSection as HTMLElement).getByLabelText('Unidade de Diâmetro'), 'in');

    // Salvar material
    const saveButton = screen.getByRole('button', { name: /salvar alterações/i });
    await act(async () => {
      await userEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1);
      const savedMaterial: Material = mockOnSave.mock.calls[0][0];
      expect(savedMaterial.name).toBe('Material Existente');
      expect(savedMaterial.components).toHaveLength(2);

      const editedComponent = savedMaterial.components.find(c => c.id === 'comp1');
      expect(editedComponent?.name).toBe('Componente Editado');
      expect(editedComponent?.lengthValue).toBe(10);
      expect(editedComponent?.lengthUnit).toBe('mm');

      const newComponent = savedMaterial.components.find(c => c.name === 'Novo Componente');
      expect(newComponent?.name).toBe('Novo Componente');
      expect(newComponent?.unitWeight).toBe(1);
      expect(newComponent?.unit).toBe('kg');
      expect(newComponent?.unitCost).toBe(10);
      expect(newComponent?.diameterValue).toBe(1.5);
      expect(newComponent?.diameterUnit).toBe('in');
    });
  }, 10000);
});