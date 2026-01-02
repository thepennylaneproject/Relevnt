import React, { useEffect, useState } from 'react'
import { useProfessionalProfile } from '../../../hooks/useProfessionalProfile'
import { useSettingsAutoSave, type AutoSaveStatus } from '../../../hooks/useSettingsAutoSave'
import { Icon } from '../../ui/Icon'
import { Button } from '../../ui/Button'
import { ExportDataButton } from '../ExportDataButton'

interface ProfileTabProps {
    onAutoSaveStatusChange: (status: AutoSaveStatus) => void
}

// AI-generated summaries (would come from backend in production)
const AI_GENERATED = {
    headline: 'Product strategist with 8+ years building user-centered digital experiences',
    strengths: [
        'Led cross-functional teams of 5-12 through complex product launches',
        'Increased user engagement 40% through data-driven feature prioritization',
        'Expert in translating stakeholder needs into actionable roadmaps',
    ],
}

export function ProfileTab({ onAutoSaveStatusChange }: ProfileTabProps) {
    const { profile, loading, setField, save } = useProfessionalProfile()
    const [acceptedHeadline, setAcceptedHeadline] = useState(false)
    const [acceptedStrengths, setAcceptedStrengths] = useState(false)
    const [editingHeadline, setEditingHeadline] = useState(false)
    const [headlineEdit, setHeadlineEdit] = useState('')

    const { status, triggerSave } = useSettingsAutoSave(save, { debounceMs: 800 })

    useEffect(() => {
        onAutoSaveStatusChange(status)
    }, [status, onAutoSaveStatusChange])

    const handleAcceptHeadline = () => {
        if (profile) {
            setField('headline_raw', AI_GENERATED.headline)
            setAcceptedHeadline(true)
            triggerSave()
        }
    }

    const handleSaveHeadlineEdit = () => {
        if (profile && headlineEdit.trim()) {
            setField('headline_raw', headlineEdit.trim())
            setEditingHeadline(false)
            triggerSave()
        }
    }

    const handleAcceptStrengths = () => {
        if (profile) {
            setField('evergreen_strengths_raw', AI_GENERATED.strengths.join('\n'))
            setAcceptedStrengths(true)
            triggerSave()
        }
    }

    if (loading || !profile) {
        return (
            <article className="surface-card">
                <div style={{ padding: 24, textAlign: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        Loading profile...
                    </span>
                </div>
            </article>
        )
    }

    const currentHeadline = profile.headline_raw || AI_GENERATED.headline
    const hasCustomHeadline = !!profile.headline_raw

    return (
        <div className="tab-pane">
            <div className="card">
                <h3>Your headline</h3>
                <p className="card-description">This is how you'll appear in applications. Does this look right?</p>
                
                <div style={{
                    padding: 16,
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-graphite-faint)',
                }}>
                    {editingHeadline ? (
                        <div style={{ display: 'grid', gap: 12 }}>
                            <input
                                type="text"
                                className="form-input"
                                value={headlineEdit}
                                onChange={(e) => setHeadlineEdit(e.target.value)}
                                placeholder="Your professional headline"
                                maxLength={120}
                            />
                            <div className="action-group">
                                <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    onClick={handleSaveHeadlineEdit}
                                >
                                    Save
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingHeadline(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p style={{ fontSize: '1.125rem', fontWeight: 500, color: 'var(--color-ink)', lineHeight: 1.4 }}>
                                "{currentHeadline}"
                            </p>
                            <div className="action-group">
                                {!hasCustomHeadline && !acceptedHeadline && (
                                    <Button
                                        type="button"
                                        variant="primary"
                                        size="sm"
                                        onClick={handleAcceptHeadline}
                                    >
                                        <Icon name="check" size="sm" />
                                        <span>Accept</span>
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        setHeadlineEdit(currentHeadline)
                                        setEditingHeadline(true)
                                    }}
                                >
                                    <Icon name="scroll" size="sm" hideAccent />
                                    <span>Edit</span>
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleAcceptHeadline}
                                >
                                    <Icon name="stars" size="sm" hideAccent />
                                    <span>Regenerate</span>
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="card">
                <h3>Key strengths</h3>
                <p className="card-description">We extracted these from your resume. Use them as-is or tweak slightly.</p>
                
                <div style={{
                    padding: 16,
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-graphite-faint)',
                }}>
                    <ul className="strengths-list">
                        {AI_GENERATED.strengths.map((strength, idx) => (
                            <li key={idx}>{strength}</li>
                        ))}
                    </ul>

                    <div className="action-group">
                        {!acceptedStrengths && (
                            <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                onClick={handleAcceptStrengths}
                            >
                                <Icon name="check" size="sm" />
                                <span>Accept all</span>
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                        >
                            <Icon name="stars" size="sm" hideAccent />
                            <span>Regenerate</span>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3>Quick confirmations</h3>
                <p className="card-description">These answers get reused across applications so you don't need to re-type them.</p>
                
                <div className="confirmation-group">
                    <div className="confirmation-question">
                        <h4>Do you require visa sponsorship?</h4>
                        <div className="button-group">
                            {[
                                { value: false, label: 'No' },
                                { value: true, label: 'Yes' },
                            ].map((opt) => (
                                <Button
                                    key={opt.label}
                                    type="button"
                                    variant={profile.needs_sponsorship === opt.value ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => {
                                        setField('needs_sponsorship', opt.value)
                                        triggerSave()
                                    }}
                                >
                                    {opt.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="confirmation-question">
                        <h4>Open to relocation?</h4>
                        <div className="button-group">
                            {[
                                { value: 'no', label: 'No' },
                                { value: 'yes', label: 'Yes' },
                                { value: 'depends', label: 'Depends on role' },
                            ].map((opt) => (
                                <Button
                                    key={opt.value}
                                    type="button"
                                    variant={profile.relocate_preference === opt.value ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => {
                                        setField('relocate_preference', opt.value as any)
                                        triggerSave()
                                    }}
                                >
                                    {opt.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="confirmation-question">
                        <h4>Travel preference</h4>
                        <div className="button-group">
                            {[
                                { value: 'none', label: 'No travel' },
                                { value: 'some', label: 'Occasional' },
                                { value: 'frequent', label: 'Frequent OK' },
                            ].map((opt) => (
                                <Button
                                    key={opt.value}
                                    type="button"
                                    variant={profile.travel_preference === opt.value ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => {
                                        setField('travel_preference', opt.value as any)
                                        triggerSave()
                                    }}
                                >
                                    {opt.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3>Data & Privacy</h3>
                <p className="card-description">
                    Download a complete copy of your career data for your records or to transfer to another service.
                </p>
                
                <div style={{ 
                    padding: '16px',
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-graphite-faint)',
                }}>
                    <div style={{ marginBottom: '12px' }}>
                        <strong>Included in export:</strong>
                        <ul className="muted" style={{ 
                            marginTop: '8px',
                            marginLeft: '20px',
                            fontSize: '14px',
                            lineHeight: '1.6'
                        }}>
                            <li>Your profile information</li>
                            <li>All resumes and their content</li>
                            <li>All job search personas and preferences</li>
                            <li>All job applications with timeline</li>
                            <li>All feedback and activity signals</li>
                        </ul>
                    </div>
                    
                    <ExportDataButton />
                </div>
            </div>
        </div>
    )
}
