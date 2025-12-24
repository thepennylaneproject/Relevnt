import { 
    User as IconUser, 
    Target as IconTarget, 
    FileText as IconProfile, 
    Mic2 as IconVoice, 
    Settings as IconGear, 
    Bot as IconRobot 
} from 'lucide-react'

export type SettingsTab = 'persona' | 'career' | 'profile' | 'voice' | 'system' | 'auto-apply'

interface TabConfig {
    id: SettingsTab
    label: string
    Icon: any
}

const TABS: TabConfig[] = [
    { id: 'persona', label: 'Persona', Icon: IconUser },
    { id: 'career', label: 'Career Targets', Icon: IconTarget },
    { id: 'profile', label: 'Profile', Icon: IconProfile },
    { id: 'voice', label: 'Voice & Style', Icon: IconVoice },
    { id: 'system', label: 'System', Icon: IconGear },
    { id: 'auto-apply', label: 'Auto-Apply', Icon: IconRobot },
]

interface SettingsTabNavProps {
    activeTab: SettingsTab
    onTabChange: (tab: SettingsTab) => void
}

export function SettingsTabNav({ activeTab, onTabChange }: SettingsTabNavProps) {
    return (
        <nav className="tabs" role="tablist" aria-label="Settings sections">
            {TABS.map((tab) => {
                const isActive = activeTab === tab.id
                const { Icon } = tab
                return (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={`panel-${tab.id}`}
                        className={`tab ${isActive ? 'active' : ''}`}
                        onClick={() => onTabChange(tab.id)}
                    >
                        <Icon className="tab-icon" size={16} />
                        <span>{tab.label}</span>
                    </button>
                )
            })}
        </nav>
    )
}
