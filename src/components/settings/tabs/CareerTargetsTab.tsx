import React, { useEffect, useState, useMemo } from 'react'
import { useJobPreferences, type JobPreferences } from '../../../hooks/useJobPreferences'
import { useSettingsAutoSave, type AutoSaveStatus } from '../../../hooks/useSettingsAutoSave'
import { Icon } from '../../ui/Icon'
import { OptionChip } from '../OptionChip'
import { RangeSliderWithPresets } from '../RangeSliderWithPresets'

interface CareerTargetsTabProps {
    onAutoSaveStatusChange: (status: AutoSaveStatus) => void
}

const SENIORITY_OPTIONS = ['Junior', 'Mid level', 'Senior', 'Lead', 'Director']
const REMOTE_OPTIONS = [
    { id: 'remote', label: 'Remote only' },
    { id: 'hybrid', label: 'Hybrid' },
    { id: 'onsite', label: 'Onsite' },
]

const SALARY_PRESETS = [
    { label: 'Conservative', value: 75000 },
    { label: 'Market average', value: 120000 },
    { label: 'Stretch', value: 180000 },
]

// Larger pool of titles for suggestions
const ALL_SUGGESTED_TITLES = [
    'Product Manager',
    'Senior Product Manager',
    'Director of Product',
    'Product Lead',
    'Head of Product',
    'VP of Product',
    'Chief Product Officer',
    'Product Owner',
    'Technical Product Manager',
    'Growth Product Manager',
    'Platform Product Manager',
    'Data Product Manager',
    'AI Product Manager',
    'Product Marketing Manager',
    'Product Designer',
]

// Larger pool of skills for suggestions
const ALL_SUGGESTED_SKILLS = [
    'Strategic Planning',
    'User Research',
    'Roadmapping',
    'Cross-functional Leadership',
    'Data Analysis',
    'Stakeholder Management',
    'Agile Methodologies',
    'Scrum',
    'Product Strategy',
    'Market Research',
    'A/B Testing',
    'SQL',
    'Python',
    'Machine Learning',
    'UX Design',
    'Wireframing',
    'Communication',
    'Project Management',
    'Technical Writing',
    'Analytics',
]

