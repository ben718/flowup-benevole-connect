import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthContext } from '../contexts/AuthContext';
import { useMissions } from '../hooks/useMissions';
import { getUserLocation } from '../lib/utils';
import LoadingSpinner from '../components/LoadingSpinner';
import MissionCard from '../components/MissionCard';
import NotificationCenter from '../components/NotificationCenter';
import BottomNavigation from '../components/BottomNavigation';

const HomePage = () => {
  const { user, userProfile, associationProfile } = useContext(AuthContext);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [userStats, setUserStats] = useState({
    missions: 0,
    hours: 0,
    associations: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeoutReached, setTimeoutReached] = useState(false);
  
  // Utiliser le hook useMissions pour récupérer les missions à proximité
  const { missions, loading: missionsLoading, error: missionsError } = useMissions(
    userLocation ? { 
      location: userLocation, 
      distance: userProfile?.max_distance || 15 
    } : {}
  );

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const location = await getUserLocation();
        setUserLocation(location);
      } catch (error) {
        setLocationError(error.message || "Impossible d'obtenir votre position.");
      }
    };
    
    const fetchUserStats = async () => {
      try {
        if (!user) return;
        
        setLoading(true);
        
        // Récupérer les statistiques de l'utilisateur
        const { data: userRegistrations, error } = await supabase
          .from('mission_registrations')
          .select(`
            *,
            mission:missions(
              *,
              association:associations(id, name)
            )
          `)
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        if (userRegistrations) {
          // Calculer les heures de bénévolat
          const totalHours = userRegistrations.reduce((acc, reg) => {
            if (reg.status === 'completed' && reg.mission) {
              return acc + (reg.mission.duration / 60);
            }
            return acc;
          }, 0);
          
          // Calculer le nombre de missions complétées
          const completedMissions = userRegistrations.filter(reg => reg.status === 'completed').length;
          
          // Calculer le nombre d'associations uniques
          const uniqueAssociations = new Set(
            userRegistrations
              .filter(reg => reg.status === 'completed')
              .map(reg => reg.mission?.association?.id)
              .filter(id => id)
          ).size;
          
          setUserStats({
            missions: completedMissions,
            hours: Math.round(totalHours * 10) / 10, // Arrondir à 1 décimale
            associations: uniqueAssociations
          });
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    console.time('fetchLocation');
    fetchLocation().catch(console.error).finally(() => console.timeEnd('fetchLocation'));
    console.time('fetchUserStats');
    fetchUserStats().catch(console.error).finally(() => console.timeEnd('fetchUserStats'));
    
    const timer = setTimeout(() => setTimeoutReached(true), 10000); // 10s timeout
    return () => clearTimeout(timer);
  }, [user, userProfile]);
  
  // Si l'utilisateur est une association, rediriger vers le tableau de bord d'association
  if (associationProfile) {
    return <AssociationRedirect />;
  }

  return (
    <div className="bg-vs-gray-100 flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-vs-gray-800">Voisin Solidaire</h1>
          </div>
          <div className="flex items-center space-x-3">
            <NotificationCenter />
            <Link to="/profile" className="h-8 w-8 rounded-full bg-vs-blue-primary flex items-center justify-center text-white font-medium">
              {userProfile?.first_name?.charAt(0) || 'U'}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 pb-20">
        {locationError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4">
            <span className="block sm:inline">{locationError}</span>
          </div>
        )}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <LoadingSpinner fullScreen />
            {timeoutReached && (
              <div className="mt-6 text-center">
                <p>Le chargement prend trop de temps.<br />
                  Vérifiez votre connexion ou
                  <button onClick={() => window.location.reload()} className="underline text-blue-600 ml-1">rafraîchissez la page</button>.
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Welcome Section */}
            <section className="mb-6">
              <h2 className="text-2xl font-bold text-vs-gray-800 mb-2">
                Bonjour, {userProfile?.first_name || 'Bénévole'} 👋
              </h2>
              <p className="text-vs-gray-600">Prêt à aider près de chez vous aujourd'hui ?</p>
            </section>

            {/* Impact Stats */}
            <section className="bg-white rounded-xl p-4 shadow-sm mb-6">
              <h3 className="text-lg font-semibold text-vs-gray-800 mb-3">Votre impact</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2">
                  <p className="text-xl font-bold text-vs-blue-primary">{userStats.missions}</p>
                  <p className="text-xs text-vs-gray-600">Missions</p>
                </div>
                <div className="p-2">
                  <p className="text-xl font-bold text-vs-green-secondary">{userStats.hours}h</p>
                  <p className="text-xs text-vs-gray-600">Temps donné</p>
                </div>
                <div className="p-2">
                  <p className="text-xl font-bold text-vs-orange-accent">{userStats.associations}</p>
                  <p className="text-xs text-vs-gray-600">Associations</p>
                </div>
              </div>
            </section>

            {/* Instant Missions */}
            <section className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-vs-gray-800">Missions instantanées</h3>
                <Link to="/explore" className="text-sm text-vs-blue-primary">
                  Voir tout
                </Link>
              </div>
              
              {missionsLoading ? (
                <LoadingSpinner />
              ) : missionsError ? (
                <div className="text-vs-error text-center py-4">
                  Une erreur est survenue lors du chargement des missions.
                </div>
              ) : missions.length === 0 ? (
                <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                  <p className="text-vs-gray-600">
                    Aucune mission à proximité pour le moment.
                  </p>
                  <Link
                    to="/explore"
                    className="mt-2 inline-block text-vs-blue-primary hover:underline"
                  >
                    Explorer d'autres missions
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {missions.slice(0, 3).map((mission) => (
                    <MissionCard key={mission.id} mission={mission} />
                  ))}
                </div>
              )}
            </section>

            {/* Upcoming Missions */}
            <section className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-vs-gray-800">Vos prochaines missions</h3>
                <Link to="/missions" className="text-sm text-vs-blue-primary">
                  Voir tout
                </Link>
              </div>
              
              <UpcomingMissions userId={user?.id} />
            </section>
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

// Composant pour rediriger les associations
const AssociationRedirect = () => {
  useEffect(() => {
    window.location.href = '/association/dashboard';
  }, []);
  
  return <LoadingSpinner fullScreen />;
};

// Composant pour afficher les prochaines missions de l'utilisateur
const UpcomingMissions = ({ userId }) => {
  const [upcomingMissions, setUpcomingMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUpcomingMissions = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('mission_registrations')
          .select(`
            *,
            mission:missions(
              *,
              association:associations(id, name, logo_url)
            )
          `)
          .eq('user_id', userId)
          .eq('status', 'confirmed')
          .order('mission(date)', { ascending: true })
          .limit(3);
        
        if (error) throw error;
        
        // Transformer les données pour correspondre au format attendu par MissionCard
        const transformedMissions = data
          .filter(reg => reg.mission)
          .map(reg => ({
            ...reg.mission,
            registration_id: reg.id,
            registration_status: reg.status
          }));
        
        setUpcomingMissions(transformedMissions);
      } catch (error) {
        console.error('Error fetching upcoming missions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    console.time('fetchUpcomingMissions');
    fetchUpcomingMissions().catch(console.error).finally(() => console.timeEnd('fetchUpcomingMissions'));
  }, [userId]);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (upcomingMissions.length === 0) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm text-center">
        <p className="text-vs-gray-600">
          Vous n'avez pas encore de missions à venir.
        </p>
        <Link
          to="/explore"
          className="mt-2 inline-block text-vs-blue-primary hover:underline"
        >
          Découvrir des missions
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {upcomingMissions.map((mission) => (
        <div
          key={mission.id}
          className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => window.location.href = `/mission/${mission.id}`}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-vs-gray-800">{mission.title}</h4>
            <span className="bg-vs-green-light text-vs-green-dark text-xs px-2 py-1 rounded-full font-medium">
              Confirmée
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-vs-gray-600">
            <div className="flex items-center">
              <Calendar size={14} className="mr-1" />
              <span>
                {new Date(mission.date).toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'short' 
                })}
              </span>
            </div>
            
            <div className="flex items-center">
              <Clock size={14} className="mr-1" />
              <span>
                {mission.start_time.substring(0, 5)} - {mission.end_time.substring(0, 5)}
              </span>
            </div>
            
            <div className="flex items-center">
              <MapPin size={14} className="mr-1" />
              <span>{mission.city}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HomePage;
