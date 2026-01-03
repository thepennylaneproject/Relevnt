import { Heading, Text } from '../../ui/Typography'
import { ProfileTab } from '../tabs/ProfileTab'
import { VoiceStyleTab } from '../tabs/VoiceStyleTab'
import type { AutoSaveStatus } from '../../../hooks/useSettingsAutoSave'

interface ProfileSectionProps {
    onAutoSaveStatusChange: (status: AutoSaveStatus) => void
}

export function ProfileSection({ onAutoSaveStatusChange }: ProfileSectionProps) {
    return (
        <section id="profile" className="scroll-mt-32">
            <Heading level={2} className="mb-2">Profile & Voice</Heading>
            <Text muted className="mb-10 text-xs">
                Manage your professional identity and how you present yourself in applications.
            </Text>

            <div className="section-content">
                <ProfileTab onAutoSaveStatusChange={onAutoSaveStatusChange} />
                <VoiceStyleTab onAutoSaveStatusChange={onAutoSaveStatusChange} />
            </div>
        </section>
    )
}
