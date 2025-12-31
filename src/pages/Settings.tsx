import React, { useEffect, useState, useCallback, useTransition } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Container } from '../components/shared/Container'
import { SettingsTabNav, type SettingsTab } from '../components/settings/SettingsTabNav'
import { AutoSaveIndicator } from '../components/settings/AutoSaveIndicator'
import { TargetingTab } from '../components/settings/tabs/TargetingTab'
import { ProfileTab } from '../components/settings/tabs/ProfileTab'
import { VoiceStyleTab } from '../components/settings/tabs/VoiceStyleTab'
import { SystemAutomationTab } from '../components/settings/tabs/SystemAutomationTab'
import { AutoApplyTab } from '../components/settings/tabs/AutoApplyTab'
import type { AutoSaveStatus } from '../hooks/useSettingsAutoSave'

const VALID_TABS: SettingsTab[] = ['targeting', 'profile', 'system']

function getTabFromHash(hash: string): SettingsTab {
    const tab = hash.replace('#', '')
    // Handle legacy tab names
    if (tab === 'persona' || tab === 'career') return 'targeting'
    if (tab === 'voice') return 'profile'
    if (tab === 'auto-apply') return 'system'
    return VALID_TABS.includes(tab as SettingsTab) ? (tab as SettingsTab) : 'targeting'
}


export default function Settings(): JSX.Element {
    const location = useLocation()
    const navigate = useNavigate()


    const [isPending, startTransition] = useTransition()
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
        startTransition(() => {
            setActiveTab(tab)
        })
        navigate(`#${tab}`, { replace: true })
    }, [navigate])

    const handleAutoSaveStatusChange = useCallback((status: AutoSaveStatus) => {
        setAutoSaveStatus(status)
    }, [])

    const renderTabContent = () => {
        switch (activeTab) {
            case 'targeting':
                return <TargetingTab onAutoSaveStatusChange={handleAutoSaveStatusChange} />
            case 'profile':
                return (
                    <>
                        <ProfileTab onAutoSaveStatusChange={handleAutoSaveStatusChange} />
                        <VoiceStyleTab onAutoSaveStatusChange={handleAutoSaveStatusChange} />
                    </>
                )
            case 'system':
                return (
                    <>
                        <SystemAutomationTab onAutoSaveStatusChange={handleAutoSaveStatusChange} />
                        <AutoApplyTab onAutoSaveStatusChange={handleAutoSaveStatusChange} />
                    </>
                )
            default:
                return null
        }
    }

    return (
        <div className="page-wrapper">
            <Container maxWidth="lg" padding="md">
                <div className="page-header">
                    <div style={{ marginLeft: 'auto' }}>
                        <AutoSaveIndicator status={autoSaveStatus} />
                    </div>
                    <h1>Preferences</h1>
                    <p>Customize how Relevnt matches and applies for you.</p>
                </div>

                <SettingsTabNav activeTab={activeTab} onTabChange={handleTabChange} />

                <div
                    className={`page-stack ${isPending ? 'is-pending' : ''}`}
                    role="tabpanel"
                    id={`panel-${activeTab}`}
                    aria-labelledby={`tab-${activeTab}`}
                    style={{ 
                        marginTop: 24,
                        opacity: isPending ? 0.6 : 1,
                        transition: 'opacity 0.2s ease',
                        pointerEvents: isPending ? 'none' : 'auto'
                    }}
                >
                    {renderTabContent()}
                </div>
            </Container>
        </div>
    )
}
