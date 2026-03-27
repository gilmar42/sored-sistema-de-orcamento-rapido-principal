import React, { useState, useCallback } from 'react';
import { Material } from '../types';
import { useData } from '../context/DataContext';
import { MaterialFormModal } from './MaterialFormModal';
import { PlusIcon, PencilIcon, TrashIcon } from './Icons';

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
    <div className="p-6 bg-background text-textPrimary min-h-screen" data-testid="material-management-root">
      <h2 className="text-3xl font-bold mb-6 text-primary">Gerenciamento de Materiais e Componentes</h2>

      <div className="flex justify-end mb-6">
        <button
          onClick={handleAddClick}
          className="flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Adicionar Novo Material
        </button>
      </div>

      <div className="bg-surface rounded-lg shadow-md p-4">
        {materials.length === 0 ? (
          <p className="text-textSecondary">Nenhum material cadastrado ainda.</p>
        ) : (
          <ul className="space-y-4">
            {materials.map((material) => (
              <li key={material.id} className="border border-border rounded-md p-4 bg-background">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-semibold text-textPrimary">{material.name}</h3>
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
                <p className="text-textSecondary mb-1">Descrição: {material.description || 'N/A'}</p>
                <p className="text-textSecondary mb-1">Custo Unitário: R$ {material.unitCost.toFixed(2)}</p>
                <p className="text-textSecondary mb-1">Peso Unitário: {material.unitWeight} {material.unit}</p>
                <p className="text-textSecondary mb-1">Categoria: {material.categoryId}</p>

                {material.components && material.components.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border-light">
                    <h4 className="text-lg font-semibold text-textPrimary mb-2">Componentes:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {material.components.map((component, compIndex) => {
                        const displayLength = component.lengthValue !== undefined ? 
                          `${component.lengthValue} ${component.lengthUnit}` :
                          component.rawLengthInput ? `${component.rawLengthInput} ${component.lengthUnit}` : null;
                          
                        const displayDiameter = component.diameterValue !== undefined ? 
                          `${component.diameterValue} ${component.diameterUnit}` :
                          component.rawDiameterInput ? `${component.rawDiameterInput} ${component.diameterUnit}` : null;
                          
                        const displayWidth = component.widthValue !== undefined ? 
                          `${component.widthValue} ${component.widthUnit}` :
                          component.rawWidthInput ? `${component.rawWidthInput} ${component.widthUnit}` : null;

                        return (
                          <li key={compIndex} className="text-textSecondary border-l-2 border-surface pl-2 my-2">
                            <div className="flex flex-col gap-1">
                              <div className="font-medium text-textPrimary">
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
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
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