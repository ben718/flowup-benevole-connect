import * as Sentry from '@sentry/react';

// Variable globale pour vérifier si Sentry est activé
let SENTRY_ENABLED = false;

/**
 * Initialise Sentry pour le suivi des erreurs
 * @param {Object} options - Options supplémentaires pour la configuration de Sentry
 */
export const initSentry = (options = {}) => {
  const environment = import.meta.env.MODE || 'development';
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  // Vérifier si la variable DSN est définie ET n'est pas une valeur d'exemple/factice
  if (!dsn || dsn.includes('example') || dsn.includes('123456')) {
    console.warn('Variable d\'environnement VITE_SENTRY_DSN non définie ou invalide. Le suivi des erreurs avec Sentry ne sera pas activé.');
    SENTRY_ENABLED = false;
    return;
  }
  
  try {
    Sentry.init({
      dsn,
      environment,
      // On échantillonne 10% des transactions pour les performances en environnement de production
      // et 100% en développement pour faciliter le débogage
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      // En développement, activons Sentry mais avec des options spécifiques
      enabled: true, // Activer Sentry même en développement pour détecter les problèmes tôt
      debug: environment !== 'production', // Activer le mode debug en développement
      // Regrouper les messages similaires
      normalizeDepth: 5,
      // Ajouter le contexte des breadcrumbs (étapes précédant l'erreur)
      maxBreadcrumbs: 50,
      // Supprimer les informations PII sensibles par défaut
      sendDefaultPii: false,
      // Options supplémentaires de l'utilisateur
      ...options
    });
    console.log(`Sentry initialisé avec succès en environnement: ${environment}`);
    SENTRY_ENABLED = true;
  } catch (err) {
    console.error("Erreur lors de l'initialisation de Sentry:", err);
    // En cas d'erreur d'initialisation, on désactive Sentry
    SENTRY_ENABLED = false;
  }
};

/**
 * Capture une exception et l'envoie à Sentry
 * @param {Error} error - L'erreur à capturer
 * @param {Object} context - Contexte supplémentaire pour l'erreur
 */
export const captureException = (error, context = {}) => {
  if (!error) return;
  
  // Vérifier si Sentry est activé
  if (!SENTRY_ENABLED) {
    console.error('Erreur capturée (Sentry désactivé):', error);
    return;
  }
  
  Sentry.withScope(scope => {
    // Ajouter des tags pour faciliter le filtrage dans Sentry
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    
    // Ajouter des données supplémentaires
    if (context.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    
    // Définir le niveau de l'erreur (fatal, error, warning, info, debug)
    if (context.level) {
      scope.setLevel(context.level);
    }
    
    // Capturer l'erreur avec le contexte enrichi
    Sentry.captureException(error);
  });
};

/**
 * Capture un message et l'envoie à Sentry
 * @param {string} message - Le message à capturer
 * @param {Object} context - Contexte supplémentaire pour le message
 */
export const captureMessage = (message, context = {}) => {
  if (!message) return;
  
  // Vérifier si Sentry est activé
  if (!SENTRY_ENABLED) {
    console.log('Message capturé (Sentry désactivé):', message);
    return;
  }
  
  Sentry.withScope(scope => {
    // Ajouter des tags pour faciliter le filtrage dans Sentry
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    
    // Ajouter des données supplémentaires
    if (context.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    
    // Définir le niveau du message (fatal, error, warning, info, debug)
    if (context.level) {
      scope.setLevel(context.level);
    }
    
    // Capturer le message avec le contexte enrichi
    Sentry.captureMessage(message);
  });
};

/**
 * Définit le contexte utilisateur pour Sentry
 * @param {Object} user - Les informations utilisateur à associer aux erreurs
 */
export const setUser = (user) => {
  if (!SENTRY_ENABLED) {
    return; // Ne rien faire si Sentry est désactivé
  }
  
  if (!user) {
    Sentry.setUser(null);
    return;
  }
  
  // Ne jamais envoyer de données sensibles à Sentry
  const safeUser = {
    id: user.id,
    username: user.username || user.email,
    // Ne pas inclure le mot de passe, ni d'informations sensibles
  };
  
  Sentry.setUser(safeUser);
};

/**
 * Crée un wrapper de promesse qui capture les erreurs avec Sentry
 * @param {Promise} promise - La promesse à exécuter
 * @param {string} errorContext - Contexte pour identifier l'origine de l'erreur
 * @param {Object} sentryContext - Contexte supplémentaire pour Sentry
 * @returns {Promise<[Error, null]|[null, any]>} - Tuple avec [erreur, résultat]
 */
export const safePromiseWithSentry = async (promise, errorContext = 'opération', sentryContext = {}) => {
  try {
    const data = await promise;
    return [null, data];
  } catch (error) {
    console.error(`Erreur lors de ${errorContext}:`, error);
    
    // Capturer l'erreur avec Sentry
    captureException(error, {
      tags: { errorContext },
      extra: { ...sentryContext.extra },
      level: sentryContext.level || 'error'
    });
    
    return [error, null];
  }
};
