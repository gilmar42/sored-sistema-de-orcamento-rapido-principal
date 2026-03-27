import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import type { Material, QuoteItem, Quote, CalculatedCosts } from '../types';
import { generateQuotePDF } from '../services/pdfGenerator';
import { formatComponentSize } from '../utils/componentUtils';
import * as Icons from '../components/Icons';

interface QuoteCalculatorProps {
  quoteToEdit: Quote | null;
  setQuoteToEdit: (quote: Quote | null) => void;
  onNavigateToMaterials?: () => void;
}

import { MaterialSelectionModal } from './MaterialSelectionModal';
import PdfActionModal from './PdfActionModal';


export const QuoteCalculator: React.FC<QuoteCalculatorProps> = ({ quoteToEdit, setQuoteToEdit, onNavigateToMaterials }) => {
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
      setLaborCost(quoteToEdit.laborCost ?? 0);
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
    // Calcular custo total dos materiais somando o custo de cada componente
    const materialCost = items.reduce((acc, item) => {
      const material = materials && Array.isArray(materials) ? materials.find(m => m.id === item.materialId) : undefined;
      if (!material) return acc;
      
      // Somar o custo de todos os componentes do material
      const componentsCost = material.components.reduce((compAcc, component) => {
        return compAcc + (component.unitCost || 0);
      }, 0);
      
      // Se não houver componentes, usar o unitCost do material
      const materialUnitCost = componentsCost > 0 ? componentsCost : material.unitCost;
      
      return acc + (materialUnitCost * item.quantity);
    }, 0);

    // Custo de fabricação informado pelo usuário (não multiplicar pela quantidade)
    const totalManufacturingCost = laborCost;
    
    const totalProjectCost = materialCost + totalManufacturingCost + (isFreightEnabled ? freightCost : 0);
    const profitValue = totalProjectCost * (profitMargin / 100);
    const finalValue = totalProjectCost + profitValue;

    const totalWeight = items.reduce((acc, item) => {
      const material = materials && Array.isArray(materials) ? materials.find(m => m.id === item.materialId) : undefined;
      return acc + (material ? material.unitWeight * item.quantity : 0);
    }, 0);

    return {
      materialCost,
      totalGrossCost: materialCost,
      indirectCosts: totalManufacturingCost,
      freightCost: isFreightEnabled ? freightCost : 0,
      totalProjectCost,
      totalManufacturingCostPerItem: totalManufacturingCost,
      profitValue,
      finalValue,
      totalWeight,
    };
  }, [items, freightCost, profitMargin, materials, isFreightEnabled, laborCost]);

  const handleAddItem = useCallback((materialOrId: Material | string) => {
    const material = typeof materialOrId === 'string' ? materials?.find(m => m.id === materialOrId) : materialOrId;
    if (!material) return;
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
  }, [setIsModalOpen, setItems, materials]);
  
  const handleUpdateQuantity = (materialId: string, value: string) => {
    const parsedQuantity = parseInt(value);
    const newQuantity = isNaN(parsedQuantity) ? 0 : Math.max(0, parsedQuantity);
    setItems(items.map(item => item.materialId === materialId ? { ...item, quantity: newQuantity } : item));
  };

  const handleRemoveItem = (materialId: string) => {
    setItems(items.filter(item => item.materialId !== materialId));
  };

  const handleSaveQuote = () => {
    if (!clientName.trim()) {
      window.alert('Por favor, informe o nome do cliente.');
      return;
    }

    if (items.length === 0) {
      window.alert('Adicione pelo menos um item antes de salvar.');
      return;
    }

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
        setQuotes(prev => prev.map(q => q.id === currentQuoteId ? updatedQuote : q));
        setQuoteToEdit(null);
    } else {
        // Create new quote
        const newQuote: Quote = { ...quoteData, id: `Q-${Date.now()}`, date: new Date().toISOString() };
        setQuotes(prev => [...prev, newQuote]);
        setCurrentQuoteId(newQuote.id);
    }

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
      laborCost: 0,
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
        {isModalOpen && <MaterialSelectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelect={handleAddItem} onNavigateToMaterials={onNavigateToMaterials} />}
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-textPrimary dark:text-white">{currentQuoteId ? `Editando Orçamento: ${currentQuoteId}` : 'Novo Orçamento'}</h2>
            <button onClick={resetForm} className="text-sm text-blue-400 dark:text-blue-300 hover:underline">Limpar Formulário</button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                {/* Itens do Orçamento */}
                <div className="bg-surface dark:bg-slate-800 p-6 rounded-lg shadow-md hover-lift card-hover animate-slide-in-left">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-textPrimary dark:text-white flex items-center">
                            <Icons.DocumentTextIcon className="w-6 h-6 mr-2 text-primary" />
                            Itens do Orçamento
                            {items.length > 0 && (
                                <span className="ml-2 px-2 py-1 bg-primary/10 dark:bg-primary/20 text-primary text-sm rounded-full animate-pulse">
                                    {items.length}
                                </span>
                            )}
                        </h3>
                        <button 
                            onClick={() => setIsModalOpen(true)} 
                            className="flex items-center px-4 py-2 bg-gradient-to-r from-primary to-blue-600 text-white rounded-lg hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl group"
                        >
                            <Icons.PlusIcon className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300"/>
                            Adicionar Item
                        </button>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-border dark:border-slate-600">
                  <table className="w-full text-sm text-left text-textSecondary dark:text-slate-300">
                    <thead className="text-xs text-gray-300 dark:text-slate-200 uppercase bg-gradient-to-r from-surface-light to-gray-100 dark:from-slate-700 dark:to-slate-600">
                                <tr>
                                    <th scope="col" className="px-6 py-4 font-semibold">Descrição</th>
                                    <th scope="col" className="px-6 py-4 w-32 font-semibold text-center">Qtd.</th>
                                    <th scope="col" className="px-6 py-4 font-semibold text-center">Custo Unitário</th>
                                    <th scope="col" className="px-6 py-4 font-semibold text-center">Custo Total</th>
                                    <th scope="col" className="px-6 py-4 w-16 font-semibold text-center">Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length > 0 ? (
                                  items.map(item => {
                                    const material = getMaterialById(item.materialId);
                                    if (!material) return null;
                                    
                                    // Calcular custo unitário somando todos os componentes
                                    const componentsCost = material.components.reduce((acc, component) => {
                                      return acc + (component.unitCost || 0);
                                    }, 0);
                                    const unitCost = componentsCost > 0 ? componentsCost : material.unitCost;
                                    const totalCost = unitCost * item.quantity;
                                    
                                    return (
                                        <tr key={item.materialId} className="border-b border-gray-200 dark:border-slate-600 hover:bg-gradient-to-r hover:from-primary/5 hover:to-blue-500/5 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-300 ease-in-out animate-fade-in-up group">
                                            <td className="px-6 py-4 font-medium text-textPrimary dark:text-white group-hover:text-primary dark:group-hover:text-blue-400 transition-colors duration-300">
                                                <div className="flex items-center">
                                                    <div className="w-3 h-3 bg-primary rounded-full mr-3 opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                    {material.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                              <input 
                                                type="number" 
                                                value={item.quantity} 
                                                onChange={(e) => handleUpdateQuantity(item.materialId, e.target.value)}
                                                className="w-20 p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-center text-textPrimary dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 hover:shadow-lg"
                                                min="1"
                                                aria-label={`Quantidade do item ${material.name}`}
                                              />
                                            </td>
                                            <td className="px-6 py-4 text-center font-semibold text-green-600 dark:text-green-400">R$ {unitCost.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-center font-bold text-textPrimary dark:text-white">
                                                <span className="bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full text-green-800 dark:text-green-300">
                                                    R$ {totalCost.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                  onClick={() => handleRemoveItem(item.materialId)} 
                                                  className="text-red-500 hover:text-red-400 hover:scale-110 transition-all duration-300 ease-in-out p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                                                  title="Remover item"
                                                  type="button"
                                                >
                                                  <Icons.TrashIcon className="w-5 h-5"/>
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                }) ) : (
                                  <tr>
                                    <td colSpan={5} className="text-center py-8 text-textSecondary dark:text-slate-400">
                                      <div className="flex flex-col items-center">
                                        <Icons.BoxIcon className="w-12 h-12 mb-2 text-gray-400" />
                                        <p>Nenhum item adicionado</p>
                                        <p className="text-xs">Use o botão acima para começar.</p>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Custos Adicionais */}
                <div className="bg-surface dark:bg-slate-800 p-6 rounded-lg shadow-md hover-lift card-hover animate-slide-in-right">
                <h3 className="text-xl font-semibold text-textPrimary dark:text-white mb-6 flex items-center">
                  <Icons.CalculatorIcon className="w-6 h-6 mr-2 text-primary" />
                  Custos e Margem
                </h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="clientName" className="block text-sm font-medium text-textSecondary dark:text-slate-300 mb-2">
                      Nome do Cliente
                    </label>
                    <input
                      id="clientName"
                      type="text"
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      placeholder="Selecione ou digite o nome do cliente"
                      className="block w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-textPrimary dark:text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label htmlFor="profitMargin" className="block text-sm font-medium text-textSecondary dark:text-slate-300 mb-2">Margem de Lucro (%)</label>
                    <input
                      id="profitMargin"
                      type="number"
                      value={profitMargin}
                      onChange={e => setProfitMargin(parseFloat(e.target.value) || 0)}
                      className="block w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-textPrimary dark:text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label htmlFor="laborCost" className="block text-sm font-medium text-textSecondary dark:text-slate-300 mb-2">
                      Custo de Fabricação (Mão de Obra)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">R$</span>
                      <input
                        type="number"
                        id="laborCost"
                        value={laborCost}
                        onChange={e => setLaborCost(parseFloat(e.target.value) || 0)}
                        className="block w-full px-4 py-3 pl-10 pr-4 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-textPrimary dark:text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300"
                        aria-label="Custo de Fabricação (Mão de Obra)"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="freightCost" className="block text-sm font-medium text-textSecondary dark:text-slate-300 mb-2">
                      Custo de Frete (R$)
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">R$</span>
                        <input
                          type="number"
                          id="freightCost"
                          value={freightCost}
                          onChange={e => setFreightCost(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="block w-full px-4 py-3 pl-10 pr-4 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-textPrimary dark:text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300"
                          disabled={!isFreightEnabled}
                          aria-label="Custo de Frete (R$)"
                        />
                      </div>
                      <label className="flex items-center space-x-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isFreightEnabled}
                          onChange={() => setIsFreightEnabled(!isFreightEnabled)}
                          aria-label="Ativar Frete"
                        />
                        <span className="text-sm text-textPrimary dark:text-white">Ativar Frete</span>
                        <span className="text-sm text-textPrimary dark:text-white">{isFreightEnabled ? 'Ativo' : 'Inativo'}</span>
                      </label>
                    </div>
                  </div>
                </div>
                </div>
            </div>

            {/* Resumo e Ações */}
            <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-surface to-white dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 sticky top-8 border border-gray-200 dark:border-slate-600 animate-scale-in">
                    <h3 className="text-xl font-bold text-textPrimary dark:text-white border-b border-surface-light dark:border-slate-600 pb-3 mb-6 flex items-center">
                        <Icons.DocumentDuplicateIcon className="w-6 h-6 mr-2 text-primary" />
                        Resumo do Orçamento
                    </h3>
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between items-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg transition-all duration-300 hover:scale-105 border border-indigo-100 dark:border-indigo-800">
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full mr-3 shadow-sm"></div>
                                <span className="text-gray-700 dark:text-slate-200 font-semibold">Custo Material:</span>
                            </div>
                            <span className="font-bold text-indigo-700 dark:text-indigo-400">R$ {calculated.materialCost.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg transition-all duration-300 hover:scale-105 border border-violet-100 dark:border-violet-800">
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-gradient-to-r from-violet-500 to-violet-600 rounded-full mr-3 shadow-sm"></div>
                                <span className="text-gray-700 dark:text-slate-200 font-semibold">Custo de Fabricação:</span>
                            </div>
                            <span className="font-bold text-violet-700 dark:text-violet-400">R$ {calculated.totalManufacturingCostPerItem.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg transition-all duration-300 hover:scale-105 border border-amber-100 dark:border-amber-800">
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full mr-3 shadow-sm"></div>
                                <span className="text-gray-700 dark:text-slate-200 font-semibold">Custo de Frete:</span>
                            </div>
                            <span className="font-bold text-amber-700 dark:text-amber-400">R$ {calculated.freightCost.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg transition-all duration-300 hover:scale-105 border border-slate-200 dark:border-slate-600">
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-gradient-to-r from-slate-500 to-slate-600 rounded-full mr-3 shadow-sm"></div>
                                <span className="text-gray-700 dark:text-slate-200 font-semibold">Custo Total do Projeto:</span>
                            </div>
                            <span className="font-bold text-slate-800 dark:text-slate-100">R$ {calculated.totalProjectCost.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg transition-all duration-300 hover:scale-105 border border-emerald-100 dark:border-emerald-800">
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full mr-3 shadow-sm"></div>
                                <span className="text-gray-700 dark:text-slate-200 font-semibold">Lucro (interno):</span>
                            </div>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">R$ {calculated.profitValue.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg transition-all duration-300 hover:scale-105 border border-orange-100 dark:border-orange-800">
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mr-3 shadow-sm"></div>
                                <span className="text-gray-700 dark:text-slate-200 font-semibold">Peso Total:</span>
                            </div>
                            <span className="font-bold text-orange-700 dark:text-orange-400">{calculated.totalWeight.toFixed(2)} kg</span>
                        </div>
                        
                         <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/30 dark:via-emerald-900/30 dark:to-teal-900/30 rounded-xl border-2 border-green-300 dark:border-green-600 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-full mr-3 shadow-md animate-pulse"></div>
                                <span className="font-bold text-lg text-gray-800 dark:text-white">Valor Final:</span>
                            </div>
                            <span className="font-bold text-2xl bg-gradient-to-r from-green-700 via-emerald-700 to-teal-700 dark:from-green-400 dark:via-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">R$ {calculated.finalValue.toFixed(2)}</span>
                        </div>
                    </div>
                    {items.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-lg font-semibold text-textPrimary dark:text-white mb-2">Componentes do Produto Final</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-textSecondary dark:text-slate-300">
                                    <thead className="text-xs text-gray-300 dark:text-slate-200 uppercase bg-surface-light dark:bg-slate-700">
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

                                            return material.components.map((component, compIndex) => (
                                                <tr key={`${item.materialId}-${compIndex}`} className="border-b border-gray-700 dark:border-slate-600 hover:bg-surface-light">
                                                    {compIndex === 0 && (
                                                        <td rowSpan={material.components.length} className="px-4 py-2 font-medium text-textPrimary dark:text-white align-top">
                                                            {material.name}
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-2">{component.name}</td>
                                                    <td className="px-4 py-2">{formatComponentSize(component)}</td>
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
                            {showSuccess ? <Icons.CheckCircleIcon className="w-5 h-5 mr-2"/> : <Icons.DocumentDuplicateIcon className="w-5 h-5 mr-2" />}
                            {showSuccess ? 'Salvo com Sucesso!' : (currentQuoteId ? 'Atualizar Orçamento' : 'Salvar Orçamento')}
                        </button>
                        <button onClick={handleGeneratePDF} disabled={!currentQuoteId} className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-600">
                            <Icons.ArrowDownOnSquareIcon className="w-5 h-5 mr-2"/>
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
