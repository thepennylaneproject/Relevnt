// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { RelevntThemeProvider } from './contexts/RelevntThemeProvider'
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
import SettingsPage from './pages/SettingsPage'
import AutoApplySettingsPage from './pages/AutoApplySettingPage'
import VoiceProfilePage from './pages/VoiceProfilePage'
import JobPreferencesPage from './pages/JobPreferencesPage'
import LearnPage from './pages/LearnPage'
import ProfilePersonalPage from './pages/ProfilePersonalPage'
import ProfileProfessionalPage from './pages/ProfileProfessionalPage'
import SidebarMarginNav from './components/chrome/SidebarMarginNav'
import AdminJobSourcesPage from './legacy/AdminJobSourcesPage'
import './styles/margin-nav.css'

import './App.css'

function AppInner() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        Loading…
      </div>
    )
  }

  const isAuthed = !!user

  return (
    <BrowserRouter>
      <SidebarMarginNav />
      <div className="app-content">
        <AppLayout>
          <Routes>
            {/* Public */}
            <Route
              path="/"
              element={isAuthed ? <Navigate to="/dashboard" replace /> : <HomePage />}
            />
            <Route
              path="/login"
              element={isAuthed ? <Navigate to="/dashboard" replace /> : <LoginPage />}
            />
            <Route
              path="/signup"
              element={isAuthed ? <Navigate to="/dashboard" replace /> : <SignupPage />}
            />

            {/* Protected */}
            <Route
              path="/dashboard"
              element={isAuthed ? <DashboardPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/resumes"
              element={isAuthed ? <ResumesPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/jobs"
              element={isAuthed ? <JobsPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/applications"
              element={isAuthed ? <ApplicationsPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/auto-apply"
              element={isAuthed ? <AutoApplySettingsPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/job-preferences"
              element={isAuthed ? <JobPreferencesPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/profile/personal"
              element={isAuthed ? <ProfilePersonalPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/profile/professional"
              element={isAuthed ? <ProfileProfessionalPage /> : <Navigate to="/login" replace />}
            />
            {/* Keep legacy routes for nav */}
            <Route
              path="/settings"
              element={isAuthed ? <ProfilePersonalPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/voice"
              element={isAuthed ? <VoiceProfilePage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/settings/voice"
              element={isAuthed ? <VoiceProfilePage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/learn"
              element={isAuthed ? <LearnPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/admin"
              element={isAuthed ? <AdminDashboard /> : <Navigate to="/login" replace />}
            />
            <Route 
            path="/admin/sources" 
              element={isAuthed ? <AdminJobSourcesPage /> : <Navigate to="/login" replace />}
            />         
          </Routes>
        </AppLayout>
      </div>
    </BrowserRouter>
  )
}

function App() {
  return (
    <RelevntThemeProvider>
      <AppInner />
    </RelevntThemeProvider>
  )
}

export default App
