import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
// Importation de l'interface utilisateur
import './App.css'; // Assurons-nous que App.css est chargé après index.css (avec Tailwind)
import ErrorBoundary from './components/ErrorBoundary';
import ConnectionStatus from './components/ConnectionStatus';
import LoadingSpinner from './components/LoadingSpinner';

// Fonction de préchargement intelligent pour les routes
const preloadRoute = (importFn) => {
  // Retourne une fonction qui sera exécutée lors du lazy loading
  return () => {
    const component = importFn();
    
    // Lance les préchargements associés en background
    component.then(() => {
      // Effectue les préchargements après un court délai pour ne pas bloquer le rendu initial
      setTimeout(() => {
        if (window.navigator && navigator.connection && 
          (navigator.connection.saveData || 
           navigator.connection.effectiveType === 'slow-2g' || 
           navigator.connection.effectiveType === '2g')) {
          // Ne pas précharger si l'utilisateur économise les données ou a une connexion lente
          return;
        }
        
        // Sinon on peut lancer les préchargements
        prefetchComponents();
      }, 1000);
    });
    
    return component;
  };
};

// Fonction pour précharger des composants courants après le chargement de la page principale
const prefetchComponents = () => {
  // Préchargement de composants communs
  import('./components/MissionCard.jsx');
  import('./components/CategoryFilter.jsx');
  import('./hooks/useCategories.js');
};

// Routes principales - chargées avec haute priorité et préchargement intelligent
const LandingPage = lazy(preloadRoute(() => import('./pages/LandingPage')));
const LoginPage = lazy(preloadRoute(() => import('./pages/LoginPage')));
const HomePage = lazy(preloadRoute(() => import('./pages/HomePage')));
const ExplorePage = lazy(preloadRoute(() => import('./pages/ExplorePage')));
const MissionDetailPage = lazy(preloadRoute(() => import('./pages/MissionDetailPage')));

// Routes secondaires - chargées normalement avec lazy loading simple
const MissionsPage = lazy(() => import('./pages/MissionsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AssociationDashboard = lazy(() => import('./pages/AssociationDashboard'));
const CreateMissionPage = lazy(() => import('./pages/CreateMissionPage'));
const CreateAssociationPage = lazy(() => import('./pages/CreateAssociationPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AssociationDetailPage = lazy(() => import('./pages/AssociationDetailPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [timeoutReached, setTimeoutReached] = useState(false);
  
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setTimeoutReached(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [loading]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
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
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Association route component
const AssociationRoute = ({ children }) => {
  const { user, associationProfile, loading } = useAuth();
  const [timeoutReached, setTimeoutReached] = useState(false);
  
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setTimeoutReached(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [loading]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
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
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (!associationProfile) {
    return <Navigate to="/home" />;
  }
  
  return children;
};

// Composant pour envelopper les routes avec Suspense
const SuspenseWrapper = ({ children }) => (
  <Suspense fallback={
    <div className="flex h-screen w-full items-center justify-center">
      <LoadingSpinner size="large" fullScreen={true} timeout={10000} />
    </div>
  }>
    {children}
  </Suspense>
);

function App() {
  return (
    <ErrorBoundary>
      <ConnectionStatus />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<SuspenseWrapper><LandingPage /></SuspenseWrapper>} />
        <Route path="/login" element={<SuspenseWrapper><LoginPage /></SuspenseWrapper>} />        
        <Route path="/mission/:id" element={<SuspenseWrapper><MissionDetailPage /></SuspenseWrapper>} />
        <Route path="/explore" element={<SuspenseWrapper><ExplorePage /></SuspenseWrapper>} />
        <Route path="/terms" element={<SuspenseWrapper><TermsPage /></SuspenseWrapper>} />        
        <Route path="/privacy" element={<SuspenseWrapper><PrivacyPage /></SuspenseWrapper>} />
        <Route path="/association/:id" element={<SuspenseWrapper><AssociationDetailPage /></SuspenseWrapper>} />
        <Route path="/forgot-password" element={<SuspenseWrapper><ForgotPasswordPage /></SuspenseWrapper>} />
        <Route path="/reset-password" element={<SuspenseWrapper><ResetPasswordPage /></SuspenseWrapper>} />
        <Route path="/help" element={<SuspenseWrapper><HelpPage /></SuspenseWrapper>} />
          {/* Protected routes */}
        <Route path="/home" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <HomePage />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        <Route path="/missions" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <MissionsPage />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />        
        <Route path="/profile" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <ProfilePage />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <SettingsPage />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        
        {/* Association routes */}
        <Route path="/association-dashboard" element={
          <AssociationRoute>
            <SuspenseWrapper>
              <AssociationDashboard />
            </SuspenseWrapper>
          </AssociationRoute>
        } />        <Route path="/create-mission" element={
          <AssociationRoute>
            <SuspenseWrapper>
              <CreateMissionPage />
            </SuspenseWrapper>
          </AssociationRoute>
        } />
        <Route path="/edit-mission/:id" element={
          <AssociationRoute>
            <SuspenseWrapper>
              <CreateMissionPage />
            </SuspenseWrapper>
          </AssociationRoute>
        } />
        <Route path="/create-association" element={
          <ProtectedRoute>
            <SuspenseWrapper>
              <CreateAssociationPage />
            </SuspenseWrapper>
          </ProtectedRoute>
        } />
        
        {/* Fallback route */}
        <Route path="/not-found" element={
          <SuspenseWrapper>
            <NotFoundPage />
          </SuspenseWrapper>
        } />        
        <Route path="*" element={<Navigate to="/not-found" />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
