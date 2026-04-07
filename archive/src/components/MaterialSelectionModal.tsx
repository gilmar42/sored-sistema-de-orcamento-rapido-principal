import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Material } from '../types';

interface MaterialSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (material: Material) => void;
}

export const MaterialSelectionModal: React.FC<MaterialSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const { materials, categories } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  if (!isOpen) return null;

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategoryId || material.categoryId === selectedCategoryId;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" data-testid="material-selection-modal">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-surface-light">
          <h3 className="text-lg font-semibold text-textPrimary">Selecionar Material</h3>
          <div className="mt-4 flex gap-4">
            <input
              type="text"
              placeholder="Buscar material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary"
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
        
        <div className="p-4 overflow-y-auto flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMaterials.map((material) => {
              const category = categories.find(c => c.id === material.categoryId);
              return (
                <button
                  key={material.id}
                  onClick={() => onSelect(material)}
                  className="text-left p-4 border border-border rounded-lg hover:bg-surface-light focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                >
                  <h4 className="font-semibold text-textPrimary">{material.name}</h4>
                  <p className="text-sm text-textSecondary mt-1">{material.description}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-sm text-primary">{category?.name || 'Sem categoria'}</span>
                    <span className="text-sm font-medium text-textPrimary">R$ {material.unitCost.toFixed(2)}</span>
                  </div>
                </button>
              );
            })}
            {filteredMaterials.length === 0 && (
              <div className="col-span-2 text-center py-8 text-textSecondary">
                Nenhum material encontrado.
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-surface-light flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-textPrimary rounded-md hover:bg-gray-500 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};