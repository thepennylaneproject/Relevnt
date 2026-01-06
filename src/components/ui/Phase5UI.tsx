/**
 * ============================================================================
 * REUSABLE UI COMPONENTS FOR PHASE 5
 * ============================================================================
 * ðŸŽ" PURPOSE: Common UI components used throughout Phase 5
 * 
 * These components handle:
 * - Loading states
 * - Error display
 * - Empty states
 * - Success messages
 * - Tier upgrade prompts
 * 
 * ðŸŽ" BENEFIT: Instead of writing loading/error UI in every component,
 * we define it once here and reuse everywhere
 * ============================================================================
 */

import React from 'react'
import { Heading, Text } from './Typography'
import { Button } from './Button'
import { Icon } from './Icon'

// ============================================================================
// LOADING SPINNER
// ============================================================================

/**
 * LoadingSpinner - Shows while async operation is in progress
 * 
 * ðŸŽ" ACCESSIBILITY: Uses aria-label for screen readers
 */
export interface LoadingSpinnerProps {
  message?: string
  size?: 'small' | 'medium' | 'large'
}

export function LoadingSpinner({
  message = 'Processing record...',
  size = 'medium',
}: LoadingSpinnerProps): React.ReactElement {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className={`${sizeClasses[size]} border-2 border-accent/20 border-t-accent rounded-none animate-spin`} />
      {message && (
        <Text muted className="text-[10px] uppercase tracking-widest font-bold">
          {message}
        </Text>
      )}
    </div>
  )
}

// ============================================================================
// ERROR ALERT
// ============================================================================

/**
 * ErrorAlert - Shows when something goes wrong
 * 
 * ðŸŽ" PATTERN: Provides user-friendly error display with optional retry
 */
export interface ErrorAlertProps {
  title?: string
  message: string
  onRetry?: () => void | Promise<void>
  onDismiss?: () => void
  isDismissible?: boolean
  showDetails?: boolean
}

