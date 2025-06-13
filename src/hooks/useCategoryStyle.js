import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { safeSupabaseCall } from '../lib/errorHandling';

/**
 * A custom hook to fetch a category's style (color and icon) from Supabase
 * @param {string} categoryName - The name of the category
 * @returns {Object} An object containing the category style and loading state
 */
export const useCategoryStyle = (categoryName) => {
  const [categoryStyle, setCategoryStyle] = useState('border-gray-300 bg-gray-100');
  const [categoryIcon, setCategoryIcon] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategoryStyle = async () => {
      if (!categoryName) {
        setLoading(false);
        return;
      }      try {
        setLoading(true);
        setError(null);
        
        const [error, data] = await safeSupabaseCall(
          supabase
            .from('categories')
            .select('color, icon')
            .eq('name', categoryName)
            .single(),
          `récupération du style pour la catégorie ${categoryName}`
        );
        
        if (error) {
          setError(error.message);
          // Utiliser un style par défaut en cas d'erreur
          setCategoryStyle('border-gray-300 bg-gray-100');
          return;
        }
        
        if (data) {
          setCategoryStyle(data.color || 'border-gray-300 bg-gray-100');
          setCategoryIcon(data.icon || '');
        }      } catch (err) {
        // Utiliser des valeurs par défaut en cas d'erreur
        setCategoryStyle('border-gray-300 bg-gray-100');
        setError(`Erreur inattendue: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategoryStyle();
  }, [categoryName]);

  return { categoryStyle, categoryIcon, loading, error };
};

export default useCategoryStyle;
