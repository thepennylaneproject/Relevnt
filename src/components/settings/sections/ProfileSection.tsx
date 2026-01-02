import React from 'react'
import { ProfileTab } from '../tabs/ProfileTab'
import { VoiceStyleTab } from '../tabs/VoiceStyleTab'
import type { AutoSaveStatus } from '../../../hooks/useSettingsAutoSave'

interface ProfileSectionProps {
    onAutoSaveStatusChange: (status: AutoSaveStatus) => void
}

export function ProfileSection({ onAutoSaveStatusChange }: ProfileSectionProps) {
    return (
        <section id="profile" className="settings-section scroll-mt-20">
            <h2 className="section-title">Profile & Voice</h2>
            <p className="section-description">
                Manage your professional identity and how you present yourself in applications.
            </p>

            <div className="section-content">
                <ProfileTab onAutoSaveStatusChange={onAutoSaveStatusChange} />
                <VoiceStyleTab onAutoSaveStatusChange={onAutoSaveStatusChange} />
            </div>
        </section>
    )
}
