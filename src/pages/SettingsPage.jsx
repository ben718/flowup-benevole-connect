import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Shield, Globe, HelpCircle, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import BottomNavigation from '../components/BottomNavigation';
import ErrorMessage from '../components/ErrorMessage';
import { safePromise, safeSupabaseCall, markErrorAsHandled } from '../lib/errorHandling';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notificationSettings, setNotificationSettings] = useState({
    new_mission: true,
    mission_reminder: true,
    mission_confirmation: true,
    platform_updates: false
  });
  const [radiusKm, setRadiusKm] = useState(15);
  const [languagePreference, setLanguagePreference] = useState('fr');

  useEffect(() => {
    if (!user && !authLoading) {
      console.log('redirect /settings', { user, authLoading });
      navigate('/login', { state: { redirectTo: '/settings' } });
      return;
    }    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (profile) {
          // Charger les préférences de notification depuis le profil utilisateur
          if (profile.notification_preferences) {
            setNotificationSettings(profile.notification_preferences);
          }
          
          // Charger le rayon de distance max
          if (profile.max_distance) {
            setRadiusKm(profile.max_distance);
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        setError('Impossible de charger vos paramètres. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      console.time('fetchSettings');
      fetchSettings().catch(console.error).finally(() => console.timeEnd('fetchSettings'));
    }
  }, [user, authLoading, profile, navigate]);
  const handleToggleNotification = async (key) => {
    try {
      const updatedSettings = {
        ...notificationSettings,
        [key]: !notificationSettings[key]
      };
      
      setNotificationSettings(updatedSettings);
      setError(null);
      
      const [updateError] = await safeSupabaseCall(
        supabase
          .from('profiles')
          .update({
            notification_preferences: updatedSettings
          })
          .eq('id', user.id),
        'mise à jour des paramètres de notification'
      );
      
      if (updateError) {
        markErrorAsHandled(updateError);
        setError(`Erreur lors de la mise à jour: ${updateError.message}`);
        // Revert the UI change if the server update failed
        setNotificationSettings(notificationSettings);
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      setError(`Une erreur inattendue est survenue: ${error.message}`);
      // Revert the UI change
      setNotificationSettings(notificationSettings);
    }
  };

  const handleRadiusChange = (e) => {
    setRadiusKm(parseInt(e.target.value));
  };
  const handleSaveRadius = async () => {
    try {
      setError(null);
      
      const [updateError] = await safeSupabaseCall(
        supabase
          .from('profiles')
          .update({
            max_distance: radiusKm
          })
          .eq('id', user.id),
        'mise à jour du rayon de recherche'
      );
      
      if (updateError) {
        markErrorAsHandled(updateError);
        setError(`Erreur lors de la mise à jour du rayon: ${updateError.message}`);
      }
    } catch (error) {
      console.error('Error updating radius:', error);
      setError(`Une erreur inattendue est survenue: ${error.message}`);
    }
  };
  const handleLanguageChange = async (e) => {
    const lang = e.target.value;
    setLanguagePreference(lang);
    setError(null);
    
    try {
      // Dans une application réelle, nous pourrions sauvegarder la préférence de langue
      // dans la base de données
      const [updateError] = await safeSupabaseCall(
        supabase
          .from('profiles')
          .update({
            language_preference: lang
          })
          .eq('id', user.id),
        'mise à jour de la langue'
      );
      
      if (updateError) {
        markErrorAsHandled(updateError);
        setError(`Erreur lors de la mise à jour de la langue: ${updateError.message}`);
      }
    } catch (error) {
      console.error('Error updating language preference:', error);
      setError(`Une erreur inattendue est survenue: ${error.message}`);
    }
  };
  const handleLogout = async () => {
    try {
      setError(null);
      
      const [logoutError] = await safePromise(signOut(), 'déconnexion');
      
      if (logoutError) {
        markErrorAsHandled(logoutError);
        console.error('Error logging out:', logoutError);
        // Still navigate away even if there was an error
      }
      
      navigate('/');
    } catch (error) {
      console.error('Unexpected error during logout:', error);
      navigate('/'); // Still navigate away
    }
  };

  if (loading || authLoading) {
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
      <div className="flex-1 p-6">        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold">Paramètres</h1>
        </div>
        
        {/* Affichage des erreurs */}
        <ErrorMessage message={error} onDismiss={() => setError(null)} />

        <div className="space-y-6">
          {/* Notifications */}
          <section className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center mb-4">
              <Bell className="text-vs-blue-primary mr-3" />
              <h2 className="text-lg font-semibold">Notifications</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p>Nouvelles missions à proximité</p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={notificationSettings.new_mission}
                    onChange={() => handleToggleNotification('new_mission')}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-vs-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vs-blue-primary"></div>
                </label>
              </div>
              
              <div className="flex justify-between items-center">
                <p>Rappels de missions</p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={notificationSettings.mission_reminder}
                    onChange={() => handleToggleNotification('mission_reminder')}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-vs-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vs-blue-primary"></div>
                </label>
              </div>
              
              <div className="flex justify-between items-center">
                <p>Confirmations de mission</p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={notificationSettings.mission_confirmation}
                    onChange={() => handleToggleNotification('mission_confirmation')}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-vs-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vs-blue-primary"></div>
                </label>
              </div>
              
              <div className="flex justify-between items-center">
                <p>Mises à jour de la plateforme</p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={notificationSettings.platform_updates}
                    onChange={() => handleToggleNotification('platform_updates')}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-vs-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vs-blue-primary"></div>
                </label>
              </div>
            </div>
          </section>
          
          {/* Distance */}
          <section className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center mb-4">
              <Globe className="text-vs-blue-primary mr-3" />
              <h2 className="text-lg font-semibold">Distance maximale</h2>
            </div>
            
            <div className="space-y-3">
              <p>Missions dans un rayon de {radiusKm} km</p>
              <input
                type="range"
                min="1"
                max="50"
                value={radiusKm}
                onChange={handleRadiusChange}
                onMouseUp={handleSaveRadius}
                onTouchEnd={handleSaveRadius}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1 km</span>
                <span>25 km</span>
                <span>50 km</span>
              </div>
            </div>
          </section>
          
          {/* Langue */}
          <section className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center mb-4">
              <Globe className="text-vs-blue-primary mr-3" />
              <h2 className="text-lg font-semibold">Langue</h2>
            </div>
            
            <select
              value={languagePreference}
              onChange={handleLanguageChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>          </section>
          
          {/* Aide et Support */}
          <section className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center mb-4">
              <HelpCircle className="text-vs-blue-primary mr-3" />
              <h2 className="text-lg font-semibold">Aide et Support</h2>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate('/help')}
                className="flex justify-between items-center w-full"
              >
                <span>Aide et FAQ</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <a 
                href="mailto:contact@voisin-solidaire.fr" 
                className="flex justify-between items-center w-full"
              >
                <span>Contacter le support</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </section>
          
          {/* Confidentialité */}
          <section className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center mb-4">
              <Shield className="text-vs-blue-primary mr-3" />
              <h2 className="text-lg font-semibold">Confidentialité</h2>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate('/privacy')}
                className="flex justify-between items-center w-full"
              >
                <span>Politique de confidentialité</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button
                onClick={() => navigate('/terms')}
                className="flex justify-between items-center w-full"
              >
                <span>Conditions d'utilisation</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </section>
          
          {/* Aide */}
          <section className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center mb-4">
              <HelpCircle className="text-vs-blue-primary mr-3" />
              <h2 className="text-lg font-semibold">Aide</h2>
            </div>
            
            <div className="space-y-3">
              <button
                className="flex justify-between items-center w-full"
              >
                <span>Centre d'aide</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button
                className="flex justify-between items-center w-full"
              >
                <span>Nous contacter</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </section>
          
          {/* Déconnexion */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full p-4 bg-red-500 text-white rounded-lg"
          >
            <LogOut className="mr-2" size={18} />
            Déconnexion
          </button>
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default SettingsPage;
