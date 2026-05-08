import React from 'react';

export const MaterialFormModal = jest.fn(({ isOpen, onClose, onSave }) => {
  if (!isOpen) return null;
  return (
    <div role="dialog">
      <h2>Selecionar Material</h2>
      <button onClick={() => onSave({ id: 'M-1', name: 'Material A', categoryId: 'C-1', unit: 'm', components: [], unitCost: 100, unitWeight: 1 })}>
        Material A
      </button>
      <button onClick={onClose}>Close</button>
    </div>
  );
});