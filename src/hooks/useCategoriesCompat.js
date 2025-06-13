import { useEffect, useState } from 'react';
import { CATEGORIES } from '../lib/utils';
import useCategories from './useCategories';

/**
 * Hook pour obtenir les catégories avec rétrocompatibilité
 * Permet d'utiliser les catégories de la base de données tout en gardant
 * une compatibilité avec les anciennes parties de l'application qui utilisent
 * encore les catégories hardcodées
 */
export const useCategoriesCompat = () => {
  const { categories, loading, error } = useCategories();
  const [compatCategories, setCompatCategories] = useState(CATEGORIES);

  useEffect(() => {
    if (!loading && !error && categories.length > 0) {
      // Créer un tableau de catégories compatibles avec l'ancien format
      const newCompatCategories = categories.map(category => ({
        id: category.name,
        name: category.name,
        icon: category.icon || '',
        color: category.color || 'bg-gray-100 text-gray-700'
      }));
      
      setCompatCategories(newCompatCategories);
    }
  }, [categories, loading, error]);

  return { categories: compatCategories, loading, error };
};

export default useCategoriesCompat;
