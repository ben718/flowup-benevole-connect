import React, { useState, useEffect } from 'react';
import APIErrorFallback from './APIErrorFallback';

/**
 * HOC (Higher-Order Component) qui ajoute la gestion des erreurs API aux pages
 * @param {React.Component} WrappedComponent - Le composant à envelopper
 * @returns {React.Component} - Composant avec gestion d'erreur
 */
const withAPIErrorHandling = (WrappedComponent) => {
  // Retourne un nouveau composant
  return function WithAPIErrorHandling(props) {
    const [hasError, setHasError] = useState(false);
    const [error, setError] = useState(null);
    const [errorInfo, setErrorInfo] = useState(null);
    
    // Réinitialiser l'état d'erreur
    const resetError = () => {
      setHasError(false);
      setError(null);
      setErrorInfo(null);
    };

    // Intercepter les erreurs de permissions spécifiques
    useEffect(() => {
      // Fonction pour intercepter les erreurs d'extension et d'autorisation
      const handleGlobalError = (event) => {
        // Vérifier si c'est une erreur de permission ou d'extension Chrome
        if (
          (event.error?.message?.includes('permission error') || 
           event.message?.includes('permission error')) ||
          (event.error?.stack?.includes('chrome-extension://') || 
           event.filename?.includes('chrome-extension://'))
        ) {
          // Capturer l'erreur
          setHasError(true);
          setError(event.error || new Error(event.message));
          setErrorInfo({
            message: event.message,
            source: event.filename,
            lineno: event.lineno,
            colno: event.colno
          });
          
          // Empêcher la propagation
          event.preventDefault();
          if (event.stopImmediatePropagation) {
            event.stopImmediatePropagation();
          }
        }
      };
      
      // Écouter les erreurs globales
      window.addEventListener('error', handleGlobalError);
      
      // Nettoyage
      return () => {
        window.removeEventListener('error', handleGlobalError);
      };
    }, []);
    
    // Afficher un composant de repli en cas d'erreur
    if (hasError) {
      return <APIErrorFallback error={error} resetError={resetError} />;
    }
    
    // Passer la fonction resetError au composant enveloppé pour qu'il puisse l'utiliser
    return <WrappedComponent {...props} resetAPIError={resetError} />;
  };
};

export default withAPIErrorHandling;
