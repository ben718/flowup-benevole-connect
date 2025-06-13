import { useState } from 'react';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';
import useCategories from '../hooks/useCategories';

const CategoryManager = () => {
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: '',
    color: 'bg-blue-100 text-blue-700',
    description: '',
    active: true
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewCategory({
      ...newCategory,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Vérifier si la catégorie existe déjà
      const existingCategory = categories.find(
        c => c.name.toLowerCase() === newCategory.name.toLowerCase()
      );
      
      if (existingCategory) {
        setMessage({
          text: 'Cette catégorie existe déjà !',
          type: 'error'
        });
        setSaving(false);
        return;
      }
      
      // Ajouter la nouvelle catégorie
      const { error } = await supabase
        .from('categories')
        .insert([newCategory]);
      
      if (error) throw error;
      
      setMessage({
        text: 'Catégorie ajoutée avec succès !',
        type: 'success'
      });
      
      // Réinitialiser le formulaire
      setNewCategory({
        name: '',
        icon: '',
        color: 'bg-blue-100 text-blue-700',
        description: '',
        active: true
      });
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la catégorie:', error);
      setMessage({
        text: `Erreur: ${error.message}`,
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Liste des couleurs prédéfinies
  const predefinedColors = [
    { name: 'Bleu', value: 'bg-blue-100 text-blue-700' },
    { name: 'Vert', value: 'bg-green-100 text-green-700' },
    { name: 'Rouge', value: 'bg-red-100 text-red-700' },
    { name: 'Jaune', value: 'bg-yellow-100 text-yellow-700' },
    { name: 'Violet', value: 'bg-purple-100 text-purple-700' },
    { name: 'Rose', value: 'bg-pink-100 text-pink-700' },
    { name: 'Orange', value: 'bg-orange-100 text-orange-700' },
    { name: 'Emeraude', value: 'bg-emerald-100 text-emerald-700' },
    { name: 'Cyan', value: 'bg-cyan-100 text-cyan-700' }
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-bold mb-4">Gestion des catégories</h2>
      
      {/* Liste des catégories existantes */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Catégories existantes</h3>
        {categoriesLoading ? (
          <LoadingSpinner small />
        ) : categoriesError ? (
          <p className="text-red-500">Erreur lors du chargement des catégories</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <div 
                key={category.id}
                className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${category.color}`}
              >
                {category.icon && (
                  <span className="mr-1" role="img" aria-label={category.name}>
                    {category.icon}
                  </span>
                )}
                {category.name}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Formulaire pour ajouter une nouvelle catégorie */}
      <form onSubmit={handleSubmit}>
        <h3 className="font-semibold mb-2">Ajouter une catégorie</h3>
        
        {message.text && (
          <div className={`p-3 mb-4 rounded-lg ${
            message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message.text}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de la catégorie *
            </label>
            <input
              type="text"
              name="name"
              value={newCategory.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emoji (icône) *
            </label>
            <input
              type="text"
              name="icon"
              value={newCategory.icon}
              onChange={handleChange}
              placeholder="Ex: 🍽️, 📚, 🏥, etc."
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Couleur *
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {predefinedColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`p-2 rounded-lg border ${
                    newCategory.color === color.value 
                      ? 'border-primary' 
                      : 'border-gray-200'
                  }`}
                  onClick={() => setNewCategory({ ...newCategory, color: color.value })}
                >
                  <div className={`py-1 px-2 rounded-full ${color.value} text-center`}>
                    {color.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={newCategory.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            ></textarea>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              name="active"
              id="active"
              checked={newCategory.active}
              onChange={handleChange}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
              Catégorie active
            </label>
          </div>
          
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary text-white py-2 rounded-lg font-medium flex items-center justify-center"
          >
            {saving ? (
              <>
                <LoadingSpinner small />
                <span className="ml-2">Enregistrement...</span>
              </>
            ) : (
              "Ajouter la catégorie"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CategoryManager;
