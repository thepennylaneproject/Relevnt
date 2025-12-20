// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { RelevntThemeProvider } from './contexts/RelevntThemeProvider'
import { useAuth } from './contexts/AuthContext'

import { AppLayout } from './components/layout/AppLayout'

import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import JobsPage from './pages/JobsPage'
import ApplicationsPage from './pages/ApplicationsPage'
import AdminDashboard from './pages/AdminDashboard'
import SettingsHub from './pages/SettingsHub'
import AutoApplySettingsPage from './pages/AutoApplySettingPage'
import AutoApplyQueuePage from './pages/AutoApplyQueuePage'
import LearnPage from './pages/LearnPage'
import ResumeBuilderPage from './pages/ResumeBuilderPage'
import ResumeWorkspacePage from './pages/ResumeWorkspacePage'
import LinkedInOptimizer from './pages/LinkedInOptimizer'
import PortfolioOptimizer from './pages/PortfolioOptimizer'
import InterviewPrepCenter from './pages/InterviewPrepCenter'
import InterviewPracticer from './pages/InterviewPracticer'
import NetworkingPage from './pages/NetworkingPage'
import SidebarMarginNav from './components/chrome/SidebarMarginNav'
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
              element={isAuthed ? <ResumeWorkspacePage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/resumes/builder"
              element={isAuthed ? <ResumeBuilderPage /> : <Navigate to="/login" replace />}
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
              path="/auto-apply/queue"
              element={isAuthed ? <AutoApplyQueuePage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/linkedin-optimizer"
              element={isAuthed ? <LinkedInOptimizer /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/portfolio-optimizer"
              element={isAuthed ? <PortfolioOptimizer /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/interview-prep"
              element={isAuthed ? <InterviewPrepCenter /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/networking"
              element={isAuthed ? <NetworkingPage /> : <Navigate to="/login" replace />}
            />

            {/* Unified Settings Hub */}
            <Route
              path="/settings"
              element={isAuthed ? <SettingsHub /> : <Navigate to="/login" replace />}
            />

            {/* Legacy route redirects to Settings Hub tabs */}
            <Route
              path="/job-preferences"
              element={isAuthed ? <Navigate to="/settings#career" replace /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/profile/personal"
              element={isAuthed ? <Navigate to="/settings#profile" replace /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/profile/professional"
              element={isAuthed ? <Navigate to="/settings#profile" replace /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/voice"
              element={isAuthed ? <Navigate to="/settings#voice" replace /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/settings/voice"
              element={isAuthed ? <Navigate to="/settings#voice" replace /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/personas"
              element={isAuthed ? <Navigate to="/settings#persona" replace /> : <Navigate to="/login" replace />}
            />

            <Route
              path="/learn"
              element={isAuthed ? <LearnPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/admin"
              element={isAuthed ? <AdminDashboard /> : <Navigate to="/login" replace />}
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
