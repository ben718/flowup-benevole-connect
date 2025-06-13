import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { safeSupabaseCall } from '../lib/errorHandling';

export const useAdvanced = () => {
  const [notifications, setNotifications] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState({
    notifications: false,
    badges: false
  });
  const [error, setError] = useState({
    notifications: null,
    badges: null
  });

  const subscriptionRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    // Sécurisation de l'appel asynchrone avec gestion d'erreur et annulation
    (async () => {
      try {
        const sub = await setupNotificationsSubscription(signal);
        if (isMounted) {
          subscriptionRef.current = sub;
        }
      } catch (err) {
        if (signal.aborted) return;
        console.error("Erreur lors de la configuration de l'abonnement aux notifications:", err);
        setError(prev => ({ ...prev, notifications: "Erreur lors de la configuration de l'abonnement" }));
      }
    })();

    return () => {
      isMounted = false;
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (subscriptionRef.current && typeof subscriptionRef.current.unsubscribe === 'function') {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);  // Configuration de l'abonnement en temps réel aux notifications
  // Ajout du paramètre signal pour permettre l'annulation
  const setupNotificationsSubscription = async (signal) => {
    try {
      const [sessionError, sessionData] = await safeSupabaseCall(
        supabase.auth.getSession(),
        'récupération de la session pour les notifications'
      );
      if (signal?.aborted) return null;
      if (sessionError) return null;
      const user = sessionData?.session?.user;
      if (!user) return null;
      if (signal?.aborted) return null;
      return supabase
        .channel('notifications-changes')
        .on('postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          payload => {
            if (signal?.aborted) return;
            setNotifications(prev => [payload.new, ...prev]);
          }
        )
        .subscribe();
    } catch (error) {
      if (signal?.aborted) return null;
      console.error('Erreur lors de la configuration des notifications en temps réel:', error);
      return null;
    }
  };  // Charger les notifications de l'utilisateur
  const fetchNotifications = async () => {
    try {
      setLoading(prev => ({ ...prev, notifications: true }));
      setError(prev => ({ ...prev, notifications: null }));
      
      const [sessionError, sessionData] = await safeSupabaseCall(
        supabase.auth.getSession(),
        'récupération de la session pour les notifications'
      );
      
      if (sessionError) {
        setError(prev => ({ ...prev, notifications: 'Erreur d\'authentification' }));
        return;
      }
      
      const user = sessionData?.session?.user;
      
      if (!user) {
        setError(prev => ({ ...prev, notifications: 'Utilisateur non connecté' }));
        return;
      }
      
      const [notifError, notifData] = await safeSupabaseCall(
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        'récupération des notifications'
      );
      
      if (notifError) {
        setError(prev => ({ ...prev, notifications: notifError.message }));
      } else {
        setNotifications(notifData);
      }
    } catch (error) {
      setError(prev => ({ ...prev, notifications: 'Erreur imprévue: ' + error.message }));
    } finally {
      setLoading(prev => ({ ...prev, notifications: false }));
    }
  };
  // Marquer une notification comme lue
  const markNotificationAsRead = async (notificationId) => {
    try {
      const [error, _] = await safeSupabaseCall(
        supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notificationId),
        'marquage de notification comme lue'
      );

      if (error) {
        return false;
      }
      
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true } 
            : notification
        )
      );
      
      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  };

  // Charger les badges de l'utilisateur
  const fetchUserBadges = async (userId) => {
    if (!userId) return;
    
    try {
      setLoading(prev => ({ ...prev, badges: true }));
      setError(prev => ({ ...prev, badges: null }));

      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge:badges(*)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      
      setBadges(data.map(item => ({
        ...item.badge,
        awarded_at: item.awarded_at
      })));
    } catch (err) {
      console.error('Error fetching user badges:', err);
      setError(prev => ({ ...prev, badges: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, badges: false }));
    }
  };

  // Gestion des langues
  const addLanguage = async (language, level, isPrimary = false) => {
    try {
      const { data, error } = await supabase.rpc('add_language_to_profile', {
        p_language: language,
        p_level: level,
        p_is_primary: isPrimary
      });

      if (error) throw error;
      
      return { success: true, error: null };
    } catch (err) {
      console.error('Error adding language:', err);
      return { success: false, error: err.message };
    }
  };

  const removeLanguage = async (language) => {
    try {
      const { data, error } = await supabase.rpc('remove_language_from_profile', {
        p_language: language
      });

      if (error) throw error;
      
      return { success: true, error: null };
    } catch (err) {
      console.error('Error removing language:', err);
      return { success: false, error: err.message };
    }
  };

  // Aucun code mort détecté dans ce hook. Tous les exports et fonctions sont utilisés dans l'application (notifications, badges, langues).
  // Rien à supprimer ici.

  return {
    notifications,
    badges,
    loading,
    error,
    fetchNotifications,
    markNotificationAsRead,
    fetchUserBadges,
    addLanguage,
    removeLanguage
  };
};
