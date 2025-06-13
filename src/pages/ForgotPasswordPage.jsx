import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import { safePromise, markErrorAsHandled } from '../lib/errorHandling';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const [{ data, error }] = await safePromise(
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      })
    );

    if (error) {
      markErrorAsHandled(error);
      setError(error.message || 'Une erreur est survenue lors de la demande de réinitialisation.');
      console.error('Error resetting password:', error);
    } else {
      setMessage('Un email de réinitialisation de mot de passe a été envoyé à votre adresse email.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-vs-blue-primary">Réinitialiser votre mot de passe</h1>
          <p className="text-gray-600 mt-2">
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
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

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-vs-gray-300 rounded-lg focus:ring-vs-blue-primary focus:border-vs-blue-primary transition duration-200"
              placeholder="Votre adresse email"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-vs-blue-primary text-white font-medium py-3 rounded-lg hover:bg-vs-blue-dark transition duration-200 flex items-center justify-center"
          >
            {loading ? <LoadingSpinner size="small" /> : "Envoyer le lien de réinitialisation"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-vs-blue-primary hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
