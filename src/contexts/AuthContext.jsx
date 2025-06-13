import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { safeSupabaseCall, safePromise } from '../lib/errorHandling';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [associationProfile, setAssociationProfile] = useState(null);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let isMounted = true;
  // Vérifier si l'utilisateur est déjà connecté
    const getSession = async () => {
      try {
        const [error, data] = await safeSupabaseCall(
          supabase.auth.getSession(),
          'récupération de la session'
        );
        
        if (!isMounted) return;
        
        if (error) {
          setAuthError(error.message);
        } else {
          setSession(data.session);
          setUser(data.session?.user ?? null);
          
          // Si l'utilisateur est connecté, charger son profil
          if (data.session?.user) {
            try {
              await fetchUserProfile(data.session.user.id);
            } catch (profileError) {
              console.error('Error loading user profile:', profileError);
            }
          }
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Critical error in getSession:', err);
        setAuthError(err.message || 'Une erreur est survenue lors de la récupération de la session');
      } finally {
        // Make sure loading is set to false even if there was an error
        if (isMounted) setLoading(false);
      }
    };

    getSession();    // Écouter les changements d'authentification
    let authListener;
    try {
      const { data: listener, error } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (!isMounted) return;
          
          try {
            setSession(session);
            setUser(session?.user ?? null);
            
            if (session?.user) {
              await fetchUserProfile(session.user.id);
            } else {
              setUserProfile(null);
              setAssociationProfile(null);
            }
          } catch (error) {
            if (!isMounted) return;
            console.error('Error in auth state change handler:', error);
            setUserProfile(null);
            setAssociationProfile(null);
          }
        }
      );
      
      if (error) {
        console.error('Error setting up auth listener:', error);
      }
      
      authListener = listener;
    } catch (error) {
      console.error('Failed to set up auth listener:', error);
      if (isMounted) {
        setLoading(false);
        setAuthError(error.message || 'Erreur lors de la configuration de l\'authentification');
      }
    }

    return () => {
      isMounted = false;
      try {
        if (authListener?.subscription?.unsubscribe) {
          authListener.subscription.unsubscribe();
        }
      } catch (error) {
        console.error('Error unsubscribing from auth listener:', error);
      }
    };
  }, []);
  // Fonction pour récupérer le profil utilisateur en fonction de son rôle
  const fetchUserProfile = async (userId) => {
    try {
      if (!userId) {
        console.warn('fetchUserProfile called with no userId');
        setUserProfile(null);
        setAssociationProfile(null);
        return;
      }

      // Essayer de récupérer un profil bénévole
      const [volunteerError, volunteerProfile] = await safeSupabaseCall(
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        'récupération du profil bénévole'
      );
      
      if (volunteerProfile) {
        setUserProfile(volunteerProfile);
        setAssociationProfile(null);
        return;
      }

      // Si ce n'est pas un bénévole, essayer de récupérer un profil association
      const [associationError, associationProfile] = await safeSupabaseCall(
        supabase
          .from('associations')
          .select('*')
          .eq('id', userId)
          .single(),
        'récupération du profil association'
      );

      if (associationProfile) {
        setUserProfile(null);
        setAssociationProfile(associationProfile);
        return;
      }

      // Si aucun profil n'est trouvé
      setUserProfile(null);
      setAssociationProfile(null);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Ensure we don't keep loading state if there's an error
      setUserProfile(null);
      setAssociationProfile(null);
    }
  };
  // Fonction d'inscription
  const signUp = async (credentials, isAssociation = false, profileData = {}) => {
    try {
      const [error, data] = await safeSupabaseCall(
        supabase.auth.signUp({
          email: credentials.email,
          password: credentials.password,
          options: {
            data: {
              role: isAssociation ? 'association' : 'benevole',
              ...profileData
            }
          }
        }),
        'inscription d\'un nouvel utilisateur'
      );

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };
  
  // Fonction de connexion
  const signIn = async (credentials) => {
    try {
      // Vérifier la connexion réseau
      if (!navigator.onLine) {
        throw new Error("Pas de connexion Internet. Veuillez vérifier votre connexion réseau.");
      }

      // Utiliser la fonction safePromise avec un timeout
      const [error, data] = await safePromise(
        Promise.race([
          supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Délai d'attente dépassé lors de la connexion")), 15000)
          )
        ]),
        'connexion utilisateur'
      );      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      // Amélioration des messages d'erreur pour l'utilisateur
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        return { 
          data: null, 
          error: { 
            message: "Impossible de se connecter au serveur. Veuillez vérifier votre connexion Internet ou réessayer plus tard." 
          }
        };
      }
      return { data: null, error };
    }
  };

  // Fonction de déconnexion
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  const value = {
    user,
    session,
    loading,
    userProfile,
    associationProfile,
    authError,
    signUp,
    signIn,
    signOut,
    refreshProfile: () => user && fetchUserProfile(user.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personnalisé pour accéder au contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};
