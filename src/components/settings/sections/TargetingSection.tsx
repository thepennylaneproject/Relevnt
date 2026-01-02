import React from 'react'
import { TargetingTab } from '../tabs/TargetingTab'
import type { AutoSaveStatus } from '../../../hooks/useSettingsAutoSave'

interface TargetingSectionProps {
    onAutoSaveStatusChange: (status: AutoSaveStatus) => void
}

export function TargetingSection({ onAutoSaveStatusChange }: TargetingSectionProps) {
    return (
        <section id="targeting" className="settings-section scroll-mt-20">
            <h2 className="section-title">Targeting</h2>
            <p className="section-description">
                Define your job search preferences, manage personas, and fine-tune how jobs are ranked.
            </p>

            <div className="section-content">
                <TargetingTab onAutoSaveStatusChange={onAutoSaveStatusChange} />
            </div>
        </section>
    )
}
