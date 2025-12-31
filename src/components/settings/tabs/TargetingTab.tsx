/**
 * TargetingTab - Combined Persona + Career Targets
 *
 * Consolidates persona selection and career targeting into one tab
 * to reduce cognitive load from 6 Settings tabs to 5.
 */

import React, { useEffect, useState, useMemo } from 'react'
import { usePersonas } from '../../../hooks/usePersonas'
import { useJobPreferences, type JobPreferences } from '../../../hooks/useJobPreferences'
import { Button } from '../../ui/Button'
import { useSettingsAutoSave, type AutoSaveStatus } from '../../../hooks/useSettingsAutoSave'
import { Icon } from '../../ui/Icon'
import type { UserPersona } from '../../../types/v2-personas'

interface TargetingTabProps {
    onAutoSaveStatusChange: (status: AutoSaveStatus) => void
}

const SENIORITY_OPTIONS = ['Junior', 'Mid level', 'Senior', 'Lead', 'Director']
const REMOTE_OPTIONS = [
    { id: 'remote', label: 'Remote only' },
    { id: 'hybrid', label: 'Hybrid' },
    { id: 'onsite', label: 'Onsite' },
]

const ALL_SUGGESTED_SKILLS = [
    'Strategic Planning', 'User Research', 'Roadmapping',
    'Cross-functional Leadership', 'Data Analysis', 'Stakeholder Management',
    'Agile Methodologies', 'Product Strategy', 'Market Research',
    'SQL', 'Python', 'Communication', 'Project Management',
]

