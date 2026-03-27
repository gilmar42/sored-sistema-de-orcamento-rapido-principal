import { useCallback } from 'react';
import type { Category } from '../types';
import { useData } from '../context/DataContext';

export const useCategories = () => {
  const { categories, setCategories } = useData();

  const addCategory = useCallback((category: Category) => {
    setCategories(prev => [...prev, category]);
  }, [setCategories]);

  const updateCategory = useCallback((category: Category) => {
    setCategories(prev => prev.map(c => (c.id === category.id ? { ...c, ...category } : c)));
  }, [setCategories]);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  }, [setCategories]);

  return {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
  };
};
