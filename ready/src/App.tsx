import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ReadyThemeProvider } from './contexts/ReadyThemeProvider'
import { ToastProvider } from './components/ui/Toast'
import { AppLayout } from './components/layout/AppLayout'
import { OnboardingGate } from './components/onboarding/OnboardingGate'
import './App.css'

// Pages
import Dashboard from './pages/Dashboard'
import Mirror from './pages/Mirror'
import LinkedInAnalysis from './pages/LinkedInAnalysis'
import PortfolioAnalysis from './pages/PortfolioAnalysis'
import PracticeCenter from './pages/PracticeCenter'
import PracticeSession from './pages/PracticeSession'
import SkillsGap from './pages/SkillsGap'
import LearningPaths from './pages/LearningPaths'
import CoachingHub from './pages/CoachingHub'
import RejectionCoaching from './pages/RejectionCoaching'
import NegotiationCoach from './pages/NegotiationCoach'
import Playback from './pages/Playback'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import YoureReady from './pages/YoureReady'


/**
 * Protected Route Wrapper
 */
const ProtectedRoute = ({ children, showLayout = true }: { children: React.ReactNode, showLayout?: boolean }) => {
  const { user, loading } = useAuth()

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-background">Loading...</div>
  if (!user) return <Navigate to="/login" replace />

  if (showLayout) {
    return (
      <OnboardingGate>
        <AppLayout>{children}</AppLayout>
      </OnboardingGate>
    )
  }

  return (
    <OnboardingGate>
      {children}
    </OnboardingGate>
  )
}

function App() {
  return (
    <ReadyThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
               <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/onboarding" element={<ProtectedRoute showLayout={false}><Onboarding /></ProtectedRoute>} />

              {/* Protected Routes */}
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              
              <Route path="/mirror" element={<ProtectedRoute><Mirror /></ProtectedRoute>} />
              <Route path="/mirror/linkedin" element={<ProtectedRoute><LinkedInAnalysis /></ProtectedRoute>} />
              <Route path="/mirror/portfolio" element={<ProtectedRoute><PortfolioAnalysis /></ProtectedRoute>} />
              
              <Route path="/practice" element={<ProtectedRoute><PracticeCenter /></ProtectedRoute>} />
              <Route path="/practice/:id" element={<ProtectedRoute><PracticeSession /></ProtectedRoute>} />
              
              <Route path="/learn" element={<ProtectedRoute><SkillsGap /></ProtectedRoute>} />
              <Route path="/learn/paths" element={<ProtectedRoute><LearningPaths /></ProtectedRoute>} />
              
              <Route path="/coaching" element={<ProtectedRoute><CoachingHub /></ProtectedRoute>} />
              <Route path="/coaching/rejection" element={<ProtectedRoute><RejectionCoaching /></ProtectedRoute>} />
              <Route path="/coaching/negotiation" element={<ProtectedRoute><NegotiationCoach /></ProtectedRoute>} />
              
              <Route path="/playback" element={<ProtectedRoute><Playback /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/youre-ready" element={<ProtectedRoute><YoureReady /></ProtectedRoute>} />


              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ReadyThemeProvider>
  )
}

export default App
