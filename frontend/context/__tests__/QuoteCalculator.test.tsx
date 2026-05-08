import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { QuoteCalculator } from '@/components/QuoteCalculator';
import { useData } from '@/context/DataContext';
import type { Material, Quote } from '@/types';
import { generateQuotePDF } from '@/services/pdfGenerator';

const mockMaterials: Material[] = [
    { id: 'M-1', name: 'Material A', description: 'Description A', categoryId: 'CAT-1', unitCost: 10, unitWeight: 1, components: [{ id: 'C-1', name: 'Comp A', unit: 'kg', unitCost: 10, unitWeight: 1 }], unit: 'kg' },
    { id: 'M-2', name: 'Material B', description: 'Description B', categoryId: 'CAT-2', unitCost: 20, unitWeight: 2, components: [{ id: 'C-2', name: 'Comp B', unit: 'kg', unitCost: 20, unitWeight: 2 }], unit: 'kg' },
];

jest.mock('@/context/DataContext', () => ({
    __esModule: true,
    useData: jest.fn(),
}));

jest.mock('@/context/AuthContext', () => ({
    useAuth: () => ({
        currentUser: { id: 'test-uid', tenantId: 'test-tenant-id', email: 'test@mock.com', passwordHash: 'hashed' },
    }),
}));

jest.mock('@/services/pdfGenerator', () => ({
    generateQuotePDF: jest.fn(),
}));

