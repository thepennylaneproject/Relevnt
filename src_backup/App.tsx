import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { AppLayout } from './components/layout/AppLayout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import ResumesPage from './pages/ResumesPage'
import JobsPage from './pages/JobsPage'
import ApplicationsPage from './pages/ApplicationsPage'
import AdminDashboard from './pages/AdminDashboard'
import './App.css'
import ApplicationQuestionsHelper from './pages/ApplicationQuestionsHelper';
import SkillsGapPage from './pages/SkillsGapPage'; // coming next
import LearningPathsPage from './pages/LearningPathsPage'; // coming next
import AutoApplySettingsPage from './pages/AutoApplySettingPage';
import VoiceProfilePage from './pages/VoiceProfilePage';
import SettingsPage from './pages/SettingsPage';

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
          element={
            <AppLayout>
              <HomePage />
            </AppLayout>
          }
          />

        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/dashboard" />
            ) : (
              <AppLayout>
                <LoginPage />
              </AppLayout>
            )
          }
          />

        <Route
          path="/signup"
          element={
            user ? (
              <Navigate to="/dashboard" />
            ) : (
              <AppLayout>
                <SignupPage />
              </AppLayout>
            )
          }
          />

        <Route
          path="/settings/voice"
          element={
            user ? (
              <AppLayout>
                <VoiceProfilePage />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
          />

        <Route
          path="/settings"
          element={
            user ? (
              <AppLayout>
                <SettingsPage />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
          />

        <Route
          path="/resumes"
          element={
            user ? (
              <AppLayout>
                <ResumesPage />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
          />

        <Route
          path="/jobs"
          element={
            user ? (
              <AppLayout>
                <JobsPage />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
          />

        <Route
          path="/skills-gap"
          element={
            user ? (
              <AppLayout>
                <SkillsGapPage />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
          />

        <Route
          path="/learning-paths"
          element={
            user ? (
              <AppLayout>
                <LearningPathsPage />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
          />

        <Route
          path="/applications"
          element={
            user ? (
              <AppLayout>
                <ApplicationsPage />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
          />

        <Route
          path="/application-helper"
          element={
            user ? (
              <AppLayout>
                <ApplicationQuestionsHelper />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
          />

        <Route
          path="/admin"
          element={
            user ? (
              <AppLayout>
                <AdminDashboard />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
          />

        <Route
          path="/auto-apply"
          element={
            user ? (
              <AppLayout>
                <AutoApplySettingsPage />
              </AppLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App