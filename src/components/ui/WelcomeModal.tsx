/**
 * Welcome Modal Component
 * 
 * First-run onboarding experience shown to new users after signup.
 * Guides users through the essential first steps without overwhelming them.
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from './Icon'
import { Button } from './Button'
import { useAuth } from '../../contexts/AuthContext'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface OnboardingStep {
    id: string
    title: string
    description: string
    action: string
    route: string
    icon: 'scroll' | 'briefcase' | 'compass' | 'stars'
    complete?: boolean
}

const ONBOARDING_STEPS: OnboardingStep[] = [
    {
        id: 'resume',
        title: 'Upload your resume',
        description: 'We\'ll analyze it to personalize your job matches and help you improve.',
        action: 'Upload Resume',
        route: '/resumes',
        icon: 'scroll',
    },
    {
        id: 'preferences',
        title: 'Set your preferences',
        description: 'Tell us what you\'re looking for so we can surface the right opportunities.',
        action: 'Set Preferences',
        route: '/settings?section=targeting',
        icon: 'compass',
    },
    {
        id: 'browse',
        title: 'Browse jobs',
        description: 'Explore opportunities matched to your skills and goals.',
        action: 'Find Jobs',
        route: '/jobs',
        icon: 'briefcase',
    },
]

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const ONBOARDING_STORAGE_KEY = 'relevnt_onboarding_complete'

export function WelcomeModal(): JSX.Element | null {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [isOpen, setIsOpen] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)

    // Check if user is new (hasn't dismissed welcome)
    useEffect(() => {
        if (!user) return

        // Use localStorage for simplicity - works across sessions
        const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_STORAGE_KEY)

        if (!hasCompletedOnboarding) {
            // Small delay to let the page load first
            const timer = setTimeout(() => setIsOpen(true), 500)
            return () => clearTimeout(timer)
        }
    }, [user])

    const handleStepClick = async (step: OnboardingStep) => {
        setIsOpen(false)
        navigate(step.route)
    }

    const handleSkip = () => {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
        setIsOpen(false)
    }

    const handleComplete = () => {
        handleSkip()
        navigate('/jobs')
    }

    if (!isOpen) return null

    const step = ONBOARDING_STEPS[currentStep]

    return (
        <div className="welcome-modal__backdrop">
            <div className="welcome-modal" role="dialog" aria-modal="true">
                {/* Progress dots */}
                <div className="welcome-modal__progress">
                    {ONBOARDING_STEPS.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            className={`progress-dot ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'complete' : ''}`}
                            onClick={() => setCurrentStep(i)}
                            aria-label={`Step ${i + 1}`}
                        />
                    ))}
                </div>

                {/* Step content */}
                <div className="welcome-modal__content">
                    <div className="welcome-modal__icon">
                        <Icon name={step.icon} size="hero" />
                    </div>

                    <h2 className="welcome-modal__title">
                        {currentStep === 0 ? 'Welcome to Relevnt!' : step.title}
                    </h2>

                    <p className="welcome-modal__description">
                        {currentStep === 0
                            ? "Let's get you set up in just a few minutes. Here's what we recommend:"
                            : step.description}
                    </p>

                    {/* Step list on first screen */}
                    {currentStep === 0 && (
                        <div className="welcome-modal__steps">
                            {ONBOARDING_STEPS.map((s, i) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    className="welcome-step"
                                    onClick={() => handleStepClick(s)}
                                >
                                    <span className="welcome-step__number">{i + 1}</span>
                                    <div className="welcome-step__text">
                                        <strong>{s.title}</strong>
                                        <span>{s.description}</span>
                                    </div>
                                    <Icon name="paper-airplane" size="sm" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="welcome-modal__actions">
                    {currentStep === 0 ? (
                        <>
                            <Button type="button" variant="ghost" onClick={handleSkip}>
                                I'll explore on my own
                            </Button>
                            <Button type="button" variant="primary" onClick={() => handleStepClick(ONBOARDING_STEPS[0])}>
                                Let's start
                            </Button>
                        </>
                    ) : currentStep < ONBOARDING_STEPS.length - 1 ? (
                        <>
                            <Button type="button" variant="ghost" onClick={() => setCurrentStep(c => c - 1)}>
                                Back
                            </Button>
                            <Button type="button" variant="primary" onClick={() => setCurrentStep(c => c + 1)}>
                                Next
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button type="button" variant="ghost" onClick={() => setCurrentStep(c => c - 1)}>
                                Back
                            </Button>
                            <Button type="button" variant="primary" onClick={handleComplete}>
                                Get Started
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <style>{welcomeModalStyles}</style>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const welcomeModalStyles = `
.welcome-modal__backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: welcome-fade-in 0.3s ease-out;
}

@keyframes welcome-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.welcome-modal {
  background: var(--color-surface);
  border-radius: 20px;
  padding: 32px;
  max-width: 520px;
  width: 100%;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
  animation: welcome-slide-in 0.3s ease-out;
}

@keyframes welcome-slide-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.welcome-modal__progress {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
}

.progress-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-graphite-faint);
  border: none;
  padding: 0;
  cursor: pointer;
  transition: all 0.2s;
}

.progress-dot.active {
  width: 24px;
  border-radius: 4px;
  background: var(--color-accent);
}

.progress-dot.complete {
  background: var(--color-accent);
}

.welcome-modal__content {
  text-align: center;
}

.welcome-modal__icon {
  margin-bottom: 16px;
}

.welcome-modal__title {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-ink);
  margin: 0 0 8px;
}

.welcome-modal__description {
  font-size: 15px;
  color: var(--color-ink-secondary);
  margin: 0 0 24px;
  line-height: 1.5;
}

.welcome-modal__steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
  margin-bottom: 24px;
}

.welcome-step {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--color-bg);
  border: 1px solid var(--color-graphite-faint);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.welcome-step:hover {
  background: var(--color-surface);
  border-color: var(--color-accent);
  transform: translateX(4px);
}

.welcome-step__number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.welcome-step__text {
  flex: 1;
}

.welcome-step__text strong {
  display: block;
  font-size: 14px;
  color: var(--color-ink);
  margin-bottom: 2px;
}

.welcome-step__text span {
  font-size: 13px;
  color: var(--color-ink-tertiary);
}

.welcome-modal__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
`

export default WelcomeModal
