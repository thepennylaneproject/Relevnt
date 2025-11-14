import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import ResumesPage from './pages/ResumesPage'
import JobsPage from './pages/JobsPage'
import ApplicationsPage from './pages/ApplicationsPage'
import AdminDashboard from './pages/AdminDashboard'
import './App.css'
import ResumeOptimizerPage from './pages/ResumeOptimizerPage';
import ApplicationQuestionsHelper from './pages/ApplicationQuestionsHelper';
import SkillsGapPage from './pages/SkillsGapPage'; // coming next
import LearningPathsPage from './pages/LearningPathsPage'; // coming next
import AutoApplySettingsPage from './pages/AutoApplySettingPage';
import VoiceProfilePage from './pages/VoiceProfilePage';

function App() {

  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        Loading...
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}

        <Route 
          path="/" 
          element={<HomePage />} 
          />

        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" /> : <LoginPage />} 
          />

        <Route 
          path="/signup" 
          element={user ? <Navigate to="/dashboard" /> : <SignupPage />} 
          />

        <Route
          path="/settings/voice"
          element={user ? <VoiceProfilePage /> : <Navigate to="/login" />}
        />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={user ? <DashboardPage /> : <Navigate to="/login" />} 
          />

        <Route 
          path="/resumes" 
          element={user ? <ResumesPage /> : <Navigate to="/login" />} 
          />

        <Route 
          path="/optimize-resume" 
          element={user ? <ResumeOptimizerPage /> : <Navigate to="/login" />} 
          />

        <Route 
          path="/jobs" 
          element={user ? <JobsPage /> : <Navigate to="/login" />} 
          />

        <Route 
          path="/skills-gap" 
          element={user ? <SkillsGapPage /> : <Navigate to="/login" />} 
          />

        <Route 
          path="/learning-paths" 
          element={user ? <LearningPathsPage /> : <Navigate to="/login" />} 
          />

        <Route 
          path="/applications" 
          element={user ? <ApplicationsPage /> : <Navigate to="/login" />} 
          />

        <Route 
          path="/application-helper" 
          element={user ? <ApplicationQuestionsHelper /> : <Navigate to="/login" />} 
          />

        <Route 
          path="/admin" 
          element={user ? <AdminDashboard /> : <Navigate to="/login" />} 
          />

        <Route
          path="/auto-apply"
          element={user ? <AutoApplySettingsPage /> : <Navigate to="/login" />}
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App