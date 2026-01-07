import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { SettingCard } from './SettingCard'
import { usePersonas } from '../../hooks/usePersonas'
import { useJobPreferences, type JobPreferences } from '../../hooks/useJobPreferences'
import { useProfessionalProfile } from '../../hooks/useProfessionalProfile'
import { useProfileSettings } from '../../hooks/useProfileSettings'
import { useSettingsAutoSave, type AutoSaveStatus } from '../../hooks/useSettingsAutoSave'
import './settings-wheel.css'

// ============================================
// CARD DEFINITION INTERFACE
// ============================================
interface CardDefinition {
    id: string
    render: (interactive: boolean) => React.ReactNode
    getValueLabel: () => string
    onActivate: () => void
    ariaLabel: string
}

// ============================================
// WHEEL GEOMETRY CONSTANTS
// ============================================
const BASE_CARD_COUNT = 13
const LOOP_MULTIPLIER = 3
const TOTAL_VIRTUAL_CARDS = BASE_CARD_COUNT * LOOP_MULTIPLIER
const CARD_INTERVAL_DEG = 360 / BASE_CARD_COUNT // ~27.69° between cards
const CYLINDER_RADIUS = 600 // px - subtle curvature, adult not theme-park
const CARD_HEIGHT_FOR_SCROLL = 80 // px of scroll per card
const VIEWPORT_HALF_WINDOW = 5 // render ±5 cards from center
const AUTHORITY_BAND_DEG = 15 // ±15° for full interactivity
const DAMPING_FACTOR = 0.12 // High damping for mechanical feel

// Centerline styling thresholds
const ZONE_INTERACTIVE = 15 // |angle| <= 15: scale 1.0, blur 0, opacity 1.0
const ZONE_NEAR = 45 // |angle| <= 45: scale 0.85, blur 2px, opacity 0.9
// |angle| > 45: scale 0.70, blur 7px, opacity 0.65

interface SettingsWheelProps {
    onAutoSaveStatusChange: (status: AutoSaveStatus) => void
}

