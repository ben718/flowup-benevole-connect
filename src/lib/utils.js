/**
 * Utilitaires pour l'application Voisin Solidaire
 */

// Fonction pour formater une date au format français
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }).format(date);
};

// Fonction pour formater une heure au format HH:MM
export const formatTime = (timeString) => {
  if (!timeString) return '';
  
  // Format: "HH:MM:SS" to "HH:MM"
  return timeString.substring(0, 5);
};

// Fonction pour calculer la distance entre deux points géographiques (en km)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  
  const R = 6371; // Rayon de la Terre en km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance en km
  
  return Math.round(distance * 10) / 10; // Arrondi à 1 décimale
};

const deg2rad = (deg) => {
  return deg * (Math.PI/180);
};

// Fonction pour obtenir l'adresse actuelle de l'utilisateur via l'API de géolocalisation
export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La géolocalisation n\'est pas prise en charge par votre navigateur.'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      error => {
        reject(error);
      }
    );
  });
};

// Fonction pour tronquer un texte à une longueur maximale
export const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
};

// Fonction pour obtenir les initiales d'un nom
export const getInitials = (name) => {
  if (!name) return '';
  
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Fonction pour générer une couleur aléatoire mais cohérente à partir d'une chaîne
export const stringToColor = (str) => {
  if (!str) return '#3B82F6'; // Couleur par défaut
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Orange
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F43F5E', // Rose
  ];
  
  return colors[Math.abs(hash) % colors.length];
};

// Les catégories sont maintenant entièrement gérées par la base de données
// Ce tableau existe pour la compatibilité avec le code existant
// et sera utilisé comme fallback si la base de données n'est pas disponible
export const CATEGORIES = [
  { id: 'Aide aux courses', name: 'Aide aux courses', icon: '🛒', color: 'bg-vs-blue-primary text-white' },
  { id: 'Transport', name: 'Transport', icon: '🚗', color: 'bg-vs-green-secondary text-white' },
  { id: 'Compagnie', name: 'Compagnie', icon: '👋', color: 'bg-vs-orange-accent text-white' },
  { id: 'Bricolage', name: 'Bricolage', icon: '🔨', color: 'bg-purple-500 text-white' },
  { id: 'Jardinage', name: 'Jardinage', icon: '🌱', color: 'bg-green-600 text-white' },
  { id: 'Informatique', name: 'Informatique', icon: '💻', color: 'bg-blue-600 text-white' },
  { id: 'Autre', name: 'Autre', icon: '📋', color: 'bg-gray-600 text-white' }
];

// Fonction qui récupère les informations d'une catégorie depuis la liste
// complète des catégories chargées depuis la base de données
export const getCategoryInfo = (categoryName, allCategories) => {
  // Si on a la liste complète des catégories de la base de données, on l'utilise
  if (allCategories && allCategories.length > 0) {
    const category = allCategories.find(c => c.name === categoryName);
    if (category) {
      return {
        id: category.id,
        name: category.name,
        icon: category.icon || '',
        color: category.color || 'bg-gray-100 text-gray-700'
      };
    }
  }
  
  // Valeur par défaut si la catégorie n'est pas trouvée
  return {
    id: categoryName,
    name: categoryName,
    icon: '📋',
    color: 'bg-gray-100 text-gray-700'
  };
};

// Fonction avancée pour la géolocalisation par adresse (utilisant une API externe)
export const geocodeAddress = async (address, city, postalCode) => {
  try {
    // Construire l'adresse complète
    const fullAddress = `${address}, ${postalCode} ${city}, France`;
    
    // Utiliser l'API Nominatim (OpenStreetMap) pour la géolocalisation - gratuite et sans clé API
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`);
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        success: true
      };
    } else {
      console.error('No results found for address:', fullAddress);
      return { success: false, error: 'Adresse non trouvée' };
    }
  } catch (error) {
    console.error('Error geocoding address:', error);
    return { success: false, error: error.message };
  }
};

// Fonction pour tester si la géolocalisation du navigateur est disponible
export const isGeolocationAvailable = () => {
  return 'geolocation' in navigator;
};

// Fonction pour demander la position de l'utilisateur avec plus d'options
export const requestUserLocation = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (!isGeolocationAvailable()) {
      reject(new Error('La géolocalisation n\'est pas prise en charge par votre navigateur.'));
      return;
    }
    
    const defaultOptions = {
      enableHighAccuracy: true, // Meilleure précision (peut consommer plus de batterie)
      timeout: 10000,          // 10 seconds
      maximumAge: 300000       // Cache position pendant 5 minutes
    };
    
    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      error => {
        let errorMessage = 'Erreur inconnue';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'L\'utilisateur a refusé la demande de géolocalisation.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Les informations de localisation ne sont pas disponibles.';
            break;
          case error.TIMEOUT:
            errorMessage = 'La demande de localisation a expiré.';
            break;
        }
        
        reject(new Error(errorMessage));
      },
      { ...defaultOptions, ...options }
    );
  });
};
