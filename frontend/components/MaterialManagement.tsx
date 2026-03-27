import React, { useState, useCallback } from 'react';
import type { Material } from '../types';
import { useData } from '../context/DataContext';
import { MaterialFormModal } from './MaterialFormModal';
import { formatComponentDimensions } from '../utils/componentUtils';
import { PlusIcon, PencilIcon, TrashIcon, BoxIcon } from './Icons';

interface MaterialManagementProps {
  activeView?: string;
}

export const MaterialManagement: React.FC<MaterialManagementProps> = ({ activeView }) => {
  // Defensive: do not render this component if it's not the active view
  if (activeView && activeView !== 'materials') return null;

  const { materials, addMaterial, updateMaterial, deleteMaterial } = useData();
  // Diagnostic: log when this component mounts
  React.useEffect(() => {
    console.log('[DEBUG] MaterialManagement mounted');
    console.log('[DEBUG] Materials:', materials);
  }, [materials]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const handleAddClick = () => {
    setEditingMaterial(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (material: Material) => {
    setEditingMaterial(material);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (materialId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este material?')) {
      deleteMaterial(materialId);
    }
  };

  const handleSaveMaterial = (material: Material) => {
    if (editingMaterial) {
      updateMaterial(material);
    } else {
      addMaterial(material);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-background dark:bg-slate-900 text-textPrimary dark:text-white min-h-screen animate-fade-in-up" data-testid="material-management-root">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent flex items-center">
              <BoxIcon className="w-8 h-8 mr-3 text-primary" />
              Materiais e Componentes
            </h2>
            <p className="text-textSecondary dark:text-slate-400 mt-2 text-sm sm:text-base">
              Gerencie seus materiais e configure componentes para orçamentos precisos
            </p>
          </div>

          <button
            onClick={handleAddClick}
            className="bg-linear-to-r from-primary to-blue-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 hover:scale-105 active:scale-95 transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl group"
          >
            <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            <span>Novo Material</span>
          </button>
        </div>

        <div className="bg-surface dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6">
          {materials.length === 0 ? (
            <div className="text-center py-12 animate-fade-in-up">
              <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-gentle">
                <BoxIcon className="w-10 h-10 text-gray-400 dark:text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-textPrimary dark:text-white mb-2">Nenhum material cadastrado</h3>
              <p className="text-textSecondary dark:text-slate-400 mb-6">Comece criando seu primeiro material para orçamentos</p>
              <button
                onClick={handleAddClick}
                className="bg-linear-to-r from-primary to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:scale-105 transition-all duration-300 shadow-lg"
              >
                Criar Primeiro Material
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materials.map((material, index) => (
                <div 
                  key={material.id} 
                  className="border border-border dark:border-slate-600 rounded-xl p-6 bg-linear-to-br from-background to-gray-50 dark:from-slate-700 dark:to-slate-600 hover:scale-105 transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl card-hover animate-slide-in-left"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-semibold text-textPrimary dark:text-white">{material.name}</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditClick(material)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Editar Material"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(material.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Excluir Material"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-textSecondary dark:text-slate-300 mb-1">Descrição: {material.description || 'N/A'}</p>
                  <p className="text-textSecondary dark:text-slate-300 mb-1">Custo Unitário: R$ {material.unitCost.toFixed(2)}</p>
                  <p className="text-textSecondary dark:text-slate-300 mb-1">Peso Unitário: {material.unitWeight} {material.unit}</p>
                  <p className="text-textSecondary dark:text-slate-300 mb-1">Categoria: {material.categoryId}</p>

                  {material.components && material.components.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border-light dark:border-slate-600">
                      <h4 className="text-lg font-semibold text-textPrimary dark:text-white mb-2">Componentes:</h4>
                      <div className="space-y-2">
                        {material.components.map((component, compIndex) => {
                          const { displayLength, displayDiameter, displayWidth } = formatComponentDimensions(component);

                          return (
                            <div key={compIndex} className="text-textSecondary dark:text-slate-300 border-l-2 border-surface dark:border-slate-600 pl-2 my-2">
                              <div className="flex flex-col gap-1">
                                <div className="font-medium text-textPrimary dark:text-white">
                                  {component.name}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    Peso: {component.unitWeight} {component.unit}
                                  </div>
                                  <div>
                                    Custo: R$ {component.unitCost.toFixed(2)}
                                  </div>
                                  {displayLength && (
                                    <div>
                                      Comprimento: {displayLength}
                                    </div>
                                  )}
                                  {displayDiameter && (
                                    <div>
                                      Diâmetro: {displayDiameter}
                                    </div>
                                  )}
                                  {displayWidth && (
                                    <div>
                                      Largura: {displayWidth}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <MaterialFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveMaterial}
          materialToEdit={editingMaterial}
        />
      )}
    </div>
  );
};