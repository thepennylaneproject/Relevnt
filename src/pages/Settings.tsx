import React, { useEffect, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Container } from '../components/shared/Container'
import { Icon } from '../components/ui/Icon'
import { SettingsTabNav, type SettingsTab } from '../components/settings/SettingsTabNav'
import { AutoSaveIndicator } from '../components/settings/AutoSaveIndicator'
import { PersonaTab } from '../components/settings/tabs/PersonaTab'
import { CareerTargetsTab } from '../components/settings/tabs/CareerTargetsTab'
import { ProfileTab } from '../components/settings/tabs/ProfileTab'
import { VoiceStyleTab } from '../components/settings/tabs/VoiceStyleTab'
import { SystemAutomationTab } from '../components/settings/tabs/SystemAutomationTab'
import { AutoApplyTab } from '../components/settings/tabs/AutoApplyTab'
import type { AutoSaveStatus } from '../hooks/useSettingsAutoSave'

const VALID_TABS: SettingsTab[] = ['persona', 'career', 'profile', 'voice', 'system', 'auto-apply']

function getTabFromHash(hash: string): SettingsTab {
    const tab = hash.replace('#', '') as SettingsTab
    return VALID_TABS.includes(tab) ? tab : 'persona'
}


export default function Settings(): JSX.Element {
    const location = useLocation()
    const navigate = useNavigate()

    const [activeTab, setActiveTab] = useState<SettingsTab>(() =>
        getTabFromHash(location.hash)
    )
    const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle')

    // Sync tab with URL hash
    useEffect(() => {
        const tab = getTabFromHash(location.hash)
        setActiveTab(tab)
    }, [location.hash])

    const handleTabChange = useCallback((tab: SettingsTab) => {
        setActiveTab(tab)
        navigate(`#${tab}`, { replace: true })
    }, [navigate])

    const handleAutoSaveStatusChange = useCallback((status: AutoSaveStatus) => {
        setAutoSaveStatus(status)
    }, [])

    const renderTabContent = () => {
        switch (activeTab) {
            case 'persona':
                return <PersonaTab onAutoSaveStatusChange={handleAutoSaveStatusChange} />
            case 'career':
                return <CareerTargetsTab onAutoSaveStatusChange={handleAutoSaveStatusChange} />
            case 'profile':
                return <ProfileTab onAutoSaveStatusChange={handleAutoSaveStatusChange} />
            case 'voice':
                return <VoiceStyleTab onAutoSaveStatusChange={handleAutoSaveStatusChange} />
            case 'system':
                return <SystemAutomationTab onAutoSaveStatusChange={handleAutoSaveStatusChange} />
            case 'auto-apply':
                return <AutoApplyTab onAutoSaveStatusChange={handleAutoSaveStatusChange} />
            default:
                return null
        }
    }

    return (
        <div className="page-wrapper">
            <Container maxWidth="lg" padding="md">
                <div className="page-header">
                    <div className="icon-header">
                        <Icon name="pocket-watch" size="sm" />
                        <span className="label">SETTINGS</span>
                        <div style={{ marginLeft: 'auto' }}>
                            <AutoSaveIndicator status={autoSaveStatus} />
                        </div>
                    </div>
                    <h1>Preferences</h1>
                    <p>Customize how Relevnt matches and applies for you.</p>
                </div>

                <SettingsTabNav activeTab={activeTab} onTabChange={handleTabChange} />

                <div
                    className="page-stack"
                    role="tabpanel"
                    id={`panel-${activeTab}`}
                    aria-labelledby={`tab-${activeTab}`}
                    style={{ marginTop: 24 }}
                >
                    {renderTabContent()}
                </div>
            </Container>
        </div>
    )
}
