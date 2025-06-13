import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ErrorFallback = ({ error, resetErrorBoundary, showDetails = false }) => {
  const navigate = useNavigate();
  const [showErrorDetails, setShowErrorDetails] = useState(showDetails);

  // Adapter le message en fonction du type d'erreur
  const getErrorMessage = () => {
    if (error?.message?.includes('network') || error?.message?.includes('connexion')) {
      return "Problème de connexion internet. Vérifiez votre réseau et réessayez.";
    } else if (error?.message?.includes('timeout') || error?.message?.includes('délai')) {
      return "Le serveur met trop de temps à répondre. Veuillez réessayer plus tard.";
    } else if (error?.status === 404 || error?.message?.includes('not found')) {
      return "La ressource demandée n'a pas pu être trouvée.";
    }
    return "Nous n'avons pas pu charger les données nécessaires. Veuillez réessayer.";
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-vs-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center">
        <div className="mb-6">
          <svg 
            className="w-16 h-16 mx-auto text-vs-error" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        
        <h1 className="text-xl font-bold text-vs-gray-800 mb-2">Erreur de chargement</h1>
        <p className="text-vs-gray-600 mb-6">
          {getErrorMessage()}
        </p>
        
        <div className="flex flex-col space-y-3">
          <button
            onClick={() => {
              if (resetErrorBoundary) {
                resetErrorBoundary();
              } else {
                window.location.reload();
              }
            }}
            className="flex items-center justify-center px-4 py-2 bg-vs-blue-primary text-white rounded-lg hover:bg-vs-blue-dark transition duration-200"
          >
            Réessayer
          </button>
          
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center px-4 py-2 border border-vs-gray-300 text-vs-gray-700 rounded-lg hover:bg-vs-gray-100 transition duration-200"
          >
            Retour à la page précédente
          </button>
          
          <button
            onClick={() => setShowErrorDetails(!showErrorDetails)}
            className="text-vs-blue-primary hover:underline text-sm mt-2"
          >
            {showErrorDetails ? "Masquer les détails" : "Afficher les détails techniques"}
          </button>
        </div>
        
        {showErrorDetails && error && (
          <div className="mt-4 p-3 bg-vs-gray-100 rounded-lg text-left overflow-auto max-h-48">
            <p className="font-mono text-xs text-vs-gray-800">
              {error.toString()}
            </p>
            {error.stack && (
              <p className="font-mono text-xs text-vs-gray-600 mt-2 whitespace-pre-wrap">
                {error.stack.split('\n').slice(0, 3).join('\n')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorFallback;
