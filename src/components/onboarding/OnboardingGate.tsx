// src/components/onboarding/OnboardingGate.tsx
/**
 * OnboardingGate
 * Shows the onboarding wizard for authenticated users who have no personas.
 * Once they complete onboarding (or skip), they see the normal app.
 */

import React, { useState, useEffect } from 'react'
import { usePersonas } from '../../hooks/usePersonas'
import { useAuth } from '../../contexts/AuthContext'
import { OnboardingWizard } from './OnboardingWizard'

interface OnboardingGateProps {
  children: React.ReactNode
}

export function OnboardingGate({ children }: OnboardingGateProps) {
  const { user } = useAuth()
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

    // Show wizard if user has no personas
    if (personas.length === 0) {
      setShowWizard(true)
    } else {
      setShowWizard(false)
    }
  }, [user, personas, personasLoading, dismissed])

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

  // Show wizard if needed
  if (showWizard && !personasLoading) {
    return (
      <>
        {children}
        <OnboardingWizard onComplete={handleComplete} onSkip={handleSkip} />
      </>
    )
  }

  return <>{children}</>
}

export default OnboardingGate
