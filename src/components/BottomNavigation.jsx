import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Calendar, User } from 'lucide-react';

export const BottomNavigation = () => {
  const location = useLocation();
  const [activeItem, setActiveItem] = useState(location.pathname);

  // Mettre à jour l'élément actif lorsque la location change
  useState(() => {
    setActiveItem(location.pathname);
  }, [location]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-vs-gray-200 z-10">
      <div className="flex items-center justify-around py-2">
        <Link 
          to="/home" 
          className={`flex flex-col items-center p-2 ${activeItem === '/home' ? 'text-vs-blue-primary' : 'text-vs-gray-500'}`}
          onClick={() => setActiveItem('/home')}
        >
          <Home size={24} />
          <span className="text-xs mt-1">Accueil</span>
        </Link>
        
        <Link 
          to="/explore" 
          className={`flex flex-col items-center p-2 ${activeItem === '/explore' ? 'text-vs-blue-primary' : 'text-vs-gray-500'}`}
          onClick={() => setActiveItem('/explore')}
        >
          <Search size={24} />
          <span className="text-xs mt-1">Explorer</span>
        </Link>
        
        <Link 
          to="/missions" 
          className={`flex flex-col items-center p-2 ${activeItem === '/missions' ? 'text-vs-blue-primary' : 'text-vs-gray-500'}`}
          onClick={() => setActiveItem('/missions')}
        >
          <Calendar size={24} />
          <span className="text-xs mt-1">Missions</span>
        </Link>
        
        <Link 
          to="/profile" 
          className={`flex flex-col items-center p-2 ${activeItem === '/profile' ? 'text-vs-blue-primary' : 'text-vs-gray-500'}`}
          onClick={() => setActiveItem('/profile')}
        >
          <User size={24} />
          <span className="text-xs mt-1">Profil</span>
        </Link>
      </div>
    </div>
  );
};

export default BottomNavigation;
