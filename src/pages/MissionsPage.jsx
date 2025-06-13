import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import BottomNavigation from '../components/BottomNavigation';
import { formatDate } from '../lib/utils';

const MissionsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    if (!user && !loading) {
      console.log('redirect /missions', { user, loading });
      navigate('/login', { state: { redirectTo: '/missions' } });
      return;
    }
    console.time('fetchUserMissions');
    fetchUserMissions().catch(console.error).finally(() => console.timeEnd('fetchUserMissions'));
  }, [user, navigate]);
  useEffect(() => {
    const fetchUserMissions = async () => {
      try {
        setLoading(true);
        
        // Fetch all user missions with details
        const { data, error } = await supabase
          .from('mission_registrations')
          .select(`
            id,
            status,
            missions (
              id,
              title,
              description,
              category,
              image_url,              date,
              start_time,
              end_time,
              address,
              city,
              latitude,              longitude,
              spots_available,
              spots_taken,
              association_id,
              associations (
                id,
                name,
                logo_url
              )
            )
          `)
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        // Process data to include mission and association data
        const processedMissions = data.map(item => ({
          id: item.id,
          status: item.status,
          ...item.missions,
          association: item.missions.associations
        }));
        
        setMissions(processedMissions);
      } catch (error) {
        console.error('Error fetching user missions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    console.time('fetchUserMissions');
    fetchUserMissions().catch(console.error).finally(() => console.timeEnd('fetchUserMissions'));
  }, [user, navigate]);
  const handleCancelMission = async (missionVolunteerId, missionId) => {
    try {
      // Delete mission volunteer entry
      const { error } = await supabase
        .from('mission_registrations')
        .delete()
        .eq('id', missionVolunteerId);
      
      if (error) throw error;
      
      // Update missions state
      setMissions(missions.filter(m => m.id !== missionVolunteerId));
        // Get mission and association details for notification
      const mission = missions.find(m => m.id === missionVolunteerId);
      
      // Send notification to the association
      if (mission) {
        await supabase
          .from('notifications')
          .insert([
            {
              user_id: mission.association_id,
              title: 'Annulation de participation',
              message: `Un bénévole a annulé sa participation à la mission "${mission.title}"`,
              type: 'volunteer_cancel',
              related_entity_type: 'mission',
              related_entity_id: missionId,
              is_read: false
            }
          ]);
      }
    } catch (error) {
      console.error('Error canceling mission:', error);
    }
  };

  // Filter missions based on active tab
  const filteredMissions = missions.filter(mission => {
    const missionDate = new Date(mission.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (activeTab === 'upcoming') {
      return missionDate >= today && mission.status !== 'completed';
    } else if (activeTab === 'past') {
      return missionDate < today || mission.status === 'completed';
    }
    return true;
  });
  const renderMissionCard = (mission) => {
    const missionDate = new Date(mission.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = missionDate < today || mission.status === 'completed';
    
    return (
      <div 
        key={mission.id}
        className="bg-white rounded-lg shadow-md overflow-hidden mb-4"
      >
        <div className="flex">
          <div 
            className="w-24 h-24 bg-gray-200 flex-shrink-0"
            style={{
              backgroundImage: mission.image_url ? `url(${mission.image_url})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          ></div>
          <div className="p-4 flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg mb-1 line-clamp-1">{mission.title}</h3>
                <div className="flex items-center mb-2">
                  <img 
                    src={mission.association.logo_url || 'https://via.placeholder.com/24'} 
                    alt={mission.association.name}
                    className="w-5 h-5 rounded-full mr-2"
                  />
                  <span className="text-sm text-gray-600">{mission.association.name}</span>
                </div>
              </div>
              <div className="ml-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  mission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  mission.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  mission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  mission.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {mission.status === 'pending' ? 'En attente' :
                   mission.status === 'confirmed' ? 'Confirmée' :
                   mission.status === 'rejected' ? 'Refusée' :
                   mission.status === 'completed' ? 'Terminée' :
                   'Inconnu'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center text-sm text-gray-600 mb-3">
              <Clock size={14} className="mr-1" />
              <span>
                {formatDate(mission.date)} • {mission.start_time} - {mission.end_time}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <button
                onClick={() => navigate(`/mission/${mission.id}`)}
                className="text-primary text-sm font-semibold"
              >
                Voir les détails
              </button>
              
              {!isPast && mission.status !== 'rejected' && (
                <button
                  onClick={() => handleCancelMission(mission.id, mission.id)}
                  className="text-red-500 text-sm font-semibold flex items-center"
                >
                  <X size={14} className="mr-1" />
                  Annuler
                </button>
              )}
              
              {mission.status === 'completed' && (
                <div className="text-green-600 text-sm font-semibold flex items-center">
                  <Check size={14} className="mr-1" />
                  Terminée
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <div className="bg-primary text-white p-6">
        <h1 className="text-2xl font-bold">Mes Missions</h1>
      </div>
      
      <div className="bg-white border-b">
        <div className="flex">
          <button
            className={`flex-1 py-3 text-center font-medium ${
              activeTab === 'upcoming' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('upcoming')}
          >
            À venir
          </button>
          <button
            className={`flex-1 py-3 text-center font-medium ${
              activeTab === 'past' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('past')}
          >
            Passées
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        ) : filteredMissions.length > 0 ? (
          <div>
            {filteredMissions.map(renderMissionCard)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <div className="bg-gray-100 rounded-full p-6 mb-4">
              <Clock className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">
              {activeTab === 'upcoming' 
                ? 'Aucune mission à venir' 
                : 'Aucune mission passée'}
            </h2>
            <p className="text-gray-600 mb-6">
              {activeTab === 'upcoming'
                ? 'Vous n\'avez pas encore participé à des missions. Explorez les missions disponibles !'
                : 'Vous n\'avez pas encore terminé de missions.'}
            </p>
            {activeTab === 'upcoming' && (
              <button
                onClick={() => navigate('/explore')}
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium"
              >
                Explorer les missions
              </button>
            )}
          </div>
        )}
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default MissionsPage;
