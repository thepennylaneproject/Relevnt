import React, { useEffect, useState } from 'react'
import { useProfileSettings } from '../../../hooks/useProfileSettings'
import { useJobPreferences } from '../../../hooks/useJobPreferences'
import { useSettingsAutoSave, type AutoSaveStatus } from '../../../hooks/useSettingsAutoSave'
import { Icon } from '../../ui/Icon'
import { RangeSliderWithPresets } from '../RangeSliderWithPresets'

interface SystemAutomationTabProps {
    onAutoSaveStatusChange: (status: AutoSaveStatus) => void
}

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
            // Convert score to slider value (score 50-100 -> slider 0-100)
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
        // Convert slider 0-100 to match score 50-100
        setJobField('auto_apply_min_match_score', Math.round(50 + value / 2))
        triggerSave()
    }

    if (loading || !settings || !prefs) {
        return (
            <article className="surface-card">
                <div style={{ padding: 24, textAlign: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        Loading settings...
                    </span>
                </div>
            </article>
        )
    }

    return (
        <>
            {/* Notifications */}
            <article className="surface-card">
                <div className="rl-field-grid">
                    <div style={{ display: 'grid', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                            <Icon name="stars" size="sm" hideAccent />
                            <span>Notifications</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Control what reaches your inbox.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gap: 12 }}>
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
            </article>

            {/* Automation */}
            <article className="surface-card">
                <div className="rl-field-grid">
                    <div style={{ display: 'grid', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                            <Icon name="paper-airplane" size="sm" hideAccent />
                            <span>Automation</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Let Relevnt work on your behalf. You're always in control.
                        </p>
                    </div>

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
            </article>

            {/* Matching Behavior */}
            <article className="surface-card">
                <div className="rl-field-grid">
                    <div style={{ display: 'grid', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                            <Icon name="pocket-watch" size="sm" hideAccent />
                            <span>Matching behavior</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Control how aggressively we surface opportunities.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gap: 12 }}>
                        <RangeSliderWithPresets
                            label="Match sensitivity"
                            value={matchAggressiveness}
                            min={0}
                            max={100}
                            onChange={handleAggressivenessChange}
                            leftLabel="Selective"
                            rightLabel="Broad"
                        />
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: -8 }}>
                            <strong>Selective:</strong> Only show jobs with 80%+ match to your profile. <strong>Broad:</strong> Show more opportunities, even 50-79% matches. Balance quality and volume.
                        </p>
                    </div>
                </div>
            </article>

            {/* Advanced (Collapsible) */}
            <article className="surface-card">
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
                    <Icon name={showAdvanced ? 'compass' : 'compass'} size="sm" hideAccent />
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                        Advanced settings
                    </span>
                    <span style={{
                        marginLeft: 'auto',
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                    }}>
                        ▼
                    </span>
                </button>

                {showAdvanced && (
                    <div className="rl-field-grid" style={{ marginTop: 16 }}>
                        <div style={{ display: 'grid', gap: 12 }}>
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
                    </div>
                )}
            </article>
        </>
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
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="jobprefs-checkbox"
                style={{ width: 16, height: 16, marginTop: 3, accentColor: 'var(--color-accent)' }}
            />
            <div style={{ display: 'grid', gap: 4 }}>
                <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{label}</span>
                {helper && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{helper}</span>}
            </div>
        </label>
    )
}