export function ErrorAlert({
  title = 'System Alert',
  message,
  onRetry,
  onDismiss,
  isDismissible = true,
  showDetails = false,
}: ErrorAlertProps): React.ReactElement {
  const [isRetrying, setIsRetrying] = React.useState(false)
  const [isDismissed, setIsDismissed] = React.useState(false)

  if (isDismissed) return <></>

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      if (onRetry) {
        await onRetry()
      }
    } finally {
      setIsRetrying(false)
    }
  }

  const handleDismiss = () => {
    if (onDismiss) onDismiss()
    setIsDismissed(true)
  }

  return (
    <div
      className="rounded-none border-l-2 border-accent bg-black/[0.02] p-6"
      role="alert"
    >
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <Heading level={4} className="uppercase tracking-widest text-xs text-text">{title}</Heading>
          <Text className="mt-2 text-sm italic">{message}</Text>

          {showDetails && (
            <details className="mt-4 text-[10px] text-text-muted">
              <summary className="cursor-pointer hover:text-text transition-colors uppercase tracking-widest font-bold">Trace Details</summary>
              <pre className="mt-4 overflow-auto bg-black/5 p-4 rounded-none text-[10px] border border-border/10">
                {message}
              </pre>
            </details>
          )}
        </div>

        {isDismissible && (
          <button
            onClick={handleDismiss}
            className="text-text-muted hover:text-text transition-colors p-1"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {onRetry && (
        <div className="mt-6">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="text-[10px] uppercase tracking-widest font-bold text-accent border-b border-accent/20 hover:border-accent transition-colors"
          >
            {isRetrying ? 'Retrying…' : 'Re-attempt Operation'}
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// EMPTY STATE
// ============================================================================

/**
 * EmptyState - Shows when there's no data to display
 * 
 * ðŸŽ" UX: Helps users understand what to do next
 */
export interface EmptyStateProps {
  icon?: 'document' | 'briefcase' | 'chart' | 'star'
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon = 'document',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps): React.ReactElement {
  const iconMap = {
    document: (
      <svg className="w-8 h-8 text-text-muted/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    briefcase: (
      <svg className="w-8 h-8 text-text-muted/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    chart: (
      <svg className="w-8 h-8 text-text-muted/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    star: (
      <svg className="w-8 h-8 text-text-muted/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 px-8 text-center bg-black/[0.01] border border-dashed border-border/20">
      {iconMap[icon]}
      <Heading level={4} className="mt-8 uppercase tracking-[0.2em] font-bold text-text-muted">{title}</Heading>
      {description && <Text muted className="mt-2 text-xs italic">{description}</Text>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-10 text-[10px] uppercase tracking-widest font-bold text-text border-b border-text/20 hover:border-text transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

// ============================================================================
// SUCCESS ALERT
// ============================================================================

/**
 * SuccessAlert - Shows when operation completes successfully
 */
export interface SuccessAlertProps {
  message: string
  onDismiss?: () => void
  autoClose?: boolean
  autoCloseDelay?: number
}

export function SuccessAlert({
  message,
  onDismiss,
  autoClose = true,
  autoCloseDelay = 3000,
}: SuccessAlertProps): React.ReactElement {
  const [isVisible, setIsVisible] = React.useState(true)

  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        if (onDismiss) onDismiss()
      }, autoCloseDelay)
      return () => clearTimeout(timer)
    }
  }, [autoClose, autoCloseDelay, onDismiss])

  if (!isVisible) return <></>

  return (
    <div
      className="rounded-none border-l-2 border-accent bg-black/[0.02] p-4 flex items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300"
      role="alert"
    >
      <Text className="text-sm font-bold uppercase tracking-widest leading-none">
        {message}
      </Text>

      <button
        onClick={() => {
          setIsVisible(false)
          if (onDismiss) onDismiss()
        }}
        className="text-text-muted hover:text-text transition-colors p-2"
        aria-label="Dismiss success"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ============================================================================
// UPGRADE PROMPT
// ============================================================================

/**
 * UpgradePrompt - Shows when user needs to upgrade tier
 * 
 * ðŸŽ" MONETIZATION: This is key to the business model
 */
export interface UpgradePromptProps {
  feature: string
  currentTier: 'free' | 'pro' | 'premium'
  requiredTier: 'pro' | 'premium'
  onUpgrade?: () => void
}

export function UpgradePrompt({
  feature,
  currentTier,
  requiredTier,
  onUpgrade,
}: UpgradePromptProps): React.ReactElement {
  const tierDisplay = {
    pro: 'Pro',
    premium: 'Premium',
  }

  return (
    <div className="rounded-none border border-accent/20 bg-accent/[0.03] p-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex-1">
          <Heading level={3} className="mb-2">Membership Required</Heading>
          <Text className="text-sm leading-[1.6]">
            This {feature} is exclusive to <span className="font-bold text-accent">{tierDisplay[requiredTier]} members</span>. 
            You are currently on the {currentTier} plan.
          </Text>
        </div>

        <button
          onClick={onUpgrade}
          className="whitespace-nowrap px-8 py-3 bg-accent text-white hover:bg-black transition-colors text-[10px] uppercase tracking-widest font-bold"
        >
          View Membership Options
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// TIER LIMIT BADGE
// ============================================================================

/**
 * TierLimitBadge - Shows user their usage and limits
 * 
 * ðŸŽ" UX: Helps users understand their tier and encourages upgrade
 */
export interface TierLimitBadgeProps {
  current: number
  limit: number
  feature: string
}

export function TierLimitBadge({ current, limit, feature }: TierLimitBadgeProps): React.ReactElement {
  const percentage = (current / limit) * 100
  const isAtLimit = percentage >= 100

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <Text muted className="text-[10px] uppercase tracking-widest font-bold">{feature}</Text>
        <Text className={`text-xs font-bold tabular-nums ${isAtLimit ? 'text-accent' : 'text-text'}`}>
          {current} <span className="text-text-muted/40 font-normal">/ {limit}</span>
        </Text>
      </div>
      <div className="w-full bg-black/[0.05] h-1">
        <div
          className={`h-full transition-all duration-1000 ease-out bg-accent`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
    </div>
  )
}
