// src/components/onboarding/OnboardingGate.tsx
/**
 * OnboardingGate
 *
 * Shows the onboarding wizard as an overlay for authenticated users who have no personas.
 * IMPORTANT: This is an ENHANCER, not a blocker. The app content always renders behind it.
 * Users can skip onboarding and still use the app with default/broad search settings.
 *
 * Design principle: Reduce cognitive load - never hard-block navigation behind the wizard.
 */

import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { usePersonas } from '../../hooks/usePersonas'
import { useAuth } from '../../contexts/AuthContext'
import { OnboardingWizard } from './OnboardingWizard'

interface OnboardingGateProps {
  children: React.ReactNode
}

// Routes where we don't show the onboarding overlay (let users explore freely)
const EXPLORATION_ROUTES = ['/jobs', '/applications', '/resumes', '/insights']

export function OnboardingGate({ children }: OnboardingGateProps) {
  const { user } = useAuth()
  const location = useLocation()
  const { personas, loading: personasLoading } = usePersonas()
  const [showWizard, setShowWizard] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Check localStorage for dismissal
  useEffect(() => {
    if (user) {
      const dismissKey = `relevnt_onboarding_dismissed_${user.id}`
      const wasDismissed = localStorage.getItem(dismissKey) === 'true'
      setDismissed(wasDismissed)
    }
  }, [user])

  // Determine if we should show wizard
  useEffect(() => {
    if (!user || personasLoading || dismissed) {
      setShowWizard(false)
      return
    }

    // Don't show wizard on exploration routes - let users browse freely
    const isExplorationRoute = EXPLORATION_ROUTES.some(route =>
      location.pathname.startsWith(route)
    )
    if (isExplorationRoute) {
      setShowWizard(false)
      return
    }

    // Show wizard if user has no personas (only on non-exploration routes like /dashboard)
    if (personas.length === 0) {
      setShowWizard(true)
    } else {
      setShowWizard(false)
    }
  }, [user, personas, personasLoading, dismissed, location.pathname])

  const handleComplete = () => {
    setShowWizard(false)
    // Persona will be created by the wizard, so personas list will update
  }

  const handleSkip = () => {
    if (user) {
      const dismissKey = `relevnt_onboarding_dismissed_${user.id}`
      localStorage.setItem(dismissKey, 'true')
    }
    setDismissed(true)
    setShowWizard(false)
  }

  // Always render children - wizard is an overlay, not a blocker
  return (
    <>
      {children}
      {showWizard && !personasLoading && (
        <OnboardingWizard onComplete={handleComplete} onSkip={handleSkip} />
      )}
    </>
  )
}

export default OnboardingGate