export function CareerTargetsTab({ onAutoSaveStatusChange }: CareerTargetsTabProps) {
    const { prefs, loading, setField, save } = useJobPreferences()

    // State for type-to-add inputs
    const [titleInput, setTitleInput] = useState('')
    const [skillInput, setSkillInput] = useState('')
    const [titleInputFocused, setTitleInputFocused] = useState(false)
    const [skillInputFocused, setSkillInputFocused] = useState(false)

    const { status, triggerSave } = useSettingsAutoSave(save, { debounceMs: 800 })

    useEffect(() => {
        onAutoSaveStatusChange(status)
    }, [status, onAutoSaveStatusChange])

    const handleFieldChange = <K extends keyof JobPreferences>(key: K, value: JobPreferences[K]) => {
        setField(key, value)
        triggerSave()
    }

    // Filter title suggestions based on input
    const filteredTitleSuggestions = useMemo(() => {
        if (!prefs) return []
        const existing = prefs.related_titles || []
        const query = titleInput.toLowerCase().trim()

        return ALL_SUGGESTED_TITLES
            .filter(t => !existing.includes(t))
            .filter(t => query === '' ? true : t.toLowerCase().includes(query))
            .slice(0, 6)
    }, [titleInput, prefs])

    // Filter skill suggestions based on input
    const filteredSkillSuggestions = useMemo(() => {
        if (!prefs) return []
        const existing = prefs.include_keywords || []
        const query = skillInput.toLowerCase().trim()

        return ALL_SUGGESTED_SKILLS
            .filter(s => !existing.includes(s))
            .filter(s => query === '' ? true : s.toLowerCase().includes(query))
            .slice(0, 6)
    }, [skillInput, prefs])

    const addRelatedTitle = (title: string) => {
        if (!prefs) return
        const current = prefs.related_titles || []
        if (current.length >= 5) return
        if (!current.includes(title)) {
            handleFieldChange('related_titles', [...current, title])
            setTitleInput('')
        }
    }

    const removeRelatedTitle = (title: string) => {
        if (!prefs) return
        handleFieldChange('related_titles', prefs.related_titles.filter((t) => t !== title))
    }

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
        const current = prefs.include_keywords || []
        handleFieldChange('include_keywords', current.filter((s) => s !== skill))
    }

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && titleInput.trim()) {
            e.preventDefault()
            addRelatedTitle(titleInput.trim())
        }
    }

    const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && skillInput.trim()) {
            e.preventDefault()
            addSkill(skillInput.trim())
        }
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

    if (loading || !prefs) {
        return (
            <article className="surface-card">
                <div style={{ padding: 24, textAlign: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        Loading preferences...
                    </span>
                </div>
            </article>
        )
    }

    // Dropdown visibility
    const showTitleDropdown = titleInputFocused && prefs.related_titles.length < 5
    const showSkillDropdown = skillInputFocused

    // Check if typed input is new (not already selected, not matching a suggestion exactly)
    const titleInputTrimmed = titleInput.trim()
    const titleInputIsNew = titleInputTrimmed &&
        !prefs.related_titles.includes(titleInputTrimmed) &&
        !filteredTitleSuggestions.some(t => t.toLowerCase() === titleInputTrimmed.toLowerCase())

    const skillInputTrimmed = skillInput.trim()
    const skillInputIsNew = skillInputTrimmed &&
        !(prefs.include_keywords || []).includes(skillInputTrimmed) &&
        !filteredSkillSuggestions.some(s => s.toLowerCase() === skillInputTrimmed.toLowerCase())

    return (
        <div className="tab-pane">
            <div className="card">
                <h3>Target job titles</h3>
                <p className="card-description">Pick up to 5 titles. Type to search or add your own.</p>
                
                <div className="pill-input">
                    {prefs.related_titles.map((title) => (
                        <div key={title} className="pill">
                            {title}
                            <button className="pill-remove" onClick={() => removeRelatedTitle(title)}>X</button>
                        </div>
                    ))}
                    {prefs.related_titles.length < 5 && (
                        <input
                            type="text"
                            value={titleInput}
                            onChange={(e) => setTitleInput(e.target.value)}
                            onFocus={() => setTitleInputFocused(true)}
                            onBlur={() => setTimeout(() => setTitleInputFocused(false), 150)}
                            onKeyDown={handleTitleKeyDown}
                            placeholder="Add another..."
                            className="pill-input-field"
                        />
                    )}
                </div>
                
                {/* Suggestions Dropdown */}
                {showTitleDropdown && (titleInputIsNew || filteredTitleSuggestions.length > 0) && (
                    <div style={{
                        marginTop: 4,
                        background: 'var(--color-bg-tertiary)',
                        border: '1px solid var(--color-graphite-faint)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-md)',
                        zIndex: 10,
                        maxHeight: 200,
                        overflowY: 'auto',
                    }}>
                        {titleInputIsNew && (
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault()
                                    addRelatedTitle(titleInputTrimmed)
                                }}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '8px 12px',
                                    textAlign: 'left',
                                    border: 'none',
                                    background: 'rgba(212, 165, 116, 0.1)',
                                    color: 'var(--color-accent)',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem'
                                }}
                            >
                                Add "{titleInputTrimmed}"
                            </button>
                        )}
                        {filteredTitleSuggestions.map((title) => (
                            <button
                                key={title}
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault()
                                    addRelatedTitle(title)
                                }}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '8px 12px',
                                    textAlign: 'left',
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'var(--color-ink)',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem'
                                }}
                            >
                                {title}
                            </button>
                        ))}
                    </div>
                )}

                <div style={{ marginTop: 24 }}>
                    <label className="form-label">Seniority levels</label>
                    <div className="button-group">
                        {SENIORITY_OPTIONS.map((level) => (
                            <button
                                key={level}
                                className={`btn-option ${prefs.seniority_levels.includes(level) ? 'active' : ''}`}
                                onClick={() => toggleSeniority(level)}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="card">
                <h3>Skills to highlight</h3>
                <p className="card-description">Type to search or add your own. We'll suggest related skills.</p>
                
                <div className="pill-input">
                    {(prefs.include_keywords || []).map((skill) => (
                        <div key={skill} className="pill">
                            {skill}
                            <button className="pill-remove" onClick={() => removeSkill(skill)}>X</button>
                        </div>
                    ))}
                    <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onFocus={() => setSkillInputFocused(true)}
                        onBlur={() => setTimeout(() => setSkillInputFocused(false), 150)}
                        onKeyDown={handleSkillKeyDown}
                        placeholder="Add another..."
                        className="pill-input-field"
                    />
                </div>
                
                {/* Suggestions Dropdown */}
                {showSkillDropdown && (skillInputIsNew || filteredSkillSuggestions.length > 0) && (
                    <div style={{
                        marginTop: 4,
                        background: 'var(--color-bg-tertiary)',
                        border: '1px solid var(--color-graphite-faint)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-md)',
                        zIndex: 10,
                        maxHeight: 200,
                        overflowY: 'auto',
                    }}>
                        {skillInputIsNew && (
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault()
                                    addSkill(skillInputTrimmed)
                                }}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '8px 12px',
                                    textAlign: 'left',
                                    border: 'none',
                                    background: 'rgba(212, 165, 116, 0.1)',
                                    color: 'var(--color-accent)',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem'
                                }}
                            >
                                Add "{skillInputTrimmed}"
                            </button>
                        )}
                        {filteredSkillSuggestions.map((skill) => (
                            <button
                                key={skill}
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault()
                                    addSkill(skill)
                                }}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '8px 12px',
                                    textAlign: 'left',
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'var(--color-ink)',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem'
                                }}
                            >
                                {skill}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="card">
                <h3>Work location</h3>
                <div className="form-group">
                    <label className="form-label">Remote preference</label>
                    <div className="button-group">
                        {REMOTE_OPTIONS.map((option) => (
                            <button
                                key={option.id}
                                className={`btn-option ${prefs.remote_preference === option.id ? 'active' : ''}`}
                                onClick={() => handleFieldChange('remote_preference', option.id as any)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group" style={{ marginTop: 24 }}>
                    <div className="slider-header">
                        <label className="form-label">Location radius</label>
                        <span className="slider-value">50 miles</span>
                    </div>
                    <input 
                        type="range" 
                        className="form-slider" 
                        min="0" max="100" 
                        defaultValue="50"
                        onChange={() => {}}
                    />
                    <div className="slider-labels">
                        <span>Local</span>
                        <span>Anywhere</span>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3>Compensation</h3>
                <p className="card-description">This is never shared with employers. We use it to filter out roles below your floor.</p>
                
                <div className="form-group">
                    <div className="slider-header">
                        <label className="form-label">Minimum base salary</label>
                        <span className="slider-value">${(prefs.min_salary / 1000).toFixed(0)}K</span>
                    </div>
                    <input 
                        type="range" 
                        className="form-slider" 
                        min="30000" 
                        max="300000" 
                        step="5000"
                        value={prefs.min_salary}
                        onChange={(e) => handleFieldChange('min_salary', parseInt(e.target.value))}
                    />
                    <div className="slider-labels">
                        <span>$30K</span>
                        <span>$300K</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
