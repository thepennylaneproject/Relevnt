// src/components/onboarding/OnboardingWizard.tsx
/**
 * Onboarding Wizard
 * Multi-step flow for new users to create their first job target
 * 
 * Steps:
 * 1. Welcome + Name your job target
 * 2. Job titles/keywords
 * 3. Locations + Remote preference
 * 4. Salary expectations
 * 5. Skills (optional)
 * 6. Confirmation
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { Button } from '../ui/Button'
import { usePersonas } from '../../hooks/usePersonas'
import type { CreatePersonaInput } from '../../types/v2-personas'
import './onboarding-wizard.css'

type Step = 1 | 2 | 3 | 4 | 5 | 6

interface OnboardingWizardProps {
  onComplete?: () => void
  onSkip?: () => void
}

const ONBOARDING_STATE_KEY = 'relevnt_onboarding_state'

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const navigate = useNavigate()
  const { createPersona } = usePersonas()
  
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [personaName, setPersonaName] = useState('My Career Search')
  const [jobTitles, setJobTitles] = useState<string[]>([])
  const [jobTitleInput, setJobTitleInput] = useState('')
  const [locations, setLocations] = useState<string[]>([])
  const [locationInput, setLocationInput] = useState('')
  const [remotePreference, setRemotePreference] = useState<'remote' | 'hybrid' | 'onsite' | 'any'>('any')
  const [minSalary, setMinSalary] = useState<number | null>(null)
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')

  // Hydrate state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(ONBOARDING_STATE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.step) setStep(data.step)
        if (data.personaName) setPersonaName(data.personaName)
        if (data.jobTitles) setJobTitles(data.jobTitles)
        if (data.locations) setLocations(data.locations)
        if (data.remotePreference) setRemotePreference(data.remotePreference)
        if (data.minSalary !== undefined) setMinSalary(data.minSalary)
        if (data.skills) setSkills(data.skills)
      } catch (e) {
        console.error('Failed to load onboarding state', e)
      }
    }
  }, [])

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    const state = {
      step,
      personaName,
      jobTitles,
      locations,
      remotePreference,
      minSalary,
      skills
    }
    localStorage.setItem(ONBOARDING_STATE_KEY, JSON.stringify(state))
  }, [step, personaName, jobTitles, locations, remotePreference, minSalary, skills])

  const totalSteps = 6

  const handleAddTag = (
    value: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    setInput: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const trimmed = value.trim()
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed])
    }
    setInput('')
  }

  const handleRemoveTag = (
    value: string,
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setList(prev => prev.filter(item => item !== value))
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    value: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    setInput: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddTag(value, list, setList, setInput)
    }
  }

  const handleNext = () => {
    if (step < 6) {
      setStep((step + 1) as Step)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    setError(null)

    try {
      const personaData: CreatePersonaInput = {
        name: personaName || 'My Career Search',
        description: 'Created during onboarding',
        is_active: true,
        preferences: {
          job_title_keywords: jobTitles,
          locations: locations,
          remote_preference: remotePreference,
          min_salary: minSalary,
          max_salary: null,
          required_skills: skills,
          nice_to_have_skills: [],
          industries: [],
          company_size: [],
          excluded_companies: [],
          mission_values: [],
          growth_focus: [],
        }
      }

      await createPersona(personaData)
      localStorage.removeItem(ONBOARDING_STATE_KEY)
      
      if (onComplete) {
        onComplete()
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job target')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    localStorage.removeItem(ONBOARDING_STATE_KEY)
    if (onSkip) {
      onSkip()
    } else {
      navigate('/dashboard')
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return personaName.trim().length > 0
      case 2:
        return jobTitles.length > 0
      case 3:
        return true // Locations are optional
      case 4:
        return true // Salary is optional
      case 5:
        return true // Skills are optional
      case 6:
        return true
      default:
        return false
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="wizard-step">
            <div className="step-icon">
              <Icon name="compass" size="xl" />
            </div>
            <h2>Welcome to Relevnt</h2>
            <p className="step-description">
              Let's set up your job target. This helps our AI find the most relevant opportunities for you.
            </p>
            <div className="form-group">
              <label className="form-label">Name your job target</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Product Design Search, Backend Engineering"
                value={personaName}
                onChange={(e) => setPersonaName(e.target.value)}
              />
              <p className="form-hint">You can have multiple job targets for different types of roles.</p>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="wizard-step">
            <div className="step-icon">
              <Icon name="briefcase" size="xl" />
            </div>
            <h2>What roles are you looking for?</h2>
            <p className="step-description">
              Add job titles or keywords. We'll use these to find matching opportunities.
            </p>
            <div className="form-group">
              <label className="form-label">Job titles or keywords</label>
              <div className="tag-input-container">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Type and press Enter (e.g., Product Manager)"
                  value={jobTitleInput}
                  onChange={(e) => setJobTitleInput(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, jobTitleInput, jobTitles, setJobTitles, setJobTitleInput)}
                />
              </div>
              <div className="tag-list">
                {jobTitles.map((title) => (
                  <span key={title} className="tag">
                    {title}
                    <button
                      type="button"
                      className="tag-remove"
                      onClick={() => handleRemoveTag(title, setJobTitles)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              {jobTitles.length === 0 && (
                <p className="form-hint">Add at least one job title to continue.</p>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="wizard-step">
            <div className="step-icon">
              <Icon name="compass" size="xl" />
            </div>
            <h2>Where do you want to work?</h2>
            <p className="step-description">
              Select your work preference and add locations if relevant.
            </p>
            
            <div className="form-group">
              <label className="form-label">Remote preference</label>
              <div className="radio-cards">
                {[
                  { value: 'remote', label: 'Fully Remote', desc: 'Work from anywhere' },
                  { value: 'hybrid', label: 'Hybrid', desc: 'Mix of office and remote' },
                  { value: 'onsite', label: 'On-site', desc: 'In the office' },
                  { value: 'any', label: 'Any', desc: 'Open to all options' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`radio-card ${remotePreference === option.value ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="remote"
                      value={option.value}
                      checked={remotePreference === option.value}
                      onChange={() => setRemotePreference(option.value as typeof remotePreference)}
                    />
                    <span className="radio-card-label">{option.label}</span>
                    <span className="radio-card-desc">{option.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {remotePreference !== 'remote' && (
              <div className="form-group">
                <label className="form-label">Preferred locations (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Type and press Enter (e.g., New York, San Francisco)"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, locationInput, locations, setLocations, setLocationInput)}
                />
                <div className="tag-list">
                  {locations.map((loc) => (
                    <span key={loc} className="tag">
                      {loc}
                      <button
                        type="button"
                        className="tag-remove"
                        onClick={() => handleRemoveTag(loc, setLocations)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div className="wizard-step">
            <div className="step-icon">
              <Icon name="flower" size="xl" />
            </div>
            <h2>Salary expectations</h2>
            <p className="step-description">
              Set a minimum to filter out roles that don't meet your needs. This is optional.
            </p>
            <div className="form-group">
              <label className="form-label">Minimum annual salary (USD)</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g., 100000"
                value={minSalary ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  setMinSalary(val ? parseInt(val, 10) : null)
                }}
                step={5000}
                min={0}
              />
              <p className="form-hint">Leave blank to see all opportunities regardless of salary.</p>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="wizard-step">
            <div className="step-icon">
              <Icon name="stars" size="xl" />
            </div>
            <h2>Your key skills</h2>
            <p className="step-description">
              Add your most relevant skills. We'll prioritize jobs that match these.
            </p>
            <div className="form-group">
              <label className="form-label">Skills (optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Type and press Enter (e.g., React, Python, Project Management)"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, skillInput, skills, setSkills, setSkillInput)}
              />
              <div className="tag-list">
                {skills.map((skill) => (
                  <span key={skill} className="tag">
                    {skill}
                    <button
                      type="button"
                      className="tag-remove"
                      onClick={() => handleRemoveTag(skill, setSkills)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="wizard-step">
            <div className="step-icon success">
              <Icon name="check" size="xl" />
            </div>
            <h2>You're all set!</h2>
            <p className="step-description">
              Here's a summary of your job target:
            </p>
            <div className="summary-card">
              <h3>{personaName}</h3>
              <div className="summary-row">
                <span className="summary-label">Looking for:</span>
                <span className="summary-value">
                  {jobTitles.length > 0 ? jobTitles.join(', ') : 'Any role'}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Work style:</span>
                <span className="summary-value">
                  {remotePreference === 'remote' ? 'Fully Remote' :
                   remotePreference === 'hybrid' ? 'Hybrid' :
                   remotePreference === 'onsite' ? 'On-site' : 'Open to all'}
                </span>
              </div>
              {locations.length > 0 && (
                <div className="summary-row">
                  <span className="summary-label">Locations:</span>
                  <span className="summary-value">{locations.join(', ')}</span>
                </div>
              )}
              {minSalary && (
                <div className="summary-row">
                  <span className="summary-label">Min. salary:</span>
                  <span className="summary-value">${minSalary.toLocaleString()}/year</span>
                </div>
              )}
              {skills.length > 0 && (
                <div className="summary-row">
                  <span className="summary-label">Skills:</span>
                  <span className="summary-value">{skills.join(', ')}</span>
                </div>
              )}
            </div>
            {error && <p className="error-text">{error}</p>}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="onboarding-wizard-overlay">
      <div className="onboarding-wizard">
        {/* Progress indicator */}
        <div className="wizard-progress">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`progress-dot ${i + 1 <= step ? 'active' : ''} ${i + 1 < step ? 'complete' : ''}`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="wizard-content">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="wizard-footer">
          {step === 1 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
            >
              Skip for now
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
            >
              Back
            </Button>
          )}

          {step < 6 ? (
            <Button
              type="button"
              variant="primary"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              onClick={handleComplete}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Start Finding Jobs'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default OnboardingWizard
