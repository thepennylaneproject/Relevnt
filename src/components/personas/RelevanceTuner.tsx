/**
 * =============================================================================
 * RelevanceTuner Component
 * =============================================================================
 * 
 * Slider-based UI for adjusting job match relevance weights.
 * 
 * Features:
 * - 5 sliders for different weight factors
 * - Live weight distribution preview
 * - Save/load/delete presets
 * - Reset to defaults
 * - Responsive design
 * 
 * =============================================================================
 */

import { useState } from 'react'
import { Icon } from '../ui/Icon'
import { useRelevanceTuner } from '../../hooks/useRelevanceTuner'
import type { WeightConfig } from '../../types/v2-schema'

// =============================================================================
// TYPES
// =============================================================================

export interface RelevanceTunerProps {
    /** Optional callback when weights change */
    onWeightsChange?: (weights: WeightConfig) => void

    /** Custom className */
    className?: string

    /** Compact mode for tight spaces */
    compact?: boolean

    // --- Feed Filter Props ---
    minSalary?: number
    setMinSalary?: (val: number) => void
    remoteOnly?: boolean
    setRemoteOnly?: (val: boolean) => void
    source?: string
    setSource?: (val: string) => void
    employmentType?: string
    setEmploymentType?: (val: string) => void
    availableSources?: { id: string; name: string; source_key: string }[]
}

// =============================================================================
// COMPONENT
// =============================================================================

