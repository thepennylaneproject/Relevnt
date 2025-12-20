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
  message = 'Loading...',
  size = 'medium',
}: LoadingSpinnerProps): React.ReactElement {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      {/* Spinner SVG */}
      <svg
        className={`${sizeClasses[size]} animate-spin text-blue-500`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-label="Loading"
        role="status"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      {message && <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>}
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
  title = 'Something went wrong',
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
      className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4"
      role="alert"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Error icon */}
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-red-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="font-semibold text-red-800 dark:text-red-200">{title}</h3>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">{message}</p>

          {/* Details (optional) */}
          {showDetails && (
            <details className="mt-2 text-xs text-red-600 dark:text-red-400">
              <summary className="cursor-pointer hover:underline">Show details</summary>
              <pre className="mt-2 overflow-auto bg-red-100 dark:bg-red-900/50 p-2 rounded text-xs">
                {message}
              </pre>
            </details>
          )}
        </div>

        {/* Dismiss button */}
        {isDismissible && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-red-400 hover:text-red-600 dark:hover:text-red-300"
            aria-label="Dismiss error"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Actions */}
      {onRetry && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50"
          >
            {isRetrying ? 'Retrying...' : 'Try again'}
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
      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    briefcase: (
      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m0 10v10l8 4"
        />
      </svg>
    ),
    chart: (
      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
    star: (
      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
        />
      </svg>
    ),
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {iconMap[icon]}
      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      {description && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 transition-colors"
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
      className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 p-4 flex items-start gap-3"
      role="alert"
    >
      {/* Success icon */}
      <div className="flex-shrink-0">
        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {/* Content */}
      <p className="text-sm font-medium text-green-800 dark:text-green-200">{message}</p>

      {/* Close button */}
      <button
        onClick={() => {
          setIsVisible(false)
          if (onDismiss) onDismiss()
        }}
        className="flex-shrink-0 text-green-400 hover:text-green-600 dark:hover:text-green-300"
        aria-label="Dismiss success"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
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
    <div className="rounded-lg border-2 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 p-6">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M12.395 2.553a1 1 0 00-.961-.726H6.466a1 1 0 00-.96.726l-.83 4.73h.98a.75.75 0 00.744-.528l.72-3.6h2.219l.72 3.6a.75.75 0 00.745.528h.98l-.83-4.73z" />
            <path
              fillRule="evenodd"
              d="M16 8a.75.75 0 01-.75.75H4.75A.75.75 0 014 8v8a2 2 0 002 2h8a2 2 0 002-2V8a.75.75 0 01.75-.75zM5 12a1 1 0 011-1h8a1 1 0 011 1v2a1 1 0 01-1 1H6a1 1 0 01-1-1v-2z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">{feature} requires {tierDisplay[requiredTier]}</h3>
          <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
            You're on the {currentTier === 'free' ? 'Free' : 'Pro'} plan. Upgrade to {tierDisplay[requiredTier]} to unlock this feature and get access to advanced AI tools.
          </p>

          <button
            onClick={onUpgrade}
            className="mt-3 inline-flex px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 transition-colors"
          >
            Upgrade Now
          </button>
        </div>
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
  const isNearLimit = percentage > 80
  const isAtLimit = percentage >= 100

  let statusColor = 'text-green-600 dark:text-green-400'
  let barColor = 'bg-green-500'

  if (isAtLimit) {
    statusColor = 'text-red-600 dark:text-red-400'
    barColor = 'bg-red-500'
  } else if (isNearLimit) {
    statusColor = 'text-yellow-600 dark:text-yellow-400'
    barColor = 'bg-yellow-500'
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">{feature}</span>
        <span className={`font-medium ${statusColor}`}>
          {current} / {limit}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`${barColor} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
    </div>
  )
}
