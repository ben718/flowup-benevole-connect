import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { safeSupabaseCall, safePromise } from '../lib/errorHandling';

export const useMissions = (filters = {}) => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMissions().catch(console.error);
  }, [filters]);

  const fetchMissions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Si la géolocalisation est demandée
      if (filters.location && filters.location.latitude && filters.location.longitude && filters.distance) {
        // Utiliser la fonction RPC pour la recherche géographique
        const [rpcError, rpcData] = await safeSupabaseCall(
          supabase.rpc('search_nearby_missions', {
            p_latitude: filters.location.latitude,
            p_longitude: filters.location.longitude,
            p_distance: filters.distance || 15,
            p_category: filters.category || null,
            p_date_start: filters.date || new Date().toISOString().split('T')[0],
            p_date_end: filters.dateEnd || null,
            p_duration_max: filters.durationMax || null,
            p_language: filters.language || null
          }),
          'recherche de missions à proximité'
        );

        if (rpcError) {
          setError(rpcError.message);
          setLoading(false);
          return;
        }
        
        // Récupérer les détails des associations pour ces missions
        if (rpcData && rpcData.length > 0) {
          const missionIds = rpcData.map(m => m.id);
          
          const [associationsError, missionsWithAssociations] = await safeSupabaseCall(
            supabase
              .from('missions')
              .select(`
                *,
                association:associations(id, name, logo_url)
              `)
              .in('id', missionIds),
            'récupération des détails d\'associations pour les missions à proximité'
          );

          if (associationsError) {
            setError(associationsError.message);
            setLoading(false);
            return;
          }
          
          setMissions(missionsWithAssociations);
          setLoading(false);
          return;
        }
        
        setMissions([]);
        setLoading(false);
        return;
      }

      // Construire la requête de base sans géolocalisation
      let query = supabase
        .from('missions')
        .select(`
          *,
          association:associations(id, name, logo_url)
        `)
        .eq('status', 'published');

      // Appliquer les filtres
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.date) {
        query = query.gte('date', filters.date);
      }

      // Exécuter la requête normale (sans géolocalisation)
      const [error, data] = await safeSupabaseCall(
        query,
        'récupération des missions'
      );

      if (error) {
        setError(error.message);
      } else {
        setMissions(data || []);
      }
    } catch (err) {
      setError(`Erreur inattendue: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  const getMissionById = async (id) => {
    try {
      setLoading(true);
      setError(null);

      const [error, data] = await safeSupabaseCall(
        supabase
          .from('missions')
          .select(`
            *,
            association:associations(id, name, logo_url, description, verified)
          `)
          .eq('id', id)
          .single(),
        `récupération de la mission ${id}`
      );

      if (error) {
        setError(error.message);
        return null;
      }
      
      return data;
    } catch (err) {
      setError(`Erreur inattendue: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };
  const registerForMission = async (missionId) => {
    try {
      const [error, data] = await safeSupabaseCall(
        supabase.rpc('register_for_mission', {
          p_mission_id: missionId
        }),
        `inscription à la mission ${missionId}`
      );

      if (error) {
        return { success: false, error: error.message };
      }
      
      // Rafraîchir les missions après l'inscription
      await fetchMissions();
      
      return { success: data, error: null };
    } catch (err) {
      return { success: false, error: `Erreur inattendue: ${err.message}` };
    }
  };

  const cancelRegistration = async (missionId, reason) => {
    try {
      const { data, error } = await supabase.rpc('cancel_mission_registration', {
        p_mission_id: missionId,
        p_reason: reason || null
      });

      if (error) throw error;
      
      // Rafraîchir les missions après l'annulation
      await fetchMissions();
      
      return { success: data, error: null };
    } catch (err) {
      console.error('Error cancelling registration:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    missions,
    loading,
    error,
    fetchMissions,
    getMissionById,
    registerForMission,
    cancelRegistration
  };
};
