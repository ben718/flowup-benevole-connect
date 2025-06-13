import React, { useState, useEffect } from 'react';

export const LoadingSpinner = ({ size = 'medium', fullScreen = false, text = 'Chargement...', timeout = 15000 }) => {
  const [isTimedOut, setIsTimedOut] = useState(false);

  useEffect(() => {
    // Configurer un délai d'expiration pour les chargements trop longs
    if (fullScreen) {
      const timeoutId = setTimeout(() => {
        setIsTimedOut(true);
      }, timeout);
      
      return () => clearTimeout(timeoutId);
    }
  }, [fullScreen, timeout]);

  const sizeClasses = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-2',
    large: 'h-12 w-12 border-3',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-white/80 z-50'
    : 'flex items-center justify-center py-4';
    
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center">
        <div
          className={`${sizeClasses[size]} rounded-full border-vs-gray-300 border-t-vs-blue-primary animate-spin`}
        ></div>
        {text && fullScreen && !isTimedOut && <p className="mt-4 text-vs-gray-700">{text}</p>}
        
        {/* Afficher un message et un bouton de récupération après le délai d'expiration */}
        {isTimedOut && fullScreen && (
          <div className="mt-4 flex flex-col items-center">
            <p className="text-vs-gray-700 mb-2">Le chargement prend plus de temps que prévu.</p>
            <button 
              onClick={handleRetry}
              className="px-4 py-2 bg-vs-blue-primary text-white rounded-lg hover:bg-vs-blue-dark transition duration-200"
            >
              Actualiser la page
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Composant FullPageLoader pour les transitions de page
export const FullPageLoader = ({ message, timeout = 15000 }) => {
  const [isTimedOut, setIsTimedOut] = useState(false);

  useEffect(() => {
    // Configurer un délai d'expiration pour les chargements trop longs
    const timeoutId = setTimeout(() => {
      setIsTimedOut(true);
    }, timeout);
    
    return () => clearTimeout(timeoutId);
  }, [timeout]);
  
  const handleRetry = () => {
    window.location.reload();
  };

  return (
  <div className="fixed inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
      {!isTimedOut ? (
        <>
          <div className="w-16 h-16 border-4 border-vs-gray-200 border-t-4 border-t-vs-blue-primary rounded-full animate-spin mb-4"></div>
          <p className="text-vs-gray-800 font-medium text-center">{message || 'Chargement en cours...'}</p>
        </>
      ) : (
        <>
          <svg className="w-12 h-12 text-vs-error mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-vs-gray-800 font-medium text-center mb-4">Le chargement prend plus de temps que prévu.</p>
          <button 
            onClick={handleRetry}
            className="px-4 py-2 bg-vs-blue-primary text-white rounded-lg hover:bg-vs-blue-dark transition duration-200"
          >
            Actualiser la page
          </button>
        </>
      )}
    </div>
  </div>
);
};

export default LoadingSpinner;
