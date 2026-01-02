import React from 'react'
import { SystemAutomationTab } from '../tabs/SystemAutomationTab'
import { AutoApplyTab } from '../tabs/AutoApplyTab'
import type { AutoSaveStatus } from '../../../hooks/useSettingsAutoSave'

interface SystemSectionProps {
    onAutoSaveStatusChange: (status: AutoSaveStatus) => void
}

export function SystemSection({ onAutoSaveStatusChange }: SystemSectionProps) {
    return (
        <section id="system" className="settings-section scroll-mt-20">
            <h2 className="section-title">System & Auto-Apply</h2>
            <p className="section-description">
                Configure notifications, automation, and application rules.
            </p>

            <div className="section-content">
                <SystemAutomationTab onAutoSaveStatusChange={onAutoSaveStatusChange} />
                <AutoApplyTab onAutoSaveStatusChange={onAutoSaveStatusChange} />
            </div>
        </section>
    )
}
