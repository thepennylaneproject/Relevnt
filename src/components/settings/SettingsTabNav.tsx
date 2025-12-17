import React from 'react'
import { Icon, type IconName } from '../ui/Icon'

export type SettingsTab = 'persona' | 'career' | 'profile' | 'voice' | 'system'

interface TabConfig {
    id: SettingsTab
    label: string
    icon: IconName
}

const TABS: TabConfig[] = [
    { id: 'persona', label: 'Persona', icon: 'compass' },
    { id: 'career', label: 'Career Targets', icon: 'briefcase' },
    { id: 'profile', label: 'Profile', icon: 'scroll' },
    { id: 'voice', label: 'Voice & Style', icon: 'microphone' },
    { id: 'system', label: 'System', icon: 'pocket-watch' },
]

interface SettingsTabNavProps {
    activeTab: SettingsTab
    onTabChange: (tab: SettingsTab) => void
}

export function SettingsTabNav({ activeTab, onTabChange }: SettingsTabNavProps) {
    return (
        <nav className="settings-tab-nav" role="tablist" aria-label="Settings sections">
            {TABS.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={`panel-${tab.id}`}
                        className={`settings-tab ${isActive ? 'is-active' : ''}`}
                        onClick={() => onTabChange(tab.id)}
                    >
                        <Icon name={tab.icon} size="sm" hideAccent />
                        <span>{tab.label}</span>
                    </button>
                )
            })}
        </nav>
    )
}
