import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Building, Info, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { safePromise, safeSupabaseCall, markErrorAsHandled } from '../lib/errorHandling';

const CreateAssociationPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    website: '',
    contact_name: '',
    contact_email: '',
    contact_role: '',
    logo_url: ''
  });

  useEffect(() => {
    if (!user && !loading) {
      console.log('redirect /create-association', { user, loading });
      navigate('/login', { state: { redirectTo: '/create-association' } });
      return;
    }    const checkExistingAssociation = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if user has association role
        const [profileError, userProfile] = await safeSupabaseCall(
          supabase
            .from('profiles')
            .select('role, email, first_name, last_name')
            .eq('id', user.id)
            .single(),
          'vérification du profil utilisateur'
        );
        
        if (profileError) {
          markErrorAsHandled(profileError);
          throw profileError;
        }
        
        // Check if association already exists
        const [associationError, associationData] = await safeSupabaseCall(
          supabase
            .from('associations')
            .select('*')
            .eq('user_id', user.id),
          'vérification de l\'association existante'
        );
        
        if (associationError) {
          markErrorAsHandled(associationError);
          throw associationError;
        }
        
        if (associationData && associationData.length > 0) {
          // Association already exists, redirect to dashboard
          navigate('/association-dashboard');
          return;
        }
        
        // Pre-fill form with user data
        setFormData({
          ...formData,
          email: userProfile.email || '',
          contact_name: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim(),
          contact_email: userProfile.email || ''
        });
      } catch (error) {
        console.error('Error checking existing association:', error);
        setError('Erreur lors de la vérification des données: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    checkExistingAssociation();
  }, [user, navigate, formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLogoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      // Validate required fields
      const requiredFields = ['name', 'description', 'email', 'phone', 'city', 'contact_name', 'contact_email'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }
      
      // First handle logo upload if there's a logo
      let logoUrl = '';
      
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${user.id}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `association-logos/${fileName}`;
        
        const [uploadError] = await safeSupabaseCall(
          supabase.storage
            .from('association-logos')
            .upload(filePath, logoFile),
          'téléchargement du logo'
        );
        
        if (uploadError) {
          markErrorAsHandled(uploadError);
          throw new Error('Erreur lors du téléchargement du logo: ' + uploadError.message);
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('association-logos')
          .getPublicUrl(filePath);
        
        logoUrl = publicUrl;
      }
      
      // Create association record
      const [associationError] = await safeSupabaseCall(
        supabase
          .from('associations')
          .insert([
            {
              name: formData.name,
              description: formData.description,
              email: formData.email,
              phone: formData.phone,
              address: formData.address,
              city: formData.city,
              website: formData.website,
              contact_name: formData.contact_name,
              contact_email: formData.contact_email,
              contact_role: formData.contact_role,
              logo_url: logoUrl,
              user_id: user.id
            }
          ]),
        'création de l\'association'
      );
      
      if (associationError) {
        markErrorAsHandled(associationError);
        throw new Error('Erreur lors de la création de l\'association: ' + associationError.message);
      }
      
      // Update user profile role to association
      const [profileError] = await safeSupabaseCall(
        supabase
          .from('profiles')
          .update({ role: 'association' })
          .eq('id', user.id),
        'mise à jour du rôle utilisateur'
      );
      
      if (profileError) {
        markErrorAsHandled(profileError);
        throw new Error('Erreur lors de la mise à jour du profil: ' + profileError.message);
      }
      
      navigate('/association-dashboard');
    } catch (error) {
      console.error('Error creating association:', error);
      setError('Une erreur est survenue lors de la création de l\'association. Veuillez réessayer.');
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
          <h1 className="text-2xl font-bold">Créer une association</h1>
        </div>      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        {/* Affichage des erreurs */}
        <ErrorMessage message={error} onDismiss={() => setError(null)} />
        
        {/* Association logo */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Logo de l'association</label>
          <div className="flex flex-col items-center">
            <div 
              className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden mb-4"
              style={{
                backgroundImage: logoPreview ? `url(${logoPreview})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {!logoPreview && (
                <Building className="w-16 h-16 text-gray-400" />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
            />
          </div>
        </div>
        
        {/* Association details */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'association *</label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
              <Building className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full focus:outline-none"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <div className="border border-gray-300 rounded-lg px-3 py-2">
              <div className="flex items-start mb-2">
                <Info className="w-5 h-5 text-gray-400 mr-2 mt-1" />
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full focus:outline-none"
                  placeholder="Décrivez votre association, sa mission et ses activités..."
                ></textarea>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
              <Mail className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full focus:outline-none"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
              <Phone className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full focus:outline-none"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
              <MapPin className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Site web</label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full focus:outline-none"
                placeholder="https://..."
              />
            </div>
          </div>
          
          <div className="border-t pt-6">
            <h2 className="text-lg font-bold mb-4">Contact principal</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du contact *</label>
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
                  <User className="w-5 h-5 text-gray-400 mr-2" />
                  <input
                    type="text"
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={handleChange}
                    required
                    className="w-full focus:outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email du contact *</label>
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
                  <Mail className="w-5 h-5 text-gray-400 mr-2" />
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    required
                    className="w-full focus:outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle dans l'association *</label>
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="text"
                    name="contact_role"
                    value={formData.contact_role}
                    onChange={handleChange}
                    required
                    className="w-full focus:outline-none"
                    placeholder="Ex: Président, Responsable des bénévoles..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mt-4">
            <ErrorMessage message={error} />
          </div>
        )}
        
        <div className="mt-8">
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium flex items-center justify-center"
          >
            {saving ? (
              <>
                <LoadingSpinner small />
                <span className="ml-2">Création en cours...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Créer mon association
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAssociationPage;
