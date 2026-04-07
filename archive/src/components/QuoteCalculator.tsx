import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import type { Material, QuoteItem, Quote, CalculatedCosts } from '../types';
import { generateQuotePDF } from '../services/pdfGenerator';
// Fix: Removed PrinterIcon as it is not exported from Icons.tsx
import { PlusIcon, TrashIcon, DocumentDuplicateIcon, CheckCircleIcon, ArrowDownOnSquareIcon, ShareIcon } from './Icons';

interface QuoteCalculatorProps {
  quoteToEdit: Quote | null;
  setQuoteToEdit: (quote: Quote | null) => void;
}

import { MaterialSelectionModal } from './MaterialSelectionModal';
import PdfActionModal from './PdfActionModal';


export const QuoteCalculator: React.FC<QuoteCalculatorProps> = ({ quoteToEdit, setQuoteToEdit }) => {
    const { materials, quotes, setQuotes, settings } = useData();
  
    // Initialize component state
  
  const [clientName, setClientName] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [laborCost, setLaborCost] = useState(0);
  const [freightCost, setFreightCost] = useState(0);
  const [profitMargin, setProfitMargin] = useState(20);
  const [isFreightEnabled, setIsFreightEnabled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [currentQuoteId, setCurrentQuoteId] = useState<string | null>(quoteToEdit?.id || null);
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  useEffect(() => {
    if (quoteToEdit) {
      setClientName(quoteToEdit.clientName);
      setItems(quoteToEdit.items || []);
      setLaborCost(quoteToEdit.laborCost);
      setFreightCost(quoteToEdit.freightCost);
      setProfitMargin(quoteToEdit.profitMargin);
      setIsFreightEnabled(quoteToEdit.isFreightEnabled || false);
      setCurrentQuoteId(quoteToEdit.id);
    } else {
        resetForm();
    }
  }, [quoteToEdit]);

  const resetForm = () => {
    setClientName('');
    setItems([]);
    setLaborCost(0);
    setFreightCost(0);
    setProfitMargin(20);
    setIsFreightEnabled(false);
    setCurrentQuoteId(null);
    setQuoteToEdit(null);
  };

  const calculated: CalculatedCosts = useMemo(() => {
    const materialCost = items.reduce((acc, item) => {
      const material = materials && Array.isArray(materials) ? materials.find(m => m.id === item.materialId) : undefined;
      return acc + (material ? material.unitCost * item.quantity : 0);
    }, 0);

    const laborOnlyIndirectCosts = laborCost;
    const totalProjectCost = materialCost + laborOnlyIndirectCosts + (isFreightEnabled ? freightCost : 0);
    const profitValue = totalProjectCost * (profitMargin / 100);
    const finalValue = totalProjectCost + profitValue;

    const totalWeight = items.reduce((acc, item) => {
      const material = materials && Array.isArray(materials) ? materials.find(m => m.id === item.materialId) : undefined;
      return acc + (material ? material.unitWeight * item.quantity : 0);
    }, 0);

    const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
    const totalManufacturingCostPerItem = laborOnlyIndirectCosts * totalQuantity;

    return {
      materialCost,
      totalGrossCost: materialCost,
      indirectCosts: laborOnlyIndirectCosts,
      freightCost: isFreightEnabled ? freightCost : 0,
      totalProjectCost,
      totalManufacturingCostPerItem,
      profitValue,
      finalValue,
      totalWeight,
    };
  }, [items, laborCost, freightCost, profitMargin, materials, isFreightEnabled]);

  const handleAddItem = useCallback((material: Material) => {
        setIsModalOpen(false);
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.materialId === material.id);
      let updatedItems;
      if (existingItem) {
        updatedItems = prevItems.map(item =>
          item.materialId === material.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        updatedItems = [...prevItems, { materialId: material.id, quantity: 1 }];
      }
      return updatedItems;
    });
  }, [setIsModalOpen, setItems]);
  
  const handleUpdateQuantity = (materialId: string, value: string) => {
    const parsedQuantity = parseInt(value);
    const newQuantity = isNaN(parsedQuantity) ? 0 : Math.max(0, parsedQuantity);
    setItems(items.map(item => item.materialId === materialId ? { ...item, quantity: newQuantity } : item));
  };

  const handleRemoveItem = (materialId: string) => {
    setItems(items.filter(item => item.materialId !== materialId));
  };

  const handleSaveQuote = () => {
        console.log('handleSaveQuote called', { clientName, items, laborCost, freightCost, profitMargin, currentQuoteId });
    const quoteData: Omit<Quote, 'id' | 'date'> = {
        clientName,
        items,
        laborCost,
        freightCost,
        profitMargin,
        isFreightEnabled,
    };
    
    if (currentQuoteId) {
        // Update existing quote
        const updatedQuote: Quote = { ...quoteData, id: currentQuoteId, date: new Date().toISOString() };
        console.log('updating quote, calling setQuotes with updatedQuote', updatedQuote, 'existing quotes:', quotes);
        setQuotes(quotes.map(q => q.id === currentQuoteId ? updatedQuote : q));
    } else {
        // Create new quote
        const newQuote: Quote = { ...quoteData, id: `Q-${Date.now()}`, date: new Date().toISOString() };
        console.log('creating new quote, calling setQuotes with newQuote', newQuote, 'existing quotes:', quotes);
        setQuotes([...quotes, newQuote]);
        setCurrentQuoteId(newQuote.id);
    }

    setShowSuccess(true);
            console.log('setting showSuccess true');
            setShowSuccess(true);
  };
  
  const handleGeneratePDF = () => {
     const quote: Quote = {
        id: currentQuoteId || `Q-${Date.now()}`,
        date: new Date().toISOString(),
        clientName,
        items,
        laborCost,
        freightCost,
        profitMargin,
        isFreightEnabled
    };
            const pdfResult = generateQuotePDF(quote, materials, settings, calculated);
            if (pdfResult instanceof Blob) {
                setPdfBlob(pdfResult);
                setIsPdfModalOpen(true);
            } else if (typeof pdfResult === 'string') {
                // fallback for older environments where generator returns data URI
                window.open(pdfResult, '_blank');
            }
  };

  const handleWhatsAppShare = () => {
    const quote: Quote = {
      id: currentQuoteId || `Q-${Date.now()}`,
      date: new Date().toISOString(),
      clientName,
      items,
      laborCost,
      freightCost,
      profitMargin,
      isFreightEnabled
    };
    const pdfDataUri = generateQuotePDF(quote, materials, settings, calculated);

    const quoteNumber = currentQuoteId || 'Novo';
    const message = `Olá! Segue o orçamento ${quoteNumber} com valor total de R$ ${calculated.finalValue.toFixed(2)} e peso total de ${calculated.totalWeight.toFixed(2)} kg. Você pode visualizar o PDF em anexo. Aguardamos seu contato!`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getMaterialById = (id: string) => materials && Array.isArray(materials) ? materials.find(m => m.id === id) : undefined;

    return (
        <div className="container mx-auto" data-testid="quote-calculator-root">
        {isModalOpen && <MaterialSelectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelect={handleAddItem} />}
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-textPrimary">{currentQuoteId ? `Editando Orçamento: ${currentQuoteId}` : 'Novo Orçamento'}</h2>
            <button onClick={resetForm} className="text-sm text-blue-400 hover:underline">Limpar Formulário</button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                {/* Itens do Orçamento */}
                <div className="bg-surface p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-textPrimary">Itens do Orçamento</h3>
                        <button onClick={() => setIsModalOpen(true)} className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 transition-colors">
                            <PlusIcon className="w-5 h-5 mr-2"/>
                            Adicionar Item
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-textSecondary">
                            <thead className="text-xs text-gray-300 uppercase bg-surface-light">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Descrição</th>
                                    <th scope="col" className="px-4 py-3 w-28">Qtd.</th>
                                    <th scope="col" className="px-4 py-3">Custo do Produto Unidade</th>
                                    <th scope="col" className="px-4 py-3">Custo Total</th>
                                    <th scope="col" className="px-4 py-3 w-12"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => {
                                    const material = getMaterialById(item.materialId);
                                    if (!material) return null;
                                    return (
                                        <tr key={item.materialId} className="border-b border-gray-700 hover:bg-surface-light">
                                            <td className="px-4 py-2 font-medium text-textPrimary">{material.name}</td>
                                            <td className="px-4 py-2">
                                                <input 
                                                    type="number" 
                                                    value={item.quantity} 
                                                    onChange={(e) => handleUpdateQuantity(item.materialId, e.target.value)}
                                                    className="w-20 p-1 border border-gray-600 bg-gray-700 rounded-md text-center text-textPrimary"
                                                />
                                            </td>
                                            <td className="px-4 py-2">R$ {material.unitCost.toFixed(2)}</td>
                                            <td className="px-4 py-2">R$ {(material.unitCost * item.quantity).toFixed(2)}</td>
                                            <td className="px-4 py-2">
                                                <button onClick={() => handleRemoveItem(item.materialId)} className="text-red-500 hover:text-red-400">
                                                    <TrashIcon className="w-5 h-5"/>
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                                 {items.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-4 text-textSecondary">Nenhum item adicionado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Custos Adicionais */}
                <div className="bg-surface p-6 rounded-lg shadow-md">
                     <h3 className="text-xl font-semibold text-textPrimary mb-4">Custos e Margem</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-textSecondary mb-1">Nome do Cliente</label>
                            <input 
                                type="text"
                                value={clientName}
                                onChange={e => setClientName(e.target.value)}
                                placeholder="Nome do Cliente"
                                className="block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-textPrimary rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            />
                        </div>
                         <div>
                            <label htmlFor="profitMargin" className="block text-sm font-medium text-textSecondary mb-1">Margem de Lucro (%)</label>
                            <input
                                id="profitMargin"
                                type="number"
                                value={profitMargin}
                                onChange={e => setProfitMargin(parseFloat(e.target.value))}
                                className="block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-textPrimary rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="laborCost" className="block text-sm font-medium text-textSecondary mb-1">Custo de Fabricação Unitário (R$)</label>
                            <input 
                                id="laborCost"
                                type="number"
                                value={laborCost}
                                onChange={e => setLaborCost(parseFloat(e.target.value))}
                                className="block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-textPrimary rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="freightCost" className="block text-sm font-medium text-textSecondary mb-1">Custo de Frete (R$)</label>
                            <div className="flex items-center">
                                <input 
                                    id="freightCost"
                                    type="number"
                                    value={freightCost}
                                    onChange={e => setFreightCost(parseFloat(e.target.value))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-textPrimary bg-bgSecondary"
                                    placeholder="0.00"
                                    disabled={!isFreightEnabled}
                                />
                                <label htmlFor="toggleFreight" className="flex items-center cursor-pointer ml-4">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            id="toggleFreight"
                                            className="sr-only"
                                            checked={isFreightEnabled}
                                            onChange={() => setIsFreightEnabled(!isFreightEnabled)}
                                        />
                                        <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
                                        <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition"></div>
                                    </div>
                                    <div className="ml-3 text-textPrimary font-medium">
                                        {isFreightEnabled ? 'Frete Ativo' : 'Frete Inativo'}
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Resumo e Ações */}
            <div className="lg:col-span-1">
                <div className="bg-surface p-6 rounded-lg shadow-md sticky top-8">
                    <h3 className="text-xl font-semibold text-textPrimary border-b border-surface-light pb-3 mb-4">Resumo do Orçamento</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-textSecondary">Custo Material:</span>
                            <span className="font-medium text-textPrimary">R$ {calculated.materialCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-textSecondary">Custo de Fabricação Unitário:</span>
            <span className="font-medium text-textPrimary">R$ {calculated.totalManufacturingCostPerItem.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-textSecondary">Custo de Frete:</span>
                            <span className="font-medium text-textPrimary">R$ {calculated.freightCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-textSecondary">Custo Total do Projeto:</span>
                            <span className="font-medium text-textPrimary">R$ {calculated.totalProjectCost.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-textSecondary">Lucro (interno):</span>
                            <span className="font-medium text-textPrimary">R$ {calculated.profitValue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-surface-light mt-2">
                             <span className="font-bold text-textSecondary">Peso Total:</span>
                            <span className="font-bold text-textPrimary">{calculated.totalWeight.toFixed(2)} kg</span>
                        </div>
                         <div className="flex justify-between text-lg">
                            <span className="font-bold text-textPrimary">Valor Final:</span>
                            <span className="font-bold text-primary">R$ {calculated.finalValue.toFixed(2)}</span>
                        </div>
                    </div>
                    {items.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-lg font-semibold text-textPrimary mb-2">Componentes do Produto Final</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-textSecondary">
                                    <thead className="text-xs text-gray-300 uppercase bg-surface-light">
                                        <tr>
                                            <th scope="col" className="px-4 py-2">Material</th>
                                            <th scope="col" className="px-4 py-2">Componente</th>
                                            <th scope="col" className="px-4 py-2">Tamanho</th>
                                            <th scope="col" className="px-4 py-2">Peso Unit.</th>
                                            <th scope="col" className="px-4 py-2">Custo Unit.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map(item => {
                                            const material = getMaterialById(item.materialId);
                                            if (!material || material.components.length === 0) return null;

                                            const getComponentSizeString = (component: any) => {
                                                // Format component size from sizeValue object or explicit/raw fields
                                                // Prefer explicit sizeValue when it's a primitive (string/number)
                                                if (component.sizeValue !== undefined && component.sizeValue !== null) {
                                                    if (typeof component.sizeValue === 'string' || typeof component.sizeValue === 'number') {
                                                        return `${component.sizeValue}${component.sizeUnit ? ` ${component.sizeUnit}` : ''}`;
                                                    }
                                                    // If sizeValue is an object (legacy data), try to extract useful fields
                                                    // IMPORTANT: Check both !== undefined AND !== null to avoid rendering "W: null" etc
                                                    if (typeof component.sizeValue === 'object') {
                                                        // Common legacy shape: { lengthValue, diameterValue, widthValue, ... }
                                                        const parts: string[] = [];
                                                        if (component.sizeValue.lengthValue !== undefined && component.sizeValue.lengthValue !== null) parts.push(`L: ${component.sizeValue.lengthValue}${component.sizeValue.lengthUnit ? ` ${component.sizeValue.lengthUnit}` : ''}`);
                                                        if (component.sizeValue.diameterValue !== undefined && component.sizeValue.diameterValue !== null) parts.push(`Ø: ${component.sizeValue.diameterValue}${component.sizeValue.diameterUnit ? ` ${component.sizeValue.diameterUnit}` : ''}`);
                                                        if (component.sizeValue.widthValue !== undefined && component.sizeValue.widthValue !== null) parts.push(`W: ${component.sizeValue.widthValue}${component.sizeValue.widthUnit ? ` ${component.sizeValue.widthUnit}` : ''}`);
                                                        if (parts.length > 0) {
                                                            return parts.join(' / ');
                                                        }
                                                        // If normalization produced a readable rawSizeString, prefer it
                                                        if (component.rawSizeString) return component.rawSizeString;

                                                        // Fallback to a safe stringification if we can't extract fields
                                                        // Use safeStringify to handle circular structures gracefully
                                                        try {
                                                            // lazy import to avoid circular deps at module load
                                                            // eslint-disable-next-line @typescript-eslint/no-var-requires
                                                            const { safeStringify } = require('../utils/safeStringify');
                                                            const s = safeStringify(component.sizeValue);
                                                            // If the safe string indicates a circular structure or looks unhelpful,
                                                            // log the object so the developer can inspect the exact shape in the browser console.
                                                            if (typeof s === 'string' && (s.includes('[Circular]') || s === '[object Object]' || s.trim() === '')) {
                                                                // eslint-disable-next-line no-console
                                                                console.warn('[DEBUG] Unusual component.sizeValue encountered in QuoteCalculator:', component);
                                                                return component.rawSizeString ?? '-';
                                                            }
                                                            return s;
                                                        } catch {
                                                            try { return component.rawSizeString ?? String(component.sizeValue); } catch { return '-'; }
                                                        }
                                                    }
                                                }

                                                // Otherwise build size from explicit length/diameter/width or raw inputs
                                                const parts: string[] = [];
                                                if (component.lengthValue !== undefined && component.lengthValue !== null) parts.push(`L: ${component.lengthValue}${component.lengthUnit ? ` ${component.lengthUnit}` : ''}`);
                                                else if (component.rawLengthInput) parts.push(`L: ${component.rawLengthInput}${component.lengthUnit ? ` ${component.lengthUnit}` : ''}`);

                                                if (component.diameterValue !== undefined && component.diameterValue !== null) parts.push(`Ø: ${component.diameterValue}${component.diameterUnit ? ` ${component.diameterUnit}` : ''}`);
                                                else if (component.rawDiameterInput) parts.push(`Ø: ${component.rawDiameterInput}${component.diameterUnit ? ` ${component.diameterUnit}` : ''}`);

                                                if (component.widthValue !== undefined && component.widthValue !== null) parts.push(`W: ${component.widthValue}${component.widthUnit ? ` ${component.widthUnit}` : ''}`);
                                                else if (component.rawWidthInput) parts.push(`W: ${component.rawWidthInput}${component.widthUnit ? ` ${component.widthUnit}` : ''}`);

                                                return parts.length > 0 ? parts.join(' / ') : '-';
                                            };

                                            return material.components.map((component, compIndex) => (
                                                <tr key={`${item.materialId}-${compIndex}`} className="border-b border-gray-700 hover:bg-surface-light">
                                                    {compIndex === 0 && (
                                                        <td rowSpan={material.components.length} className="px-4 py-2 font-medium text-textPrimary align-top">
                                                            {material.name}
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-2">{component.name}</td>
                                                    <td className="px-4 py-2">{getComponentSizeString(component)}</td>
                                                    <td className="px-4 py-2">{(component.unitWeight || 0).toFixed(2)} {component.unit}</td>
                                                    <td className="px-4 py-2">R$ {(component.unitCost || 0).toFixed(2)}</td>
                                                </tr>
                                            ));
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    <div className="mt-6 space-y-3">
                        <button onClick={handleSaveQuote} disabled={items.length === 0} className="w-full flex items-center justify-center px-4 py-2 bg-secondary text-white rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                            {showSuccess ? <CheckCircleIcon className="w-5 h-5 mr-2"/> : <DocumentDuplicateIcon className="w-5 h-5 mr-2" />}
                            {showSuccess ? 'Salvo com Sucesso!' : (currentQuoteId ? 'Atualizar Orçamento' : 'Salvar Orçamento')}
                        </button>
                        <button onClick={handleGeneratePDF} disabled={!currentQuoteId} className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-600">
                            <ArrowDownOnSquareIcon className="w-5 h-5 mr-2"/>
                            Gerar PDF
                        </button>
                        
                     </div>
                </div>
            </div>
        </div>
        <PdfActionModal isOpen={isPdfModalOpen} blob={pdfBlob} filename="orcamento.pdf" onClose={() => setIsPdfModalOpen(false)} />
    </div>
  )
};