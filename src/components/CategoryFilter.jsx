import React from 'react';
import useCategories from '../hooks/useCategories';
import LoadingSpinner from './LoadingSpinner';

const CategoryFilter = ({ selectedCategory, onCategoryChange }) => {
  const { categories, loading, error } = useCategories();

  if (loading) {
    return <div className="flex items-center justify-center py-4"><LoadingSpinner small /></div>;
  }

  if (error) {
    return <div className="text-red-500 text-sm py-2">Erreur lors du chargement des catégories</div>;
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex space-x-2">
        <button
          onClick={() => onCategoryChange(null)}
          className={`whitespace-nowrap px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            !selectedCategory
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Toutes
        </button>
          {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.name)}
            className={`whitespace-nowrap px-3 py-1 rounded-full text-sm font-medium flex items-center transition-colors ${
              selectedCategory === category.name
                ? category.color || 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.icon && (
              <span className="mr-1" role="img" aria-label={category.name}>
                {category.icon}
              </span>
            )}
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
