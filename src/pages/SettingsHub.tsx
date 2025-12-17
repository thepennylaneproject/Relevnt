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
import type { AutoSaveStatus } from '../hooks/useSettingsAutoSave'

const VALID_TABS: SettingsTab[] = ['persona', 'career', 'profile', 'voice', 'system']

function getTabFromHash(hash: string): SettingsTab {
    const tab = hash.replace('#', '') as SettingsTab
    return VALID_TABS.includes(tab) ? tab : 'persona'
}

export default function SettingsHub(): JSX.Element {
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
            default:
                return null
        }
    }

    const TAB_TITLES: Record<SettingsTab, { title: string; subtitle: string }> = {
        persona: {
            title: 'Persona',
            subtitle: 'Who are you job-searching as right now?',
        },
        career: {
            title: 'Career Targets',
            subtitle: 'What kinds of jobs are you open to?',
        },
        profile: {
            title: 'Profile',
            subtitle: 'What do we already know about you?',
        },
        voice: {
            title: 'Voice & Style',
            subtitle: 'How should Relevnt sound when it speaks for you?',
        },
        system: {
            title: 'System & Automation',
            subtitle: 'How hands-on do you want to be?',
        },
    }

    return (
        <div className="page-wrapper">
            <Container maxWidth="lg" padding="md">
                <header className="hero-shell">
                    <div className="hero-header">
                        <div className="hero-header-main">
                            <div className="hero__badge">
                                <Icon name="pocket-watch" size="sm" hideAccent />
                                <span>Settings</span>
                            </div>
                            <h1>{TAB_TITLES[activeTab].title}</h1>
                            <p className="hero-subtitle">
                                {TAB_TITLES[activeTab].subtitle}
                            </p>
                        </div>

                        <div className="hero-actions" style={{ justifyContent: 'flex-end', paddingTop: 0 }}>
                            <AutoSaveIndicator status={autoSaveStatus} />
                        </div>
                    </div>
                </header>

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
