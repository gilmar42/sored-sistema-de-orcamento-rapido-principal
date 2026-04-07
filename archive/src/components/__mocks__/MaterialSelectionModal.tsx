import React from 'react';

export const MaterialSelectionModal = jest.fn(({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;
  return (
    <div>
      <h2>Selecionar Material</h2>
      <button onClick={() => onSelect({ id: 'M-1', name: 'Material A', description: 'Description A', categoryId: 'CAT-1', unitCost: 10, unitWeight: 1, components: [], unit: 'kg', diameterValue: 10, diameterUnit: 'mm', lengthValue: 100, lengthUnit: 'mm', widthValue: 50, widthUnit: 'mm' })}>Material A</button>
      <button onClick={() => onSelect({ id: 'M-2', name: 'Material B', description: 'Description B', categoryId: 'CAT-2', unitCost: 20, unitWeight: 2, components: [], unit: 'kg', diameterValue: 20, diameterUnit: 'mm', lengthValue: 200, lengthUnit: 'mm', widthValue: 100, widthUnit: 'mm' })}>Material B</button>
      <button onClick={onClose}>Close</button>
    </div>
  );
});