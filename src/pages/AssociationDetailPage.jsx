import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, Globe, Users, Award, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import BottomNavigation from '../components/BottomNavigation';

const AssociationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [association, setAssociation] = useState(null);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  useEffect(() => {
    const fetchAssociationDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch association data
        const { data: associationData, error: associationError } = await supabase
          .from('associations')
          .select('*')
          .eq('id', id)
          .single();
        
        if (associationError) throw associationError;
        if (!associationData) {
          navigate('/not-found');
          return;
        }
        
        setAssociation(associationData);
        
        // Fetch missions by this association
        const { data: missionsData, error: missionsError } = await supabase
          .from('missions')
          .select('*')
          .eq('association_id', id)
          .eq('status', 'published')
          .order('date', { ascending: true });
        
        if (missionsError) throw missionsError;
        setMissions(missionsData);
      } catch (error) {
        console.error('Error fetching association details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    console.time('fetchAssociationDetails');
    fetchAssociationDetails().catch(console.error).finally(() => console.timeEnd('fetchAssociationDetails'));
  }, [id]);

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

  if (!association) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-4">Association non trouvée</h1>
          <p className="text-gray-600 mb-6">L'association que vous recherchez n'existe pas ou a été supprimée.</p>
          <button 
            onClick={() => navigate('/explore')} 
            className="px-4 py-2 bg-primary text-white rounded-lg"
          >
            Explorer les missions
          </button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <div className="flex-1">
        {/* Association Header */}
        <div className="h-64 w-full bg-gray-300 relative">
          {association.logo_url ? (
            <img 
              src={association.logo_url} 
              alt={association.name} 
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
        
        {/* Association Content */}
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-2">
            {association.categories && association.categories.map((category, index) => (
              <span key={index} className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                {category}
              </span>
            ))}
            {association.verified && (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Vérifiée
              </span>
            )}
          </div>
          
          <h1 className="text-2xl font-bold mb-4">{association.name}</h1>
          
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <div className="flex space-x-8">
              <button
                className={`pb-4 ${activeTab === 'about' ? 'border-b-2 border-primary font-medium text-primary' : 'text-gray-500'}`}
                onClick={() => setActiveTab('about')}
              >
                À propos
              </button>
              <button
                className={`pb-4 ${activeTab === 'missions' ? 'border-b-2 border-primary font-medium text-primary' : 'text-gray-500'}`}
                onClick={() => setActiveTab('missions')}
              >
                Missions ({missions.length})
              </button>
            </div>
          </div>
          
          {/* About Tab */}
          {activeTab === 'about' && (
            <div>
              <p className="text-gray-700 mb-6">{association.description}</p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-primary mr-3 mt-1" />
                  <div>
                    <p className="font-medium">Adresse</p>
                    <p className="text-gray-600">{association.address}, {association.city}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Phone className="w-5 h-5 text-primary mr-3 mt-1" />
                  <div>
                    <p className="font-medium">Téléphone</p>
                    <p className="text-gray-600">{association.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-primary mr-3 mt-1" />
                  <div>
                    <p className="font-medium">Email</p>
                    <a href={`mailto:${association.email}`} className="text-primary hover:underline">
                      {association.email}
                    </a>
                  </div>
                </div>
                
                {association.website && (
                  <div className="flex items-start">
                    <Globe className="w-5 h-5 text-primary mr-3 mt-1" />
                    <div>
                      <p className="font-medium">Site web</p>
                      <a 
                        href={association.website.startsWith('http') ? association.website : `https://${association.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {association.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col space-y-2 mb-6">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-primary mr-2" />
                  <span className="font-medium">Bénévoles engagés:</span>
                  <span className="ml-2">{association.total_volunteers_engaged || 0}</span>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-primary mr-2" />
                  <span className="font-medium">Missions créées:</span>
                  <span className="ml-2">{association.total_missions_created || 0}</span>
                </div>
                
                <div className="flex items-center">
                  <Award className="w-5 h-5 text-primary mr-2" />
                  <span className="font-medium">Impact:</span>
                  <span className="ml-2">{association.impact_score || 0} points</span>
                </div>
              </div>
              
              {association.siret && (
                <div className="bg-gray-50 p-4 rounded-lg mb-8">
                  <p className="font-medium">SIRET</p>
                  <p className="text-gray-600">{association.siret}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Missions Tab */}
          {activeTab === 'missions' && (
            <div>
              {missions.length > 0 ? (
                <div className="space-y-4">
                  {missions.map(mission => (
                    <div 
                      key={mission.id} 
                      className="bg-white rounded-lg shadow p-4 cursor-pointer"
                      onClick={() => navigate(`/mission/${mission.id}`)}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                          {mission.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(mission.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                      </div>
                      
                      <h3 className="font-semibold mb-1">{mission.title}</h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{mission.short_description}</p>
                      
                      <div className="flex justify-between text-xs text-gray-500">
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {mission.city}
                        </div>
                        
                        <div className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {mission.spots_available - (mission.spots_taken || 0)}/{mission.spots_available} places
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-center">
                    Cette association n'a pas encore publié de missions.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default AssociationDetailPage;
