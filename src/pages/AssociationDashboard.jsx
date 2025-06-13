import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Calendar, Clock, User, Users, CheckCircle, XCircle, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../lib/utils';

const AssociationDashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [association, setAssociation] = useState(null);
  const [missions, setMissions] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [activeTab, setActiveTab] = useState('missions');
  const [missionFilter, setMissionFilter] = useState('active');

  useEffect(() => {
    if (!user && !loading) {
      console.log('redirect /association-dashboard', { user, loading });
      navigate('/login', { state: { redirectTo: '/association-dashboard' } });
      return;
    }

    const fetchAssociationData = async () => {
      try {
        setLoading(true);
        
        // Check if user has association role
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profileError) throw profileError;
        
        if (userProfile.role !== 'association') {
          navigate('/home');
          return;
        }
        
        // Fetch association data
        const { data: associationData, error: associationError } = await supabase
          .from('associations')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (associationError) {
          if (associationError.code === 'PGRST116') {
            // No association found, redirect to create association page
            navigate('/create-association');
            return;
          }
          throw associationError;
        }
        
        setAssociation(associationData);
        
        // Fetch association missions
        const { data: missionData, error: missionError } = await supabase
          .from('missions')
          .select('*')
          .eq('association_id', associationData.id)
          .order('start_date', { ascending: true });
        
        if (missionError) throw missionError;
        setMissions(missionData);
          // Fetch volunteers for all missions
        const { data: volunteerData, error: volunteerError } = await supabase
          .from('mission_registrations')
          .select(`
            id,
            mission_id,
            user_id,
            status,
            created_at,
            profiles (
              id,
              first_name,
              last_name,
              avatar_url,
              phone,
              email
            ),
            missions (
              id,
              title
            )
          `)
          .in(
            'mission_id', 
            missionData.map(m => m.id)
          );
        
        if (volunteerError) throw volunteerError;
        setVolunteers(volunteerData);
      } catch (error) {
        console.error('Error fetching association data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    console.time('fetchAssociationData');
    fetchAssociationData().catch(console.error).finally(() => console.timeEnd('fetchAssociationData'));
  }, [user, navigate]);

  const handleCreateMission = () => {
    navigate('/create-mission');
  };

  const handleEditMission = (missionId) => {
    navigate(`/edit-mission/${missionId}`);
  };

  const handleVolunteerAction = async (volunteerId, action) => {
    try {
      const volunteer = volunteers.find(v => v.id === volunteerId);
      if (!volunteer) return;
      
      const newStatus = action === 'approve' ? 'confirmed' : 'rejected';
        // Update volunteer status
      const { error } = await supabase
        .from('mission_registrations')
        .update({ status: newStatus })
        .eq('id', volunteerId);
      
      if (error) throw error;
        // Send notification to volunteer
      await supabase
        .from('notifications')
        .insert([
          {
            user_id: volunteer.user_id,
            title: action === 'approve' ? 'Participation confirmée' : 'Participation refusée',
            message: action === 'approve'
              ? `Votre participation à la mission "${volunteer.missions.title}" a été confirmée`
              : `Votre participation à la mission "${volunteer.missions.title}" a été refusée`,
            type: action === 'approve' ? 'mission_confirmed' : 'mission_rejected',
            related_entity_type: 'mission',
            related_entity_id: volunteer.mission_id,
            is_read: false
          }
        ]);
      
      // Update local state
      setVolunteers(volunteers.map(v => {
        if (v.id === volunteerId) {
          return { ...v, status: newStatus };
        }
        return v;
      }));
    } catch (error) {
      console.error('Error updating volunteer status:', error);
    }
  };

  const filteredMissions = missions.filter(mission => {
    const missionDate = new Date(mission.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (missionFilter === 'active') {
      return missionDate >= today;
    } else if (missionFilter === 'past') {
      return missionDate < today;
    }
    return true;
  });

  const pendingVolunteers = volunteers.filter(v => v.status === 'pending');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!association) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Aucune association trouvée</h1>
        <p className="text-gray-600 mb-6 text-center">
          Vous n'avez pas encore créé d'association. Créez votre association pour publier des missions.
        </p>
        <button
          onClick={() => navigate('/create-association')}
          className="px-6 py-3 bg-primary text-white rounded-lg font-medium"
        >
          Créer mon association
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-primary text-white p-6">
        <div className="flex items-center">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-white mr-4">
            {association.logo_url ? (
              <img 
                src={association.logo_url} 
                alt={association.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{association.name}</h1>
            <p className="text-white/80">{association.city}</p>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="flex">
          <button
            className={`flex-1 py-3 text-center font-medium ${
              activeTab === 'missions' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('missions')}
          >
            Missions
          </button>
          <button
            className={`flex-1 py-3 text-center font-medium ${
              activeTab === 'volunteers' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('volunteers')}
          >
            {pendingVolunteers.length > 0 && (
              <span className="inline-block bg-red-500 text-white text-xs rounded-full w-5 h-5 mr-2">
                {pendingVolunteers.length}
              </span>
            )}
            Bénévoles
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 bg-gray-50 p-4">
        {activeTab === 'missions' && (
          <div>
            {/* Mission Filters & Create Button */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex space-x-2">
                <button
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    missionFilter === 'active'
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                  onClick={() => setMissionFilter('active')}
                >
                  Missions actives
                </button>
                <button
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    missionFilter === 'past'
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                  onClick={() => setMissionFilter('past')}
                >
                  Missions passées
                </button>
              </div>
              
              <button
                onClick={handleCreateMission}
                className="flex items-center bg-primary text-white px-4 py-2 rounded-lg"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Nouvelle mission
              </button>
            </div>
            
            {/* Missions List */}
            {filteredMissions.length > 0 ? (
              <div className="space-y-4">
                {filteredMissions.map(mission => {
                  const missionVolunteers = volunteers.filter(v => v.mission_id === mission.id);
                  const confirmedVolunteers = missionVolunteers.filter(v => v.status === 'confirmed');
                  
                  return (
                    <div key={mission.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg">{mission.title}</h3>
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <Calendar className="w-4 h-4 mr-1" />
                              <span>{formatDate(mission.start_date)}</span>
                              <Clock className="w-4 h-4 ml-3 mr-1" />
                              <span>{mission.start_time} - {mission.end_time}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleEditMission(mission.id)}
                            className="text-gray-500 hover:text-primary"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className="mt-3 flex justify-between items-center">
                          <div className="flex items-center">
                            <Users className="w-5 h-5 text-gray-500 mr-2" />                            <span className="text-gray-700">
                              {confirmedVolunteers.length}/{mission.spots_available} bénévoles
                            </span>
                          </div>
                          <button
                            onClick={() => navigate(`/mission/${mission.id}`)}
                            className="text-primary text-sm font-semibold"
                          >
                            Voir les détails
                          </button>
                        </div>
                        
                        {missionVolunteers.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm font-medium mb-2">Bénévoles inscrits</p>
                            <div className="flex flex-wrap">
                              {missionVolunteers.map(volunteer => (
                                <div 
                                  key={volunteer.id}
                                  className={`flex items-center mr-3 mb-2 px-2 py-1 rounded-full text-xs ${
                                    volunteer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    volunteer.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                    'bg-red-100 text-red-800'
                                  }`}
                                >
                                  <div className="w-4 h-4 rounded-full overflow-hidden bg-gray-200 mr-1">
                                    {volunteer.profiles.avatar_url ? (
                                      <img 
                                        src={volunteer.profiles.avatar_url} 
                                        alt="" 
                                        className="w-full h-full object-cover"
                                      />
                                    ) : null}
                                  </div>
                                  <span>{volunteer.profiles.first_name} {volunteer.profiles.last_name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium mb-2">
                  {missionFilter === 'active' 
                    ? 'Aucune mission active' 
                    : 'Aucune mission passée'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {missionFilter === 'active'
                    ? 'Vous n\'avez pas de missions à venir. Créez votre première mission !'
                    : 'Vous n\'avez pas encore organisé de missions.'}
                </p>
                {missionFilter === 'active' && (
                  <button
                    onClick={handleCreateMission}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium"
                  >
                    Créer une mission
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'volunteers' && (
          <div>
            {/* Pending volunteers */}
            {pendingVolunteers.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-3">Demandes en attente</h2>
                <div className="space-y-3">
                  {pendingVolunteers.map(volunteer => (
                    <div 
                      key={volunteer.id}
                      className="bg-white rounded-lg shadow-sm p-4"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 mr-3">
                            {volunteer.profiles.avatar_url ? (
                              <img 
                                src={volunteer.profiles.avatar_url} 
                                alt="" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-6 h-6 text-gray-400 m-auto" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium">
                              {volunteer.profiles.first_name} {volunteer.profiles.last_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Pour: {volunteer.missions.title}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleVolunteerAction(volunteer.id, 'approve')}
                            className="p-2 bg-green-100 text-green-700 rounded-full"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleVolunteerAction(volunteer.id, 'reject')}
                            className="p-2 bg-red-100 text-red-700 rounded-full"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* All volunteers */}
            <h2 className="text-lg font-bold mb-3">Tous les bénévoles</h2>
            {volunteers.length > 0 ? (
              <div className="space-y-3">
                {volunteers
                  .filter(v => v.status !== 'pending')
                  .map(volunteer => (
                    <div 
                      key={volunteer.id}
                      className="bg-white rounded-lg shadow-sm p-4"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 mr-3">
                            {volunteer.profiles.avatar_url ? (
                              <img 
                                src={volunteer.profiles.avatar_url} 
                                alt="" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-6 h-6 text-gray-400 m-auto" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium">
                              {volunteer.profiles.first_name} {volunteer.profiles.last_name}
                            </h3>
                            <div className="flex items-center">
                              <p className="text-sm text-gray-600 mr-2">
                                Pour: {volunteer.missions.title}
                              </p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                volunteer.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {volunteer.status === 'confirmed' ? 'Confirmé' : 'Refusé'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <button
                            onClick={() => window.location.href = `mailto:${volunteer.profiles.email}`}
                            className="text-primary text-sm font-medium"
                          >
                            Contacter
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium mb-2">Aucun bénévole</h3>
                <p className="text-gray-600">
                  Vous n'avez pas encore de bénévoles inscrits à vos missions.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssociationDashboard;
