/**
 * Loading State Component
 * 
 * Consistent loading indicator across the app.
 * Replaces various "Loading...", "Loading your dashboard...", etc. strings.
 */

import React from 'react'
import { Icon } from './Icon'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface LoadingStateProps {
    /** What's being loaded - shown to user */
    message?: string
    /** Size variant */
    size?: 'sm' | 'md' | 'lg'
    /** Centers in parent container */
    centered?: boolean
    /** Full page loading overlay */
    fullPage?: boolean
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function LoadingState({
    message = 'Loading...',
    size = 'md',
    centered = true,
    fullPage = false,
}: LoadingStateProps): JSX.Element {
    const content = (
        <div className={`loading-state loading-state--${size} ${centered ? 'loading-state--centered' : ''}`}>
            <div className="loading-state__spinner">
                <Icon name="compass" size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'} />
            </div>
            <span className="loading-state__message">{message}</span>
        </div>
    )

    if (fullPage) {
        return (
            <div className="loading-state__overlay">
                {content}
                <style>{loadingStyles}</style>
            </div>
        )
    }

    return (
        <>
            {content}
            <style>{loadingStyles}</style>
        </>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// SKELETON LOADERS
// ═══════════════════════════════════════════════════════════════════════════

export function SkeletonLine({ width = '100%' }: { width?: string }): JSX.Element {
    return (
        <>
            <div className="skeleton-line" style={{ width }} />
            <style>{loadingStyles}</style>
        </>
    )
}

export function SkeletonCard(): JSX.Element {
    return (
        <>
            <div className="skeleton-card">
                <div className="skeleton-line" style={{ width: '60%', height: '16px' }} />
                <div className="skeleton-line" style={{ width: '100%', marginTop: '12px' }} />
                <div className="skeleton-line" style={{ width: '80%', marginTop: '8px' }} />
            </div>
            <style>{loadingStyles}</style>
        </>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const loadingStyles = `
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
}

.loading-state--centered {
  justify-content: center;
  min-height: 200px;
}

.loading-state--sm {
  padding: 12px;
  gap: 8px;
  min-height: 100px;
}

.loading-state--lg {
  padding: 48px;
  gap: 16px;
  min-height: 300px;
}

.loading-state__spinner {
  animation: spin 2s linear infinite;
  opacity: 0.6;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-state__message {
  font-size: 14px;
  color: var(--color-ink-tertiary, #888);
  font-style: italic;
}

.loading-state--sm .loading-state__message {
  font-size: 12px;
}

.loading-state__overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: var(--color-bg, #fafafa);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Skeleton loaders */
.skeleton-line {
  height: 12px;
  background: linear-gradient(90deg, var(--color-border, #e5e5e5) 25%, var(--color-bg, #f5f5f5) 50%, var(--color-border, #e5e5e5) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-card {
  padding: 16px;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e5e5e5);
  border-radius: 12px;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`

export default LoadingState
