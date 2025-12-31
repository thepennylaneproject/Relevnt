/**
 * QuickApplyModal Component
 *
 * A modal for one-click job applications using the user's Light Profile
 * (persona-linked resume data).
 */

import React, { useState, useEffect } from 'react'
import { Icon } from '../ui/Icon'
import { Button } from '../ui/Button'
import { useToast } from '../ui/Toast'
import { supabase } from '../../lib/supabase'
import type { UserPersona } from '../../types/v2-personas'

// ============================================================================
// TYPES
// ============================================================================

interface LightProfile {
  name: string
  email: string
  phone: string
  location: string
  resumeTitle: string
  resumeId: string | null
}

interface JobInfo {
  id: string
  title: string
  company: string
  external_url?: string | null
  supports_quick_apply?: boolean
}

interface QuickApplyModalProps {
  job: JobInfo
  persona: UserPersona | null
  isOpen: boolean
  onClose: () => void
  onApplied: (jobId: string) => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export function QuickApplyModal({
  job,
  persona,
  isOpen,
  onClose,
  onApplied,
}: QuickApplyModalProps) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [profile, setProfile] = useState<LightProfile | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch the Light Profile from the persona's linked resume
  useEffect(() => {
    if (!isOpen || !persona) return

    async function fetchProfile() {
      setLoading(true)
      setError(null)

      try {
        // Get user info
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('Please sign in to use Quick Apply')
          return
        }

        let profileData: LightProfile = {
          name: user.user_metadata?.full_name || '',
          email: user.email || '',
          phone: user.user_metadata?.phone || '',
          location: '',
          resumeTitle: 'No resume linked',
          resumeId: null,
        }

        // Get resume data if persona has one linked
        if (persona.resume_id) {
          const { data: resume } = await supabase
            .from('resumes')
            .select('id, title, parsed_fields')
            .eq('id', persona.resume_id)
            .single()

          if (resume) {
            const fields = resume.parsed_fields as Record<string, unknown> | null
            profileData = {
              name: (fields?.fullName as string) || profileData.name,
              email: (fields?.email as string) || profileData.email,
              phone: (fields?.phone as string) || profileData.phone,
              location: (fields?.location as string) || profileData.location,
              resumeTitle: resume.title || 'Untitled Resume',
              resumeId: resume.id,
            }
          }
        }

        setProfile(profileData)
      } catch (err) {
        console.error('Failed to fetch profile:', err)
        setError('Failed to load profile. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [isOpen, persona])

  const handleApply = async () => {
    if (!profile || !persona) return

    setSubmitting(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create application record
      const { error: appError } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          job_id: job.id,
          persona_id: persona.id,
          resume_id: profile.resumeId,
          status: 'applied',
          applied_at: new Date().toISOString(),
          source: 'quick_apply',
        })

      if (appError) throw appError

      showToast(`Applied to ${job.company}!`, 'success', 4000)
      onApplied(job.id)
      onClose()
    } catch (err) {
      console.error('Quick apply failed:', err)
      showToast('Application failed. Please try again.', 'error', 4000)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const hasResume = !!profile?.resumeId

  return (
    <div className="quick-apply-overlay" onClick={onClose}>
      <div className="quick-apply-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="quick-apply-header">
          <div>
            <h2 className="quick-apply-title">Quick Apply</h2>
            <p className="quick-apply-subtitle">{job.title} at {job.company}</p>
          </div>
          <button
            type="button"
            className="quick-apply-close"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="x" size="sm" hideAccent />
          </button>
        </div>

        {/* Content */}
        <div className="quick-apply-body">
          {loading ? (
            <div className="quick-apply-loading">
              <Icon name="compass" size="lg" />
              <p>Loading your profile...</p>
            </div>
          ) : error ? (
            <div className="quick-apply-error">
              <Icon name="alert-triangle" size="lg" />
              <p>{error}</p>
            </div>
          ) : profile ? (
            <>
              <div className="quick-apply-section">
                <h3 className="quick-apply-section-title">Applying as</h3>
                <div className="quick-apply-profile">
                  <div className="profile-row">
                    <Icon name="user" size="sm" hideAccent />
                    <span>{profile.name || 'Name not set'}</span>
                  </div>
                  <div className="profile-row">
                    <Icon name="mailbox" size="sm" hideAccent />
                    <span>{profile.email || 'Email not set'}</span>
                  </div>
                  {profile.phone && (
                    <div className="profile-row">
                      <Icon name="microphone" size="sm" hideAccent />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  {profile.location && (
                    <div className="profile-row">
                      <Icon name="map-pin" size="sm" hideAccent />
                      <span>{profile.location}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="quick-apply-section">
                <h3 className="quick-apply-section-title">Resume</h3>
                <div className={`quick-apply-resume ${hasResume ? '' : 'no-resume'}`}>
                  <Icon name="scroll" size="sm" hideAccent />
                  <span>{profile.resumeTitle}</span>
                  {!hasResume && (
                    <span className="resume-warning">
                      Link a resume to your persona for better applications
                    </span>
                  )}
                </div>
              </div>

              <div className="quick-apply-section">
                <h3 className="quick-apply-section-title">Using persona</h3>
                <div className="quick-apply-persona">
                  <Icon name="compass" size="sm" hideAccent />
                  <span>{persona?.name || 'Default'}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="quick-apply-footer">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleApply}
            disabled={loading || submitting || !profile}
          >
            {submitting ? (
              <>Applying...</>
            ) : (
              <>
                <Icon name="paper-airplane" size="sm" hideAccent />
                Apply Now
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default QuickApplyModal
