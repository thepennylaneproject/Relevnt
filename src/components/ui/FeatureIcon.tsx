/**
 * FeatureIcon Component
 * 
 * Renders colorful feature icons from the Relevnt icon sprite.
 * These are 96x96 display icons with gradients, NOT the inline stroke icons.
 * 
 * Usage:
 *   <FeatureIcon name="high-matches" size={48} />
 *   <FeatureIcon name="applications-briefcase" size={64} theme="dark" />
 */

import React from 'react'

export type FeatureIconName =
    | 'ai-tools-wrench'
    | 'ai-tools-zap'
    | 'applications-briefcase'
    | 'applications-filetext'
    | 'ats-optimizer'
    | 'bullet-bank'
    | 'career-development'
    | 'contacts-messagecircle'
    | 'contacts-users'
    | 'high-matches'
    | 'interview-prep'
    | 'interviews'
    | 'notifications'
    | 'offer-negotiator'
    | 'portfolio-curator'
    | 'predictive-trends'
    | 'professional-network'
    | 'profile-filetext'
    | 'profile-user'
    | 'resume-optimizer'
    | 'resume-versions'
    | 'skill-gap'
    | 'total-jobs'

export interface FeatureIconProps {
    name: FeatureIconName
    size?: number
    theme?: 'light' | 'dark'
    className?: string
    title?: string
}

export const FeatureIcon: React.FC<FeatureIconProps> = ({
    name,
    size = 48,
    theme = 'light',
    className = '',
    title,
}) => {
    const spriteUrl = theme === 'dark'
        ? '/sprite-dark-cloudinary.svg'
        : '/sprite-light-cloudinary.svg'

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 96 96"
            className={`feature-icon ${className}`}
            role={title ? 'img' : 'presentation'}
            aria-label={title}
            aria-hidden={!title}
        >
            {title && <title>{title}</title>}
            <use href={`${spriteUrl}#${name}`} />
        </svg>
    )
}

export default FeatureIcon
