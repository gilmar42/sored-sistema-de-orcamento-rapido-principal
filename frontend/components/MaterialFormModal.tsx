import React, { useState, useEffect } from 'react';
import type { Material, Category, ProductComponent, WeightUnit } from '../types';
import { useData } from '../context/DataContext';
import { parseDimensionInput } from '../utils/parsers';
import { v4 as uuidv4 } from 'uuid';

interface MaterialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (material: Material) => void;
  materialToEdit?: Material | null;
}

export const MaterialFormModal: React.FC<MaterialFormModalProps> = ({ isOpen, onClose, onSave, materialToEdit }) => {
  const { categories } = useData();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [unitWeight, setUnitWeight] = useState('');
  const [unit, setUnit] = useState<WeightUnit>('kg');
  const [categoryId, setCategoryId] = useState('');
  const [components, setComponents] = useState<ProductComponent[]>([]);

  // Helper function to format dimension values back to string with unit
  const formatDimensionForInput = (value?: number, unit?: string) => {
    if (value === undefined) return '';
    return `${value}${unit || ''}`;
  };

  useEffect(() => {
    if (materialToEdit) {
      setName(materialToEdit.name);
      setDescription(materialToEdit.description || '');
      setUnitCost(materialToEdit.unitCost.toString());
      setUnitWeight(materialToEdit.unitWeight.toString());
      setUnit(materialToEdit.unit || 'kg');
      setCategoryId(materialToEdit.categoryId || categories[0]?.id || '');
      setComponents(materialToEdit.components.map(comp => {
        const rawLengthInput = formatDimensionForInput(comp.lengthValue, comp.lengthUnit);
        const rawDiameterInput = formatDimensionForInput(comp.diameterValue, comp.diameterUnit);
        const rawWidthInput = formatDimensionForInput(comp.widthValue, comp.widthUnit);
        return {
          ...comp,
          rawLengthInput,
          rawDiameterInput,
          rawWidthInput,
          id: comp.id || uuidv4(), // Garante que cada componente tenha um ID
        };
      }));
    } else {
      setName('');
      setDescription('');
      setUnitCost('');
      setUnitWeight('');
      setUnit('kg');
      setCategoryId('');
      setComponents([]);
    }
  }, [materialToEdit]);

  const handleAddComponent = () => {
    setComponents([...components, { id: uuidv4(), name: '', unitWeight: 0, unit: 'kg', unitCost: 0, rawLengthInput: '', lengthValue: undefined, lengthUnit: '', rawDiameterInput: '', diameterValue: undefined, diameterUnit: '', rawWidthInput: '', widthValue: undefined, widthUnit: '' }]);
  };

  const handleRemoveComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const handleComponentChange = (index: number, field: keyof ProductComponent, value: any) => {
    const updatedComponents = [...components];
    const currentComponent = { ...updatedComponents[index] };
    
    if (field === 'rawLengthInput') {
      currentComponent.rawLengthInput = value;
      const parsedLength = parseDimensionInput(value);
      currentComponent.lengthValue = parsedLength !== null ? parsedLength : undefined;
      console.log('[DEBUG] Parsed length:', { raw: value, parsed: parsedLength });
    }
    else if (field === 'rawDiameterInput') {
      currentComponent.rawDiameterInput = value;
      const parsedDiameter = parseDimensionInput(value);
      currentComponent.diameterValue = parsedDiameter !== null ? parsedDiameter : undefined;
      console.log('[DEBUG] Parsed diameter:', { raw: value, parsed: parsedDiameter });
    }
    else if (field === 'rawWidthInput') {
      currentComponent.rawWidthInput = value;
      const parsedWidth = parseDimensionInput(value);
      currentComponent.widthValue = parsedWidth !== null ? parsedWidth : undefined;
      console.log('[DEBUG] Parsed width:', { raw: value, parsed: parsedWidth });
    }
    else if (field === 'lengthUnit' || field === 'diameterUnit' || field === 'widthUnit') {
      currentComponent[field] = value as any; // Necessário devido à tipagem do TypeScript
    }
    else {
      (currentComponent as any)[field] = value;
    }
    
    console.log('[DEBUG] Updated component:', currentComponent);
    updatedComponents[index] = currentComponent;
    setComponents(updatedComponents);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newMaterial: Material = {
      id: materialToEdit ? materialToEdit.id : uuidv4(),
      name,
      description,
      categoryId,
      unitWeight: parseFloat(unitWeight),
      unit,
      unitCost: parseFloat(unitCost),
      components: components.map(comp => {
        // Log para debug
        console.log('[DEBUG] Processing component before save:', comp);
        
        const processedComponent = {
          id: comp.id,
          name: comp.name,
          unitWeight: parseFloat(comp.unitWeight.toString()),
          unit: comp.unit,
          unitCost: parseFloat(comp.unitCost.toString()),
          // Use os valores processados do parser
          lengthValue: parseDimensionInput(comp.rawLengthInput),
          lengthUnit: comp.lengthUnit,
          diameterValue: parseDimensionInput(comp.rawDiameterInput),
          diameterUnit: comp.diameterUnit,
          widthValue: parseDimensionInput(comp.rawWidthInput),
          widthUnit: comp.widthUnit,
          // Mantém os valores brutos para edição futura
          rawLengthInput: comp.rawLengthInput,
          rawDiameterInput: comp.rawDiameterInput,
          rawWidthInput: comp.rawWidthInput
        };
        
        // Log para debug
        console.log('[DEBUG] Processed component after save:', processedComponent);
        
        return processedComponent;
      })
    };
    onSave(newMaterial);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up">
      <div role="dialog" className="bg-surface dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in border border-gray-200 dark:border-slate-600 overflow-hidden">
        <div className="p-6 border-b border-surface-light dark:border-slate-600 bg-gradient-to-r from-primary/5 to-blue-500/5 dark:from-primary/10 dark:to-blue-500/10">
          <h3 className="text-2xl font-bold text-textPrimary dark:text-white flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-blue-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">{materialToEdit ? 'E' : 'A'}</span>
            </div>
            {materialToEdit ? 'Editar Material' : 'Adicionar Material'}
          </h3>
          <p className="text-textSecondary dark:text-slate-400 mt-2 text-sm">
            {materialToEdit ? 'Atualize as informações do material abaixo.' : 'Preencha os dados para criar um novo material.'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden" data-testid="material-form">
          <div className="p-4 overflow-y-auto flex-grow">
            {/* Campos principais do material */}
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-semibold text-textSecondary dark:text-slate-300 mb-2 flex items-center">
                <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                Nome do Material *
              </label>
              <input
                type="text"
                id="name"
                className="w-full px-4 py-3 border border-border dark:border-slate-600 rounded-lg bg-background dark:bg-slate-700 text-textPrimary dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:border-blue-500 transition-all duration-300 hover:shadow-lg"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite o nome do material"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-semibold text-textSecondary dark:text-slate-300 mb-2 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Descrição (Opcional)
              </label>
              <textarea
                id="description"
                rows={3}
                className="w-full px-4 py-3 border border-border dark:border-slate-600 rounded-lg bg-background dark:bg-slate-700 text-textPrimary dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:border-blue-500 transition-all duration-300 hover:shadow-lg resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Adicione uma descrição detalhada do material..."
              ></textarea>
            </div>
            <div className="mb-4">
              <label htmlFor="unitWeight" className="block text-sm font-medium text-textSecondary dark:text-slate-300 mb-1">Peso Unitário</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  id="unitWeight"
                  step="0.01"
                  className="flex-1 px-3 py-2 border border-border dark:border-slate-600 rounded-md bg-background dark:bg-slate-700 text-textPrimary dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={unitWeight}
                  onChange={(e) => setUnitWeight(e.target.value)}
                  required
                />
                <label htmlFor="unit" className="sr-only">Unidade de Peso</label>
                <select
                  id="unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as WeightUnit)}
                  className="w-24 px-3 py-2 border border-border dark:border-slate-600 rounded-md bg-background dark:bg-slate-700 text-textPrimary dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="unitCost" className="block text-sm font-medium text-textSecondary dark:text-slate-300 mb-1">Custo Unitário (R$)</label>
              <input
                type="number"
                id="unitCost"
                step="0.01"
                className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md bg-background dark:bg-slate-700 text-textPrimary dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="category" className="block text-sm font-medium text-textSecondary dark:text-slate-300 mb-1">Categoria</label>
              <select
                id="category"
                className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md bg-background dark:bg-slate-700 text-textPrimary dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                {categories.length === 0 ? (
                  <option value="">Nenhuma categoria disponível</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Campos de componentes */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-textPrimary dark:text-white mb-3">Componentes do Material</h4>
              {/* Single 'Adicionar Componente' button is rendered after the components list */}
              {components.map((component, index) => (
                <div key={component.id} className="mb-4 p-3 border border-border dark:border-slate-600 rounded-md bg-background dark:bg-slate-700">
                  <div className="flex justify-end mb-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveComponent(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remover
                    </button>
                  </div>
                  <div className="mb-2">
                    <label htmlFor={`component-name-${component.id}`} className="block text-sm font-medium text-textSecondary dark:text-slate-300 mb-1">Nome do Componente</label>
                    <input
                      type="text"
                      id={`component-name-${component.id}`}
                      value={component.name}
                      onChange={(e) => handleComponentChange(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md bg-background dark:bg-slate-700 text-textPrimary dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label htmlFor={`component-unitWeight-${component.id}`} className="block text-sm font-medium text-textSecondary dark:text-slate-300 mb-1">Peso Unitário</label>
                    <input
                      type="number"
                      id={`component-unitWeight-${component.id}`}
                      step="0.01"
                      value={component.unitWeight}
                      onChange={(e) => handleComponentChange(index, 'unitWeight', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md bg-background dark:bg-slate-700 text-textPrimary dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="mb-2">
                    <label htmlFor={`component-unit-${component.id}`} className="block text-sm font-medium text-textSecondary dark:text-slate-300 mb-1">Unidade de Peso</label>
                    <select
                      id={`component-unit-${component.id}`}
                      value={component.unit}
                      onChange={(e) => handleComponentChange(index, 'unit', e.target.value as WeightUnit)}
                      className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md bg-background dark:bg-slate-700 text-textPrimary dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                    </select>
                  </div>
                  <div className="mb-2">
                    <label htmlFor={`component-unitCost-${component.id}`} className="block text-sm font-medium text-textSecondary dark:text-slate-300 mb-1">Custo Unitário (R$)</label>
                    <input
                      type="number"
                      id={`component-unitCost-${component.id}`}
                      step="0.01"
                      value={component.unitCost}
                      onChange={(e) => handleComponentChange(index, 'unitCost', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md bg-background dark:bg-slate-700 text-textPrimary dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label htmlFor={`component-length-${component.id}`} className="block text-sm font-medium text-textSecondary dark:text-slate-300 mb-1">Comprimento</label>
                    <input
                      type="text" // Changed to text to allow for "1/2\"" input
                      id={`component-length-${component.id}`}
                      step="0.01"
                      value={component.rawLengthInput}
                      onChange={(e) => handleComponentChange(index, 'rawLengthInput', e.target.value)}
                      className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md bg-background dark:bg-slate-700 text-textPrimary dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="mb-2">
                    <label htmlFor={`component-length-unit-${component.id}`} className="block text-sm font-medium text-textSecondary dark:text-slate-300 mb-1">Unidade de Comprimento</label>
                    <select
                      id={`component-length-unit-${component.id}`}
                      value={component.lengthUnit}
                      onChange={(e) => handleComponentChange(index, 'lengthUnit', e.target.value as 'mm' | 'cm' | 'in' | '')}
                      className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md bg-background dark:bg-slate-700 text-textPrimary dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecionar</option>
                      <option value="mm">mm</option>
                      <option value="cm">cm</option>
                      <option value="in">in</option>
                    </select>
                  </div>
                  <div className="mb-2">
                    <label htmlFor={`component-diameter-${component.id}`} className="block text-sm font-medium text-textSecondary dark:text-slate-300 mb-1">Diâmetro</label>
                    <input
                      type="text" // Changed to text to allow for "1/2\"" input
                      id={`component-diameter-${component.id}`}
                      step="0.01"
                      value={component.rawDiameterInput}
                      onChange={(e) => handleComponentChange(index, 'rawDiameterInput', e.target.value)}
                      className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md bg-background dark:bg-slate-700 text-textPrimary dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="mb-2">
                    <label htmlFor={`component-diameter-unit-${component.id}`} className="block text-sm font-medium text-textSecondary dark:text-slate-300 mb-1">Unidade de Diâmetro</label>
                    <select
                      id={`component-diameter-unit-${component.id}`}
                      value={component.diameterUnit}
                      onChange={(e) => handleComponentChange(index, 'diameterUnit', e.target.value as 'mm' | 'in' | '')}
                      className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md bg-background dark:bg-slate-700 text-textPrimary dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecionar</option>
                      <option value="mm">mm</option>
                      <option value="in">in</option>
                    </select>
                  </div>
                  <div className="mb-2">
                    <label htmlFor={`component-width-${component.id}`} className="block text-sm font-medium text-textSecondary dark:text-slate-300 mb-1">Largura</label>
                    <input
                      type="text" // Changed to text to allow for "1/2\"" input
                      id={`component-width-${component.id}`}
                      step="0.01"
                      value={component.rawWidthInput}
                      onChange={(e) => handleComponentChange(index, 'rawWidthInput', e.target.value)}
                      className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md bg-background dark:bg-slate-700 text-textPrimary dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="mb-2">
                    <label htmlFor={`component-width-unit-${component.id}`} className="block text-sm font-medium text-textSecondary dark:text-slate-300 mb-1">Unidade de Largura</label>
                    <select
                      id={`component-width-unit-${component.id}`}
                      value={component.widthUnit}
                      onChange={(e) => handleComponentChange(index, 'widthUnit', e.target.value as 'mm' | 'cm' | 'in' | '')}
                      className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md bg-background dark:bg-slate-700 text-textPrimary dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecionar</option>
                      <option value="mm">mm</option>
                      <option value="cm">cm</option>
                      <option value="in">in</option>
                    </select>
                  </div>

                </div>
              ))}
              <button
                type="button"
                onClick={handleAddComponent}
                className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Adicionar Componente
              </button>
            </div>
          </div>
          <div className="p-6 border-t border-surface-light dark:border-slate-600 flex justify-end space-x-4 bg-gray-50 dark:bg-slate-700/50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-500 dark:bg-slate-600 text-white rounded-lg hover:bg-gray-600 dark:hover:bg-slate-500 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 font-medium shadow-lg hover:shadow-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-primary transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 font-medium shadow-lg hover:shadow-xl flex items-center group"
            >
              <span className="group-hover:scale-110 transition-transform duration-300">
                {materialToEdit ? '✓ Salvar Alterações' : '+ Criar Material'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
