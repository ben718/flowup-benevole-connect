/**
 * Utilitaire pour gérer les promesses de manière plus sécurisée
 * en capturant et loggant les erreurs de manière cohérente
 */
import { captureException, captureMessage } from './sentry.js';

/**
 * Enveloppe une promesse pour s'assurer que les erreurs sont traitées
 * @param {Promise} promise - La promesse à exécuter
 * @param {string} errorContext - Contexte pour identifier l'origine de l'erreur
 * @returns {Promise<[Error, null]|[null, any]>} - Tuple avec [erreur, résultat]
 */
export const safePromise = async (promise, errorContext = 'opération') => {
  try {
    const data = await promise;
    return [null, data];
  } catch (error) {
    console.error(`Erreur lors de ${errorContext}:`, error);
    captureException(error, {
      tags: { errorContext },
      level: 'error'
    });
    return [error, null];
  }
};

/**
 * Enveloppe une fonction qui renvoie une promesse pour assurer la gestion des erreurs
 * @param {Function} fn - La fonction à envelopper
 * @param {string} errorContext - Contexte pour identifier l'origine de l'erreur
 * @returns {Function} - Fonction enveloppée qui gère les erreurs
 */
export const createSafeAsyncHandler = (fn, errorContext) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(`Erreur dans ${errorContext}:`, error);
      captureException(error, {
        tags: { errorContext },
        extra: { arguments: JSON.stringify(args) },
        level: 'error'
      });
      throw error; // Re-throw pour permettre à l'appelant de gérer l'erreur s'il le souhaite
    }
  };
};

/**
 * Utilitaire pour faciliter l'utilisation des appels API Supabase
 * @param {Promise} supabasePromise - Promesse issue d'un appel Supabase
 * @param {string} context - Contexte de l'opération
 * @returns {Promise<[Error, null]|[null, any]>} - Résultat formaté
 */
export const safeSupabaseCall = async (supabasePromise, context = 'requête Supabase') => {
  try {
    const { data, error } = await supabasePromise;
    
    if (error) {
      console.error(`Erreur Supabase (${context}):`, error);
      captureException(error, {
        tags: { 
          errorContext: context,
          errorType: 'supabase_error'
        },
        level: 'error'
      });
      return [error, null];
    }
    
    return [null, data];
  } catch (error) {
    console.error(`Exception non gérée dans ${context}:`, error);
    captureException(error, {
      tags: { 
        errorContext: context,
        errorType: 'unhandled_exception'
      },
      level: 'error'
    });
    return [error, null];
  }
};

/**
 * Fonction pour attacher des gestionnaires d'erreurs globaux
 * pour attraper les erreurs non gérées
 */
export const setupGlobalErrorHandlers = () => {
  // Liste des patterns d'erreurs à ignorer
  window.__ignoreErrors = window.__ignoreErrors || [
    'ignored-error',
    'chrome-extension://',
    'permission error',
    'ofpnmcalabcbjgholdjcjblkibolbppb' // ID d'extension Chrome qui pose problème
  ];
  
  // Gestionnaire pour les erreurs de promesses non gérées
  window.addEventListener('unhandledrejection', (event) => {
    // Vérifier si l'erreur doit être ignorée (extensions navigateur, etc.)
    const errorStr = String(event.reason?.message || event.reason || '');
    const errorStack = String(event.reason?.stack || '');
    const shouldIgnore = (window.__ignoreErrors || []).some(pattern => 
      errorStr.includes(pattern) || errorStack.includes(pattern)
    );
    if (shouldIgnore) {
      console.warn('Ignoring whitelisted error pattern:', errorStr.substring(0, 100));
      event.preventDefault(); // On peut empêcher l'affichage dans la console pour ces erreurs ignorées
      if (event.stopImmediatePropagation) {
        event.stopImmediatePropagation();
      }
      return;
    }
    
    console.error('Promesse non gérée:', event.reason);
    
    // Envoyer l'erreur à Sentry
    captureException(event.reason, {
      tags: { 
        errorType: 'unhandled_promise_rejection',
        reasonType: typeof event.reason,
        hasMessage: event.reason && !!event.reason.message
      },
      level: 'error'
    });
    
    // Empêcher l'affichage de l'erreur dans la console uniquement en environnement de production
    if (process.env.NODE_ENV === 'production') {
      event.preventDefault();
      if (event.stopImmediatePropagation) {
        event.stopImmediatePropagation();
      }
    }
  });// Gestionnaire pour les erreurs JavaScript générales
  window.addEventListener('error', (event) => {    // Vérifier si l'erreur doit être ignorée (extensions navigateur, etc.)
    const errorMsg = event.message || '';
    const errorSrc = event.filename || '';
    const errorStack = event.error?.stack || '';
    const shouldIgnore = (window.__ignoreErrors || []).some(pattern => 
      errorMsg.includes(pattern) || errorSrc.includes(pattern) || errorStack.includes(pattern)
    );
    
    if (shouldIgnore) {
      console.warn('Ignoring whitelisted error:', errorMsg.substring(0, 100));
      event.preventDefault(); // On peut empêcher l'affichage dans la console pour ces erreurs ignorées
      if (event.stopImmediatePropagation) {
        event.stopImmediatePropagation();
      }
      return;
    }
      console.error('Erreur globale:', event.error || event.message);
    
    // Envoyer l'erreur à Sentry si elle n'est pas déjà marquée comme traitée
    if (!event.error?._handled) {
      captureException(event.error || new Error(event.message), {
        tags: { 
          errorType: 'global_error',
          sourceFile: event.filename,
          lineNumber: event.lineno,
          columnNumber: event.colno
        },
        level: 'error'
      });
    }
    
    // Prévenir la propagation des erreurs pour éviter les erreurs non gérées
    event.preventDefault();
    if (event.stopImmediatePropagation) {
      event.stopImmediatePropagation();
    }
  });
  
  // Log de démarrage de l'application (utile pour suivre les sessions)
  captureMessage('Application démarrée', { 
    level: 'info',
    tags: { event: 'app_start' }
  });
};

// Exporter une fonction pratique pour marquer les erreurs comme traitées
export const markErrorAsHandled = (error) => {
  if (error) {
    error._handled = true;
  }
  return error;
};

/**
 * Gère l'expiration de la session utilisateur
 * Affiche un message et redirige vers la page de login
 * @param {Function} navigate - Fonction de navigation (ex: react-router)
 */
export const handleAuthSessionExpired = (navigate) => {
  // Affiche un message et redirige vers la page de login
  alert("Votre session a expiré. Veuillez vous reconnecter.");
  navigate('/login', { replace: true, state: { sessionExpired: true } });
};
