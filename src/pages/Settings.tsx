import React, { useEffect, useState, useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Container } from '../components/shared/Container'
import { AutoSaveIndicator } from '../components/settings/AutoSaveIndicator'
import { SettingsSidebar } from '../components/settings/SettingsSidebar'
import { TargetingSection } from '../components/settings/sections/TargetingSection'
import { ProfileSection } from '../components/settings/sections/ProfileSection'
import { SystemSection } from '../components/settings/sections/SystemSection'
import type { AutoSaveStatus } from '../hooks/useSettingsAutoSave'

const SECTIONS = ['targeting', 'profile', 'system'] as const
type SectionId = (typeof SECTIONS)[number]

// Legacy hash mapping for backwards compatibility
const LEGACY_HASH_MAP: Record<string, SectionId> = {
    persona: 'targeting',
    career: 'targeting',
    voice: 'profile',
    'auto-apply': 'system',
}

export default function Settings(): JSX.Element {
    const location = useLocation()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle')

    // Handle deep links from query parameters: /settings?section=profile
    React.useLayoutEffect(() => {
        const section = searchParams.get('section')
        if (section && SECTIONS.includes(section as SectionId)) {
            // Use requestAnimationFrame to ensure DOM is fully rendered
            requestAnimationFrame(() => {
                const element = document.getElementById(section)
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
            })
        }
    }, [searchParams])

    // Handle legacy hash routes for backwards compatibility: /settings#targeting
    React.useLayoutEffect(() => {
        const hash = window.location.hash
        if (hash) {
            const hashValue = hash.slice(1) // Remove #
            const mappedSection = LEGACY_HASH_MAP[hashValue] || (SECTIONS.includes(hashValue as SectionId) ? hashValue : null)

            if (mappedSection) {
                requestAnimationFrame(() => {
                    const element = document.getElementById(mappedSection)
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                    // Clean up URL (replace hash with clean /settings)
                    window.history.replaceState(null, '', '/settings')
                })
            }
        }
    }, [location.hash])

    const handleAutoSaveStatusChange = useCallback((status: AutoSaveStatus) => {
        setAutoSaveStatus(status)
    }, [])

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

                <div className="settings-layout">
                    {/* Sidebar - hidden on mobile */}
                    <aside className="settings-sidebar-wrapper">
                        <SettingsSidebar />
                    </aside>

                    {/* Mobile navigation dropdown */}
                    <div className="settings-mobile-nav">
                        <select
                            onChange={(e) => {
                                const element = document.getElementById(e.target.value)
                                if (element) {
                                    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                }
                            }}
                            defaultValue=""
                            className="form-select"
                        >
                            <option value="" disabled>
                                Jump to section...
                            </option>
                            <option value="targeting">Targeting</option>
                            <option value="profile">Profile & Voice</option>
                            <option value="system">System & Auto-Apply</option>
                        </select>
                    </div>

                    {/* Main content - all sections */}
                    <main className="settings-main">
                        <TargetingSection onAutoSaveStatusChange={handleAutoSaveStatusChange} />
                        <ProfileSection onAutoSaveStatusChange={handleAutoSaveStatusChange} />
                        <SystemSection onAutoSaveStatusChange={handleAutoSaveStatusChange} />
                    </main>
                </div>
            </Container>

            <style>{settingsStyles}</style>
        </div>
    )
}

const settingsStyles = `
.settings-layout {
    display: flex;
    gap: 48px;
    margin-top: 24px;
}

.settings-sidebar-wrapper {
    flex-shrink: 0;
    width: 220px;
}

.settings-sidebar {
    position: sticky;
    top: 80px;
}

.sidebar-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-ink-tertiary);
    margin: 0 0 12px 0;
    padding: 0 12px;
}

.sidebar-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.sidebar-link {
    display: block;
    width: 100%;
    padding: 8px 12px;
    border-radius: var(--radius-md);
    text-align: left;
    border: none;
    background: transparent;
    color: var(--color-ink-secondary);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s ease;
}

.sidebar-link:hover {
    color: var(--color-ink);
    background: var(--color-bg-tertiary);
}

.sidebar-link.active {
    color: var(--color-ink);
    background: var(--color-bg-alt);
    font-weight: 500;
}

.settings-mobile-nav {
    display: none;
    margin-bottom: 24px;
}

.settings-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 64px;
}

.settings-section {
    scroll-margin-top: 80px;
}

.section-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-ink);
    margin: 0 0 8px 0;
}

.section-description {
    font-size: 0.875rem;
    color: var(--color-ink-secondary);
    margin: 0 0 24px 0;
}

.section-content {
    display: flex;
    flex-direction: column;
    gap: 0;
}

/* Mobile responsive */
@media (max-width: 1024px) {
    .settings-sidebar-wrapper {
        display: none;
    }
    
    .settings-mobile-nav {
        display: block;
    }
    
    .settings-layout {
        gap: 0;
    }
}

/* Smooth scroll behavior */
html {
    scroll-behavior: smooth;
}
`
