import { useState, useCallback } from 'react';
import { useErrorHandler } from './useErrorHandler';
import { safePromise } from '../lib/errorHandling';

export const useAsyncOperation = (initialLoading = false) => {
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const { handleAPIError } = useErrorHandler();

  const execute = useCallback(
    async (asyncFunction, customErrorMessage = null, operationContext = 'opération') => {
      setLoading(true);
      setError(null);
      setErrorDetails(null);

      const [err, result] = await safePromise(asyncFunction(), operationContext);
      
      setLoading(false);      
      if (err) {
        // Vérifier si l'erreur vient d'une extension Chrome
        if (err?.stack?.includes('chrome-extension://') || 
            err?.originalError?.stack?.includes('chrome-extension://')) {
          console.warn('Erreur provenant d\'une extension Chrome ignorée:', err);
          setErrorDetails({
            isExtensionError: true,
            originalError: err
          });
          // Ne pas afficher de toast pour les erreurs d'extensions
          return { 
            error: true, 
            isExtensionError: true,
            message: "Une extension de votre navigateur interfère avec le site."
          };
        }
        
        const errorResult = handleAPIError(err, customErrorMessage);
        
        // Ne pas définir d'état d'erreur si l'erreur provient d'une extension et est ignorée
        if (!errorResult.ignored) {
          setError(errorResult.message);
          setErrorDetails({
            ...errorResult,
            originalError: err
          });
          return { error: true, message: errorResult.message, code: errorResult.code, details: err };
        }
        
        // Pour les erreurs d'extensions ignorées, retourner un résultat neutre
        return { error: false, message: null };
      }
      
      return result;
    },
    [handleAPIError]
  );
  
  const resetError = useCallback(() => {
    setError(null);
    setErrorDetails(null);
  }, []);

  return { 
    loading, 
    error, 
    errorDetails,
    execute, 
    setError,
    resetError
  };
};

export default useAsyncOperation;
