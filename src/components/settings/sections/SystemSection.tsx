import { Heading, Text } from '../../ui/Typography'
import { SystemAutomationTab } from '../tabs/SystemAutomationTab'
import { AutoApplyTab } from '../tabs/AutoApplyTab'
import type { AutoSaveStatus } from '../../../hooks/useSettingsAutoSave'

interface SystemSectionProps {
    onAutoSaveStatusChange: (status: AutoSaveStatus) => void
}

export function SystemSection({ onAutoSaveStatusChange }: SystemSectionProps) {
    return (
        <section id="system" className="scroll-mt-32">
            <Heading level={2} className="mb-2">System & Auto-Apply</Heading>
            <Text muted className="mb-10 text-xs">
                Configure notifications, automation, and application rules.
            </Text>

            <div className="section-content">
                <SystemAutomationTab onAutoSaveStatusChange={onAutoSaveStatusChange} />
                <AutoApplyTab onAutoSaveStatusChange={onAutoSaveStatusChange} />
            </div>
        </section>
    )
}
