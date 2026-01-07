/**
 * PreferencesSection - System Behavior
 * 
 * Controls: Notifications (grouped), Automation toggle with confirmation
 */

import React, { useEffect, useState } from 'react'
import { useProfileSettings } from '../../../hooks/useProfileSettings'
import { useJobPreferences } from '../../../hooks/useJobPreferences'
import { useSettingsAutoSave, type AutoSaveStatus } from '../../../hooks/useSettingsAutoSave'

interface PreferencesSectionProps {
    onAutoSaveStatusChange: (status: AutoSaveStatus) => void
}

export function PreferencesSection({ onAutoSaveStatusChange }: PreferencesSectionProps) {
    const { settings, saveSettings, isLoading: settingsLoading } = useProfileSettings()
    const { prefs, loading: prefsLoading, setField: setJobField, save: saveJobPrefs } = useJobPreferences()

    const [showAutomationConfirm, setShowAutomationConfirm] = useState(false)

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

    const loading = settingsLoading || prefsLoading

    if (loading || !settings || !prefs) {
        return (
            <p className="settings-loading">Loading…</p>
        )
    }

    const handleNotificationToggle = (key: 'notifHighMatch' | 'notifApplicationUpdates' | 'notifWeeklyDigest', value: boolean) => {
        saveSettings({ [key]: value })
        triggerSave()
    }

    const handleAutomationToggle = (enable: boolean) => {
        if (enable && !prefs.enable_auto_apply) {
            // First time enabling - require confirmation
            setShowAutomationConfirm(true)
        } else {
            setJobField('enable_auto_apply', enable)
            triggerSave()
        }
    }

    const confirmAutomation = () => {
        setJobField('enable_auto_apply', true)
        triggerSave()
        setShowAutomationConfirm(false)
    }

    const cancelAutomation = () => {
        setShowAutomationConfirm(false)
    }

    return (
        <div className="settings-fields">
                {/* Notifications group */}
                <div className="settings-field">
                    <span className="settings-field-label">Notifications</span>
                    <div className="settings-toggles">
                        <ToggleRow
                            label="High-confidence matches"
                            checked={settings.notifHighMatch}
                            onChange={(v) => handleNotificationToggle('notifHighMatch', v)}
                        />
                        <ToggleRow
                            label="Application updates"
                            checked={settings.notifApplicationUpdates}
                            onChange={(v) => handleNotificationToggle('notifApplicationUpdates', v)}
                        />
                        <ToggleRow
                            label="Weekly digest"
                            checked={settings.notifWeeklyDigest}
                            onChange={(v) => handleNotificationToggle('notifWeeklyDigest', v)}
                        />
                    </div>
                </div>

                {/* Automation - elevated hierarchy */}
                <div className="settings-field settings-field--elevated">
                    <div className="settings-field-header">
                        <span className="settings-field-label">Automation</span>
                    </div>
                    <span className="settings-field-sublabel">Allow Relevnt to apply on your behalf</span>
                    
                    {showAutomationConfirm ? (
                        <div className="settings-automation-confirm">
                            <p className="settings-automation-confirm-text">
                                Enabling automation will allow Relevnt to submit applications to matching jobs automatically. You can disable this at any time.
                            </p>
                            <div className="settings-automation-confirm-actions">
                                <button 
                                    className="settings-automation-confirm-btn settings-automation-confirm-btn--primary"
                                    onClick={confirmAutomation}
                                >
                                    Enable automation
                                </button>
                                <button 
                                    className="settings-automation-confirm-btn"
                                    onClick={cancelAutomation}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="settings-toggles">
                            <ToggleRow
                                label={prefs.enable_auto_apply ? 'Enabled' : 'Disabled'}
                                checked={prefs.enable_auto_apply}
                                onChange={handleAutomationToggle}
                            />
                        </div>
                    )}

                    {prefs.enable_auto_apply && !showAutomationConfirm && (
                        <div className="settings-sub-field">
                            <span className="settings-field-label-sm">Max applications per week</span>
                            <input
                                type="number"
                                min={1}
                                max={50}
                                value={prefs.auto_apply_max_apps_per_day ? prefs.auto_apply_max_apps_per_day * 7 : 10}
                                onChange={(e) => {
                                    const weekly = Number(e.target.value)
                                    setJobField('auto_apply_max_apps_per_day', Math.ceil(weekly / 7))
                                    triggerSave()
                                }}
                                className="settings-number-input"
                            />
                        </div>
                    )}
                </div>
        </div>
    )
}

interface ToggleRowProps {
    label: string
    checked: boolean
    onChange: (value: boolean) => void
}

function ToggleRow({ label, checked, onChange }: ToggleRowProps) {
    return (
        <label className="settings-toggle-row">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="settings-checkbox"
            />
            <span className="settings-toggle-label">{label}</span>
        </label>
    )
}
