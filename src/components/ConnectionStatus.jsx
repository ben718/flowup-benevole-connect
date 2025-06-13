// Composant pour afficher le statut de connexion à Supabase
import { useState, useEffect, useCallback } from 'react';
import { checkSupabaseConnection } from '../lib/supabase';
import { safePromise } from '../lib/errorHandling';

const ConnectionStatus = () => {
  const [status, setStatus] = useState({ connected: true, checking: false });
  const [showStatus, setShowStatus] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Fonction pour vérifier la connexion
  const checkConnection = useCallback(async (silent = false) => {
    if (!navigator.onLine) {
      setStatus({ connected: false, error: "Pas de connexion Internet" });
      setShowStatus(true);
      return;
    }

    if (!silent) {
      setStatus(prev => ({ ...prev, checking: true }));
    }
    
    const [error, result] = await safePromise(
      checkSupabaseConnection(), 
      'vérification de la connexion Supabase'
    );
    
    if (error) {
      setStatus({ 
        connected: false, 
        checking: false, 
        error: "Erreur lors de la vérification: " + error.message 
      });
      setShowStatus(true);
      return;
    }
    
    setStatus({ ...result, checking: false });
    
    // Réinitialiser le compteur de tentatives si la connexion est rétablie
    if (result.connected) {
      setReconnectAttempts(0);
      // Cacher après 3 secondes si la connexion est rétablie
      setTimeout(() => setShowStatus(false), 3000);
    } else {
      // Incrémenter le compteur de tentatives si la connexion a échoué
      setReconnectAttempts(prev => prev + 1);
      setShowStatus(true);
    }
  }, []);

  // Vérifier la connexion lorsque le navigateur change d'état de connexion
  useEffect(() => {
    // Vérifier immédiatement au chargement
    checkConnection();

    // Ajouter les écouteurs d'événements pour détecter les changements de connectivité
    const handleOnline = () => {
      checkConnection();
    };

    const handleOffline = () => {
      setStatus({ connected: false, error: "Pas de connexion Internet" });
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Ajuster l'intervalle de vérification en fonction du nombre de tentatives échouées
    const getCheckInterval = () => {
      // Vérifier plus fréquemment si les tentatives échouent
      if (reconnectAttempts === 0) return 30000; // 30s normalement
      if (reconnectAttempts < 3) return 15000;   // 15s après 1-2 échecs
      if (reconnectAttempts < 5) return 60000;   // 1min après 3-4 échecs
      return 300000;                             // 5min après 5+ échecs (pour économiser la batterie)
    };

    // Vérifier périodiquement la connexion
    const interval = setInterval(() => checkConnection(true), getCheckInterval());

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkConnection, reconnectAttempts]);

  // Bouton pour forcer une nouvelle vérification
  const handleManualCheck = () => {
    checkConnection();
  };

  // Ne rien afficher si tout va bien et qu'on ne veut pas montrer le statut
  if (status.connected && !showStatus) {
    return null;
  }

  return (
    <div className={`fixed bottom-16 left-0 right-0 mx-auto w-max px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300 ${
      showStatus ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
    } ${
      status.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      {status.checking ? (
        <p className="flex items-center">
          <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Vérification de la connexion...
        </p>
      ) : status.connected ? (
        <p className="flex items-center">
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Connexion rétablie {status.latency && `(${status.latency}ms)`}
        </p>
      ) : (
        <div>
          <p className="flex items-center">
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {status.error || "Problème de connexion au serveur"}
          </p>
          {!navigator.onLine ? (
            <p className="text-xs mt-1">Vérifiez votre connexion internet</p>
          ) : (
            <button 
              onClick={handleManualCheck}
              className="text-xs underline mt-1 hover:text-red-700"
            >
              Réessayer maintenant
            </button>
          )}
        </div>
      )}
      <button 
        onClick={() => setShowStatus(false)} 
        className="absolute -right-1 -top-1 bg-gray-200 rounded-full p-1 text-gray-600 hover:bg-gray-300"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default ConnectionStatus;