jest.mock('@/components/MaterialSelectionModal', () => ({
    MaterialSelectionModal: ({ isOpen, onClose, onSelect }) => {
        if (!isOpen) return null;
        return (
            <div data-testid="material-selection-modal">
                <h2>Selecionar Material</h2>
                {mockMaterials.map(material => (
                    <button key={material.id} onClick={() => onSelect(material.id)}>{material.name}</button>
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

    let mockSetQuotes: jest.Mock;
    let mockQuotes: Quote[];

    const mockSetQuoteToEdit = jest.fn();

    beforeEach(() => {
        jest.useFakeTimers();
        mockQuotes = [];
        mockSetQuotes = jest.fn(updater => {
            if (typeof updater === 'function') {
                mockQuotes = updater(mockQuotes);
            } else {
                mockQuotes = updater;
            }
        });

        (useData as jest.Mock).mockReturnValue({
            materials: mockMaterials,
            getMaterialById: (id: string) => mockMaterials.find(m => m.id === id),
            categories: [],
            quotes: mockQuotes,
            setQuotes: mockSetQuotes,
            settings: mockSettings,
        });

        mockSetQuoteToEdit.mockClear();
        mockGenerateQuotePDF.mockClear();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    const renderQuoteCalculator = (quoteToEdit: Quote | null = null) => {
        render(<QuoteCalculator quoteToEdit={quoteToEdit} setQuoteToEdit={mockSetQuoteToEdit} />);
    };

    it('should render with initial state', () => {
        renderQuoteCalculator();
        expect(screen.getByText('Novo Orçamento')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Selecione ou digite o nome do cliente')).toHaveValue('');
        expect(screen.getByLabelText('Margem de Lucro (%)')).toHaveValue(20);
        expect(screen.getByLabelText('Custo de Fabricação (Mão de Obra)')).toHaveValue(0);
        expect(screen.getByPlaceholderText('0.00')).toHaveValue(0); // Freight Cost
        expect(screen.getByText(/Nenhum item adicionado/i)).toBeInTheDocument();
    });

    it('should add an item to the quote', async () => {
        renderQuoteCalculator();
        expect(screen.getByText(/Nenhum item adicionado/i)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Adicionar Item/i }));
        
        await waitFor(() => {
            expect(screen.getByTestId('material-selection-modal')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /Material A/ }));

        await waitFor(() => {
            expect(screen.queryByText(/Nenhum item adicionado/i)).not.toBeInTheDocument();
            expect(screen.getAllByText('Material A')[0]).toBeInTheDocument();
        });
    });

    it('should update item quantity', async () => {
        renderQuoteCalculator();
        fireEvent.click(screen.getByRole('button', { name: /Adicionar Item/i }));
        await waitFor(() => screen.getByTestId('material-selection-modal'));
        fireEvent.click(screen.getByRole('button', { name: /Material A/ }));

        await waitFor(() => {
            const quantityInput = screen.getByLabelText(/Quantidade do item Material A/i);
            fireEvent.change(quantityInput, { target: { value: '5' } });
            expect(quantityInput).toHaveValue(5);
        });
    });

    it('should remove an item from the quote', async () => {
        renderQuoteCalculator();
        fireEvent.click(screen.getByRole('button', { name: /Adicionar Item/i }));
        await waitFor(() => screen.getByTestId('material-selection-modal'));
        fireEvent.click(screen.getByRole('button', { name: /Material A/ }));

        await waitFor(() => expect(screen.getAllByText('Material A')[0]).toBeInTheDocument());
        
        const removeButton = screen.getByRole('button', { name: /Remover/i });
        fireEvent.click(removeButton);

        await waitFor(() => {
            expect(screen.queryByText('Material A')).not.toBeInTheDocument();
            expect(screen.getByText(/Nenhum item adicionado/i)).toBeInTheDocument();
        });
    });

    it('should toggle freight cost enabled state', async () => {
        renderQuoteCalculator();
        const freightCheckbox = screen.getByLabelText('Ativar Frete');
        expect(freightCheckbox).not.toBeChecked();
        expect(screen.getByText('Inativo')).toBeInTheDocument();

        fireEvent.click(freightCheckbox);
        
        await waitFor(() => {
            expect(freightCheckbox).toBeChecked();
            expect(screen.getByText('Ativo')).toBeInTheDocument();
        });

        fireEvent.click(freightCheckbox);

        await waitFor(() => {
            expect(freightCheckbox).not.toBeChecked();
            expect(screen.getByText('Inativo')).toBeInTheDocument();
        });
    });

    it('should calculate costs correctly', async () => {
        renderQuoteCalculator();
        // Add Material A
        fireEvent.click(screen.getByRole('button', { name: /Adicionar Item/i }));
        await waitFor(() => screen.getByTestId('material-selection-modal'));
        fireEvent.click(screen.getByRole('button', { name: /Material A/ })); // Cost 10, Weight 1

        // Add Material B
        fireEvent.click(screen.getByRole('button', { name: /Adicionar Item/i }));
        await waitFor(() => screen.getByTestId('material-selection-modal'));
        fireEvent.click(screen.getByRole('button', { name: /Material B/ })); // Cost 20, Weight 2

        await waitFor(() => {
            const [materialAQty, materialBQty] = screen.getAllByLabelText(/Quantidade do item/i);
            fireEvent.change(materialAQty, { target: { value: '2' } }); // Material A qty: 2
            fireEvent.change(materialBQty, { target: { value: '3' } }); // Material B qty: 3
        });
        
        fireEvent.change(screen.getByLabelText('Custo de Fabricação (Mão de Obra)'), { target: { value: '50' } });
        fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '30' } }); // Freight
        fireEvent.change(screen.getByLabelText('Margem de Lucro (%)'), { target: { value: '25' } });

        // Enable freight
        fireEvent.click(screen.getByLabelText('Ativar Frete'));

        await waitFor(() => {
            // Material Cost: (10 * 2) + (20 * 3) = 20 + 60 = 80
            // Manufacturing Cost: 50
            // Freight Cost: 30
            // Total Project Cost: 80 + 50 + 30 = 160
            // Profit Value: 160 * 0.25 = 40
            // Final Value: 160 + 40 = 200
            // Total Weight: (1 * 2) + (2 * 3) = 8
            expect(screen.getByText('R$ 80.00')).toBeInTheDocument(); // Material Cost
            expect(screen.getByText('R$ 50.00')).toBeInTheDocument(); // Manufacturing Cost
            expect(screen.getByText('R$ 30.00')).toBeInTheDocument(); // Freight Cost
            expect(screen.getByText('R$ 160.00')).toBeInTheDocument(); // Total Project Cost
            expect(screen.getByText('R$ 40.00')).toBeInTheDocument(); // Profit
            expect(screen.getByText('8.00 kg')).toBeInTheDocument(); // Weight
            expect(screen.getByText('R$ 200.00')).toBeInTheDocument(); // Final Value
        });
    });

    it('should save a new quote', async () => {
        renderQuoteCalculator();
        fireEvent.change(screen.getByPlaceholderText('Selecione ou digite o nome do cliente'), { target: { value: 'New Client' } });
        fireEvent.click(screen.getByRole('button', { name: /Adicionar Item/i }));
        await waitFor(() => screen.getByTestId('material-selection-modal'));
        fireEvent.click(screen.getByRole('button', { name: /Material A/ }));

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Salvar Orçamento/i }));
            await jest.runAllTimers();
        });

        await waitFor(() => {
            expect(mockSetQuotes).toHaveBeenCalledTimes(1);
            expect(mockQuotes.length).toBe(1);
            expect(mockQuotes[0].clientName).toBe('New Client');
            expect(screen.getByText('Salvo com Sucesso!')).toBeInTheDocument();
        });
    });

    it('should update an existing quote', async () => {
        const existingQuote: Quote = {
            id: 'Q-1', clientName: 'Old Client', items: [{ materialId: 'M-1', quantity: 1 }],
            laborCost: 10, freightCost: 5, profitMargin: 20, date: new Date().toISOString(),
        };
        mockQuotes = [existingQuote];
        renderQuoteCalculator(existingQuote);

        await waitFor(() => {
            expect(screen.getByPlaceholderText('Selecione ou digite o nome do cliente')).toHaveValue('Old Client');
        });

        fireEvent.change(screen.getByPlaceholderText('Selecione ou digite o nome do cliente'), { target: { value: 'Updated Client' } });
        
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Atualizar Orçamento/i }));
            await jest.runAllTimers();
        });

        await waitFor(() => {
            expect(mockSetQuotes).toHaveBeenCalledTimes(1);
            expect(mockQuotes.length).toBe(1);
            expect(mockQuotes[0].clientName).toBe('Updated Client');
            expect(mockSetQuoteToEdit).toHaveBeenCalledWith(null);
        });
    });

    it('should generate PDF', async () => {
        const existingQuote: Quote = {
            id: 'Q-1', date: new Date().toISOString(), clientName: 'Existing Client',
            items: [{ materialId: 'M-1', quantity: 1 }], laborCost: 10, freightCost: 5, profitMargin: 20,
        };
        mockQuotes = [existingQuote];
        renderQuoteCalculator(existingQuote);

        await waitFor(() => {
            const pdfButton = screen.getByRole('button', { name: /Gerar PDF/i });
            expect(pdfButton).not.toBeDisabled();
            fireEvent.click(pdfButton);
        });

        expect(mockGenerateQuotePDF).toHaveBeenCalledTimes(1);
    });
});