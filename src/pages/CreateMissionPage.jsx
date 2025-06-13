import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, Award, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import useCategories from '../hooks/useCategories';
import LoadingSpinner from '../components/LoadingSpinner';

// Fonction pour calculer la durée en minutes entre deux heures
const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return 60; // Durée par défaut en minutes
  
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  // Calculer le nombre total de minutes
  let startTotalMinutes = startHours * 60 + startMinutes;
  let endTotalMinutes = endHours * 60 + endMinutes;
  
  // Gérer le cas où la mission se termine le jour suivant
  if (endTotalMinutes < startTotalMinutes) {
    endTotalMinutes += 24 * 60;
  }
  
  return endTotalMinutes - startTotalMinutes;
};

const CreateMissionPage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // If editing existing mission
  const { user } = useAuth();
  const { categories, loading: categoriesLoading } = useCategories();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [association, setAssociation] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [badges, setBadges] = useState([]);
  const [selectedBadges, setSelectedBadges] = useState([]);  const [formData, setFormData] = useState({
    title: '',
    description: '',
    short_description: '',
    category: '',
    date: '',
    start_time: '',
    end_time: '',
    address: '',
    city: '',
    postal_code: '',
    latitude: null,
    longitude: null,
    spots_available: 1,
    requirements: '',
    image_url: ''
  });

  useEffect(() => {
    if (!user && !loading) {
      console.log('redirect /create-mission', { user, loading });
      navigate('/login', { state: { redirectTo: id ? `/edit-mission/${id}` : '/create-mission' } });
      return;
    }
    console.time('fetchInitialData');
    fetchInitialData().catch(console.error).finally(() => console.timeEnd('fetchInitialData'));
  }, [user, navigate, id]);

  useEffect(() => {
    const fetchInitialData = async () => {
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
        
        // Fetch all available badges
        const { data: badgeData, error: badgeError } = await supabase
          .from('badges')
          .select('*');
        
        if (badgeError) throw badgeError;
        setBadges(badgeData);
        
        // If editing, fetch mission data
        if (id) {
          setIsEditing(true);
          
          const { data: missionData, error: missionError } = await supabase
            .from('missions')
            .select('*')
            .eq('id', id)
            .single();
          
          if (missionError) throw missionError;
          
          // Check if this mission belongs to the user's association
          if (missionData.association_id !== associationData.id) {
            navigate('/association-dashboard');
            return;
          }
          
          setFormData({
            title: missionData.title || '',
            description: missionData.description || '',
            category: missionData.category || '',
            start_date: missionData.start_date || '',
            end_date: missionData.end_date || '',
            start_time: missionData.start_time || '',
            end_time: missionData.end_time || '',            address: missionData.address || '',
            city: missionData.city || '',
            latitude: missionData.latitude || null,
            longitude: missionData.longitude || null,
            spots_available: missionData.spots_available || 1,
            requirements: missionData.requirements || '',
            image_url: missionData.image_url || ''
          });
          
          if (missionData.image_url) {
            setImagePreview(missionData.image_url);
          }
          
          if (missionData.badges) {
            setSelectedBadges(missionData.badges);
          }
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [user, navigate, id]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData({ ...formData, [name]: parseInt(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleBadgeToggle = (badge) => {
    if (selectedBadges.includes(badge)) {
      setSelectedBadges(selectedBadges.filter(b => b !== badge));
    } else {
      setSelectedBadges([...selectedBadges, badge]);
    }
  };

  const handleAddressSearch = async () => {
    try {
      const address = `${formData.address}, ${formData.city}, France`;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        setFormData({
          ...formData,
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        });
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!association) return;
    
    try {
      setSaving(true);
      
      // First handle image upload if there's a new image
      let imageUrl = formData.image_url;
      
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `mission-images/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('mission-images')
          .upload(filePath, imageFile);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('mission-images')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrl;
      }
      
      // Handle geocoding if not already done
      if (!formData.latitude || !formData.longitude) {
        await handleAddressSearch();
      }
        // Créer une description courte si elle n'est pas renseignée
      const short_description = formData.short_description || 
                              (formData.description.length > 150 ? 
                               formData.description.substring(0, 147) + '...' : 
                               formData.description);
      
      const missionData = {
        title: formData.title,
        description: formData.description,
        short_description: short_description,
        category: formData.category,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postal_code || '',
        latitude: formData.latitude,
        longitude: formData.longitude,
        spots_available: formData.spots_available,
        requirements: formData.requirements,
        image_url: imageUrl,
        association_id: association.id,
        badges: selectedBadges,
        duration: calculateDuration(formData.start_time, formData.end_time)
      };
      
      if (isEditing) {
        // Update existing mission
        const { error } = await supabase
          .from('missions')
          .update(missionData)
          .eq('id', id);
        
        if (error) throw error;
      } else {
        // Create new mission
        const { error } = await supabase
          .from('missions')
          .insert([missionData]);
        
        if (error) throw error;
      }
      
      navigate('/association-dashboard');
    } catch (error) {
      console.error('Error saving mission:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-6">
      <div className="bg-primary text-white p-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-3"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Modifier la mission' : 'Créer une mission'}
          </h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        {/* Mission image */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Image de la mission</label>
          <div 
            className="h-48 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden mb-2"
            style={{
              backgroundImage: imagePreview ? `url(${imagePreview})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {!imagePreview && (
              <div className="text-center p-4">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Aucune image sélectionnée</p>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
          />
        </div>
        
        {/* Mission details */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre de la mission *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={categoriesLoading}
            >
              <option value="">Sélectionner une catégorie</option>              {categoriesLoading ? (
                <option value="" disabled>Chargement des catégories...</option>
              ) : 
                categories.map(category => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))
              }
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            ></textarea>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prérequis</label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Compétences ou qualifications requises (optionnel)"
            ></textarea>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de début *</label>
              <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
                <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  className="w-full focus:outline-none"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
              <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
                <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="w-full focus:outline-none"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heure de début *</label>
              <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
                <Clock className="w-5 h-5 text-gray-400 mr-2" />
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  required
                  className="w-full focus:outline-none"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heure de fin *</label>
              <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
                <Clock className="w-5 h-5 text-gray-400 mr-2" />
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  required
                  className="w-full focus:outline-none"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse *</label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
              <MapPin className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full focus:outline-none"
                placeholder="Numéro et nom de rue"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
              <MapPin className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full focus:outline-none"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de bénévoles *</label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
              <Users className="w-5 h-5 text-gray-400 mr-2" />              <input
                type="number"
                name="spots_available"
                value={formData.spots_available}
                onChange={handleChange}
                min="1"
                required
                className="w-full focus:outline-none"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Badges à gagner</label>
            <div className="flex items-center mb-2">
              <Award className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">
                Sélectionnez les badges que les bénévoles pourront gagner
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {badges.map(badge => (
                <button
                  key={badge.id}
                  type="button"
                  onClick={() => handleBadgeToggle(badge.name)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedBadges.includes(badge.name)
                      ? 'bg-secondary text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {badge.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium flex items-center justify-center"
          >
            {saving ? (
              <>
                <LoadingSpinner small />
                <span className="ml-2">Enregistrement...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                {isEditing ? 'Mettre à jour la mission' : 'Créer la mission'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateMissionPage;
