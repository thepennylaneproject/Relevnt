/**
 * JobSearchSection - Search Strategy
 * 
 * Controls: Active Persona, Target Job Titles, Seniority Levels, Skill Emphasis,
 *           Remote Preference, Relocation, Travel, Minimum Base Salary, Requires Sponsorship
 */

import React, { useEffect, useState, useMemo } from 'react'
import { usePersonas } from '../../../hooks/usePersonas'
import { useJobPreferences, type JobPreferences } from '../../../hooks/useJobPreferences'
import { useProfessionalProfile } from '../../../hooks/useProfessionalProfile'
import { useSettingsAutoSave, type AutoSaveStatus } from '../../../hooks/useSettingsAutoSave'
import type { UserPersona } from '../../../types/v2-personas'

interface JobSearchSectionProps {
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

export function JobSearchSection({ onAutoSaveStatusChange }: JobSearchSectionProps) {
    const { personas, activePersona, setActivePersona, loading: personaLoading, error: personaError } = usePersonas()
    const { prefs, loading: prefsLoading, setField, save: savePrefs } = useJobPreferences()
    const { profile, setField: setProfileField, save: saveProfile } = useProfessionalProfile()

    const [skillInput, setSkillInput] = useState('')
    const [skillInputFocused, setSkillInputFocused] = useState(false)

    const combinedSave = async () => {
        await Promise.all([savePrefs(), saveProfile()])
        return true
    }

    const { status, triggerSave } = useSettingsAutoSave(combinedSave, { debounceMs: 800 })

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
        // Enforce minimum one selection
        if (current.includes(level) && current.length <= 1) {
            return // Cannot deselect the last one
        }
        if (current.includes(level)) {
            handleFieldChange('seniority_levels', current.filter((s) => s !== level))
        } else {
            handleFieldChange('seniority_levels', [...current, level])
        }
    }

    const loading = personaLoading || prefsLoading

    if (loading) {
        return (
            <p className="settings-loading">Loading…</p>
        )
    }

    if (personaError) {
        return (
            <p className="settings-error">{personaError}</p>
        )
    }

    const skillInputTrimmed = skillInput.trim()
    const skillInputIsNew = skillInputTrimmed &&
        !(prefs?.include_keywords || []).includes(skillInputTrimmed) &&
        !filteredSkillSuggestions.some(s => s.toLowerCase() === skillInputTrimmed.toLowerCase())

    const showSkillDropdown = skillInputFocused

    const seniorityCount = (prefs?.seniority_levels || []).length
    const minSalaryK = ((prefs?.min_salary ?? 0) / 1000).toFixed(0)

