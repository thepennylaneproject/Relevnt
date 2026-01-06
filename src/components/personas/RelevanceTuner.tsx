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
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Heading, Text } from '../ui/Typography'
import { Select } from '../forms/Select'
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
        <Card className="mb-12 p-0 overflow-hidden">
            {/* Collapsible Header */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-left px-8 py-6 flex justify-between items-center hover:bg-black/[0.02] transition-colors"
                aria-expanded={isExpanded}
            >
                <div>
                    <Heading level={4} className="tracking-tight">Tune Ranking Priorities</Heading>
                    <Text muted className="text-[10px] uppercase tracking-widest font-bold mt-1">
                        {isExpanded
                            ? 'Adjust weights to refine your feed results'
                            : `Current Bias: ${selectedPreset?.name || 'Balanced'}`}
                    </Text>
                </div>
                <Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} size="sm" hideAccent />
            </button>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="px-8 pb-10 border-t border-border/50 pt-8 space-y-10">
                    
                    {/* Filter Section */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="space-y-2">
                            <Text className="text-[10px] uppercase tracking-widest font-bold text-text-muted">Min Salary</Text>
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
                                className="w-full bg-transparent border-b border-border text-sm py-1 focus:border-accent outline-none"
                                placeholder="e.g. 100000"
                            />
                        </div>

                        <div className="space-y-2">
                            <Text className="text-[10px] uppercase tracking-widest font-bold text-text-muted">Source</Text>
                            <select
                                value={source}
                                onChange={(e) => setSource?.(e.target.value)}
                                className="w-full bg-transparent border-b border-border text-sm py-1 focus:border-accent outline-none cursor-pointer"
                            >
                                <option value="">All Sources</option>
                                {availableSources.map((s) => (
                                    <option key={s.id} value={s.source_key}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Text className="text-[10px] uppercase tracking-widest font-bold text-text-muted">Type</Text>
                            <select
                                value={employmentType}
                                onChange={(e) => setEmploymentType?.(e.target.value)}
                                className="w-full bg-transparent border-b border-border text-sm py-1 focus:border-accent outline-none cursor-pointer"
                            >
                                <option value="">All Types</option>
                                <option value="full-time">Full-time</option>
                                <option value="part-time">Part-time</option>
                                <option value="contract">Contract</option>
                                <option value="temporary">Temporary</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3 pt-6">
                            <input
                                id="remote-only-toggle"
                                type="checkbox"
                                className="accent-accent"
                                checked={remoteOnly}
                                onChange={(e) => setRemoteOnly?.(e.target.checked)}
                            />
                            <label htmlFor="remote-only-toggle" className="text-[10px] uppercase tracking-widest font-bold text-text-muted cursor-pointer">
                                Remote Only
                            </label>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-end gap-6 border-y border-border/30 py-8">
                        <div className="space-y-2 flex-1 min-w-[200px]">
                            <Text className="text-[10px] uppercase tracking-widest font-bold text-text-muted">Preset Configurations</Text>
                            <select
                                value={selectedPreset?.id || ''}
                                onChange={handleLoadPreset}
                                className="w-full bg-transparent border-b border-border text-sm py-1 focus:border-accent outline-none cursor-pointer font-medium"
                                disabled={loading}
                            >
                                <option value="">Balanced (Default)</option>
                                {presets.map(preset => (
                                    <option key={preset.id} value={preset.id}>
                                        {preset.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-4">
                            <button
                                className="text-[10px] uppercase tracking-widest font-bold text-text-muted hover:text-text transition-colors"
                                onClick={() => setShowSaveForm(!showSaveForm)}
                            >
                                {showSaveForm ? 'Cancel' : 'Save As Preset'}
                            </button>
                            <button
                                className="text-[10px] uppercase tracking-widest font-bold text-text-muted hover:text-text transition-colors"
                                onClick={handleReset}
                            >
                                Restore Defaults
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
                            <Button
                                type="submit"
                                variant="primary"
                                size="sm"
                                disabled={saving || !presetName.trim()}
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                        </form>
                    )}

                    {/* Sliders */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                        {[
                            { id: 'skill_weight', label: 'Skills & Match', hint: 'Emphasize roles aligning with your core strengths', color: 'bg-accent' },
                            { id: 'salary_weight', label: 'Compensation', hint: 'Rank higher-paying opportunities at the top', color: 'bg-text' },
                            { id: 'location_weight', label: 'Geography', hint: 'Prioritize specific cities or regions', color: 'bg-text-muted' },
                            { id: 'remote_weight', label: 'Remote Flexibility', hint: 'Float remote-first roles to the top', color: 'bg-accent/40' },
                            { id: 'industry_weight', label: 'Industry Focus', hint: 'Heavily weigh roles in your preferred sectors', color: 'bg-border' },
                        ].map((factor) => (
                            <div key={factor.id} className="space-y-3">
                                <div className="flex justify-between items-baseline">
                                    <Text className="text-[10px] uppercase tracking-widest font-bold">{factor.label}</Text>
                                    <Text className="text-[10px] tabular-nums font-mono">{Math.round((currentWeights[factor.id as keyof WeightConfig] / totalWeight) * 100)}%</Text>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={currentWeights[factor.id as keyof WeightConfig] * 100}
                                    onChange={(e) => handleWeightChange(factor.id as keyof WeightConfig, parseFloat(e.target.value))}
                                    className="w-full accent-accent h-1 bg-border rounded-none appearance-none cursor-pointer"
                                />
                                <Text muted className="text-[9px] italic leading-relaxed">{factor.hint}</Text>
                            </div>
                        ))}
                    </div>

                    {/* Collapsible Weight Distribution Visualization */}
                    <div className="pt-10">
                        <button
                            type="button"
                            onClick={() => setShowDistribution(!showDistribution)}
                            className="text-[10px] uppercase tracking-widest font-bold text-text-muted hover:text-text transition-colors flex items-center gap-2"
                        >
                            {showDistribution ? '−' : '+'} View Weight Distribution
                        </button>

                        {showDistribution && (
                            <div className="mt-6">
                                <div className="flex h-1 overflow-hidden bg-border">
                                    <div style={{ width: `${percentages.skill}%` }} className="bg-accent h-full" />
                                    <div style={{ width: `${percentages.salary}%` }} className="bg-text h-full" />
                                    <div style={{ width: `${percentages.location}%` }} className="bg-text-muted h-full" />
                                    <div style={{ width: `${percentages.remote}%` }} className="bg-accent/40 h-full" />
                                    <div style={{ width: `${percentages.industry}%` }} className="bg-border h-full" />
                                </div>
                                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
                                    <span className="text-[9px] uppercase tracking-widest font-bold flex items-center gap-1.5 min-w-[80px]">
                                        <div className="w-1.5 h-1.5 bg-accent" /> Skills
                                    </span>
                                    <span className="text-[9px] uppercase tracking-widest font-bold flex items-center gap-1.5 min-w-[80px]">
                                        <div className="w-1.5 h-1.5 bg-text" /> Salary
                                    </span>
                                    <span className="text-[9px] uppercase tracking-widest font-bold flex items-center gap-1.5 min-w-[80px]">
                                        <div className="w-1.5 h-1.5 bg-text-muted" /> Geography
                                    </span>
                                    <span className="text-[9px] uppercase tracking-widest font-bold flex items-center gap-1.5 min-w-[80px]">
                                        <div className="w-1.5 h-1.5 bg-accent/40" /> Remote
                                    </span>
                                    <span className="text-[9px] uppercase tracking-widest font-bold flex items-center gap-1.5 min-w-[80px]">
                                        <div className="w-1.5 h-1.5 bg-border-dark" /> Industry
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Card>
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

        letterSpacing: '0.05em',
        color: 'var(--color-ink-tertiary)',
    },
}

export default RelevanceTuner