export function TargetingTab({ onAutoSaveStatusChange }: TargetingTabProps) {
    // Persona state
    const { personas, activePersona, setActivePersona, loading: personaLoading, error: personaError } = usePersonas()

    // Career targets state
    const { prefs, loading: prefsLoading, setField, save } = useJobPreferences()

    // Type-to-add inputs
    const [skillInput, setSkillInput] = useState('')
    const [skillInputFocused, setSkillInputFocused] = useState(false)

    const { status, triggerSave } = useSettingsAutoSave(save, { debounceMs: 800 })

    useEffect(() => {
        onAutoSaveStatusChange(status)
    }, [status, onAutoSaveStatusChange])

    const handlePersonaSelect = async (persona: UserPersona) => {
        if (persona.id !== activePersona?.id) {
            await setActivePersona(persona.id)
            triggerSave()
        }
    }

    const handleFieldChange = <K extends keyof JobPreferences>(key: K, value: JobPreferences[K]) => {
        setField(key, value)
        triggerSave()
    }

    // Skill suggestions
    const filteredSkillSuggestions = useMemo(() => {
        if (!prefs) return []
        const existing = prefs.include_keywords || []
        const query = skillInput.toLowerCase().trim()
        return ALL_SUGGESTED_SKILLS
            .filter(s => !existing.includes(s))
            .filter(s => query === '' ? true : s.toLowerCase().includes(query))
            .slice(0, 6)
    }, [skillInput, prefs])

    const addSkill = (skill: string) => {
        if (!prefs) return
        const current = prefs.include_keywords || []
        if (!current.includes(skill)) {
            handleFieldChange('include_keywords', [...current, skill])
            setSkillInput('')
        }
    }

    const removeSkill = (skill: string) => {
        if (!prefs) return
        handleFieldChange('include_keywords', (prefs.include_keywords || []).filter((s) => s !== skill))
    }

    const toggleSeniority = (level: string) => {
        if (!prefs) return
        const current = prefs.seniority_levels || []
        if (current.includes(level)) {
            handleFieldChange('seniority_levels', current.filter((s) => s !== level))
        } else {
            handleFieldChange('seniority_levels', [...current, level])
        }
    }

    const loading = personaLoading || prefsLoading

    if (loading) {
        return (
            <div className="tab-pane">
                <div className="card" style={{ textAlign: 'center', padding: 32 }}>
                    <p className="muted">Loading your targeting preferences...</p>
                </div>
            </div>
        )
    }

    if (personaError) {
        return (
            <div className="tab-pane">
                <div className="card" style={{ textAlign: 'center', color: 'var(--color-error)' }}>
                    <p>{personaError}</p>
                </div>
            </div>
        )
    }

    const skillInputTrimmed = skillInput.trim()
    const skillInputIsNew = skillInputTrimmed &&
        !(prefs?.include_keywords || []).includes(skillInputTrimmed) &&
        !filteredSkillSuggestions.some(s => s.toLowerCase() === skillInputTrimmed.toLowerCase())

    const showSkillDropdown = skillInputFocused

    return (
        <div className="tab-pane">
            {/* PERSONA SECTION */}
            <section className="collapsible-section">
                <div className="collapsible-header">
                    <div className="collapsible-header-content">
                        <Icon name="compass" size="sm" />
                        <div>
                            <h2>Active Persona</h2>
                            <p className="muted text-sm">Your persona shapes how Relevnt matches and applies for you</p>
                        </div>
                    </div>
                </div>

                <div className="collapsible-content">
                    <div className="card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                        {personas.map((persona) => {
                            const isActive = persona.id === activePersona?.id
                            return (
                                <div
                                    key={persona.id}
                                    className={`card card-persona ${isActive ? 'active' : ''}`}
                                    onClick={() => handlePersonaSelect(persona)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <h3>{persona.name || 'Untitled Persona'}</h3>
                                    {persona.description && (
                                        <p className="card-description text-sm muted">{persona.description}</p>
                                    )}
                                </div>
                            )
                        })}

                        {personas.length === 0 && (
                            <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-ink-tertiary)' }}>
                                <p>No personas yet. Create one to get started.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* CAREER TARGETS SECTION */}
            <section className="collapsible-section" style={{ marginTop: 24 }}>
                <div className="collapsible-header">
                    <div className="collapsible-header-content">
                        <Icon name="lighthouse" size="sm" />
                        <div>
                            <h2>Career Targets</h2>
                            <p className="muted text-sm">Define what you're looking for</p>
                        </div>
                    </div>
                </div>

                {prefs && (
                    <div className="collapsible-content">
                        {/* Job Titles */}
                        <div className="card">
                            <h3>Target job titles</h3>
                            <p className="card-description">Pick up to 5 titles. Type to search or add your own.</p>

                            {(prefs.related_titles || []).length > 0 && (
                                <p>{(prefs.related_titles || []).join(', ')}</p>
                            )}

                            <div style={{ marginTop: 20 }}>
                                <label className="form-label">Seniority levels</label>
                                <div className="button-group">
                                    {SENIORITY_OPTIONS.map((level) => (
                                        <Button
                                            key={level}
                                            type="button"
                                            variant={(prefs.seniority_levels || []).includes(level) ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => toggleSeniority(level)}
                                        >
                                            {level}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="card">
                            <h3>Skills to highlight</h3>
                            <p className="card-description">Type to search or add your own.</p>

                            <div className="pill-input">
                                {(prefs.include_keywords || []).map((skill) => (
                                    <div key={skill} className="pill">
                                        {skill}
                                        <button className="pill-remove" onClick={() => removeSkill(skill)}>×</button>
                                    </div>
                                ))}
                                <input
                                    type="text"
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    onFocus={() => setSkillInputFocused(true)}
                                    onBlur={() => setTimeout(() => setSkillInputFocused(false), 150)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && skillInput.trim()) {
                                            e.preventDefault()
                                            addSkill(skillInput.trim())
                                        }
                                    }}
                                    placeholder="Add skill..."
                                    className="pill-input-field"
                                />
                            </div>

                            {showSkillDropdown && (skillInputIsNew || filteredSkillSuggestions.length > 0) && (
                                <div className="dropdown-suggestions">
                                    {skillInputIsNew && (
                                        <button
                                            type="button"
                                            onMouseDown={(e) => { e.preventDefault(); addSkill(skillInputTrimmed) }}
                                            className="dropdown-item dropdown-item-new"
                                        >
                                            Add "{skillInputTrimmed}"
                                        </button>
                                    )}
                                    {filteredSkillSuggestions.map((skill) => (
                                        <button
                                            key={skill}
                                            type="button"
                                            onMouseDown={(e) => { e.preventDefault(); addSkill(skill) }}
                                            className="dropdown-item"
                                        >
                                            {skill}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Location & Compensation */}
                        <div className="card">
                            <h3>Work preferences</h3>

                            <div className="form-group">
                                <label className="form-label">Remote preference</label>
                                <div className="button-group">
                                    {REMOTE_OPTIONS.map((option) => (
                                        <Button
                                            key={option.id}
                                            type="button"
                                            variant={prefs.remote_preference === option.id ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => handleFieldChange('remote_preference', option.id as any)}
                                        >
                                            {option.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: 20 }}>
                                <div className="slider-header">
                                    <label className="form-label">Minimum base salary</label>
                                    <span className="slider-value">${((prefs.min_salary ?? 0) / 1000).toFixed(0)}K</span>
                                </div>
                                <input
                                    type="range"
                                    className="form-slider"
                                    min="30000"
                                    max="300000"
                                    step="5000"
                                    value={prefs.min_salary ?? 30000}
                                    onChange={(e) => handleFieldChange('min_salary', parseInt(e.target.value))}
                                />
                                <div className="slider-labels">
                                    <span>$30K</span>
                                    <span>$300K</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <style>{targetingTabStyles}</style>
        </div>
    )
}

const targetingTabStyles = `
.collapsible-section {
    background: var(--color-surface);
    border: 1px solid var(--color-graphite-faint);
    border-radius: var(--radius-lg);
    overflow: hidden;
}

.collapsible-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: transparent;
    border: none;
    text-align: left;
}

.collapsible-header-content {
    display: flex;
    align-items: center;
    gap: 12px;
}

.collapsible-header-content h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
}

.collapsible-header-content p {
    margin: 0;
}

.collapsible-content {
    padding: 0 20px 20px;
}

.collapsible-content .card {
    margin-top: 16px;
}

.collapsible-content .card:first-child {
    margin-top: 0;
}


.dropdown-suggestions {
    margin-top: 4px;
    background: var(--color-surface);
    border: 1px solid var(--color-graphite-faint);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    max-height: 200px;
    overflow-y: auto;
}

.dropdown-item {
    display: block;
    width: 100%;
    padding: 8px 12px;
    text-align: left;
    border: none;
    background: transparent;
    color: var(--color-ink);
    cursor: pointer;
    font-size: 0.875rem;
}

.dropdown-item:hover {
    background: var(--color-bg-alt);
}

.dropdown-item-new {
    background: var(--color-accent-glow);
    color: var(--color-accent);
}

.dropdown-item-new:hover {
    background: var(--color-accent-glow);
}
`

export default TargetingTab
