import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import type { Material } from '../types';

interface MaterialSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (material: Material | string) => void;
  onNavigateToMaterials?: () => void;
}

// Materiais de exemplo para demonstração
const createExampleMaterials = (): Material[] => {
  return [
    {
      id: 'mat_001',
      name: 'Ferro 6mm',
      description: 'Barra de ferro 6mm para estruturas',
      unitCost: 15.50,
      unitWeight: 0.22,
      unit: 'kg',
      categoryId: 'cat_ferro',
      components: []
    },
    {
      id: 'mat_002', 
      name: 'Ferro 8mm',
      description: 'Barra de ferro 8mm para estruturas',
      unitCost: 18.75,
      unitWeight: 0.39,
      unit: 'kg',
      categoryId: 'cat_ferro',
      components: [
        {
          id: 'comp_001',
          name: 'Barra Principal',
          unitWeight: 0.39,
          unit: 'kg',
          unitCost: 18.75,
          lengthValue: 6000,
          lengthUnit: 'mm',
          diameterValue: 8,
          diameterUnit: 'mm',
          rawLengthInput: '6000mm',
          rawDiameterInput: '8mm',
          rawWidthInput: ''
        }
      ]
    },
    {
      id: 'mat_003',
      name: 'Solda 3,25mm',
      description: 'Eletrodo de solda 3,25mm',
      unitCost: 2.80,
      unitWeight: 0.05,
      unit: 'kg',
      categoryId: 'cat_solda',
      components: []
    },
    {
      id: 'mat_004',
      name: 'Tubo Quadrado 20x20mm',
      description: 'Tubo quadrado de ferro 20x20mm',
      unitCost: 25.00,
      unitWeight: 1.2,
      unit: 'kg',
      categoryId: 'cat_ferro',
      components: [
        {
          id: 'comp_002',
          name: 'Tubo Seção',
          unitWeight: 1.2,
          unit: 'kg',
          unitCost: 25.00,
          lengthValue: 3000,
          lengthUnit: 'mm',
          widthValue: 20,
          widthUnit: 'mm',
          rawLengthInput: '3m',
          rawDiameterInput: '',
          rawWidthInput: '20x20mm',
          // Adicionar caso problemático que pode existir em dados antigos
          sizeValue: {
            lengthValue: 3000,
            lengthUnit: 'mm',
            widthValue: 20,
            widthUnit: 'mm'
          } as any
        }
      ]
    }
  ];
};

export const MaterialSelectionModal: React.FC<MaterialSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  onNavigateToMaterials,
}) => {
  const { materials, categories, setMaterials } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  // Debug: Log do estado do modal
  React.useEffect(() => {
    if (isOpen) {
      console.log('[DEBUG] MaterialSelectionModal opened');
      console.log('[DEBUG] Materials available:', materials.length);
      console.log('[DEBUG] Categories available:', categories.length);
      console.log('[DEBUG] Materials:', materials);
    }
  }, [isOpen, materials, categories]);

  const handleAddExampleMaterials = () => {
    const exampleMaterials = createExampleMaterials();
    setMaterials(prev => [...prev, ...exampleMaterials]);
    console.log('[DEBUG] Added example materials');
  };

  if (!isOpen) return null;

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategoryId || material.categoryId === selectedCategoryId;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up" data-testid="material-selection-modal">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-scale-in border border-gray-200 dark:border-slate-700">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Selecionar Material</h3>
          <div className="mt-4 flex gap-4">
            <input
              type="text"
              placeholder="Buscar material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
            />
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px] transition-all duration-300"
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMaterials.map((material, index) => {
              const category = categories.find(c => c.id === material.categoryId);
              return (
                <button
                  key={material.id}
                  onClick={() => onSelect(material)}
                  data-testid={index === 0 ? 'select-first-material-btn' : undefined}
                  className="text-left p-6 border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:scale-105 hover:shadow-lg card-hover"
                >
                  <h4 className="font-semibold text-gray-900 dark:text-white">{material.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">{material.description}</p>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">{category?.name || 'Sem categoria'}</span>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">R$ {material.unitCost.toFixed(2)}</span>
                  </div>
                </button>
              );
            })}
            {filteredMaterials.length === 0 && materials.length === 0 && (
              <div className="col-span-2 text-center py-12 text-gray-500 dark:text-slate-400">
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 1L5 3l4 2 4-2-4-2zM1 21h22M5 21V10l7-4 7 4v11" />
                  </svg>
                </div>
                <p className="text-lg font-medium mb-2">Nenhum material cadastrado</p>
                <p className="text-sm mb-4">Você precisa cadastrar materiais primeiro para criar orçamentos.</p>
                <div className="space-y-3">
                  <button
                    onClick={handleAddExampleMaterials}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-lg mr-3"
                  >
                    Adicionar Materiais de Exemplo
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToMaterials?.();
                    }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    Ir para Materiais
                  </button>
                </div>
              </div>
            )}
            {filteredMaterials.length === 0 && materials.length > 0 && (
              <div className="col-span-2 text-center py-12 text-gray-500 dark:text-slate-400">
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-lg font-medium">Nenhum material encontrado</p>
                <p className="text-sm">Tente ajustar os filtros de busca</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {filteredMaterials.length} {filteredMaterials.length === 1 ? 'material encontrado' : 'materiais encontrados'}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};