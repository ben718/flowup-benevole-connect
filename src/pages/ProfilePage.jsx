import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Award, LogOut, Mail, Phone, MapPin, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import BottomNavigation from '../components/BottomNavigation';
import { safePromise, safeSupabaseCall, markErrorAsHandled } from '../lib/errorHandling';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, setProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [badges, setBadges] = useState([]);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    missionsCompleted: 0,
    hoursVolunteered: 0
  });
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    city: '',
    bio: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (!user && !loading) {
      console.log('redirect /profile', { user, loading });
      navigate('/login', { state: { redirectTo: '/profile' } });
      return;
    }    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // If profile data is already available from context
        if (profile) {
          setFormData({
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            email: profile.email || user.email || '',
            phone: profile.phone || '',
            city: profile.city || '',
            bio: profile.bio || '',
            avatar_url: profile.avatar_url || ''
          });
        }
        
        // Fetch user badges
        const [badgeError, badgeData] = await safeSupabaseCall(
          supabase
            .from('user_badges')
            .select(`
              id,
              badges (
                id,
                name,
                description,
                icon_url
              )
            `)
            .eq('user_id', user.id),
          'récupération des badges'
        );
        
        if (badgeError) {
          markErrorAsHandled(badgeError);
          console.warn('Erreur lors de la récupération des badges:', badgeError.message);
          // Continue with execution - badges are non-critical
        } else {
          const processedBadges = badgeData.map(item => item.badges);
          setBadges(processedBadges);
        }
        
        // Fetch user statistics
        const [missionError, missionData] = await safeSupabaseCall(
          supabase
            .from('mission_registrations')
            .select(`
              missions (
                id,
                start_time,
                end_time
              )
            `)
            .eq('user_id', user.id)
            .eq('status', 'completed'),
          'récupération des statistiques'
        );
        
        if (missionError) {
          markErrorAsHandled(missionError);
          console.warn('Erreur lors de la récupération des statistiques:', missionError.message);
          // Continue with execution - stats are non-critical
        } else {
          // Calculate total missions and hours
          const missionsCompleted = missionData.length;
          let totalHours = 0;
          
          missionData.forEach(item => {
            const mission = item.missions;
            if (mission && mission.start_time && mission.end_time) {
              const start = new Date(`2000-01-01T${mission.start_time}`);
              const end = new Date(`2000-01-01T${mission.end_time}`);
              const hours = (end - start) / (1000 * 60 * 60);
              totalHours += hours;
            }          });
          
          setStats({
            missionsCompleted,
            hoursVolunteered: Math.round(totalHours)
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Don't block the UI for data fetch errors
      } finally {
        setLoading(false);
      }
    };
    
    console.time('fetchUserData');
    fetchUserData().catch(console.error).finally(() => console.timeEnd('fetchUserData'));
  }, [user, navigate, profile]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const [error] = await safeSupabaseCall(
        supabase
          .from('profiles')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            city: formData.city,
            bio: formData.bio
          })
          .eq('id', user.id),
        'mise à jour du profil'
      );
      
      if (error) {
        markErrorAsHandled(error);
        throw error;
      }
      
      // Update profile context
      setProfile({
        ...profile,
        ...formData
      });
      
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(`Erreur lors de la mise à jour du profil: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  const handleAvatarChange = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      
      setLoading(true);
      
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const [uploadError] = await safeSupabaseCall(
        supabase.storage
          .from('user-avatars')
          .upload(filePath, file),
        'téléchargement de l\'avatar'
      );
      
      if (uploadError) {
        markErrorAsHandled(uploadError);
        throw uploadError;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);
      
      // Update profile with new avatar URL
      const [updateError] = await safeSupabaseCall(
        supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id),
        'mise à jour de l\'URL de l\'avatar'
      );
      
      if (updateError) {
        markErrorAsHandled(updateError);
        throw updateError;
      }
      
      // Update local state
      setFormData({ ...formData, avatar_url: publicUrl });
      
      // Update profile context
      setProfile({
        ...profile,
        avatar_url: publicUrl
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = async () => {
    try {
      const [error] = await safePromise(signOut(), 'déconnexion');
      
      if (error) {
        markErrorAsHandled(error);
        console.error('Error logging out:', error);
        // Continue to navigate away even if there was an error
      }
      
      navigate('/');
    } catch (error) {
      console.error('Unexpected error during logout:', error);
      navigate('/'); // Still navigate away
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <div className="bg-primary text-white p-6">
        <div className="flex justify-between items-center">          <h1 className="text-2xl font-bold">Mon Profil</h1>
          <div className="flex space-x-2">
            <button 
              onClick={() => navigate('/settings')}
              className="p-2 rounded-full hover:bg-white/10"
            >
              <Settings className="w-6 h-6" />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-white/10"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1">
        {editMode ? (
          <form onSubmit={handleSubmit} className="p-6">
            {/* Avatar upload */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                  {formData.avatar_url ? (
                    <img 
                      src={formData.avatar_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <User className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer">
                  <Edit className="w-4 h-4" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
            </div>
            
            {/* Form fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">À propos de moi</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                ></textarea>
              </div>
            </div>
            
            {/* Buttons */}
            <div className="mt-6 flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white py-3 rounded-lg font-medium"
              >
                {loading ? <LoadingSpinner small /> : 'Enregistrer'}
              </button>
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium"
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <div>
            {/* Profile header */}
            <div className="p-6 border-b">
              <div className="flex items-center">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 mr-4">
                  {formData.avatar_url ? (
                    <img 
                      src={formData.avatar_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <User className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {formData.first_name} {formData.last_name}
                  </h2>
                  <p className="text-gray-600 flex items-center mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {formData.city || 'Aucune ville renseignée'}
                  </p>
                  <button
                    onClick={() => setEditMode(true)}
                    className="mt-2 text-primary text-sm font-medium flex items-center"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Modifier mon profil
                  </button>
                </div>
              </div>
              
              {formData.bio && (
                <div className="mt-4">
                  <p className="text-gray-700">{formData.bio}</p>
                </div>
              )}
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-gray-700">{formData.email}</span>
                </div>
                {formData.phone && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-gray-700">{formData.phone}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Stats */}
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold mb-4">Mes statistiques</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700 mb-1">Missions réalisées</p>
                  <p className="text-2xl font-bold text-blue-800">{stats.missionsCompleted}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-700 mb-1">Heures de bénévolat</p>
                  <p className="text-2xl font-bold text-green-800">{stats.hoursVolunteered}</p>
                </div>
              </div>
            </div>
            
            {/* Badges */}
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">Mes badges</h3>
              {badges.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {badges.map((badge, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg flex items-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                        {badge.icon_url ? (
                          <img src={badge.icon_url} alt={badge.name} className="w-6 h-6" />
                        ) : (
                          <Award className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{badge.name}</p>
                        <p className="text-xs text-gray-600">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h4 className="text-lg font-medium mb-2">Aucun badge pour le moment</h4>
                  <p className="text-gray-600 mb-4">
                    Participez à des missions pour gagner des badges !
                  </p>
                  <button
                    onClick={() => navigate('/explore')}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium"
                  >
                    Explorer les missions
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;
