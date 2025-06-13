// filepath: c:\Users\b.mvouama\Downloads\siteweb\voisin-solidaire\src\hooks\useCategories.js
import { useEffect, useState } from 'react';
import { supabase, checkSupabaseConnection } from '../lib/supabase';
import { safeSupabaseCall, safePromise } from '../lib/errorHandling';

// Catégories par défaut à utiliser en cas d'échec de chargement
const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Aide aux courses', icon: '🛒', color: 'bg-vs-blue-primary text-white', active: true },
  { id: 2, name: 'Transport', icon: '🚗', color: 'bg-vs-green-secondary text-white', active: true },
  { id: 3, name: 'Compagnie', icon: '👋', color: 'bg-vs-orange-accent text-white', active: true },
  { id: 4, name: 'Bricolage', icon: '🔨', color: 'bg-purple-500 text-white', active: true },
  { id: 5, name: 'Jardinage', icon: '🌱', color: 'bg-green-600 text-white', active: true },
  { id: 6, name: 'Informatique', icon: '💻', color: 'bg-blue-600 text-white', active: true },
  { id: 7, name: 'Autre', icon: '📋', color: 'bg-gray-600 text-white', active: true }
];

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        
        // Vérifier la connexion réseau avant de faire l'appel
        if (!navigator.onLine) {
          setCategories(DEFAULT_CATEGORIES);
          setError("Pas de connexion Internet. Utilisation des catégories par défaut.");
          return;
        }
        
        // Vérifier d'abord la connexion à Supabase
        const [connectionError, connectionStatus] = await safePromise(
          checkSupabaseConnection('categories'),
          'vérification de la connexion à Supabase'
        );
        
        if (connectionError || !connectionStatus?.connected) {
          setCategories(DEFAULT_CATEGORIES);
          setError(`Problème de connexion à Supabase. Utilisation des catégories par défaut. (${connectionError?.message || connectionStatus?.error || 'Erreur inconnue'})`);
          return;
        }
        
        // Ajouter un timeout pour éviter les attentes infinies
        const [timeoutOrQueryError, data] = await safePromise(
          Promise.race([
            safeSupabaseCall(
              supabase
                .from('categories')
                .select('*')
                .eq('active', true)
                .order('name', { ascending: true }),
              'récupération des catégories'
            ).then(([error, data]) => {
              if (error) throw error;
              return data;
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Délai d'attente dépassé lors du chargement des catégories")), 15000)
            )
          ]),
          'récupération des catégories avec timeout'
        );
        
        if (timeoutOrQueryError) {
          console.warn('Erreur lors du chargement des catégories, utilisation des valeurs par défaut:', timeoutOrQueryError);
          setCategories(DEFAULT_CATEGORIES);
          setError(`Impossible de charger les catégories: ${timeoutOrQueryError.message}`);
        } else {
          setCategories(data.length ? data : DEFAULT_CATEGORIES);
          setError(null);
        }
      } catch (err) {
        console.error('Erreur non gérée lors du chargement des catégories:', err);
        setCategories(DEFAULT_CATEGORIES);
        setError(`Erreur inattendue: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories().catch(console.error);
  }, []);

  const getCategoryById = (id) => {
    const category = categories.find(cat => cat.id === id);
    return category || categories.find(cat => cat.name === 'Autre') || categories[0];
  };

  const getCategoryByName = (name) => {
    const category = categories.find(cat => cat.name.toLowerCase() === name.toLowerCase());
    return category || categories.find(cat => cat.name === 'Autre') || categories[0];
  };

  return { 
    categories, 
    loading, 
    error, 
    getCategoryById,
    getCategoryByName
  };
};

export default useCategories;
