// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { RelevntThemeProvider } from './contexts/RelevntThemeProvider'
import { useAuth, isUserAdmin } from './contexts/AuthContext'

import { AppLayout } from './components/layout/AppLayout'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { WelcomeModal } from './components/ui/WelcomeModal'
import { LoadingState } from './components/ui/LoadingState'

import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import JobsPage from './pages/JobsPage'
import ApplicationsPage from './pages/ApplicationsPage'
import AdminDashboard from './pages/AdminDashboard'
import { lazy, Suspense } from 'react'
const Settings = lazy(() => import('./pages/Settings'))
import ResumeWorkspacePage from './pages/ResumeWorkspacePage'
import ResumeFullViewPage from './pages/ResumeFullViewPage'
import InsightsPage from './pages/InsightsPage'
import SharedAuditPage from './pages/SharedAuditPage'
import MastheadNav from './components/layout/MastheadNav'
import { OnboardingGate } from './components/onboarding'

import './App.css'

function AppInner() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingState message="Loading Relevnt..." fullPage />
  }

  const isAuthed = !!user

  return (
    <BrowserRouter>
      <MastheadNav />
      <div className="app-content">
        <OnboardingGate>
          <WelcomeModal />
          <AppLayout>
            <Suspense fallback={<LoadingState message="Loading page..." />}>
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

                <Route
                  path="/shared/audit/:type/:token"
                  element={<SharedAuditPage />}
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
                  path="/resumes/:id/view"
                  element={isAuthed ? <ResumeFullViewPage /> : <Navigate to="/login" replace />}
                />
                <Route
                  path="/insights"
                  element={isAuthed ? <InsightsPage /> : <Navigate to="/login" replace />}
                />

                {/* Jobs page is accessible without full onboarding - allows exploration */}
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
                  element={isAuthed ? <Navigate to="/settings?section=system" replace /> : <Navigate to="/login" replace />}
                />


                {/* Unified Settings Hub */}
                <Route
                  path="/settings"
                  element={isAuthed ? <Settings /> : <Navigate to="/login" replace />}
                />

                {/* Legacy route redirects to Settings Hub tabs */}
                <Route
                  path="/job-preferences"
                  element={isAuthed ? <Navigate to="/settings?section=targeting" replace /> : <Navigate to="/login" replace />}
                />
                <Route
                  path="/profile/personal"
                  element={isAuthed ? <Navigate to="/settings?section=profile" replace /> : <Navigate to="/login" replace />}
                />
                <Route
                  path="/profile/professional"
                  element={isAuthed ? <Navigate to="/settings?section=profile" replace /> : <Navigate to="/login" replace />}
                />
                <Route
                  path="/voice"
                  element={isAuthed ? <Navigate to="/settings?section=profile" replace /> : <Navigate to="/login" replace />}
                />
                <Route
                  path="/settings/voice"
                  element={isAuthed ? <Navigate to="/settings?section=profile" replace /> : <Navigate to="/login" replace />}
                />
                <Route
                  path="/personas"
                  element={isAuthed ? <Navigate to="/settings?section=targeting" replace /> : <Navigate to="/login" replace />}
                />

                <Route
                  path="/admin"
                  element={isAuthed && isUserAdmin(user) ? <AdminDashboard /> : <Navigate to="/dashboard" replace />}
                />

                {/* Redirects for deprecated/moved routes */}
                <Route
                  path="/interview-prep"
                  element={isAuthed ? <Navigate to="/settings?section=profile" replace /> : <Navigate to="/login" replace />}
                />
                <Route
                  path="/profile-analyzer"
                  element={isAuthed ? <Navigate to="/settings?section=profile" replace /> : <Navigate to="/login" replace />}
                />
              </Routes>
            </Suspense>
          </AppLayout>
        </OnboardingGate>
      </div>
    </BrowserRouter>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <RelevntThemeProvider>
        <AppInner />
      </RelevntThemeProvider>
    </ErrorBoundary>
  )
}

export default App
