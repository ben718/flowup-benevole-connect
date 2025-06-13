import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, Award, MessageCircle, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import BottomNavigation from '../components/BottomNavigation';
import { formatDate, calculateDistance } from '../lib/utils';
import { safeSupabaseCall } from '../lib/errorHandling';
import { getUserLocation } from '../lib/utils';

const MissionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();  const [mission, setMission] = useState(null);
  const [association, setAssociation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const location = await getUserLocation();
        setUserLocation(location);
      } catch (error) {
        setLocationError(error.message || "Impossible d'obtenir votre position.");
      }
    };
    fetchLocation();
    // Fetch mission details
    const fetchMissionDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch mission data
        const [missionError, missionData] = await safeSupabaseCall(
          supabase
            .from('missions')
            .select('*')
            .eq('id', id)
            .single(),
          'récupération des détails de la mission'
        );
        
        if (missionError || !missionData) {
          setError(missionError ? missionError.message : "Mission introuvable");
          navigate('/not-found');
          return;
        }
          setMission(missionData);
        
        // Fetch association data
        const [associationError, associationData] = await safeSupabaseCall(
          supabase
            .from('associations')
            .select('*')
            .eq('id', missionData.association_id)
            .single(),
          'récupération des détails de l\'association'
        );
        
        if (associationError) {
          setError(`Erreur lors du chargement des détails de l'association: ${associationError.message}`);
        } else {
          setAssociation(associationData);
        }
        
        // Check if user is enrolled
        if (user) {
          const [enrollmentError, enrollmentData] = await safeSupabaseCall(
            supabase
              .from('mission_registrations')
              .select('*')
              .eq('mission_id', id)
              .eq('user_id', user.id)
              .single(),
            'vérification de l\'inscription à la mission'
          );
          
          if (!enrollmentError && enrollmentData) {
            setIsEnrolled(true);
          }
        }
      } catch (error) {
        setError(`Erreur lors du chargement de la mission: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMissionDetails();
  }, [id, user]);
  const handleEnroll = async () => {
    if (!user) {
      navigate('/login', { state: { redirectTo: `/mission/${id}` } });
      return;
    }
    
    try {
      setEnrolling(true);
      setError(null);
      
      const [enrollError, enrollData] = await safeSupabaseCall(
        supabase
          .from('mission_registrations')
          .insert([
            { 
              mission_id: id, 
              user_id: user.id,
              status: 'pending'
            }
          ]),
        'inscription à la mission'
      );
      
      if (enrollError) {
        setError(`Erreur lors de l'inscription: ${enrollError.message}`);
        return;
      }
      
      // Send notification to the association
      const [notifError, _] = await safeSupabaseCall(
        supabase
          .from('notifications')
          .insert([
            {
              user_id: mission.association_id,
              title: 'Nouveau bénévole',
              message: `${profile?.first_name || 'Un bénévole'} ${profile?.last_name || ''} s'est inscrit à la mission "${mission.title}"`,
              type: 'new_volunteer',
              related_entity_type: 'mission',
              related_entity_id: id,
              is_read: false
            }
          ]),
        'envoi de notification pour inscription'
      );
      
      if (notifError) {
        // Juste un log, ne pas bloquer l'expérience utilisateur
        console.warn('Impossible d\'envoyer la notification:', notifError.message);
      }
      
      setIsEnrolled(true);
    } catch (error) {
      setError(`Erreur inattendue: ${error.message}`);
    } finally {
      setEnrolling(false);
    }
  };
    const handleCancelEnrollment = async () => {
    try {
      setEnrolling(true);
      setError(null);
      
      const [cancelError, _] = await safeSupabaseCall(
        supabase
          .from('mission_registrations')
          .delete()
          .eq('mission_id', id)
          .eq('user_id', user.id),
        'annulation de l\'inscription à la mission'
      );
      
      if (cancelError) {
        setError(`Erreur lors de l'annulation de l'inscription: ${cancelError.message}`);
        return;
      }      // Send notification to the association
      const [notifError, _notifData] = await safeSupabaseCall(
        supabase
          .from('notifications')
          .insert([
            {
              user_id: mission.association_id,
              title: 'Annulation de participation',
              message: `${profile?.first_name || 'Un bénévole'} ${profile?.last_name || ''} a annulé sa participation à la mission "${mission.title}"`,
              type: 'volunteer_cancel',
              related_entity_type: 'mission',
              related_entity_id: id,
              is_read: false
            }
          ]),
        'envoi de notification pour annulation'
      );
      
      if (notifError) {
        // Juste un log, ne pas bloquer l'expérience utilisateur
        console.warn('Impossible d\'envoyer la notification d\'annulation:', notifError.message);
      }
      
      setIsEnrolled(false);
    } catch (error) {
      setError(`Erreur inattendue: ${error.message}`);
    } finally {
      setEnrolling(false);
    }
  };

  // Composant pour afficher les erreurs
  const ErrorMessage = ({ message }) => {
    if (!message) return null;
    
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4 relative">
        <span className="block sm:inline">{message}</span>
        <button 
          onClick={() => setError(null)} 
          className="absolute top-0 bottom-0 right-0 px-4 py-3"
        >
          <span className="text-red-500 font-bold">×</span>
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!mission || !association) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-4">Mission non trouvée</h1>
          <p className="text-gray-600 mb-6">La mission que vous recherchez n'existe pas ou a été supprimée.</p>
          <button 
            onClick={() => navigate('/explore')} 
            className="px-4 py-2 bg-primary text-white rounded-lg"
          >
            Explorer d'autres missions
          </button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const distance = userLocation 
    ? calculateDistance(
        userLocation.latitude, 
        userLocation.longitude, 
        mission.latitude, 
        mission.longitude
      ) 
    : null;

  return (    <div className="min-h-screen flex flex-col pb-16">
      <div className="flex-1">
        {/* Affichage des erreurs */}
        {error && <ErrorMessage message={error} />}
        {locationError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4">
            <span className="block sm:inline">{locationError}</span>
          </div>
        )}
        
        {/* Mission Image */}
        <div className="h-64 w-full bg-gray-300 relative">
          {mission.image_url ? (
            <img 
              src={mission.image_url} 
              alt={mission.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
              <h2 className="text-2xl font-bold text-primary">{association.name}</h2>
            </div>
          )}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 bg-white rounded-full p-2 shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
        
        {/* Mission Content */}
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-2">
            <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
              {mission.category}
            </span>
            {distance && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full flex items-center">
                <MapPin size={14} className="mr-1" />
                {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}
              </span>
            )}
          </div>
          
          <h1 className="text-2xl font-bold mb-2">{mission.title}</h1>
          
          <div className="flex items-center mb-6">
            <img 
              src={association.logo_url || 'https://via.placeholder.com/40'} 
              alt={association.name}
              className="w-10 h-10 rounded-full mr-3 object-cover"
            />
            <div>
              <p className="font-medium">{association.name}</p>
              <p className="text-sm text-gray-500">{association.city}</p>
            </div>
          </div>
          
          {/* Mission details */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start">
              <Calendar className="w-5 h-5 text-primary mr-3 mt-1" />
              <div>
                <p className="font-medium">Date</p>                <p className="text-gray-600">
                  {formatDate(mission.date)}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Clock className="w-5 h-5 text-primary mr-3 mt-1" />
              <div>
                <p className="font-medium">Horaires</p>
                <p className="text-gray-600">
                  {mission.start_time} - {mission.end_time}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <MapPin className="w-5 h-5 text-primary mr-3 mt-1" />
              <div>
                <p className="font-medium">Lieu</p>
                <p className="text-gray-600">{mission.address}, {mission.city}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Users className="w-5 h-5 text-primary mr-3 mt-1" />
              <div>
                <p className="font-medium">Bénévoles recherchés</p>
                <p className="text-gray-600">{mission.spots_available} personne{mission.spots_available > 1 ? 's' : ''}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Award className="w-5 h-5 text-primary mr-3 mt-1" />
              <div>
                <p className="font-medium">Badges à gagner</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {mission.badges && mission.badges.map((badge, index) => (
                    <span key={index} className="px-2 py-1 bg-secondary/10 text-secondary text-xs font-medium rounded-full">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Mission description */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-3">Description</h2>
            <p className="text-gray-700 whitespace-pre-line">{mission.description}</p>
          </div>
          
          {/* Mission requirements */}
          {mission.requirements && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-3">Prérequis</h2>
              <p className="text-gray-700 whitespace-pre-line">{mission.requirements}</p>
            </div>
          )}
            {/* Contact */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-3">Contact</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">{association.name}</p>
              <p className="text-gray-600 mb-3">{association.city}</p>
              <div className="flex items-center">
                <MessageCircle className="w-5 h-5 text-primary mr-2" />
                <a href={`mailto:${association.email}`} className="text-primary">
                  {association.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Places disponibles</p>
              <p className="font-bold text-lg">{mission.spots_available - (mission.spots_taken || 0)}/{mission.spots_available}</p>
            </div>
            {!isEnrolled ? (
            <button
              onClick={handleEnroll}
              disabled={enrolling || (mission.spots_taken >= mission.spots_available)}
              className={`px-6 py-3 rounded-lg font-medium flex items-center ${
                mission.spots_taken >= mission.spots_available
                  ? 'bg-gray-300 text-gray-500'
                  : 'bg-primary text-white'
              }`}
            >
              {enrolling ? (
                <>
                  <LoadingSpinner small />
                  <span className="ml-2">En cours...</span>
                </>
              ) : mission.spots_taken >= mission.spots_available ? (
                'Mission complète'
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Je participe
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleCancelEnrollment}
              disabled={enrolling}
              className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium flex items-center"
            >
              {enrolling ? (
                <>
                  <LoadingSpinner small />
                  <span className="ml-2">En cours...</span>
                </>
              ) : (
                <>
                  <X className="w-5 h-5 mr-2" />
                  Annuler
                </>
              )}
            </button>
          )}
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default MissionDetailPage;
