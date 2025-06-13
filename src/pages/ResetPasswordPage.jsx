import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import { safePromise, markErrorAsHandled } from '../lib/errorHandling';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Vérifier si l'URL contient un hash pour la réinitialisation du mot de passe
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes('type=recovery')) {
      setError('Lien de réinitialisation de mot de passe invalide.');
    }
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation de base
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setMessage(null);
    
    try {
      const [err, response] = await safePromise(
        supabase.auth.updateUser({
          password: password
        }),
        'réinitialisation du mot de passe'
      );
      
      if (err || response?.error) {
        const updateError = err || response?.error;
        markErrorAsHandled(updateError);
        throw updateError;
      }
      
      setMessage('Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion.');
      
      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setError(error.message || 'Une erreur est survenue lors de la réinitialisation du mot de passe.');
      console.error('Error resetting password:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-vs-blue-primary">Réinitialiser votre mot de passe</h1>
          <p className="text-gray-600 mt-2">
            Veuillez choisir un nouveau mot de passe pour votre compte.
          </p>
        </div>
        
        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre nouveau mot de passe"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-vs-blue-primary focus:border-vs-blue-primary transition duration-200"
            />
          </div>
          
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmez votre nouveau mot de passe"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-vs-blue-primary focus:border-vs-blue-primary transition duration-200"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-vs-blue-primary text-white font-medium py-3 px-4 rounded-lg hover:bg-vs-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vs-blue-primary transition duration-200 disabled:opacity-50"
          >
            {loading ? <LoadingSpinner size="small" /> : 'Réinitialiser le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