export function SettingsWheel({ onAutoSaveStatusChange }: SettingsWheelProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const isRecentering = useRef(false)
    const animationRef = useRef<number>()
    
    // Target rotation (from scroll) and current rotation (damped)
    const [targetRotation, setTargetRotation] = useState(BASE_CARD_COUNT * CARD_INTERVAL_DEG)
    const [currentRotation, setCurrentRotation] = useState(BASE_CARD_COUNT * CARD_INTERVAL_DEG)
    const currentRotationRef = useRef(BASE_CARD_COUNT * CARD_INTERVAL_DEG)

    // Reduced motion preference
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
    
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
        setPrefersReducedMotion(mq.matches)
        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [])

    // Data hooks
    const { personas, activePersona, setActivePersona, loading: personaLoading } = usePersonas()
    const { prefs, loading: prefsLoading, setField: setJobField, save: saveJobPrefs } = useJobPreferences()
    const { profile, setField: setProfileField, save: saveProfile } = useProfessionalProfile()
    const { settings, saveSettings, isLoading: settingsLoading } = useProfileSettings()

    const combinedSave = async () => {
        await Promise.all([saveSettings({}), saveJobPrefs(), saveProfile()])
        return true
    }

    const { status, triggerSave } = useSettingsAutoSave(combinedSave, { debounceMs: 800 })

    useEffect(() => {
        onAutoSaveStatusChange(status)
    }, [status, onAutoSaveStatusChange])

    const loading = personaLoading || prefsLoading || settingsLoading

    // ============================================
    // CARD DEFINITIONS (flat array)
    // ============================================
    const baseCardDefinitions: CardDefinition[] = useMemo(() => {
        if (loading || !prefs || !profile || !settings) return []

        const handleJobFieldChange = <K extends keyof JobPreferences>(key: K, value: JobPreferences[K]) => {
            setJobField(key, value)
            triggerSave()
        }

        return [
            {
                id: 'persona',
                ariaLabel: 'Active persona',
                getValueLabel: () => activePersona?.name || '—',
                onActivate: () => {
                    const currentIdx = personas.findIndex(p => p.id === activePersona?.id)
                    const nextIdx = (currentIdx + 1) % personas.length
                    if (personas[nextIdx]) {
                        setActivePersona(personas[nextIdx].id)
                        triggerSave()
                    }
                },
                render: (interactive: boolean) => (
                    <button className="settings-fact" onClick={() => {
                        const currentIdx = personas.findIndex(p => p.id === activePersona?.id)
                        const nextIdx = (currentIdx + 1) % personas.length
                        if (personas[nextIdx]) {
                            setActivePersona(personas[nextIdx].id)
                            triggerSave()
                        }
                    }} disabled={!interactive} type="button">
                        <span className="settings-fact-label">Persona</span>
                        <span className="settings-fact-value">{activePersona?.name || '—'}</span>
                    </button>
                )
            },
            {
                id: 'titles',
                ariaLabel: 'Target job titles',
                getValueLabel: () => {
                    const titles = prefs.related_titles || []
                    return titles.length > 0 ? (titles.length <= 2 ? titles.join(', ') : `${titles.length} selected`) : '—'
                },
                onActivate: () => {},
                render: (interactive: boolean) => {
                    const titles = prefs.related_titles || []
                    const display = titles.length > 0 ? (titles.length <= 2 ? titles.join(', ') : `${titles.length} selected`) : '—'
                    return (
                        <button className="settings-fact" disabled={!interactive} type="button">
                            <span className="settings-fact-label">Titles</span>
                            <span className="settings-fact-value">{display}</span>
                        </button>
                    )
                }
            },
            {
                id: 'seniority',
                ariaLabel: 'Seniority levels',
                getValueLabel: () => {
                    const current = prefs.seniority_levels || []
                    return current.length > 0 ? (current.length <= 2 ? current.join(', ') : `${current.length} levels`) : '—'
                },
                onActivate: () => {
                    const allLevels = ['Junior', 'Mid level', 'Senior', 'Lead', 'Director']
                    const current = prefs.seniority_levels || []
                    const unselected = allLevels.filter(l => !current.includes(l))
                    if (unselected.length > 0) {
                        handleJobFieldChange('seniority_levels', [...current, unselected[0]])
                    } else {
                        handleJobFieldChange('seniority_levels', [])
                    }
                },
                render: (interactive: boolean) => {
                    const allLevels = ['Junior', 'Mid level', 'Senior', 'Lead', 'Director']
                    const current = prefs.seniority_levels || []
                    const display = current.length > 0 ? (current.length <= 2 ? current.join(', ') : `${current.length} levels`) : '—'
                    const cycle = () => {
                        const unselected = allLevels.filter(l => !current.includes(l))
                        if (unselected.length > 0) {
                            handleJobFieldChange('seniority_levels', [...current, unselected[0]])
                        } else {
                            handleJobFieldChange('seniority_levels', [])
                        }
                    }
                    return (
                        <button className="settings-fact" onClick={cycle} disabled={!interactive} type="button">
                            <span className="settings-fact-label">Seniority</span>
                            <span className="settings-fact-value">{display}</span>
                        </button>
                    )
                }
            },
            {
                id: 'skills',
                ariaLabel: 'Skills to highlight',
                getValueLabel: () => {
                    const skills = prefs.include_keywords || []
                    return skills.length > 0 ? (skills.length <= 3 ? skills.join(', ') : `${skills.length} skills`) : '—'
                },
                onActivate: () => {},
                render: (interactive: boolean) => {
                    const skills = prefs.include_keywords || []
                    const display = skills.length > 0 ? (skills.length <= 3 ? skills.join(', ') : `${skills.length} skills`) : '—'
                    return (
                        <button className="settings-fact" disabled={!interactive} type="button">
                            <span className="settings-fact-label">Skills</span>
                            <span className="settings-fact-value">{display}</span>
                        </button>
                    )
                }
            },
            {
                id: 'remote',
                ariaLabel: 'Remote preference',
                getValueLabel: () => {
                    const labels: Record<string, string> = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'Onsite' }
                    return labels[prefs.remote_preference || 'remote']
                },
                onActivate: () => {
                    const opts = ['remote', 'hybrid', 'onsite']
                    const currentIdx = opts.indexOf(prefs.remote_preference || 'remote')
                    handleJobFieldChange('remote_preference', opts[(currentIdx + 1) % opts.length])
                },
                render: (interactive: boolean) => {
                    const opts = ['remote', 'hybrid', 'onsite']
                    const labels: Record<string, string> = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'Onsite' }
                    const currentIdx = opts.indexOf(prefs.remote_preference || 'remote')
                    const cycle = () => handleJobFieldChange('remote_preference', opts[(currentIdx + 1) % opts.length])
                    return (
                        <button className="settings-fact" onClick={cycle} disabled={!interactive} type="button">
                            <span className="settings-fact-label">Remote</span>
                            <span className="settings-fact-value">{labels[prefs.remote_preference || 'remote']}</span>
                        </button>
                    )
                }
            },
            {
                id: 'salary',
                ariaLabel: 'Minimum base salary',
                getValueLabel: () => `$${((prefs.min_salary ?? 0) / 1000).toFixed(0)}K+`,
                onActivate: () => {
                    const brackets = [30000, 50000, 75000, 100000, 125000, 150000, 200000, 250000, 300000]
                    const currentIdx = brackets.findIndex(b => b >= (prefs.min_salary ?? 30000))
                    const nextIdx = (currentIdx + 1) % brackets.length
                    handleJobFieldChange('min_salary', brackets[nextIdx])
                },
                render: (interactive: boolean) => {
                    const salaryK = ((prefs.min_salary ?? 0) / 1000).toFixed(0)
                    const brackets = [30000, 50000, 75000, 100000, 125000, 150000, 200000, 250000, 300000]
                    const currentIdx = brackets.findIndex(b => b >= (prefs.min_salary ?? 30000))
                    const cycle = () => {
                        const nextIdx = (currentIdx + 1) % brackets.length
                        handleJobFieldChange('min_salary', brackets[nextIdx])
                    }
                    return (
                        <button className="settings-fact" onClick={cycle} disabled={!interactive} type="button">
                            <span className="settings-fact-label">Min Salary</span>
                            <span className="settings-fact-value">${salaryK}K+</span>
                        </button>
                    )
                }
            },
            {
                id: 'visa',
                ariaLabel: 'Visa sponsorship requirement',
                getValueLabel: () => profile.needs_sponsorship ? 'Required' : 'Not needed',
                onActivate: () => { setProfileField('needs_sponsorship', !profile.needs_sponsorship); triggerSave() },
                render: (interactive: boolean) => (
                    <button
                        className="settings-fact"
                        onClick={() => { setProfileField('needs_sponsorship', !profile.needs_sponsorship); triggerSave() }}
                        disabled={!interactive}
                        type="button"
                    >
                        <span className="settings-fact-label">Visa</span>
                        <span className="settings-fact-value">{profile.needs_sponsorship ? 'Required' : 'Not needed'}</span>
                    </button>
                )
            },
            {
                id: 'relocation',
                ariaLabel: 'Relocation preference',
                getValueLabel: () => {
                    const labels: Record<string, string> = { no: 'No', yes: 'Yes', depends: 'Depends' }
                    return labels[profile.relocate_preference || 'no']
                },
                onActivate: () => {
                    const opts = ['no', 'yes', 'depends'] as const
                    const currentIdx = opts.indexOf(profile.relocate_preference || 'no')
                    setProfileField('relocate_preference', opts[(currentIdx + 1) % opts.length])
                    triggerSave()
                },
                render: (interactive: boolean) => {
                    const opts = ['no', 'yes', 'depends'] as const
                    const labels: Record<string, string> = { no: 'No', yes: 'Yes', depends: 'Depends' }
                    const currentIdx = opts.indexOf(profile.relocate_preference || 'no')
                    const cycle = () => { setProfileField('relocate_preference', opts[(currentIdx + 1) % opts.length]); triggerSave() }
                    return (
                        <button className="settings-fact" onClick={cycle} disabled={!interactive} type="button">
                            <span className="settings-fact-label">Relocation</span>
                            <span className="settings-fact-value">{labels[profile.relocate_preference || 'no']}</span>
                        </button>
                    )
                }
            },
            {
                id: 'travel',
                ariaLabel: 'Travel preference',
                getValueLabel: () => {
                    const labels: Record<string, string> = { none: 'None', some: 'Occasional', frequent: 'Frequent' }
                    return labels[profile.travel_preference || 'none']
                },
                onActivate: () => {
                    const opts = ['none', 'some', 'frequent'] as const
                    const currentIdx = opts.indexOf(profile.travel_preference || 'none')
                    setProfileField('travel_preference', opts[(currentIdx + 1) % opts.length])
                    triggerSave()
                },
                render: (interactive: boolean) => {
                    const opts = ['none', 'some', 'frequent'] as const
                    const labels: Record<string, string> = { none: 'None', some: 'Occasional', frequent: 'Frequent' }
                    const currentIdx = opts.indexOf(profile.travel_preference || 'none')
                    const cycle = () => { setProfileField('travel_preference', opts[(currentIdx + 1) % opts.length]); triggerSave() }
                    return (
                        <button className="settings-fact" onClick={cycle} disabled={!interactive} type="button">
                            <span className="settings-fact-label">Travel</span>
                            <span className="settings-fact-value">{labels[profile.travel_preference || 'none']}</span>
                        </button>
                    )
                }
            },
            {
                id: 'notif-match',
                ariaLabel: 'Match alerts notification',
                getValueLabel: () => settings.notifHighMatch ? 'On' : 'Off',
                onActivate: () => { saveSettings({ notifHighMatch: !settings.notifHighMatch }); triggerSave() },
                render: (interactive: boolean) => (
                    <button
                        className="settings-fact"
                        onClick={() => { saveSettings({ notifHighMatch: !settings.notifHighMatch }); triggerSave() }}
                        disabled={!interactive}
                        type="button"
                    >
                        <span className="settings-fact-label">Match Alerts</span>
                        <span className="settings-fact-value">{settings.notifHighMatch ? 'On' : 'Off'}</span>
                    </button>
                )
            },
            {
                id: 'notif-updates',
                ariaLabel: 'Application updates notification',
                getValueLabel: () => settings.notifApplicationUpdates ? 'On' : 'Off',
                onActivate: () => { saveSettings({ notifApplicationUpdates: !settings.notifApplicationUpdates }); triggerSave() },
                render: (interactive: boolean) => (
                    <button
                        className="settings-fact"
                        onClick={() => { saveSettings({ notifApplicationUpdates: !settings.notifApplicationUpdates }); triggerSave() }}
                        disabled={!interactive}
                        type="button"
                    >
                        <span className="settings-fact-label">App Updates</span>
                        <span className="settings-fact-value">{settings.notifApplicationUpdates ? 'On' : 'Off'}</span>
                    </button>
                )
            },
            {
                id: 'notif-digest',
                ariaLabel: 'Weekly digest notification',
                getValueLabel: () => settings.notifWeeklyDigest ? 'On' : 'Off',
                onActivate: () => { saveSettings({ notifWeeklyDigest: !settings.notifWeeklyDigest }); triggerSave() },
                render: (interactive: boolean) => (
                    <button
                        className="settings-fact"
                        onClick={() => { saveSettings({ notifWeeklyDigest: !settings.notifWeeklyDigest }); triggerSave() }}
                        disabled={!interactive}
                        type="button"
                    >
                        <span className="settings-fact-label">Weekly Digest</span>
                        <span className="settings-fact-value">{settings.notifWeeklyDigest ? 'On' : 'Off'}</span>
                    </button>
                )
            },
            {
                id: 'autoapply',
                ariaLabel: 'Auto-apply setting',
                getValueLabel: () => prefs.enable_auto_apply ? 'Enabled' : 'Disabled',
                onActivate: () => { setJobField('enable_auto_apply', !prefs.enable_auto_apply); triggerSave() },
                render: (interactive: boolean) => (
                    <button
                        className="settings-fact"
                        onClick={() => { setJobField('enable_auto_apply', !prefs.enable_auto_apply); triggerSave() }}
                        disabled={!interactive}
                        type="button"
                    >
                        <span className="settings-fact-label">Auto-Apply</span>
                        <span className="settings-fact-value">{prefs.enable_auto_apply ? 'Enabled' : 'Disabled'}</span>
                    </button>
                )
            }
        ]
    }, [loading, prefs, profile, settings, personas, activePersona, setActivePersona, setJobField, setProfileField, saveSettings, triggerSave])

    // ============================================
    // TRIPLICATED CARDS FOR INFINITE LOOP
    // ============================================
    const triplicatedCards = useMemo(() => {
        if (baseCardDefinitions.length === 0) return []
        return [
            ...baseCardDefinitions.map((card, i) => ({ ...card, virtualIndex: i, copyIndex: 0 })),
            ...baseCardDefinitions.map((card, i) => ({ ...card, virtualIndex: i + BASE_CARD_COUNT, copyIndex: 1 })),
            ...baseCardDefinitions.map((card, i) => ({ ...card, virtualIndex: i + BASE_CARD_COUNT * 2, copyIndex: 2 }))
        ]
    }, [baseCardDefinitions])

    // ============================================
    // SCROLL -> ROTATION MAPPING
    // ============================================
    const recenterIfNeeded = useCallback((scrollTop: number): number => {
        const oneSetHeight = BASE_CARD_COUNT * CARD_HEIGHT_FOR_SCROLL
        const middleStart = oneSetHeight
        const middleEnd = oneSetHeight * 2
        
        if (scrollTop < middleStart * 0.5) {
            return scrollTop + oneSetHeight
        }
        if (scrollTop > middleEnd + middleStart * 0.5) {
            return scrollTop - oneSetHeight
        }
        return scrollTop
    }, [])

    const handleScroll = useCallback(() => {
        if (!scrollRef.current || isRecentering.current) return
        
        let newScroll = scrollRef.current.scrollTop
        const recentered = recenterIfNeeded(newScroll)
        
        if (recentered !== newScroll) {
            isRecentering.current = true
            scrollRef.current.scrollTop = recentered
            newScroll = recentered
            requestAnimationFrame(() => { isRecentering.current = false })
        }
        
        // Convert scroll to target rotation
        // One card of scroll = one CARD_INTERVAL_DEG of rotation
        const newTargetRotation = (newScroll / CARD_HEIGHT_FOR_SCROLL) * CARD_INTERVAL_DEG
        setTargetRotation(newTargetRotation)
    }, [recenterIfNeeded])

    // Initialize scroll position
    useEffect(() => {
        const scrollEl = scrollRef.current
        if (!scrollEl) return
        
        scrollEl.scrollTop = BASE_CARD_COUNT * CARD_HEIGHT_FOR_SCROLL
        scrollEl.addEventListener('scroll', handleScroll, { passive: true })
        return () => scrollEl.removeEventListener('scroll', handleScroll)
    }, [handleScroll])

    // Wheel event fallback - forwards wheel to scroll driver
    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (!scrollRef.current) return
        // Forward wheel delta to scroll driver
        scrollRef.current.scrollTop += e.deltaY
    }, [])

    // ============================================
    // DAMPED ROTATION ANIMATION
    // ============================================
    useEffect(() => {
        if (prefersReducedMotion) {
            // No animation for reduced motion
            setCurrentRotation(targetRotation)
            return
        }

        const animate = () => {
            const diff = targetRotation - currentRotationRef.current
            if (Math.abs(diff) < 0.01) {
                currentRotationRef.current = targetRotation
                setCurrentRotation(targetRotation)
                return
            }
            
            // Damped interpolation (no snapping, no easing to integers)
            currentRotationRef.current += diff * DAMPING_FACTOR
            setCurrentRotation(currentRotationRef.current)
            animationRef.current = requestAnimationFrame(animate)
        }
        
        animationRef.current = requestAnimationFrame(animate)
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current)
        }
    }, [targetRotation, prefersReducedMotion])

    // ============================================
    // COMPUTE VISIBLE CARDS WITH 3D TRANSFORMS
    // ============================================
    const visibleCards = useMemo(() => {
        if (triplicatedCards.length === 0) return []

        const centerCardFloat = currentRotation / CARD_INTERVAL_DEG
        const centerCardIndex = Math.round(centerCardFloat)
        const cards = []

        for (let offset = -VIEWPORT_HALF_WINDOW; offset <= VIEWPORT_HALF_WINDOW; offset++) {
            const virtualIdx = centerCardIndex + offset
            if (virtualIdx < 0 || virtualIdx >= triplicatedCards.length) continue

            const card = triplicatedCards[virtualIdx]
            if (!card) continue

            // Calculate angle from centerline
            // cardAngle = (virtualIndex * CARD_INTERVAL_DEG) - currentRotation
            let cardAngle = (virtualIdx * CARD_INTERVAL_DEG) - currentRotation
            // Normalize to [-180, 180]
            while (cardAngle > 180) cardAngle -= 360
            while (cardAngle < -180) cardAngle += 360

            const absAngle = Math.abs(cardAngle)
            
            // Skip cards too far away
            if (absAngle > 90) continue

            // Compute styling based on angular distance
            let scale: number, blur: number, opacity: number
            const isInteractive = absAngle <= AUTHORITY_BAND_DEG

            if (absAngle <= ZONE_INTERACTIVE) {
                // Centerline authority: full interactivity
                scale = 1.0
                blur = 0
                opacity = 1.0
            } else if (absAngle <= ZONE_NEAR) {
                // Near zone: slightly recessed
                const t = (absAngle - ZONE_INTERACTIVE) / (ZONE_NEAR - ZONE_INTERACTIVE)
                scale = 1.0 - t * 0.15 // 1.0 -> 0.85
                blur = t * 2 // 0 -> 2px
                opacity = 1.0 - t * 0.1 // 1.0 -> 0.9
            } else {
                // Far zone: deeply recessed
                const t = Math.min((absAngle - ZONE_NEAR) / (90 - ZONE_NEAR), 1)
                scale = 0.85 - t * 0.15 // 0.85 -> 0.70
                blur = 2 + t * 5 // 2 -> 7px
                opacity = 0.9 - t * 0.25 // 0.9 -> 0.65
            }

            // z-index: closer to center = higher
            const zIndex = Math.round(100 - absAngle)

            cards.push({
                key: `${card.id}-${card.copyIndex}-${virtualIdx}`,
                card,
                cardAngle,
                scale,
                blur,
                opacity,
                zIndex,
                isInteractive
            })
        }

        return cards
    }, [currentRotation, triplicatedCards])

    // ============================================
    // REDUCED MOTION FALLBACK
    // ============================================
    if (prefersReducedMotion) {
        if (loading) {
            return <div className="settings-wheel-container"><p className="settings-loading">Loading…</p></div>
        }

        return (
            <div 
                className="settings-wheel-container settings-wheel-reduced-motion"
                role="region"
                aria-label="Settings"
            >
                <div className="settings-wheel-fallback-list">
                    {baseCardDefinitions.map((card) => (
                        <div 
                            key={card.id} 
                            className="settings-wheel-fallback-card"
                            aria-label={card.ariaLabel}
                        >
                            <SettingCard title="" isInteractive={true}>
                                {card.render(true)}
                            </SettingCard>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (loading) {
        return <div className="settings-wheel-container"><p className="settings-loading">Loading…</p></div>
    }

    // Total virtual scroll height
    const totalScrollHeight = TOTAL_VIRTUAL_CARDS * CARD_HEIGHT_FOR_SCROLL

    return (
        <div 
            className="settings-wheel-container" 
            ref={containerRef}
            onWheel={handleWheel}
            role="region"
            aria-label="Settings wheel"
        >
            {/* Hidden scroll driver */}
            <div 
                className="settings-wheel-scroll-driver"
                ref={scrollRef}
                aria-hidden="true"
            >
                <div style={{ height: totalScrollHeight }} />
            </div>

            {/* 3D Stage */}
            <div className="settings-wheel-stage">
                <div className="settings-wheel-cylinder">
                    {visibleCards.map(({ key, card, cardAngle, scale, blur, opacity, zIndex, isInteractive }) => {
                        // 3D transform: rotateX positions card on cylinder, translateZ brings it forward
                        const angleRad = (cardAngle * Math.PI) / 180
                        const translateZ = Math.cos(angleRad) * CYLINDER_RADIUS
                        const translateY = Math.sin(angleRad) * CYLINDER_RADIUS * 0.4 // Subtle Y movement

                        return (
                            <div
                                key={key}
                                className={`settings-wheel-card ${isInteractive ? 'interactive' : 'inert'}`}
                                style={{
                                    transform: `translateY(${translateY}px) translateZ(${translateZ}px) scale(${scale})`,
                                    filter: blur > 0 ? `blur(${blur}px)` : 'none',
                                    opacity,
                                    zIndex,
                                    pointerEvents: isInteractive ? 'auto' : 'none'
                                }}
                                aria-label={card.ariaLabel}
                                aria-hidden={!isInteractive}
                                tabIndex={isInteractive ? 0 : -1}
                            >
                                <SettingCard title="" isInteractive={isInteractive}>
                                    {card.render(isInteractive)}
                                </SettingCard>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
