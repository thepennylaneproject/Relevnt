/**
 * PageHero - Consistent hero section for all pages
 *
 * Pattern:
 * [Icon CATEGORY]
 * Headline
 * Subtitle
 * Context line (optional, teal accent)
 */

import React from 'react'
import { Button } from './Button'
import { FeatureIcon, type FeatureIconName } from './FeatureIcon'
import type { TextureType } from './TexturedBg'

export type PageCategory = 'track' | 'optimize' | 'grow'

export interface PageHeroAction {
    label: string
    onClick?: () => void
    href?: string
    variant?: 'primary' | 'ghost'
    icon?: React.ReactNode
}

export interface PageHeroProps {
    /** Category: track, optimize, or grow */
    category?: PageCategory
    /** Main headline */
    headline: string
    /** Optional subtitle below headline */
    subtitle?: string
    /** Optional context/transparency line with teal accent */
    contextLine?: string
    /** Action buttons to show on right side */
    actions?: PageHeroAction[]
    /** Optional texture overlay (watercolor default for hero) */
    texture?: TextureType | false
    /** Additional content below subtitle */
    children?: React.ReactNode
}

// Map categories to icons from relevnt_icon_kit
const CATEGORY_CONFIG: Record<PageCategory, { label: string; icon: FeatureIconName }> = {
    track: { label: 'TRACK', icon: 'high-matches' },
    optimize: { label: 'OPTIMIZE', icon: 'ai-tools-wrench' },
    grow: { label: 'GROW', icon: 'career-development' },
}

export function PageHero({
    category,
    headline,
    subtitle,
    contextLine,
    actions,
    texture = 'watercolor',
    children,
}: PageHeroProps) {
    const textureClass = texture ? `textured-bg--${texture}` : ''

    return (
        <section className={`page-hero ${textureClass}`}>
            {/* Category Pill */}
            {category && (
                <div className="page-hero__category-pill">
                    <FeatureIcon
                        name={CATEGORY_CONFIG[category].icon}
                        size={16}
                        title={CATEGORY_CONFIG[category].label}
                    />
                    <span>{CATEGORY_CONFIG[category].label}</span>
                </div>
            )}

            <div className="page-hero__header">
                <div className="page-hero__content">
                    <h1 className="page-hero__headline">{headline}</h1>
                    {subtitle && <p className="page-hero__subtitle">{subtitle}</p>}
                </div>
                {actions && actions.length > 0 && (
                    <div className="page-hero__actions">
                        {actions.map((action, idx) => {
                            const variant = action.variant === 'primary' ? 'primary' : 'ghost'

                            if (action.href) {
                                return (
                                    <Button
                                        key={idx}
                                        type="button"
                                        variant={variant}
                                        onClick={() => action.href && window.location.assign(action.href)}
                                    >
                                        {action.icon}
                                        {action.label}
                                    </Button>
                                )
                            }

                            return (
                                <Button
                                    key={idx}
                                    type="button"
                                    variant={variant}
                                    onClick={action.onClick}
                                >
                                    {action.icon}
                                    {action.label}
                                </Button>
                            )
                        })}
                    </div>
                )}
            </div>

            {contextLine && (
                <p className="page-hero__context">{contextLine}</p>
            )}

            {children}
        </section>
    )
}

export default PageHero
