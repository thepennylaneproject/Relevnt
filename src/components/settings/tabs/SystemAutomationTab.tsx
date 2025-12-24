import React, { useEffect, useState } from 'react'
import { useProfileSettings } from '../../../hooks/useProfileSettings'
import { useJobPreferences } from '../../../hooks/useJobPreferences'
import { useSettingsAutoSave, type AutoSaveStatus } from '../../../hooks/useSettingsAutoSave'
import { Icon } from '../../ui/Icon'
import { RangeSliderWithPresets } from '../RangeSliderWithPresets'

interface SystemAutomationTabProps {
    onAutoSaveStatusChange: (status: AutoSaveStatus) => void
}

import { IconBell, IconSettings, IconRocket, IconChevronDown } from 'lucide-react'

export function SystemAutomationTab({ onAutoSaveStatusChange }: SystemAutomationTabProps) {
    const { settings, isLoading: settingsLoading, saveSettings } = useProfileSettings()
    const { prefs, loading: prefsLoading, setField: setJobField, save: saveJobPrefs } = useJobPreferences()

    const [showAdvanced, setShowAdvanced] = useState(false)
    const [matchAggressiveness, setMatchAggressiveness] = useState(50)

    const loading = settingsLoading || prefsLoading

    const combinedSave = async () => {
        await Promise.all([
            saveSettings({}),
            saveJobPrefs(),
        ])
        return true
    }

    const { status, triggerSave } = useSettingsAutoSave(combinedSave, { debounceMs: 800 })

    useEffect(() => {
        onAutoSaveStatusChange(status)
    }, [status, onAutoSaveStatusChange])

    useEffect(() => {
        if (prefs?.auto_apply_min_match_score) {
            setMatchAggressiveness((prefs.auto_apply_min_match_score - 50) * 2)
        }
    }, [prefs])

    const handleNotificationToggle = (key: 'notifHighMatch' | 'notifApplicationUpdates' | 'notifWeeklyDigest', value: boolean) => {
        saveSettings({ [key]: value })
        triggerSave()
    }

    const handleAutoApplyToggle = (value: boolean) => {
        setJobField('enable_auto_apply', value)
        triggerSave()
    }

    const handleAggressivenessChange = (value: number) => {
        setMatchAggressiveness(value)
        setJobField('auto_apply_min_match_score', Math.round(50 + value / 2))
        triggerSave()
    }

    if (loading || !settings || !prefs) {
        return (
            <div className="tab-pane">
                <div className="card" style={{ textAlign: 'center' }}>
                    <p>Loading settings...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="tab-pane">
            <div className="card">
                <h3>Notifications</h3>
                <p className="card-description">Control what reaches your inbox.</p>
                
                <div style={{ display: 'grid', gap: 16 }}>
                    <ToggleRow
                        label="High-confidence matches"
                        helper="Get notified when we find roles that strongly match your profile."
                        checked={settings.notifHighMatch}
                        onChange={(v) => handleNotificationToggle('notifHighMatch', v)}
                    />
                    <ToggleRow
                        label="Application updates"
                        helper="Progress updates, rejections, or patterns we detect."
                        checked={settings.notifApplicationUpdates}
                        onChange={(v) => handleNotificationToggle('notifApplicationUpdates', v)}
                    />
                    <ToggleRow
                        label="Weekly digest"
                        helper="A simple snapshot of your activity and suggested next steps."
                        checked={settings.notifWeeklyDigest}
                        onChange={(v) => handleNotificationToggle('notifWeeklyDigest', v)}
                    />
                </div>
            </div>

            <div className="card">
                <h3>Automation</h3>
                <p className="card-description">Let Relevnt work on your behalf. You're always in control.</p>
                
                <div style={{ display: 'grid', gap: 16 }}>
                    <ToggleRow
                        label="Auto-match jobs"
                        helper="Continuously find and score new roles against your preferences."
                        checked={true}
                        onChange={() => { }}
                    />
                    <ToggleRow
                        label="Auto-apply assistance"
                        helper="Allow Relevnt to help prepare and submit applications."
                        checked={prefs.enable_auto_apply}
                        onChange={handleAutoApplyToggle}
                    />
                </div>
            </div>

            <div className="card">
                <h3>Matching behavior</h3>
                <div className="form-group">
                    <div className="slider-header">
                        <label className="form-label">Match sensitivity</label>
                        <span className="slider-value">{matchAggressiveness}%</span>
                    </div>
                    <input 
                        type="range" 
                        className="form-slider" 
                        min="0" max="100" 
                        value={matchAggressiveness}
                        onChange={(e) => handleAggressivenessChange(parseInt(e.target.value))}
                    />
                    <div className="slider-labels">
                        <span>Selective</span>
                        <span>Broad</span>
                    </div>
                </div>
                <p className="card-description" style={{ marginTop: 12 }}>
                    <strong>Selective:</strong> Only show jobs with 80%+ match to your profile. <strong>Broad:</strong> Show more opportunities, even 50-79% matches.
                </p>
            </div>

            <div className={`card ${showAdvanced ? 'active' : ''}`}>
                <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        width: '100%',
                    }}
                >
                    <IconSettings size={16} strokeWidth={1.5} color="var(--color-accent)" />
                    <h3 style={{ margin: 0 }}>Advanced settings</h3>
                    <IconChevronDown 
                        size={16} 
                        strokeWidth={1.5} 
                        style={{
                            marginLeft: 'auto',
                            transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                        }}
                    />
                </button>

                {showAdvanced && (
                    <div style={{ marginTop: 24, display: 'grid', gap: 16 }}>
                        <ToggleRow
                            label="Use my data to improve recommendations"
                            helper="We only use your data to rank jobs for you, never to sell or share."
                            checked={settings.useDataForRecommendations}
                            onChange={(v) => {
                                saveSettings({ useDataForRecommendations: v })
                                triggerSave()
                            }}
                        />
                        <ToggleRow
                            label="Show experimental features"
                            helper="You may see features that are still in progress."
                            checked={settings.enableExperimentalFeatures}
                            onChange={(v) => {
                                saveSettings({ enableExperimentalFeatures: v })
                                triggerSave()
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

interface ToggleRowProps {
    label: string
    helper?: string
    checked: boolean
    onChange: (value: boolean) => void
}

function ToggleRow({ label, helper, checked, onChange }: ToggleRowProps) {
    return (
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                style={{ width: 16, height: 16, marginTop: 4, accentColor: 'var(--color-accent)' }}
            />
            <div style={{ display: 'grid', gap: 2 }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-ink)', fontWeight: 600 }}>{label}</span>
                {helper && <span style={{ fontSize: '0.75rem', color: 'var(--color-graphite)' }}>{helper}</span>}
            </div>
        </label>
    )
}
