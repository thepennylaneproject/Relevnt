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
        <>
            {/* Job Titles */}
            <article className="surface-card">
                <div className="rl-field-grid">
                    <div style={{ display: 'grid', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                            <Icon name="briefcase" size="sm" hideAccent />
                            <span>Target job titles</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Pick up to 5 titles. Type to search or add your own.
                        </p>
                    </div>

                    {/* Selected titles */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {prefs.related_titles.map((title) => (
                            <OptionChip
                                key={title}
                                label={title}
                                selected
                                onRemove={() => removeRelatedTitle(title)}
                            />
                        ))}
                    </div>

                    {/* Type-to-add input for titles */}
                    {prefs.related_titles.length < 5 && (
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                value={titleInput}
                                onChange={(e) => setTitleInput(e.target.value)}
                                onFocus={() => setTitleInputFocused(true)}
                                onBlur={() => setTimeout(() => setTitleInputFocused(false), 150)}
                                onKeyDown={handleTitleKeyDown}
                                placeholder="Type a job title..."
                                className="rl-input"
                                style={{ fontSize: 13, padding: '10px 14px' }}
                            />

                            {/* Unified dropdown */}
                            {showTitleDropdown && (titleInputIsNew || filteredTitleSuggestions.length > 0) && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    marginTop: 4,
                                    background: 'var(--color-bg)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-md)',
                                    boxShadow: 'var(--shadow-md)',
                                    zIndex: 10,
                                    maxHeight: 240,
                                    overflowY: 'auto',
                                }}>
                                    {/* Add custom option - at top when input is new */}
                                    {titleInputIsNew && (
                                        <button
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault()
                                                addRelatedTitle(titleInputTrimmed)
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                width: '100%',
                                                padding: '10px 14px',
                                                textAlign: 'left',
                                                border: 'none',
                                                borderBottom: filteredTitleSuggestions.length > 0 ? '1px solid var(--border-subtle)' : 'none',
                                                background: 'var(--color-accent-glow)',
                                                fontSize: 13,
                                                fontWeight: 500,
                                                color: 'var(--color-accent)',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <Icon name="plus" size="sm" hideAccent />
                                            <span>Add "{titleInputTrimmed}"</span>
                                        </button>
                                    )}

                                    {/* Suggestions */}
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
                                                padding: '10px 14px',
                                                textAlign: 'left',
                                                border: 'none',
                                                background: 'transparent',
                                                fontSize: 13,
                                                color: 'var(--text)',
                                                cursor: 'pointer',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-alt)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {title}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{ display: 'grid', gap: 6, marginTop: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Seniority levels</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {SENIORITY_OPTIONS.map((level) => (
                                <OptionChip
                                    key={level}
                                    label={level}
                                    selected={prefs.seniority_levels.includes(level)}
                                    onClick={() => toggleSeniority(level)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </article>

            {/* Skills */}
            <article className="surface-card">
                <div className="rl-field-grid">
                    <div style={{ display: 'grid', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                            <Icon name="seeds" size="sm" hideAccent />
                            <span>Skills to highlight</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Type to search or add your own. We'll suggest related skills.
                        </p>
                    </div>

                    {/* Selected skills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {(prefs.include_keywords || []).map((skill) => (
                            <OptionChip
                                key={skill}
                                label={skill}
                                selected
                                onRemove={() => removeSkill(skill)}
                            />
                        ))}
                    </div>

                    {/* Type-to-add input for skills */}
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onFocus={() => setSkillInputFocused(true)}
                            onBlur={() => setTimeout(() => setSkillInputFocused(false), 150)}
                            onKeyDown={handleSkillKeyDown}
                            placeholder="Type a skill..."
                            className="rl-input"
                            style={{ fontSize: 13, padding: '10px 14px' }}
                        />

                        {/* Unified dropdown */}
                        {showSkillDropdown && (skillInputIsNew || filteredSkillSuggestions.length > 0) && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                marginTop: 4,
                                background: 'var(--color-bg)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                                boxShadow: 'var(--shadow-md)',
                                zIndex: 10,
                                maxHeight: 240,
                                overflowY: 'auto',
                            }}>
                                {/* Add custom option - at top when input is new */}
                                {skillInputIsNew && (
                                    <button
                                        type="button"
                                        onMouseDown={(e) => {
                                            e.preventDefault()
                                            addSkill(skillInputTrimmed)
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            width: '100%',
                                            padding: '10px 14px',
                                            textAlign: 'left',
                                            border: 'none',
                                            borderBottom: filteredSkillSuggestions.length > 0 ? '1px solid var(--border-subtle)' : 'none',
                                            background: 'var(--color-accent-glow)',
                                            fontSize: 13,
                                            fontWeight: 500,
                                            color: 'var(--color-accent)',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <Icon name="plus" size="sm" hideAccent />
                                        <span>Add "{skillInputTrimmed}"</span>
                                    </button>
                                )}

                                {/* Suggestions */}
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
                                            padding: '10px 14px',
                                            textAlign: 'left',
                                            border: 'none',
                                            background: 'transparent',
                                            fontSize: 13,
                                            color: 'var(--text)',
                                            cursor: 'pointer',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-alt)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        {skill}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </article>

            {/* Location & Remote */}
            <article className="surface-card">
                <div className="rl-field-grid">
                    <div style={{ display: 'grid', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                            <Icon name="compass" size="sm" hideAccent />
                            <span>Work location</span>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: 16 }}>
                        <div style={{ display: 'grid', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Remote preference</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {REMOTE_OPTIONS.map((option) => (
                                    <OptionChip
                                        key={option.id}
                                        label={option.label}
                                        selected={prefs.remote_preference === option.id}
                                        onClick={() => handleFieldChange('remote_preference', option.id)}
                                    />
                                ))}
                            </div>
                        </div>

                        <RangeSliderWithPresets
                            label="Location radius"
                            value={50}
                            min={0}
                            max={100}
                            onChange={() => { /* TODO: Add location radius to prefs */ }}
                            leftLabel="Local"
                            rightLabel="Anywhere"
                        />
                    </div>
                </div>
            </article>

            {/* Salary */}
            <article className="surface-card">
                <div className="rl-field-grid">
                    <div style={{ display: 'grid', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                            <Icon name="scroll" size="sm" hideAccent />
                            <span>Compensation</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            This is never shared with employers. We use it to filter out roles below your floor.
                        </p>
                    </div>

                    <RangeSliderWithPresets
                        label="Minimum base salary"
                        value={prefs.min_salary || 100000}
                        min={30000}
                        max={300000}
                        step={5000}
                        presets={SALARY_PRESETS}
                        onChange={(value) => handleFieldChange('min_salary', value)}
                        formatValue={(v) => `$${(v / 1000).toFixed(0)}K ${prefs.salary_currency}/${prefs.salary_unit === 'yearly' ? 'yr' : 'hr'}`}
                    />
                </div>
            </article>
        </>
    )
}
