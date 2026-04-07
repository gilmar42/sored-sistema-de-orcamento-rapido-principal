import React from 'react';
  import { render, screen, fireEvent, act, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
  import userEvent from '@testing-library/react';
  import { QuoteCalculator } from '@/components/QuoteCalculator';
import { useData } from '@/context/DataContext';
import type { Material, Quote } from '@/types';
 import { generateQuotePDF } from '@/services/pdfGenerator';


 const mockMaterials: Material[] = [
  { id: 'M-1', name: 'Material A', description: 'Description A', categoryId: 'CAT-1', unitCost: 10, unitWeight: 1, components: [], unit: 'kg', diameterValue: 10, diameterUnit: 'mm', lengthValue: 100, lengthUnit: 'mm', widthValue: 50, widthUnit: 'mm' },
  { id: 'M-2', name: 'Material B', description: 'Description B', categoryId: 'CAT-2', unitCost: 20, unitWeight: 2, components: [], unit: 'kg', diameterValue: 20, diameterUnit: 'mm', lengthValue: 200, lengthUnit: 'mm', widthValue: 100, widthUnit: 'mm' },
];

// Mock DataContext
jest.mock('@/context/DataContext', () => ({
  __esModule: true,
  useData: jest.fn(),
}));


jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { uid: 'test-uid', tenantId: 'test-tenant-id' },
    loading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    resetPassword: jest.fn(),
  }),
}));

// Mock pdfGenerator
jest.mock('@/services/pdfGenerator', () => ({
  generateQuotePDF: jest.fn(),
}));



// Mock MaterialSelectorModal
jest.mock('@/components/MaterialFormModal', () => ({
  MaterialFormModal: ({ isOpen, onClose, onSave = (_: any) => {} }) => {
    if (!isOpen) return null;
     return (
       <div data-testid="material-form-modal">
         Selecionar Material
         {mockMaterials.map(material => (
           <button key={material.id} onClick={() => onSave(material)}>{material.name}</button>
         ))}
         <button onClick={onClose}>Fechar</button>
       </div>
     );
   },
}));

const mockGenerateQuotePDF = generateQuotePDF as jest.Mock;

