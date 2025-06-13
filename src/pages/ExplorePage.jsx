import { useState, useEffect, useContext } from 'react';
import { Search, Filter, MapPin, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthContext } from '../contexts/AuthContext';
import { useMissions } from '../hooks/useMissions';
import { getUserLocation } from '../lib/utils';
import LoadingSpinner from '../components/LoadingSpinner';
import MissionCard from '../components/MissionCard';
import BottomNavigation from '../components/BottomNavigation';
import CategoryFilter from '../components/CategoryFilter';
import useCategoryStyle from '../hooks/useCategoryStyle';

// Composant pour afficher une puce de catégorie avec le style approprié
const CategoryChip = ({ categoryName, onRemove }) => {
  const { categoryStyle, categoryIcon } = useCategoryStyle(categoryName);
  
  return (
    <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${categoryStyle}`}>
      {categoryIcon && (
        <span className="mr-1" role="img" aria-label={categoryName}>
          {categoryIcon}
        </span>
      )}
      <span>{categoryName}</span>
      <button
        className="ml-2 rounded-full hover:bg-white/20 p-1"
        onClick={onRemove}
      >
        <X size={14} />
      </button>
    </div>
  );
};

const ExplorePage = () => {
  const { userProfile } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    location: null,
    distance: userProfile?.max_distance || 15,
    category: null,
    date: new Date().toISOString().split('T')[0],
    dateEnd: null,
    durationMax: null,
    language: null
  });
  const [showFilters, setShowFilters] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Utiliser le hook useMissions pour récupérer les missions filtrées
  const { missions, loading, error, fetchMissions } = useMissions(filters);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const location = await getUserLocation();
        setFilters(prev => ({
          ...prev,
          location
        }));
      } catch (error) {
        console.error('Error getting user location:', error);
      }
    };
    
    const fetchCities = async () => {
      try {
        const { data, error } = await supabase
          .from('missions')
          .select('city')
          .eq('status', 'published')
          .order('city', { ascending: true });
        
        if (error) throw error;
        
        // Supprimer les doublons
        const uniqueCities = [...new Set(data.map(m => m.city))];
        setLocations(uniqueCities);
      } catch (error) {
        console.error('Error fetching cities:', error);
      }
    };
    
    fetchLocation().catch(console.error);
    fetchCities().catch(console.error);
  }, [userProfile]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Implémenter la recherche textuelle
    // On pourrait utiliser la recherche full-text de Supabase ici
    console.log('Searching for:', searchQuery);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      location: null,
      distance: userProfile?.max_distance || 15,
      category: null,
      date: new Date().toISOString().split('T')[0],
      dateEnd: null,
      durationMax: null,
      language: null
    });
  };

  return (
    <div className="bg-vs-gray-100 flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-vs-gray-800">Explorer</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              className="p-2 rounded-full hover:bg-vs-gray-100 transition-colors"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} className="text-vs-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 pb-20">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative mb-4">
          <input 
            type="text" 
            placeholder="Rechercher une mission..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-vs-gray-200 rounded-lg focus:ring-vs-blue-primary focus:border-vs-blue-primary transition duration-200"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-vs-gray-500" size={18} />
          <button 
            type="submit"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-vs-blue-primary text-white px-3 py-1 rounded-md text-sm"
          >
            Chercher
          </button>
        </form>

        {/* Map View (placeholder for now) */}
        <div className="mb-4 rounded-xl overflow-hidden shadow-sm">
          <div id="map" className="relative h-40 bg-vs-gray-200">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MapPin size={32} className="text-vs-blue-primary mx-auto" />
                <p className="mt-2 text-vs-gray-600">Carte des missions à proximité</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-4 bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-vs-gray-800">Filtres</h3>
              <button 
                className="text-vs-blue-primary text-sm hover:underline"
                onClick={resetFilters}
              >
                Réinitialiser
              </button>
            </div>
            
            <div className="space-y-4">              {/* Catégories */}              <div>
                <label className="block text-sm font-medium text-vs-gray-700 mb-2">Catégorie</label>
                <CategoryFilter 
                  selectedCategory={filters.category}
                  onCategoryChange={(category) => {
                    setFilters(prev => ({
                      ...prev,
                      category
                    }));
                  }}
                />
              </div>
              
              {/* Distance */}
              <div>
                <label className="block text-sm font-medium text-vs-gray-700 mb-2">
                  Distance max : {filters.distance} km
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={filters.distance}
                  onChange={(e) => handleFilterChange('distance', parseInt(e.target.value))}
                  className="w-full h-2 bg-vs-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              {/* Durée */}
              <div>
                <label className="block text-sm font-medium text-vs-gray-700 mb-2">Durée maximale</label>
                <select
                  value={filters.durationMax || ''}
                  onChange={(e) => handleFilterChange('durationMax', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-vs-gray-300 rounded-lg focus:ring-vs-blue-primary focus:border-vs-blue-primary"
                >
                  <option value="">Toutes les durées</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 heure</option>
                  <option value="120">2 heures</option>
                  <option value="240">4 heures</option>
                </select>
              </div>
              
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-vs-gray-700 mb-2">À partir de</label>
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) => handleFilterChange('date', e.target.value)}
                  className="w-full px-3 py-2 border border-vs-gray-300 rounded-lg focus:ring-vs-blue-primary focus:border-vs-blue-primary"
                />
              </div>
              
              {/* Lieu */}
              <div>
                <label className="block text-sm font-medium text-vs-gray-700 mb-2">Ville</label>
                <select
                  value={filters.city || ''}
                  onChange={(e) => handleFilterChange('city', e.target.value || null)}
                  className="w-full px-3 py-2 border border-vs-gray-300 rounded-lg focus:ring-vs-blue-primary focus:border-vs-blue-primary"
                >
                  <option value="">Toutes les villes</option>
                  {locations.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Appliquer les filtres */}
              <button
                className="w-full bg-vs-blue-primary text-white font-medium py-2 rounded-lg hover:bg-vs-blue-dark transition-colors"
                onClick={() => {
                  setShowFilters(false);
                  fetchMissions();
                }}
              >
                Appliquer les filtres
              </button>
            </div>
          </div>
        )}        {/* Filter Chips (catégories actives) */}
        {filters.category && (
          <div className="flex flex-wrap gap-2 mb-4">
            <CategoryChip 
              categoryName={filters.category} 
              onRemove={() => handleFilterChange('category', null)} 
            />
          </div>
        )}

        {/* Missions List */}
        <section>
          <h2 className="text-lg font-semibold text-vs-gray-800 mb-3">
            Missions à proximité
          </h2>
          
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <div className="text-vs-error text-center py-4">
              Une erreur est survenue lors du chargement des missions.
            </div>
          ) : missions.length === 0 ? (
            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
              <p className="text-vs-gray-600">
                Aucune mission ne correspond à vos critères.
              </p>
              <button
                className="mt-2 text-vs-blue-primary hover:underline"
                onClick={resetFilters}
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {missions.map((mission) => (
                <MissionCard key={mission.id} mission={mission} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default ExplorePage;