    return (
        <div className="settings-fields">
                <div className="settings-field">
                    <span className="settings-field-label">Active persona</span>
                    <div className="settings-options-inline">
                        {personas.map((persona) => {
                            const isActive = persona.id === activePersona?.id
                            return (
                                <button
                                    key={persona.id}
                                    className={`settings-option ${isActive ? 'active' : ''}`}
                                    onClick={() => handlePersonaSelect(persona)}
                                >
                                    {persona.name || 'Untitled Persona'}
                                </button>
                            )
                        })}
                        {personas.length === 0 && (
                            <span className="settings-empty">None</span>
                        )}
                    </div>
                </div>

                {prefs && (
                    <div className="settings-field">
                        <span className="settings-field-label">Target job titles</span>
                        {(prefs.related_titles || []).length > 0 ? (
                            <p className="settings-field-value">{(prefs.related_titles || []).join(', ')}</p>
                        ) : (
                            <p className="settings-field-value settings-field-value--empty">—</p>
                        )}
                    </div>
                )}

                {prefs && (
                    <div className="settings-field">
                        <div className="settings-field-header">
                            <span className="settings-field-label">Seniority</span>
                            {seniorityCount > 0 && (
                                <span className="settings-field-hint">Showing {seniorityCount} level{seniorityCount !== 1 ? 's' : ''}</span>
                            )}
                        </div>
                        <div className="settings-options-inline">
                            {SENIORITY_OPTIONS.map((level) => (
                                <button
                                    key={level}
                                    className={`settings-option ${(prefs.seniority_levels || []).includes(level) ? 'active' : ''}`}
                                    onClick={() => toggleSeniority(level)}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                        {seniorityCount === 0 && (
                            <span className="settings-field-warning">None selected</span>
                        )}
                    </div>
                )}

                {prefs && (
                    <div className="settings-field">
                        <span className="settings-field-label">Skill emphasis</span>
                        <div className="settings-tags">
                            {(prefs.include_keywords || []).map((skill) => (
                                <span key={skill} className="settings-tag">
                                    {skill}
                                    <button className="settings-tag-remove" onClick={() => removeSkill(skill)}>×</button>
                                </span>
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
                                placeholder="Add…"
                                className="settings-tag-input"
                            />
                        </div>

                        {showSkillDropdown && (skillInputIsNew || filteredSkillSuggestions.length > 0) && (
                            <div className="settings-suggestions">
                                {skillInputIsNew && (
                                    <button
                                        type="button"
                                        onMouseDown={(e) => { e.preventDefault(); addSkill(skillInputTrimmed) }}
                                        className="settings-suggestion"
                                    >
                                        Add "{skillInputTrimmed}"
                                    </button>
                                )}
                                {filteredSkillSuggestions.map((skill) => (
                                    <button
                                        key={skill}
                                        type="button"
                                        onMouseDown={(e) => { e.preventDefault(); addSkill(skill) }}
                                        className="settings-suggestion"
                                    >
                                        {skill}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {prefs && (
                    <div className="settings-field">
                        <span className="settings-field-label">Remote preference</span>
                        <div className="settings-options-inline">
                            {REMOTE_OPTIONS.map((option) => (
                                <button
                                    key={option.id}
                                    className={`settings-option ${prefs.remote_preference === option.id ? 'active' : ''}`}
                                    onClick={() => handleFieldChange('remote_preference', option.id)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Location & Flexibility cluster */}
                {profile && (
                    <div className="settings-field">
                        <span className="settings-field-label">Relocation</span>
                        <div className="settings-options-inline">
                            {[
                                { value: 'no', label: 'No' },
                                { value: 'yes', label: 'Yes' },
                                { value: 'depends', label: 'Depends' },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    className={`settings-option ${profile.relocate_preference === opt.value ? 'active' : ''}`}
                                    onClick={() => {
                                        setProfileField('relocate_preference', opt.value as any)
                                        triggerSave()
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {profile && (
                    <div className="settings-field">
                        <span className="settings-field-label">Travel</span>
                        <div className="settings-options-inline">
                            {[
                                { value: 'none', label: 'None' },
                                { value: 'some', label: 'Occasional' },
                                { value: 'frequent', label: 'Frequent' },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    className={`settings-option ${profile.travel_preference === opt.value ? 'active' : ''}`}
                                    onClick={() => {
                                        setProfileField('travel_preference', opt.value as any)
                                        triggerSave()
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {prefs && (
                    <div className="settings-field">
                        <div className="settings-field-header">
                            <span className="settings-field-label">Minimum salary</span>
                            <span className="settings-value-display">${minSalaryK}K</span>
                        </div>
                        <input
                            type="range"
                            className="settings-slider"
                            min="30000"
                            max="300000"
                            step="5000"
                            value={prefs.min_salary ?? 30000}
                            onChange={(e) => handleFieldChange('min_salary', parseInt(e.target.value))}
                        />
                        <div className="settings-slider-labels">
                            <span>$30K</span>
                            <span>$300K</span>
                        </div>
                        <span className="settings-field-hint">Jobs below ${minSalaryK}K will not be shown</span>
                    </div>
                )}

                {profile && (
                    <div className="settings-field">
                        <span className="settings-field-label">Requires sponsorship</span>
                        <div className="settings-options-inline">
                            {[
                                { value: false, label: 'No' },
                                { value: true, label: 'Yes' },
                            ].map((opt) => (
                                <button
                                    key={opt.label}
                                    className={`settings-option ${profile.needs_sponsorship === opt.value ? 'active' : ''}`}
                                    onClick={() => {
                                        setProfileField('needs_sponsorship', opt.value)
                                        triggerSave()
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
        </div>
    )
}
