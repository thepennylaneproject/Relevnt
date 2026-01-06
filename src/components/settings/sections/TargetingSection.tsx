import { Heading, Text } from '../../ui/Typography'
import { TargetingTab } from '../tabs/TargetingTab'
import type { AutoSaveStatus } from '../../../hooks/useSettingsAutoSave'

interface TargetingSectionProps {
    onAutoSaveStatusChange: (status: AutoSaveStatus) => void
}

export function TargetingSection({ onAutoSaveStatusChange }: TargetingSectionProps) {
    return (
        <section id="targeting" className="scroll-mt-32">
            <Heading level={2} className="mb-2">Targeting</Heading>
            <Text muted className="mb-10 text-xs">
                Define your job search preferences, manage personas, and fine-tune how jobs are ranked.
            </Text>

            <div className="section-content">
                <TargetingTab onAutoSaveStatusChange={onAutoSaveStatusChange} />
            </div>
        </section>
    )
}
