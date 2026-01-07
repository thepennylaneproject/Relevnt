import React, { useState, useCallback } from 'react'
import '../styles/settings.css'
import { PageLayout } from '../components/layout/PageLayout'
import { AccountSection } from '../components/settings/sections/AccountSection'
import { JobSearchSection } from '../components/settings/sections/JobSearchSection'
import { PreferencesSection } from '../components/settings/sections/PreferencesSection'
import type { AutoSaveStatus } from '../hooks/useSettingsAutoSave'

/**
 * Settings Page - Calm, Editorial Reference Layout
 * 
 * A single centered column with normal vertical scroll.
 * No cards, no panels, no metaphors. Just facts and inline editing.
 */
export default function Settings(): JSX.Element {
    const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle')

    const handleAutoSaveStatusChange = useCallback((status: AutoSaveStatus) => {
        setAutoSaveStatus(status)
    }, [])

    // Quiet status indicator
    const statusText = autoSaveStatus === 'saving' ? 'Saving…' : 
                       autoSaveStatus === 'saved' ? 'Saved' : 
                       autoSaveStatus === 'error' ? 'Error' : null

    return (
        <PageLayout title="Settings">
            <div className="settings-page">
                {/* Quiet status in top corner */}
                {statusText && (
                    <div className="settings-status">{statusText}</div>
                )}

                {/* Identity */}
                <section className="settings-section">
                    <h2 className="settings-section-header">Identity</h2>
                    <AccountSection onAutoSaveStatusChange={handleAutoSaveStatusChange} />
                </section>

                <hr className="settings-divider" />

                {/* Search Strategy */}
                <section id="search-strategy" className="settings-section">
                    <h2 className="settings-section-header">Search Strategy</h2>
                    <JobSearchSection onAutoSaveStatusChange={handleAutoSaveStatusChange} />
                </section>

                <hr className="settings-divider" />

                {/* System Behavior */}
                <section id="system-behavior" className="settings-section">
                    <h2 className="settings-section-header">System Behavior</h2>
                    <PreferencesSection onAutoSaveStatusChange={handleAutoSaveStatusChange} />
                </section>
            </div>
        </PageLayout>
    )
}