export function RelevanceTuner({
    onWeightsChange,
    className = '',
    compact = false,
    minSalary = 0,
    setMinSalary,
    remoteOnly = false,
    setRemoteOnly,
    source = '',
    setSource,
    employmentType = '',
    setEmploymentType,
    availableSources = [],
}: RelevanceTunerProps) {
    const {
        presets,
        currentWeights,
        selectedPreset,
        loading,
        error,
        setWeight,
        resetToDefaults,
        savePreset,
        loadPreset,
        deletePreset,
    } = useRelevanceTuner()

    const [isExpanded, setIsExpanded] = useState(false) // Collapsed by default
    const [showSaveForm, setShowSaveForm] = useState(false)
    const [showDistribution, setShowDistribution] = useState(false)
    const [presetName, setPresetName] = useState('')
    const [saving, setSaving] = useState(false)

    // Human-friendly preset labels
    const PRESET_LABELS: Record<string, { label: string; description: string }> = {
        'default': { label: 'Balanced', description: 'A little bit of everything weighted equally.' },
        'skills-first': { label: 'Skills-first', description: 'Roles that best match what you already know.' },
        'pay-first': { label: 'Pay-first', description: 'Higher salary takes priority in the ranking.' },
        'remote-friendly': { label: 'Remote-friendly', description: 'Remote-friendly roles float to the top.' },
    }

    // ---------------------------------------------------------------------------
    // WEIGHT HANDLERS
    // ---------------------------------------------------------------------------

    const handleWeightChange = (field: keyof WeightConfig, value: number) => {
        const normalizedValue = value / 100 // Convert 0-100 to 0-1
        setWeight(field, normalizedValue)

        // Notify parent if callback provided
        if (onWeightsChange) {
            onWeightsChange({
                ...currentWeights,
                [field]: normalizedValue,
            })
        }
    }

    const handleReset = () => {
        resetToDefaults()
        if (onWeightsChange) {
            onWeightsChange({
                skill_weight: 0.3,
                salary_weight: 0.25,
                location_weight: 0.15,
                remote_weight: 0.2,
                industry_weight: 0.1,
            })
        }
    }

    // ---------------------------------------------------------------------------
    // PRESET HANDLERS
    // ---------------------------------------------------------------------------

    const handleSavePreset = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!presetName.trim()) {
            return
        }

        try {
            setSaving(true)
            await savePreset(presetName.trim())
            setPresetName('')
            setShowSaveForm(false)
        } catch (err) {
            console.error('Failed to save preset:', err)
        } finally {
            setSaving(false)
        }
    }

    const handleLoadPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const presetId = e.target.value
        if (!presetId) {
            resetToDefaults()
            return
        }

        const preset = presets.find(p => p.id === presetId)
        if (preset) {
            loadPreset(preset)
            if (onWeightsChange) {
                onWeightsChange({
                    skill_weight: preset.skill_weight,
                    salary_weight: preset.salary_weight,
                    location_weight: preset.location_weight,
                    remote_weight: preset.remote_weight,
                    industry_weight: preset.industry_weight,
                })
            }
        }
    }

    const handleDeletePreset = async () => {
        if (!selectedPreset || !selectedPreset.id) return

        if (!confirm(`Delete preset "${selectedPreset.name}"?`)) {
            return
        }

        try {
            await deletePreset(selectedPreset.id)
        } catch (err) {
            console.error('Failed to delete preset:', err)
        }
    }

    // ---------------------------------------------------------------------------
    // CALCULATE PERCENTAGES FOR DISPLAY
    // ---------------------------------------------------------------------------

    const totalWeight = Object.values(currentWeights).reduce((sum, w) => sum + w, 0)
    const percentages = {
        skill: totalWeight > 0 ? (currentWeights.skill_weight / totalWeight) * 100 : 20,
        salary: totalWeight > 0 ? (currentWeights.salary_weight / totalWeight) * 100 : 20,
        location: totalWeight > 0 ? (currentWeights.location_weight / totalWeight) * 100 : 20,
        remote: totalWeight > 0 ? (currentWeights.remote_weight / totalWeight) * 100 : 20,
        industry: totalWeight > 0 ? (currentWeights.industry_weight / totalWeight) * 100 : 20,
    }

    // ---------------------------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------------------------

    if (loading) {
        return (
            <div className={`relevance-tuner relevance-tuner--loading ${className}`}>
                <div className="tuner-loading">Loading tuner settings...</div>
            </div>
        )
    }

    return (
        <div className={`relevance-tuner surface-card ${className}`}>
            {/* Collapsible Header */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="tuner-header"
                aria-expanded={isExpanded}
            >
                <div className="tuner-header__content">
                    <h3 className="tuner-header__title">Tune your ranking</h3>
                    <span className="tuner-header__subtitle">
                        {isExpanded
                            ? 'Tell us what to emphasize. We still consider everything.'
                            : `Currently: ${selectedPreset?.name || 'Balanced'}`}
                    </span>
                </div>
                <div className="tuner-header__chevron">
                    <Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} size="sm" hideAccent />
                </div>
            </button>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="tuner-body">
                    
                    {/* Filter Section */}
                    <div className="tuner-filters">
                        <div className="filter-grid">
                            <div className="form-group">
                                <label className="form-label">Minimum Salary (USD)</label>
                                <input
                                    type="number"
                                    min={0}
                                    step={5000}
                                    value={minSalary}
                                    onChange={(e) => {
                                        const raw = e.target.value
                                        const numeric = raw.replace(/[^\d]/g, '')
                                        const num = numeric === '' ? 0 : Number(numeric)
                                        const next = num <= 0 ? 0 : num
                                        setMinSalary?.(next)
                                    }}
                                    className="form-input"
                                    placeholder="e.g. 100000"
                                />
                            </div>

                            <div className="field">
                                <label className="form-label">Source</label>
                                <select
                                    value={source}
                                    onChange={(e) => setSource?.(e.target.value)}
                                    className="form-select"
                                >
                                    <option value="">All Sources</option>
                                    {availableSources.map((s) => (
                                        <option key={s.id} value={s.source_key}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="field">
                                <label className="form-label">Employment Type</label>
                                <select
                                    value={employmentType}
                                    onChange={(e) => setEmploymentType?.(e.target.value)}
                                    className="form-select"
                                >
                                    <option value="">All Types</option>
                                    <option value="full-time">Full-time</option>
                                    <option value="part-time">Part-time</option>
                                    <option value="contract">Contract</option>
                                    <option value="temporary">Temporary</option>
                                </select>
                            </div>

                            <div className="form-group checkbox-field">
                                <input
                                    id="remote-only-toggle"
                                    type="checkbox"
                                    className="form-checkbox"
                                    checked={remoteOnly}
                                    onChange={(e) => setRemoteOnly?.(e.target.checked)}
                                />
                                <label htmlFor="remote-only-toggle" className="form-label">
                                    Remote Friendly Only
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="tuner-divider">
                        <span className="divider-text">Ranking Weights</span>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="error-box">
                            <div className="error-icon">
                                <Icon name="alert-triangle" size="sm" hideAccent />
                            </div>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Preset Controls */}
                    <div className="preset-controls">
                        <select
                            value={selectedPreset?.id || ''}
                            onChange={handleLoadPreset}
                            className="form-select preset-select"
                            disabled={loading}
                        >
                            <option value="">Balanced</option>
                            {presets.map(preset => (
                                <option key={preset.id} value={preset.id}>
                                    {preset.name} {preset.is_default ? '(Default)' : ''}
                                </option>
                            ))}
                        </select>
                        {/* Show description for selected preset */}
                        {selectedPreset && PRESET_LABELS[selectedPreset.name.toLowerCase()] && (
                            <div className="preset-description">
                                {PRESET_LABELS[selectedPreset.name.toLowerCase()].description}
                            </div>
                        )}

                        <div className="preset-buttons">
                            {selectedPreset && !selectedPreset.is_default && (
                                <button
                                    type="button"
                                    onClick={handleDeletePreset}
                                    className="btn btn-destructive btn-sm"
                                    title="Delete preset"
                                >
                                    🗑️
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setShowSaveForm(!showSaveForm)}
                                className="btn btn-secondary btn-sm"
                            >
                                {showSaveForm ? 'Cancel' : 'Save'}
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="btn btn-ghost btn-sm"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Save Form */}
                    {showSaveForm && (
                        <form onSubmit={handleSavePreset} className="save-form">
                            <input
                                type="text"
                                value={presetName}
                                onChange={(e) => setPresetName(e.target.value)}
                                placeholder="Preset name..."
                                className="form-input"
                                disabled={saving}
                                autoFocus
                            />
                            <button
                                type="submit"
                                className="btn btn-primary btn-sm"
                                disabled={saving || !presetName.trim()}
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </form>
                    )}

                    {/* Sliders */}
                    <div className="sliders-container">
                        <div className="slider-group">
                            <label className="slider-label">
                                <span className="label-text">Skills</span>
                                <span className="label-value">{Math.round(percentages.skill)}%</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={currentWeights.skill_weight * 100}
                                onChange={(e) => handleWeightChange('skill_weight', parseFloat(e.target.value))}
                                className="tuner-slider"
                            />
                            <div className="hint">Match what you're already good at</div>
                        </div>

                        <div className="slider-group">
                            <label className="slider-label">
                                <span className="label-text">Salary</span>
                                <span className="label-value">{Math.round(percentages.salary)}%</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={currentWeights.salary_weight * 100}
                                onChange={(e) => handleWeightChange('salary_weight', parseFloat(e.target.value))}
                                className="tuner-slider"
                            />
                            <div className="hint">Higher pay floats to the top</div>
                        </div>

                        <div className="slider-group">
                            <label className="slider-label">
                                <span className="label-text">Location</span>
                                <span className="label-value">{Math.round(percentages.location)}%</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={currentWeights.location_weight * 100}
                                onChange={(e) => handleWeightChange('location_weight', parseFloat(e.target.value))}
                                className="tuner-slider"
                            />
                            <div className="hint">Favor your preferred cities or regions</div>
                        </div>

                        <div className="slider-group">
                            <label className="slider-label">
                                <span className="label-text">Remote</span>
                                <span className="label-value">{Math.round(percentages.remote)}%</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={currentWeights.remote_weight * 100}
                                onChange={(e) => handleWeightChange('remote_weight', parseFloat(e.target.value))}
                                className="tuner-slider"
                            />
                            <div className="hint">Remote-friendly roles rank higher</div>
                        </div>

                        <div className="slider-group">
                            <label className="slider-label">
                                <span className="label-text">Industry</span>
                                <span className="label-value">{Math.round(percentages.industry)}%</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={currentWeights.industry_weight * 100}
                                onChange={(e) => handleWeightChange('industry_weight', parseFloat(e.target.value))}
                                className="tuner-slider"
                            />
                            <div className="hint">Lean toward industries you care about</div>
                        </div>
                    </div>

                    {/* Collapsible Weight Distribution Visualization */}
                    <div className="distribution-section">
                        <button
                            type="button"
                            onClick={() => setShowDistribution(!showDistribution)}
                            className="distribution-toggle"
                        >
                            {showDistribution ? '▼' : '▶'} See how your weights stack up
                        </button>

                        {showDistribution && (
                            <>
                                <div className="distribution-bar">
                                    <div
                                        className="distribution-segment"
                                        style={{
                                            width: `${percentages.skill}%`,
                                            backgroundColor: 'var(--color-accent, #d4af37)',
                                        }}
                                        title={`Skills: ${Math.round(percentages.skill)}%`}
                                    >
                                        {percentages.skill > 10 && <span className="segment-label">{Math.round(percentages.skill)}%</span>}
                                    </div>
                                    <div
                                        className="distribution-segment"
                                        style={{
                                            width: `${percentages.salary}%`,
                                            backgroundColor: 'var(--color-success, #4ade80)',
                                        }}
                                        title={`Salary: ${Math.round(percentages.salary)}%`}
                                    >
                                        {percentages.salary > 10 && <span className="segment-label">{Math.round(percentages.salary)}%</span>}
                                    </div>
                                    <div
                                        className="distribution-segment"
                                        style={{
                                            width: `${percentages.location}%`,
                                            backgroundColor: 'var(--color-info, #60a5fa)',
                                        }}
                                        title={`Location: ${Math.round(percentages.location)}%`}
                                    >
                                        {percentages.location > 10 && <span className="segment-label">{Math.round(percentages.location)}%</span>}
                                    </div>
                                    <div
                                        className="distribution-segment"
                                        style={{
                                            width: `${percentages.remote}%`,
                                            backgroundColor: 'var(--color-warning, #fbbf24)',
                                        }}
                                        title={`Remote: ${Math.round(percentages.remote)}%`}
                                    >
                                        {percentages.remote > 10 && <span className="segment-label">{Math.round(percentages.remote)}%</span>}
                                    </div>
                                    <div
                                        className="distribution-segment"
                                        style={{
                                            width: `${percentages.industry}%`,
                                            backgroundColor: 'var(--color-purple, #a78bfa)',
                                        }}
                                        title={`Industry: ${Math.round(percentages.industry)}%`}
                                    >
                                        {percentages.industry > 10 && <span className="segment-label">{Math.round(percentages.industry)}%</span>}
                                    </div>
                                </div>
                                <div className="distribution-legend">
                                    <span className="legend-item" style={{ color: 'var(--color-accent, #d4af37)' }}>■ Skills</span>
                                    <span className="legend-item" style={{ color: 'var(--color-success, #4ade80)' }}>■ Salary</span>
                                    <span className="legend-item" style={{ color: 'var(--color-info, #60a5fa)' }}>■ Location</span>
                                    <span className="legend-item" style={{ color: 'var(--color-warning, #fbbf24)' }}>■ Remote</span>
                                    <span className="legend-item" style={{ color: 'var(--color-purple, #a78bfa)' }}>■ Industry</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// =============================================================================
// STYLES
// =============================================================================

const styles: Record<string, React.CSSProperties> = {
    container: {
        // Removed - now using surface-card className
        marginBottom: '24px',
    },

    compactContainer: {
        padding: '16px',
    },

    header: {
        marginBottom: '16px',
    },

    title: {
        margin: 0,
        fontSize: '18px',
        fontWeight: 600,
        color: 'var(--text)',
    },

    subtitle: {
        fontSize: '13px',
        color: 'var(--text-muted)',
        marginTop: '4px',
    },

    errorBox: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '6px',
        padding: '12px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        color: 'var(--danger)',
    },

    errorIcon: {
        fontSize: '16px',
    },

    presetControls: {
        display: 'flex',
        gap: '12px',
        marginBottom: '16px',
        flexWrap: 'wrap',
        alignItems: 'center',
    },

    presetSelect: {
        flex: 1,
        minWidth: '180px',
        padding: '8px 12px',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        color: 'var(--text)',
        fontSize: '14px',
        cursor: 'pointer',
    },

    presetButtons: {
        display: 'flex',
        gap: '8px',
    },

    primaryButton: {
        padding: '8px 16px',
        backgroundColor: 'var(--accent)',
        border: 'none',
        borderRadius: '6px',
        color: 'var(--text)',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'opacity 0.2s',
    },

    secondaryButton: {
        padding: '8px 16px',
        backgroundColor: 'var(--surface-soft)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        color: 'var(--text)',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },

    deleteButton: {
        padding: '8px 12px',
        backgroundColor: 'transparent',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '6px',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },

    saveForm: {
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
        padding: '12px',
        backgroundColor: 'var(--surface-soft)',
        borderRadius: '6px',
    },

    presetInput: {
        flex: 1,
        padding: '8px 12px',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        color: 'var(--text)',
        fontSize: '14px',
    },

    slidersContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        marginBottom: '20px',
    },

    sliderGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },

    sliderLabel: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '14px',
        fontWeight: 500,
        color: 'var(--text)',
    },

    labelText: {
        fontSize: '14px',
    },

    labelValue: {
        fontSize: '14px',
        color: 'var(--accent)',
        fontWeight: 600,
    },

    slider: {
        width: '100%',
        height: '6px',
        borderRadius: '3px',
        background: 'var(--surface-soft)',
        outline: 'none',
        cursor: 'pointer',
    },

    hint: {
        fontSize: '12px',
        color: 'var(--text-muted)',
        fontStyle: 'italic',
    },

    presetDescription: {
        fontSize: '12px',
        color: 'var(--text-muted)',
        fontStyle: 'italic',
        marginLeft: '4px',
    },

    distributionSection: {
        marginTop: '16px',
    },

    distributionToggle: {
        background: 'transparent',
        border: 'none',
        color: 'var(--text-muted)',
        fontSize: '13px',
        cursor: 'pointer',
        padding: '8px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'color 0.2s',
    },

    distributionLabel: {
        fontSize: '13px',
        fontWeight: 500,
        color: 'var(--text-muted)',
        marginBottom: '8px',
    },

    distributionBar: {
        display: 'flex',
        height: '40px',
        borderRadius: '6px',
        overflow: 'hidden',
        backgroundColor: 'var(--surface-soft)',
    },

    distributionSegment: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'width 0.3s ease',
        position: 'relative',
    } as React.CSSProperties,

    segmentLabel: {
        fontSize: '11px',
        fontWeight: 600,
        color: 'var(--text)',
    },

    distributionLegend: {
        display: 'flex',
        gap: '16px',
        marginTop: '12px',
        fontSize: '12px',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },

    legendItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    },

    loadingText: {
        textAlign: 'center',
        padding: '20px',
        color: 'var(--text-muted)',
        fontStyle: 'italic',
    },

    filtersWrapper: {
        marginBottom: '24px',
    },

    filterGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
    },

    tunerDivider: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '24px 0',
        height: '1px',
        background: 'var(--border-subtle)',
    },

    dividerText: {
        position: 'absolute',
        background: 'var(--color-bg-secondary)',
        padding: '0 12px',
        fontSize: '0.75rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--color-ink-tertiary)',
    },
}

export default RelevanceTuner
