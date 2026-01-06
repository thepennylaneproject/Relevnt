import React, { useEffect, useState, useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { PageLayout } from '../components/layout/PageLayout'
import { Heading, Text } from '../components/ui/Typography'
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
        <PageLayout
            title="Preferences"
            subtitle="Customize how Relevnt matches and applies for you."
            actions={<AutoSaveIndicator status={autoSaveStatus} />}
        >
            <div className="flex flex-col lg:flex-row gap-16 mt-8">
                {/* Sidebar - hidden on mobile */}
                <aside className="hidden lg:block w-56 shrink-0 h-fit sticky top-32">
                    <SettingsSidebar />
                </aside>

                {/* Mobile navigation dropdown */}
                <div className="lg:hidden mb-8">
                    <select
                        onChange={(e) => {
                            const element = document.getElementById(e.target.value)
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            }
                        }}
                        defaultValue=""
                        className="w-full bg-ivory border border-border text-sm py-2 px-4 focus:ring-1 focus:ring-accent outline-none"
                    >
                        <option value="" disabled>Jump to section...</option>
                        <option value="targeting">Targeting</option>
                        <option value="profile">Profile & Voice</option>
                        <option value="system">System & Auto-Apply</option>
                    </select>
                </div>

                {/* Main content - all sections */}
                <main className="flex-1 max-w-2xl space-y-24">
                    <section id="targeting" className="scroll-mt-32">
                        <TargetingSection onAutoSaveStatusChange={handleAutoSaveStatusChange} />
                    </section>
                    <section id="profile" className="scroll-mt-32 border-t border-border/10 pt-24">
                        <ProfileSection onAutoSaveStatusChange={handleAutoSaveStatusChange} />
                    </section>
                    <section id="system" className="scroll-mt-32 border-t border-border/10 pt-24">
                        <SystemSection onAutoSaveStatusChange={handleAutoSaveStatusChange} />
                    </section>
                </main>
            </div>
        </PageLayout>
    )
}
