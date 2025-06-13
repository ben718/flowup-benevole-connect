import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

// Préchargement des styles
import './index.css'

// Importation d'App en utilisant un import dynamique pour l'hydratation progressive
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { ToastProvider } from './hooks/useToast.jsx'
import { setupGlobalErrorHandlers } from './lib/errorHandling.js'
import { initSentry } from './lib/sentry.js'

// Initialiser Sentry pour le suivi des erreurs
initSentry();

// Définir une whitelist d'erreurs à ignorer (comme les erreurs des extensions de navigateur)
window.__ignoreErrors = [
  'content.js', 
  'extension',
  // Ajouter d'autres patterns si nécessaire
];

// Configurer les gestionnaires d'erreurs globaux
setupGlobalErrorHandlers();

// Préchargement d'importations critiques en arrière-plan pour améliorer les performances perçues
// L'import() en tant qu'expression sera exécuté mais le résultat n'est pas attendu
import('./lib/supabase.js');  // Précharge la connexion Supabase
import('./components/BottomNavigation.jsx');  // Précharge la navigation qui sera utilisée sur toutes les pages

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
