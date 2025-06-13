import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { safePromise, markErrorAsHandled } from '../lib/errorHandling';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [associationName, setAssociationName] = useState('');
  const [siret, setSiret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAssociation, setIsAssociation] = useState(false);
  
  const { signIn, signUp, user, authError } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Si l'utilisateur est déjà connecté, le rediriger vers la page d'accueil
    if (user) {
      navigate('/home');
    }
    
    // Vérifier si l'URL contient un paramètre pour l'onglet actif
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'signup') {
      setActiveTab('signup');
    }
    
    // Vérifier si l'URL contient un paramètre pour le type d'utilisateur
    if (params.get('type') === 'association') {
      setIsAssociation(true);
    }
  }, [user, navigate, location]);
    const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const [err, response] = await safePromise(
        signIn({ email, password }),
        'connexion à votre compte'
      );
      
      if (err || response?.error) {
        const signInError = err || response?.error;
        markErrorAsHandled(signInError);
        
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Identifiants incorrects. Veuillez réessayer.');
        } else if (signInError.message.includes('Email not confirmed')) {
          throw new Error('Veuillez confirmer votre email avant de vous connecter.');
        } else {
          throw signInError;
        }
      }
      
      navigate('/home');
    } catch (err) {
      console.error('Error signing in:', err.message);
      setError(err.message || 'Identifiants incorrects. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };
    const handleSignupSubmit = async (e) => {
    e.preventDefault();
    
    // Validation de base
    if (isAssociation) {
      if (!email || !password || !confirmPassword || !associationName || !siret) {
        setError('Veuillez remplir tous les champs.');
        return;
      }
    } else {
      if (!email || !password || !confirmPassword || !firstName || !lastName) {
        setError('Veuillez remplir tous les champs.');
        return;
      }
    }
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const profileData = isAssociation
        ? {
            associationName,
            siret,
          }
        : {
            firstName,
            lastName,
          };
      
      const [err, response] = await safePromise(
        signUp(
          { email, password },
          isAssociation,
          profileData
        ),
        'création de votre compte'
      );
      
      if (err || response?.error) {
        const signUpError = err || response?.error;
        markErrorAsHandled(signUpError);
        
        if (signUpError.message.includes('email already registered')) {
          throw new Error('Cette adresse email est déjà utilisée. Veuillez vous connecter ou utiliser une autre adresse.');
        } else {
          throw signUpError;
        }
      }
      
      // Rediriger vers la page de connexion avec un message de succès
      navigate('/login?success=signup');
    } catch (err) {
      console.error('Error signing up:', err.message);
      setError(err.message || 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-vs-gray-100 flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-vs-gray-900 mb-2">Voisin Solidaire</h1>
          <p className="text-vs-gray-600">
            {activeTab === 'login'
              ? 'Connectez-vous pour aider près de chez vous.'
              : isAssociation
              ? 'Créez un compte association pour proposer des missions.'
              : 'Créez un compte pour aider près de chez vous.'}
          </p>
        </div>
        {/* Affichage de l'erreur d'authentification globale */}
        {authError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {authError}
          </div>
        )}
        {/* Tabs */}
        <div className="mb-6">
          <div className="flex border-b border-vs-gray-200">
            <button
              className={`flex-1 py-3 px-4 text-center font-medium ${
                activeTab === 'login'
                  ? 'text-vs-blue-primary border-b-2 border-vs-blue-primary'
                  : 'text-vs-gray-500 hover:text-vs-blue-primary'
              } focus:outline-none`}
              onClick={() => setActiveTab('login')}
            >
              Connexion
            </button>
            <button
              className={`flex-1 py-3 px-4 text-center font-medium ${
                activeTab === 'signup'
                  ? 'text-vs-blue-primary border-b-2 border-vs-blue-primary'
                  : 'text-vs-gray-500 hover:text-vs-blue-primary'
              } focus:outline-none`}
              onClick={() => setActiveTab('signup')}
            >
              Inscription
            </button>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {/* Login Form */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-vs-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.com"
                required
                className="w-full px-4 py-3 border border-vs-gray-300 rounded-lg focus:ring-vs-blue-primary focus:border-vs-blue-primary transition duration-200"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-vs-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"                required
                className="w-full px-4 py-3 border border-vs-gray-300 rounded-lg focus:ring-vs-blue-primary focus:border-vs-blue-primary transition duration-200"              />
              <Link to="/forgot-password" className="block text-right text-sm text-vs-blue-primary hover:underline mt-1">
                Mot de passe oublié ?
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-vs-blue-primary text-white font-medium py-3 px-4 rounded-lg hover:bg-vs-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vs-blue-primary transition duration-200 disabled:opacity-50"
            >
              {loading ? <LoadingSpinner size="small" /> : 'Se connecter'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit} className="space-y-6">
            {/* Type d'utilisateur (bénévole ou association) */}
            <div className="flex rounded-lg overflow-hidden border border-vs-gray-300">
              <button
                type="button"
                className={`flex-1 py-2 text-center ${
                  !isAssociation
                    ? 'bg-vs-blue-primary text-white font-medium'
                    : 'bg-white text-vs-gray-600'
                }`}
                onClick={() => setIsAssociation(false)}
              >
                Bénévole
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-center ${
                  isAssociation
                    ? 'bg-vs-blue-primary text-white font-medium'
                    : 'bg-white text-vs-gray-600'
                }`}
                onClick={() => setIsAssociation(true)}
              >
                Association
              </button>
            </div>

            {/* Champs spécifiques au type d'utilisateur */}
            {isAssociation ? (
              <>
                <div>
                  <label htmlFor="association-name" className="block text-sm font-medium text-vs-gray-700 mb-1">
                    Nom de l'association
                  </label>
                  <input
                    type="text"
                    id="association-name"
                    value={associationName}
                    onChange={(e) => setAssociationName(e.target.value)}
                    placeholder="Nom de votre association"
                    required
                    className="w-full px-4 py-3 border border-vs-gray-300 rounded-lg focus:ring-vs-blue-primary focus:border-vs-blue-primary transition duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="siret" className="block text-sm font-medium text-vs-gray-700 mb-1">
                    Numéro SIRET
                  </label>
                  <input
                    type="text"
                    id="siret"
                    value={siret}
                    onChange={(e) => setSiret(e.target.value)}
                    placeholder="12345678901234"
                    required
                    className="w-full px-4 py-3 border border-vs-gray-300 rounded-lg focus:ring-vs-blue-primary focus:border-vs-blue-primary transition duration-200"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first-name" className="block text-sm font-medium text-vs-gray-700 mb-1">
                      Prénom
                    </label>
                    <input
                      type="text"
                      id="first-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Prénom"
                      required
                      className="w-full px-4 py-3 border border-vs-gray-300 rounded-lg focus:ring-vs-blue-primary focus:border-vs-blue-primary transition duration-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="last-name" className="block text-sm font-medium text-vs-gray-700 mb-1">
                      Nom
                    </label>
                    <input
                      type="text"
                      id="last-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Nom"
                      required
                      className="w-full px-4 py-3 border border-vs-gray-300 rounded-lg focus:ring-vs-blue-primary focus:border-vs-blue-primary transition duration-200"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Champs communs */}
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-vs-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="signup-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.com"
                required
                className="w-full px-4 py-3 border border-vs-gray-300 rounded-lg focus:ring-vs-blue-primary focus:border-vs-blue-primary transition duration-200"
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-vs-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                id="signup-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choisissez un mot de passe sécurisé"
                required
                className="w-full px-4 py-3 border border-vs-gray-300 rounded-lg focus:ring-vs-blue-primary focus:border-vs-blue-primary transition duration-200"
              />
            </div>
            <div>
              <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-vs-gray-700 mb-1">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                id="signup-confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez votre mot de passe"
                required
                className="w-full px-4 py-3 border border-vs-gray-300 rounded-lg focus:ring-vs-blue-primary focus:border-vs-blue-primary transition duration-200"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full ${
                isAssociation ? 'bg-vs-green-secondary hover:bg-vs-green-dark' : 'bg-vs-blue-primary hover:bg-vs-blue-dark'
              } text-white font-medium py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vs-blue-primary transition duration-200 disabled:opacity-50`}
            >
              {loading ? <LoadingSpinner size="small" /> : "S'inscrire"}
            </button>            <p className="text-xs text-vs-gray-500 text-center">
              En vous inscrivant, vous acceptez nos{' '}
              <Link to="/terms" className="text-vs-blue-primary hover:underline">
                Conditions d'utilisation
              </Link>{' '}
              et notre{' '}
              <Link to="/privacy" className="text-vs-blue-primary hover:underline">
                Politique de confidentialité
              </Link>
              .
            </p>
          </form>
        )}
      </div>
      
      <div className="mt-6 text-center">
        <Link to="/" className="text-vs-blue-primary hover:underline">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
