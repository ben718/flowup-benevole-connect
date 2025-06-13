import React from 'react';

/**
 * Composant pour afficher un message d'erreur
 * @param {Object} props
 * @param {string} props.message - Le message d'erreur à afficher
 * @param {Function} props.onDismiss - Fonction à appeler pour fermer le message
 * @returns {JSX.Element|null}
 */
const ErrorMessage = ({ message, onDismiss }) => {
  if (!message) return null;
  
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4 relative">
      <span className="block sm:inline">{message}</span>
      {onDismiss && (
        <button 
          onClick={onDismiss} 
          className="absolute top-0 bottom-0 right-0 px-4 py-3"
          aria-label="Fermer"
        >
          <span className="text-red-500 font-bold">×</span>
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
