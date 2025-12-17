import React, { useEffect, useState } from 'react'
import { useProfessionalProfile } from '../../../hooks/useProfessionalProfile'
import { useSettingsAutoSave, type AutoSaveStatus } from '../../../hooks/useSettingsAutoSave'
import { Icon } from '../../ui/Icon'

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
        <>
            {/* Headline */}
            <article className="surface-card">
                <div className="rl-field-grid">
                    <div style={{ display: 'grid', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                            <Icon name="compass" size="sm" hideAccent />
                            <span>Your headline</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            This is how you'll appear in applications. Does this look right?
                        </p>
                    </div>

                    <div style={{
                        padding: 16,
                        background: 'var(--surface-subtle, rgba(0,0,0,0.02))',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                    }}>
                        {editingHeadline ? (
                            <div style={{ display: 'grid', gap: 12 }}>
                                <input
                                    type="text"
                                    className="rl-input"
                                    value={headlineEdit}
                                    onChange={(e) => setHeadlineEdit(e.target.value)}
                                    placeholder="Your professional headline"
                                    maxLength={120}
                                    style={{ fontSize: 14 }}
                                />
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        type="button"
                                        className="primary-button"
                                        onClick={handleSaveHeadlineEdit}
                                        style={{ padding: '6px 12px', fontSize: 12 }}
                                    >
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        className="ghost-button button-sm"
                                        onClick={() => setEditingHeadline(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>
                                    "{currentHeadline}"
                                </p>
                                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                    {!hasCustomHeadline && !acceptedHeadline && (
                                        <button
                                            type="button"
                                            className="primary-button"
                                            onClick={handleAcceptHeadline}
                                            style={{ padding: '6px 12px', fontSize: 12 }}
                                        >
                                            <Icon name="check" size="sm" />
                                            <span>Accept</span>
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="ghost-button button-sm"
                                        onClick={() => {
                                            setHeadlineEdit(currentHeadline)
                                            setEditingHeadline(true)
                                        }}
                                    >
                                        <Icon name="scroll" size="sm" hideAccent />
                                        <span>Edit</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="ghost-button button-sm"
                                        onClick={handleAcceptHeadline}
                                    >
                                        <Icon name="stars" size="sm" hideAccent />
                                        <span>Regenerate</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </article>

            {/* Strengths */}
            <article className="surface-card">
                <div className="rl-field-grid">
                    <div style={{ display: 'grid', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                            <Icon name="seeds" size="sm" hideAccent />
                            <span>Key strengths</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            We extracted these from your resume. Use them as-is or tweak slightly.
                        </p>
                    </div>

                    <div style={{
                        padding: 16,
                        background: 'var(--surface-subtle, rgba(0,0,0,0.02))',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                    }}>
                        <ul style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: 0,
                            display: 'grid',
                            gap: 8,
                        }}>
                            {AI_GENERATED.strengths.map((strength, idx) => (
                                <li
                                    key={idx}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 8,
                                        fontSize: 13,
                                        color: 'var(--text)',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    <span style={{ color: 'var(--color-accent)', flexShrink: 0 }}>•</span>
                                    {strength}
                                </li>
                            ))}
                        </ul>

                        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                            {!acceptedStrengths && (
                                <button
                                    type="button"
                                    className="primary-button"
                                    onClick={handleAcceptStrengths}
                                    style={{ padding: '6px 12px', fontSize: 12 }}
                                >
                                    <Icon name="check" size="sm" />
                                    <span>Accept all</span>
                                </button>
                            )}
                            <button
                                type="button"
                                className="ghost-button button-sm"
                            >
                                <Icon name="stars" size="sm" hideAccent />
                                <span>Regenerate</span>
                            </button>
                        </div>
                    </div>
                </div>
            </article>

            {/* Work Authorization - Quick confirmations */}
            <article className="surface-card">
                <div className="rl-field-grid">
                    <div style={{ display: 'grid', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                            <Icon name="scroll" size="sm" hideAccent />
                            <span>Quick confirmations</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            These answers get reused across applications so you don't need to re-type them.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gap: 16 }}>
                        <div style={{ display: 'grid', gap: 8 }}>
                            <div className="rl-label">Do you require visa sponsorship?</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {[
                                    { value: false, label: 'No' },
                                    { value: true, label: 'Yes' },
                                ].map((opt) => (
                                    <button
                                        key={opt.label}
                                        type="button"
                                        onClick={() => {
                                            setField('needs_sponsorship', opt.value)
                                            triggerSave()
                                        }}
                                        className={`option-button ${profile.needs_sponsorship === opt.value ? 'is-active' : ''}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: 8 }}>
                            <div className="rl-label">Open to relocation?</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {[
                                    { value: 'no', label: 'No' },
                                    { value: 'yes', label: 'Yes' },
                                    { value: 'depends', label: 'Depends on role' },
                                ].map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                            setField('relocate_preference', opt.value as any)
                                            triggerSave()
                                        }}
                                        className={`option-button ${profile.relocate_preference === opt.value ? 'is-active' : ''}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: 8 }}>
                            <div className="rl-label">Travel preference</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {[
                                    { value: 'none', label: 'No travel' },
                                    { value: 'some', label: 'Occasional' },
                                    { value: 'frequent', label: 'Frequent OK' },
                                ].map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                            setField('travel_preference', opt.value as any)
                                            triggerSave()
                                        }}
                                        className={`option-button ${profile.travel_preference === opt.value ? 'is-active' : ''}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        </>
    )
}
