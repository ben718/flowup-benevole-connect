import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { safeSupabaseCall } from '../lib/errorHandling';

export const useAssociations = () => {
  const [associations, setAssociations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssociations().catch(console.error);
  }, []);

  const fetchAssociations = async () => {
    try {
      setLoading(true);
      setError(null);

      const [error, data] = await safeSupabaseCall(
        supabase
          .from('associations')
          .select('*'),
        'récupération des associations'
      );

      if (error) {
        setError(error.message);
      } else {
        setAssociations(data || []);
      }
    } catch (err) {
      setError(`Erreur inattendue: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getAssociationById = async (id) => {
    try {
      setLoading(true);
      setError(null);

      const [error, data] = await safeSupabaseCall(
        supabase
          .from('associations')
          .select(`
            *,
            contacts:association_contacts(*)
          `)
          .eq('id', id)
          .single(),
        `récupération de l'association ${id}`
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

  const getAssociationMissions = async (associationId) => {
    try {
      const [error, data] = await safeSupabaseCall(
        supabase
          .from('missions')
          .select('*')
          .eq('association_id', associationId)
          .order('date', { ascending: true }),
        `récupération des missions de l'association ${associationId}`
      );

      if (error) {
        setError(error.message);
        return [];
      }
      
      return data || [];
    } catch (err) {
      setError(`Erreur inattendue: ${err.message}`);
      return [];
    }
  };

  return { 
    associations, 
    loading, 
    error,
    getAssociationById,
    getAssociationMissions
  };
};
