import { useToast } from '../hooks/useToast.jsx';
import { markErrorAsHandled, handleAuthSessionExpired } from '../lib/errorHandling.js';
import { captureException } from '../lib/sentry.js';
import { useNavigate } from 'react-router-dom';

const useErrorHandler = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const handleAPIError = (error, customMessage = null) => {
    // Ignorer les erreurs provenant d'extensions Chrome
    if (error && (error.stack?.includes('chrome-extension://') || error.originalError?.stack?.includes('chrome-extension://'))) {
      console.warn('Erreur provenant d\'une extension Chrome ignorée:', error);
      return { error: false, message: null, code: 'EXTENSION_ERROR', ignored: true };
    }
    
    // Marquer l'erreur comme traitée pour éviter la double notification
    markErrorAsHandled(error);
    
    // Message d'erreur par défaut
    let errorMessage = customMessage || "Une erreur s'est produite. Veuillez réessayer plus tard.";
    let errorCode = null;
    
    // Messages spécifiques basés sur le code d'erreur
    if (error?.status === 401 || error?.code === 'PGRST301') {
      errorMessage = "Votre session a expiré. Veuillez vous reconnecter.";
      errorCode = 'AUTH_SESSION_EXPIRED';
      handleAuthSessionExpired(navigate);
      // Correction : retourner la structure attendue pour les tests
      return { error: true, message: errorMessage, code: errorCode };
    } else if (error?.status === 403 || error?.code === 403 || error?.data?.code === 403 || error?.message === 'permission error') {
      errorMessage = "Vous n'avez pas les droits nécessaires pour effectuer cette action.";
      errorCode = 'AUTH_FORBIDDEN';
    } else if (error?.status === 404) {
      errorMessage = "La ressource demandée n'a pas été trouvée.";
      errorCode = 'RESOURCE_NOT_FOUND';
    } else if (error?.code === 'PGRST401') {
      errorMessage = "Erreur d'authentification. Veuillez vous reconnecter.";
      errorCode = 'AUTH_ERROR';
    } else if (error?.message) {
      // Utiliser le message d'erreur provenant de l'API si disponible
      errorMessage = error.message;
      errorCode = error.code || 'UNKNOWN_ERROR';
    }
    
    // Envoyer l'erreur à Sentry avec le contexte approprié
    captureException(error, {
      tags: { 
        errorType: 'api_error', 
        errorCode: errorCode || 'UNKNOWN_ERROR'
      },
      extra: { 
        customMessage,
        errorMessage 
      },
      level: 'error'
    });
    
    // Afficher un toast avec le message d'erreur
    showToast(errorMessage, 'error');
    
    return { error: true, message: errorMessage, code: errorCode };
  };
  return { handleAPIError };
};

export { useErrorHandler };
