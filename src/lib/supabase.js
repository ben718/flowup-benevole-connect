import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isDevelopment = import.meta.env.MODE === 'development';

// Disable during development for easier debugging
if (isDevelopment) {
  console.log('Running in development mode - Supabase URL:', supabaseUrl);
}

// Check if environment variables are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!', { 
    hasUrl: !!supabaseUrl, 
    hasKey: !!supabaseAnonKey 
  });
}

// Provide fallback values in case environment variables are missing
const fallbackUrl = 'https://cljwsvwfwxfhpnpzdikg.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsandzdndmd3hmaHBucHpkaWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMDAwMjMsImV4cCI6MjA2NDc3NjAyM30.dX2LE2foZL1ZOo0ctc_RKsdMExRambfx3btuJ9Wfh1Y';

// Fonction de création du client avec gestion des erreurs
const createSafeClient = () => {  try {
    // Set up logging for debugging
    console.log('Creating Supabase client in environment:', isDevelopment ? 'development' : 'production');
    
    const options = {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Use PKCE authentication flow which is more secure
        flowType: 'pkce'
      },
      // Ajouter des options pour la gestion des timeouts et des retry
      global: {
        headers: {
          'X-Client-Info': 'voisin-solidaire-app'
        },
        fetch: (...args) => {
          // Personnalisation de fetch pour gérer les timeouts
          return new Promise((resolve, reject) => {
            // Défini un timeout de 15 secondes
            const timeoutId = setTimeout(() => {
              reject(new Error("La requête Supabase a expiré après 15 secondes"));
            }, 15000);
            
            // Exécute fetch avec les arguments originaux
            fetch(...args)
              .then(response => {
                clearTimeout(timeoutId);
                resolve(response);
              })
              .catch(error => {
                clearTimeout(timeoutId);
                // Amélioration du message d'erreur pour le débogage
                console.error("Erreur réseau dans Supabase:", { 
                  message: error.message, 
                  url: args[0],
                  connectionStatus: navigator.onLine ? "En ligne" : "Hors ligne"
                });
                reject(error);
              });
          });
        }
      }
    };
    
    // For development environment, we need special handling
    if (isDevelopment) {
      console.log('Using development configuration for Supabase');
      console.log('Supabase URL:', supabaseUrl || fallbackUrl);
      // Ne pas afficher la clé complète pour des raisons de sécurité
      console.log('Supabase Key available:', !!supabaseAnonKey || !!fallbackKey);
    }
    
    return createClient(
      supabaseUrl || fallbackUrl, 
      supabaseAnonKey || fallbackKey,
      options
    );
  } catch (error) {
    console.error("Erreur lors de la création du client Supabase:", error);
    // Retourner un client avec des méthodes simulées pour éviter les erreurs
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: new Error("Client Supabase non disponible: " + error.message) }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signUp: async () => ({ data: null, error: new Error("Client Supabase non disponible: " + error.message) }),
        signInWithPassword: async () => ({ data: null, error: new Error("Client Supabase non disponible: " + error.message) }),
        signOut: async () => ({ error: null })
      },
      from: (table) => ({
        select: (fields) => ({
          eq: (field, value) => ({
            single: async () => ({ data: null, error: new Error(`Client Supabase non disponible lors de l'accès à ${table}: ${error.message}`) })
          }),
          order: () => ({
            data: null,
            error: new Error(`Client Supabase non disponible lors de l'accès à ${table}: ${error.message}`)
          })
        })
      })
    };
  }
};

export const supabase = createSafeClient();

// Fonction pour vérifier la connexion à Supabase
export const checkSupabaseConnection = async (tableName = 'health_check') => {
  try {
    // Essayer de faire une requête simple pour vérifier la connectivité
    const startTime = Date.now();
    const { error } = await supabase.from(tableName).select('count').limit(1);
    const endTime = Date.now();
    
    if (error && error.code === '42P01') {
      // Cette erreur indique que la table n'existe pas, mais la connexion fonctionne
      console.warn(`Table '${tableName}' n'existe pas, mais la connexion à Supabase fonctionne.`);
      return { connected: true, latency: endTime - startTime, tableExists: false };
    } else if (error) {
      console.error(`Erreur lors de la vérification de la connexion Supabase (table: ${tableName}):`, error);
      return { connected: false, error: error.message, tableExists: false };
    }
    
    return { connected: true, latency: endTime - startTime, tableExists: true };
  } catch (error) {
    console.error('Erreur critique lors de la vérification de Supabase:', error);
    return { 
      connected: false, 
      error: error.message,
      network: navigator.onLine ? 'connecté' : 'déconnecté',
      tableExists: false
    };
  }
};