describe('QuoteCalculator', () => {


  const mockSettings = {
    companyName: 'Test Company',
    companyContact: '123-456-7890',
    companyLogo: '',
    defaultTax: 0,
  };

  const mockQuotesRef = { current: [] as Quote[] };
  let mockSetQuotes: jest.Mock;
  
  const mockSetQuoteToEdit = jest.fn();
  const mockSetMaterials = jest.fn();

  beforeEach(() => {
     jest.useFakeTimers();
     mockQuotesRef.current = []; // Reset quotes before each test
     mockSetQuotes = jest.fn();

     const mockDataContextValue = {
       materials: mockMaterials,
       setMaterials: mockSetMaterials,
       categories: [],
       setCategories: jest.fn(),
       get quotes() { return mockQuotesRef.current; },
       setQuotes: mockSetQuotes,
       settings: mockSettings,
       setSettings: jest.fn(),
       deleteMaterial: jest.fn(),
       addMaterial: jest.fn(),
       updateMaterial: jest.fn(),
     };

     console.log('mockDataContextValue before mockReturnValue:', mockDataContextValue);
     (useData as jest.Mock).mockReturnValue(mockDataContextValue);
     mockSetQuoteToEdit.mockClear();
     mockGenerateQuotePDF.mockClear();
     jest.spyOn(window, 'open').mockImplementation(() => null);
   });

   afterEach(() => {
     jest.restoreAllMocks();
     jest.useRealTimers();
   });

   const renderQuoteCalculator = (quoteToEdit: Quote | null = null) => {
     const setQuoteToEdit = jest.fn();
     render(<QuoteCalculator quoteToEdit={quoteToEdit} setQuoteToEdit={setQuoteToEdit} />);
     return { setQuoteToEdit };
   };

   it('should render with initial state', () => {
     renderQuoteCalculator();
     expect(screen.getByText('Novo Orçamento')).toBeInTheDocument();
     expect(screen.getByPlaceholderText('Nome do Cliente')).toHaveValue('');
     expect(screen.getByLabelText('Margem de Lucro (%)')).toHaveValue(20);
     expect(screen.getByLabelText('Custo de Fabricação Unitário (R$)')).toHaveValue(0);
     expect(screen.getByLabelText('Custo de Frete (R$)')).toHaveValue(0);
     expect(screen.getByText('Nenhum item adicionado.')).toBeInTheDocument();
   });

   it('should add an item to the quote', async () => {
     renderQuoteCalculator();
     expect(screen.getByText('Nenhum item adicionado.')).toBeInTheDocument();
     fireEvent.click(screen.getByRole('button', { name: /Adicionar Item/i }));
     await waitFor(() => expect(screen.getByText('Selecionar Material')).toBeInTheDocument());
     fireEvent.click(screen.getByText('Material A'));
     expect(screen.queryByText('Nenhum item adicionado.')).not.toBeInTheDocument();
     expect(screen.getByDisplayValue('1')).toBeInTheDocument();
   });

   it('should update item quantity', async () => {
     renderQuoteCalculator();
     fireEvent.click(screen.getByRole('button', { name: /Adicionar Item/i }));
     await waitFor(() => expect(screen.getByText('Selecionar Material')).toBeInTheDocument());
     fireEvent.click(screen.getByText('Material A'));
     const quantityInput = screen.getByDisplayValue('1');
     fireEvent.change(quantityInput, { target: { value: '5' } });
     expect(quantityInput).toHaveValue(5);
   });

    it('should remove an item from the quote', async () => {
      renderQuoteCalculator();
      fireEvent.click(screen.getByRole('button', { name: /Adicionar Item/i }));
      await waitFor(() => expect(screen.getByText('Selecionar Material')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Material A'));
      expect(screen.getByText('Material A')).toBeInTheDocument();
      const materialARow = screen.getByText('Material A').closest('tr');
      const removeButton = materialARow.querySelector('button');
      fireEvent.click(removeButton);
      expect(screen.queryByText('Material A')).not.toBeInTheDocument();      
      expect(screen.getByText('Nenhum item adicionado.')).toBeInTheDocument();
    });

    it('should toggle freight cost enabled state', async () => {
      renderQuoteCalculator();
      const freightCheckbox = screen.getByLabelText('Frete Inativo', { selector: 'input' });
      expect(freightCheckbox).not.toBeChecked();

      fireEvent.click(screen.getByLabelText('Frete Inativo'));
      expect(freightCheckbox).toBeChecked();

      fireEvent.click(screen.getByLabelText('Frete Ativo'));
      expect(freightCheckbox).not.toBeChecked();
    });

     it('should calculate costs correctly', async () => {
       renderQuoteCalculator();
       fireEvent.click(screen.getByRole('button', { name: /Adicionar Item/i }));
       await waitFor(() => expect(screen.getByText('Selecionar Material')).toBeInTheDocument());
       fireEvent.click(screen.getByText('Material A')); // Cost 10, Weight 1
       fireEvent.click(screen.getByRole('button', { name: /Adicionar Item/i }));
       await waitFor(() => expect(screen.getByText('Selecionar Material')).toBeInTheDocument());
       fireEvent.click(screen.getByText('Material B')); // Cost 20, Weight 2
       
          const quantityInputA = screen.getAllByDisplayValue('1', { exact: false })[0];
          fireEvent.change(quantityInputA, { target: { value: '2' } }); // Material A quantity 2, cost 20, weight 2
          
          const materialBRow = screen.getByText('Material B').closest('tr');
          const quantityInputB = materialBRow.querySelector('input[type="number"]');
          fireEvent.change(quantityInputB, { target: { value: '3' } }); // Material B quantity 3, cost 60, weight 6
  
      fireEvent.change(screen.getByLabelText('Custo de Fabricação Unitário (R$)'), { target: { value: '50' } }); // Labor Cost
      fireEvent.change(screen.getByLabelText('Custo de Frete (R$)'), { target: { value: '30' } }); // Freight Cost
      fireEvent.change(screen.getByLabelText('Margem de Lucro (%)'), { target: { value: '25' } }); // Profit Margin
  
      // Enable freight
      fireEvent.click(screen.getByText('Frete Inativo'));
 
      // Material Cost: (10 * 2) + (20 * 3) = 20 + 60 = 80
      // Indirect Costs: 50
      // Freight Cost: 30
      // Total Project Cost: 80 + 50 + 30 = 160
      // Total Quantity: 2 + 3 = 5
      // Total Manufacturing Cost Per Item: 50 * 5 = 250
      // Profit Value: 160 * 0.25 = 40
      // Final Value: 160 + 40 = 200
      // Total Weight: (1 * 2) + (2 * 3) = 2 + 6 = 8
   
       const materialCost = screen.getAllByText(/R\$\s*80\.00/)[0]; // Material Cost
 
       const unitManufacturingCostLabel = screen.getByText('Custo de Fabricação Unitário:');
       const unitManufacturingCost = unitManufacturingCostLabel.nextElementSibling; // Get the sibling element which contains the value
 
       const freightCostLabel = screen.getByText('Custo de Frete:');
       const freightCost = freightCostLabel.nextElementSibling; // Get the sibling element which contains the value
 
       const totalProjectCostLabel = screen.getByText('Custo Total do Projeto:');
       const totalProjectCost = totalProjectCostLabel.nextElementSibling; // Get the sibling element which contains the value
 
 
 
       const profitValue = screen.getByText(/R\$\s*40\.00/); // Profit Value (160 * 0.25)
       const totalWeight = screen.getByText(/8\.00\s*kg/); // Total Weight
 
       const finalValueLabel = screen.getByText('Valor Final:');
       const finalValue = finalValueLabel.nextElementSibling; // Get the sibling element which contains the value
 
       expect(screen.getByText('Custo do Produto Unidade')).toBeInTheDocument();
       expect(materialCost).toBeInTheDocument();
       expect(unitManufacturingCost).toHaveTextContent(/R\$\s*250\.00/);
       expect(freightCost).toHaveTextContent(/R\$\s*30\.00/);
       expect(totalProjectCost).toHaveTextContent(/R\$\s*160\.00/);
 
       expect(profitValue).toBeInTheDocument();
       expect(totalWeight).toBeInTheDocument();
       expect(finalValue).toHaveTextContent(/R\$\s*200\.00/);
     });
 
     it('should calculate costs correctly when freight is disabled', async () => {
       renderQuoteCalculator();
       fireEvent.click(screen.getByRole('button', { name: /Adicionar Item/i }));
       await waitFor(() => expect(screen.getByText('Selecionar Material')).toBeInTheDocument());
       fireEvent.click(screen.getByText('Material A')); // Cost 10, Weight 1
       fireEvent.click(screen.getByRole('button', { name: /Adicionar Item/i }));
       await waitFor(() => expect(screen.getByText('Selecionar Material')).toBeInTheDocument());
       fireEvent.click(screen.getByText('Material B')); // Cost 20, Weight 2
       
          const quantityInputA = screen.getAllByDisplayValue('1', { exact: false })[0];
          fireEvent.change(quantityInputA, { target: { value: '2' } }); // Material A quantity 2, cost 20, weight 2
          
          const materialBRow = screen.getByText('Material B').closest('tr');
          const quantityInputB = materialBRow.querySelector('input[type="number"]');
          fireEvent.change(quantityInputB, { target: { value: '3' } }); // Material B quantity 3, cost 60, weight 6
 
      fireEvent.change(screen.getByLabelText('Custo de Fabricação Unitário (R$)'), { target: { value: '50' } }); // Labor Cost
      fireEvent.change(screen.getByLabelText('Custo de Frete (R$)'), { target: { value: '30' } }); // Freight Cost
      fireEvent.change(screen.getByLabelText('Margem de Lucro (%)'), { target: { value: '25' } }); // Profit Margin
 
      // Freight is disabled by default, so it should not be included
 
      // Material Cost: (10 * 2) + (20 * 3) = 20 + 60 = 80
      // Indirect Costs: 50
      // Freight Cost: 0 (disabled)
      // Total Project Cost: 80 + 50 = 130
      // Total Quantity: 2 + 3 = 5
      // Total Manufacturing Cost Per Item: 50 * 5 = 250
      // Profit Value: 130 * 0.25 = 32.5
      // Final Value: 130 + 32.5 = 162.5
      // Total Weight: (1 * 2) + (2 * 3) = 2 + 6 = 8
   
       const materialCost = screen.getAllByText(/R\$\s*80\.00/)[0]; // Material Cost
 
       const unitManufacturingCostLabel = screen.getByText('Custo de Fabricação Unitário:');
       const unitManufacturingCost = unitManufacturingCostLabel.nextElementSibling; // Get the sibling element which contains the value
 
       const freightCostLabel = screen.getByText('Custo de Frete:');
       const freightCost = freightCostLabel.nextElementSibling; // Get the sibling element which contains the value
 
       const totalProjectCostLabel = screen.getByText('Custo Total do Projeto:');
       const totalProjectCost = totalProjectCostLabel.nextElementSibling; // Get the sibling element which contains the value
 
       const profitValue = screen.getByText(/R\$\s*32\.50/); // Profit Value (130 * 0.25)
       const totalWeight = screen.getByText(/8\.00\s*kg/); // Total Weight
 
       const finalValueLabel = screen.getByText('Valor Final:');
       const finalValue = finalValueLabel.nextElementSibling; // Get the sibling element which contains the value
 
       expect(screen.getByText('Custo do Produto Unidade')).toBeInTheDocument();
       expect(materialCost).toBeInTheDocument();
       expect(unitManufacturingCost).toHaveTextContent(/R\$\s*250\.00/);
       expect(freightCost).toHaveTextContent(/R\$\s*0\.00/);
       expect(totalProjectCost).toHaveTextContent(/R\$\s*130\.00/);
 
       expect(profitValue).toBeInTheDocument();
       expect(totalWeight).toBeInTheDocument();
       expect(finalValue).toHaveTextContent(/R\$\s*162\.50/);
    });
  
    it('should reset the form', async () => {
      renderQuoteCalculator();
      fireEvent.change(screen.getByPlaceholderText('Nome do Cliente'), { target: { value: 'Test Client' } });
      fireEvent.click(screen.getByRole('button', { name: /Adicionar Item/i }));
      await waitFor(() => expect(screen.getByText('Selecionar Material')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Material A'));
  
      fireEvent.click(screen.getByRole('button', { name: /Limpar Formulário/i }));
  
      expect(screen.getByPlaceholderText('Nome do Cliente')).toHaveValue('');
      expect(screen.getByText('Nenhum item adicionado.')).toBeInTheDocument();
    });
  
    it('should save a new quote', async () => {
      renderQuoteCalculator();
      fireEvent.change(screen.getByPlaceholderText('Nome do Cliente'), { target: { value: 'New Client' } });
      fireEvent.click(screen.getByRole('button', { name: /Adicionar Item/i }));
      await waitFor(() => expect(screen.getByText('Selecionar Material')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Material A'));
      // console.log('Items after adding material:', screen.debug());
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Salvar Orçamento/i }));
        jest.runOnlyPendingTimers();
      });
      await waitFor(() => { expect(mockSetQuotes).toHaveBeenCalledTimes(1); }, { timeout: 10000 });
      expect(mockSetQuotes).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: expect.any(String) })]));
      expect(screen.getByText('Salvo com Sucesso!')).toBeInTheDocument();
    }, 15000);
  
    test('should update an existing quote', async () => {
      const existingQuote = {
        id: 'Q-1',
        clientName: 'Old Client',
        items: [{ materialId: 'M-1', quantity: 1 }],
        laborCost: 10,
        freightCost: 5,
        profitMargin: 20,
        date: new Date().toISOString(),
      };
      (useData as jest.Mock).mockReturnValue({
        materials: [{ id: 'M-1', name: 'Material A', unitCost: 100, unitWeight: 2, components: [], unit: 'kg', diameterValue: 10, diameterUnit: 'mm', lengthValue: 100, lengthUnit: 'mm', widthValue: 50, widthUnit: 'mm' }],
        quotes: [existingQuote],
        setQuotes: mockSetQuotes,
        settings: { tenantName: 'Test Tenant' },
      });
     render(<QuoteCalculator quoteToEdit={existingQuote} setQuoteToEdit={mockSetQuoteToEdit} />);
 
     fireEvent.change(screen.getByPlaceholderText('Nome do Cliente'), { target: { value: 'Updated Client' } });
 
     const updateButton = screen.getByRole('button', { name: /Atualizar Orçamento/i });
      fireEvent.click(updateButton);
  
      await waitFor(() => {
        expect(mockSetQuotes).toHaveBeenCalledTimes(1);
         expect(mockSetQuotes).toHaveBeenCalledWith(
           expect.arrayContaining([
             expect.objectContaining({ clientName: 'Updated Client', id: 'Q-1' })
           ])
         );
       });
    });
 
   it('should generate PDF', async () => {
     const existingQuote: Quote = {
       id: 'Q-1',
       date: new Date().toISOString(),
       clientName: 'Existing Client',
       items: [{ materialId: 'M-1', quantity: 1 }],
       laborCost: 10,
       freightCost: 5,
       profitMargin: 20,
     };
     (useData as jest.Mock).mockReturnValue({
       materials: mockMaterials,
       quotes: [existingQuote],
       setQuotes: jest.fn(),
       settings: mockSettings,
     });
     renderQuoteCalculator(existingQuote);
 
     fireEvent.click(screen.getByRole('button', { name: /Gerar PDF/i }));
     expect(mockGenerateQuotePDF).toHaveBeenCalledTimes(1);
   });
});