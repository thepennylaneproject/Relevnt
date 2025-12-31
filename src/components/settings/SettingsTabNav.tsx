export type SettingsTab = 'targeting' | 'profile' | 'system'

interface TabConfig {
    id: SettingsTab
    label: string
}

const TABS: TabConfig[] = [
    { id: 'targeting', label: 'Targeting' },
    { id: 'profile', label: 'Profile & Voice' },
    { id: 'system', label: 'System & Auto-Apply' },
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
                        <span>{tab.label}</span>
                    </button>
                )
            })}
        </nav>
    )
}
