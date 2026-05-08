import React, { useState, useMemo } from 'react';
import { ClockIcon, PlusIcon, TrashIcon, DocumentTextIcon, SaveIcon } from './Icons';
import { useData } from '../context/DataContext';
import { useToast } from '../hooks/useToast';
import { generatePDF } from '../services/pdfGenerator';
import type { Quote } from '../types';

interface HourlyItem {
  id: string;
  description: string;
  hourlyRate: number;
  numberOfWorkers: number;
  hours: number;
}

export const HourlyQuote: React.FC = () => {
  const { settings, clients, materials, quotes, setQuotes } = useData();
  const { showSuccess, showError } = useToast();
  
  const [items, setItems] = useState<HourlyItem[]>([
    { id: '1', description: '', hourlyRate: 0, numberOfWorkers: 1, hours: 1 }
  ]);
  const [clientName, setClientName] = useState('');
  const [profitMargin, setProfitMargin] = useState(settings?.defaultTax ?? 30);
  const [currentQuoteId, setCurrentQuoteId] = useState<string | null>(null);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        description: '',
        hourlyRate: 0,
        numberOfWorkers: 1,
        hours: 1
      }
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof HourlyItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculated = useMemo(() => {
    const laborCost = items.reduce((sum, item) => {
      return sum + (item.hourlyRate * item.numberOfWorkers * item.hours);
    }, 0);

    const profit = laborCost * (profitMargin / 100);
    const totalValue = laborCost + profit;

    return {
      laborCost,
      profit,
      totalValue
    };
  }, [items, profitMargin]);

  const handleGeneratePDF = () => {
    if (!clientName.trim()) {
      showError('Por favor, informe o nome do cliente');
      return;
    }

    if (items.some(item => !item.description.trim())) {
      showError('Por favor, preencha a descrição de todos os itens');
      return;
    }

    // Build a Quote-compatible object for PDF generator
    const quote = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      clientName,
      items: [],
      laborCost: calculated.laborCost,
      freightCost: 0,
      profitMargin,
      isFreightEnabled: false,
    };

    // Map hourly calculation into CalculatedCosts expected by generator
    const hourlyCosts = {
      materialCost: 0,
      totalGrossCost: 0,
      indirectCosts: 0,
      freightCost: 0,
      totalProjectCost: calculated.laborCost + calculated.profit,
      totalManufacturingCostPerItem: calculated.laborCost,
      profitValue: calculated.profit,
      finalValue: calculated.totalValue,
      totalWeight: 0,
    };

    try {
      generatePDF(quote as any, materials, settings as any, hourlyCosts as any);
      showSuccess('PDF gerado com sucesso!');
    } catch (error) {
      showError('Erro ao gerar PDF');
      console.error(error);
    }
  };

  const handleClear = () => {
    setItems([{ id: '1', description: '', hourlyRate: 0, numberOfWorkers: 1, hours: 1 }]);
    setClientName('');
    setProfitMargin(settings?.defaultTax ?? 30);
    setCurrentQuoteId(null);
  };

  const handleSaveQuote = () => {
    if (!clientName.trim()) {
      showError('Por favor, informe o nome do cliente');
      return;
    }

    if (items.some(item => !item.description.trim())) {
      showError('Por favor, preencha a descrição de todos os itens');
      return;
    }

    const quoteData: Omit<Quote, 'id' | 'date'> = {
      clientName,
      items: [], // Empty items array for hourly quotes
      laborCost: calculated.laborCost,
      freightCost: 0,
      profitMargin,
      isFreightEnabled: false,
    };

    if (currentQuoteId) {
      // Update existing quote
      const updatedQuote: Quote = { ...quoteData, id: currentQuoteId, date: new Date().toISOString() };
      setQuotes(prev => prev.map(q => q.id === currentQuoteId ? updatedQuote : q));
      showSuccess('Orçamento atualizado com sucesso!');
    } else {
      // Create new quote
      const newQuote: Quote = { ...quoteData, id: `HQ-${Date.now()}`, date: new Date().toISOString() };
      setQuotes(prev => [...prev, newQuote]);
      setCurrentQuoteId(newQuote.id);
      showSuccess('Orçamento salvo com sucesso!');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center mb-6">
          <ClockIcon className="w-8 h-8 text-sidebar-600 dark:text-ice-300 mr-3" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Orçamento por Hora-Homem
          </h2>
        </div>

        {/* Client Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Cliente *
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            list="clients-list"
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sidebar-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            placeholder="Digite ou selecione o cliente"
          />
          <datalist id="clients-list">
            {clients.map(client => (
              <option key={client.id} value={client.name} />
            ))}
          </datalist>
        </div>

        {/* Items */}
        <div className="space-y-4 mb-6">
          {items.map((item, index) => (
            <div key={item.id} className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg border border-gray-200 dark:border-slate-600">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200">Item {index + 1}</h3>
                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    aria-label="Remover item"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descrição *
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sidebar-500 dark:bg-slate-600 dark:text-white"
                    placeholder="Ex: Instalação elétrica"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valor/Hora (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.hourlyRate}
                    onChange={(e) => updateItem(item.id, 'hourlyRate', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sidebar-500 dark:bg-slate-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nº de Homens
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={item.numberOfWorkers}
                    onChange={(e) => updateItem(item.id, 'numberOfWorkers', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sidebar-500 dark:bg-slate-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Horas
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={item.hours}
                    onChange={(e) => updateItem(item.id, 'hours', parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sidebar-500 dark:bg-slate-600 dark:text-white"
                  />
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subtotal
                  </label>
                  <div className="text-lg font-semibold text-sidebar-600 dark:text-ice-300">
                    R$ {(item.hourlyRate * item.numberOfWorkers * item.hours).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addItem}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-sidebar-600 hover:bg-sidebar-700 text-white rounded-lg transition-colors mb-6"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Adicionar Item</span>
        </button>

        {/* Profit Margin */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Margem de Lucro (%)
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={profitMargin}
            onChange={(e) => setProfitMargin(parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sidebar-500 dark:bg-slate-700 dark:text-white"
          />
        </div>

        {/* Totals */}
        <div className="bg-gradient-to-br from-sidebar-50 to-ice-100 dark:from-slate-700 dark:to-slate-600 p-6 rounded-lg border-2 border-sidebar-200 dark:border-slate-500">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Custo de Mão de Obra:</span>
              <span className="text-xl font-bold text-gray-800 dark:text-white">
                R$ {calculated.laborCost.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                Lucro ({profitMargin}%):
              </span>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">
                R$ {calculated.profit.toFixed(2)}
              </span>
            </div>
            <div className="border-t-2 border-sidebar-300 dark:border-slate-500 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-800 dark:text-gray-200 font-bold text-lg">Valor Total:</span>
                <span className="text-3xl font-bold text-sidebar-600 dark:text-ice-300">
                  R$ {calculated.totalValue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <button
            onClick={handleSaveQuote}
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
          >
            <SaveIcon className="w-5 h-5" />
            <span>Salvar Orçamento</span>
          </button>
          <button
            onClick={handleGeneratePDF}
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-sidebar-600 hover:bg-sidebar-700 text-white rounded-lg transition-colors font-medium"
          >
            <DocumentTextIcon className="w-5 h-5" />
            <span>Gerar PDF</span>
          </button>
          <button
            onClick={handleClear}
            className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 dark:bg-slate-600 dark:hover:bg-slate-500 text-gray-700 dark:text-white rounded-lg transition-colors font-medium"
          >
            Limpar
          </button>
        </div>
      </div>
    </div>
  );
};
