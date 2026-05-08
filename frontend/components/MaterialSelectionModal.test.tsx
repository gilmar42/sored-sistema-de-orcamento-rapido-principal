import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MaterialSelectionModal } from './MaterialSelectionModal';
import { DataContext } from '../context/DataContext';
import type { Material, Category } from '../types';

const mockMaterials: Material[] = [
  {
    id: 'm1',
    name: 'Material A',
    description: 'Descrição A',
    categoryId: 'c1',
    unitWeight: 1,
    unit: 'kg',
    unitCost: 10,
    components: []
  },
  {
    id: 'm2',
    name: 'Material B',
    description: 'Descrição B',
    categoryId: 'c2',
    unitWeight: 2,
    unit: 'kg',
    unitCost: 20,
    components: []
  }
];

const mockCategories: Category[] = [
  { id: 'c1', name: 'Categoria 1' },
  { id: 'c2', name: 'Categoria 2' }
];

describe('MaterialSelectionModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal with material list', () => {
    render(
      <DataContext.Provider value={{ materials: mockMaterials, categories: mockCategories } as any}>
        <MaterialSelectionModal isOpen={true} onClose={mockOnClose} onSelect={mockOnSelect} />
      </DataContext.Provider>
    );

    expect(screen.getByText('Material A')).toBeInTheDocument();
    expect(screen.getByText('Material B')).toBeInTheDocument();
  });

  it('filters materials by search term', async () => {
    render(
      <DataContext.Provider value={{ materials: mockMaterials, categories: mockCategories } as any}>
        <MaterialSelectionModal isOpen={true} onClose={mockOnClose} onSelect={mockOnSelect} />
      </DataContext.Provider>
    );

    const searchInput = screen.getByPlaceholderText('Buscar material...');
    await userEvent.type(searchInput, 'Material A');

    expect(screen.getByText('Material A')).toBeInTheDocument();
    expect(screen.queryByText('Material B')).not.toBeInTheDocument();
  });

  it('filters materials by category', () => {
    render(
      <DataContext.Provider value={{ materials: mockMaterials, categories: mockCategories } as any}>
        <MaterialSelectionModal isOpen={true} onClose={mockOnClose} onSelect={mockOnSelect} />
      </DataContext.Provider>
    );

    const categorySelect = screen.getByRole('combobox');
    fireEvent.change(categorySelect, { target: { value: 'c1' } });

    expect(screen.getByText('Material A')).toBeInTheDocument();
    expect(screen.queryByText('Material B')).not.toBeInTheDocument();
  });

  it('calls onSelect when a material is clicked', () => {
    render(
      <DataContext.Provider value={{ materials: mockMaterials, categories: mockCategories } as any}>
        <MaterialSelectionModal isOpen={true} onClose={mockOnClose} onSelect={mockOnSelect} />
      </DataContext.Provider>
    );

    fireEvent.click(screen.getByText('Material A'));
    expect(mockOnSelect).toHaveBeenCalledWith(mockMaterials[0]);
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <DataContext.Provider value={{ materials: mockMaterials, categories: mockCategories } as any}>
        <MaterialSelectionModal isOpen={true} onClose={mockOnClose} onSelect={mockOnSelect} />
      </DataContext.Provider>
    );

    fireEvent.click(screen.getByText('Cancelar'));
    expect(mockOnClose).toHaveBeenCalled();
  });
});