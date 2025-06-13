import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Composant de repli pour les erreurs d'API
 * Affiche un message d'erreur adapté et des options de récupération
 */
const APIErrorFallback = ({ error, resetError, customMessage }) => {
  // Déterminer le type d'erreur
  const isPermissionError = error?.status === 403 || 
                           error?.code === 403 || 
                           error?.data?.code === 403 || 
                           error?.message?.includes('permission error');
  
  const isAuthError = error?.status === 401 || 
                     error?.code === 'PGRST301' || 
                     error?.code === 'PGRST401';
  
  const isExtensionError = error?.stack?.includes('chrome-extension://') || 
                          error?.originalError?.stack?.includes('chrome-extension://');
  
  // Déterminer le message d'erreur à afficher
  let errorTitle = "Une erreur s'est produite";
  let errorMessage = customMessage || "Nous n'avons pas pu charger les données. Veuillez réessayer.";
  
  if (isPermissionError) {
    errorTitle = "Vous n'avez pas les droits nécessaires";
    errorMessage = "Vous n'avez pas les autorisations requises pour accéder à cette ressource.";
  } else if (isAuthError) {
    errorTitle = "Session expirée";
    errorMessage = "Votre session a expiré. Veuillez vous reconnecter.";
  } else if (isExtensionError) {
    errorTitle = "Erreur d'extension navigateur";
    errorMessage = "Une extension de votre navigateur interfère avec le site. Essayez de désactiver vos extensions ou d'utiliser le mode navigation privée.";
  }
  
  return (
    <div className="py-8 px-4 mx-auto max-w-lg text-center">
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="mb-6">
          {isExtensionError ? (
            <svg className="w-16 h-16 mx-auto text-vs-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-16 h-16 mx-auto text-vs-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        
        <h2 className="text-xl font-semibold text-vs-gray-800 mb-2">{errorTitle}</h2>
        <p className="text-vs-gray-600 mb-6">{errorMessage}</p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          {resetError && (
            <button
              onClick={resetError}
              className="px-4 py-2 bg-vs-blue-primary text-white rounded-lg hover:bg-vs-blue-dark transition duration-200"
            >
              Réessayer
            </button>
          )}
          
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-vs-blue-primary text-vs-blue-primary rounded-lg hover:bg-vs-blue-50 transition duration-200"
          >
            Actualiser la page
          </button>
          
          {isAuthError && (
            <Link
              to="/login"
              className="px-4 py-2 bg-vs-blue-primary text-white rounded-lg hover:bg-vs-blue-dark transition duration-200"
            >
              Se reconnecter
            </Link>
          )}
          
          <Link
            to="/home"
            className="px-4 py-2 border border-vs-gray-300 text-vs-gray-700 rounded-lg hover:bg-vs-gray-100 transition duration-200"
          >
            Retour à l'accueil
          </Link>
        </div>
        
        {isExtensionError && (
          <div className="mt-6 p-4 bg-vs-gray-100 rounded-lg text-left text-sm">
            <p className="font-medium mb-2">Conseils pour résoudre le problème :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Désactivez temporairement vos extensions de navigateur</li>
              <li>Essayez d'utiliser le mode navigation privée/incognito</li>
              <li>Videz le cache de votre navigateur</li>
              <li>Essayez un autre navigateur</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default APIErrorFallback;
