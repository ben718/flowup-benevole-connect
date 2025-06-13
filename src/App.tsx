import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import './App.css'

// Import pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import ExplorePage from './pages/ExplorePage'
import MissionsPage from './pages/MissionsPage'
import ProfilePage from './pages/ProfilePage'
import MissionDetailPage from './pages/MissionDetailPage'
import AssociationDashboard from './pages/AssociationDashboard'
import CreateMissionPage from './pages/CreateMissionPage'
import CreateAssociationPage from './pages/CreateAssociationPage'

// Import components
import LoadingSpinner from './components/LoadingSpinner'
import NotificationCenter from './components/NotificationCenter'
import BottomNavigation from './components/BottomNavigation'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    // Vérifier la session de l'utilisateur au chargement
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user?.id) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Configurer l'écouteur d'événements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session?.user?.id) {
          fetchUserProfile(session.user.id)
        } else {
          setUserRole(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Récupérer le profil utilisateur pour déterminer son rôle
  const fetchUserProfile = async (userId) => {
    try {
      // Vérifier si c'est une association
      const { data: associationData } = await supabase
        .from('associations')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (associationData) {
        setUserRole('association')
      } else {
        // Sinon c'est un bénévole
        setUserRole('volunteer')
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><LoadingSpinner /></div>
  }

  return (
    <Router>
      <div className="app-container">
        {session && <NotificationCenter userId={session.user.id} />}
        
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={!session ? <LandingPage /> : <Navigate to="/home" />} />
          <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/home" />} />
          
          {/* Routes protégées - Commun */}
          <Route path="/home" element={session ? <HomePage /> : <Navigate to="/login" />} />
          <Route path="/explore" element={session ? <ExplorePage /> : <Navigate to="/login" />} />
          <Route path="/profile" element={session ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path="/mission/:id" element={session ? <MissionDetailPage /> : <Navigate to="/login" />} />
          
          {/* Routes pour bénévoles */}
          <Route 
            path="/missions" 
            element={
              session && userRole === 'volunteer' 
                ? <MissionsPage /> 
                : session ? <Navigate to="/home" /> : <Navigate to="/login" />
            } 
          />
          
          {/* Routes pour associations */}
          <Route 
            path="/association/dashboard" 
            element={
              session && userRole === 'association' 
                ? <AssociationDashboard /> 
                : session ? <Navigate to="/home" /> : <Navigate to="/login" />
            }
          />
          <Route 
            path="/association/create-mission" 
            element={
              session && userRole === 'association' 
                ? <CreateMissionPage /> 
                : session ? <Navigate to="/home" /> : <Navigate to="/login" />
            }
          />
          <Route 
            path="/create-association" 
            element={session ? <CreateAssociationPage /> : <Navigate to="/login" />}
          />
        </Routes>
        
        {session && <BottomNavigation userRole={userRole} />}
      </div>
    </Router>
  )
}

export default App
