/**
 * Error Boundary Component
 * 
 * Catches unhandled React errors and displays a user-friendly fallback UI
 * instead of crashing the entire app with a white screen.
 */

import React, { Component, ReactNode } from 'react'
import { Icon } from './Icon'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ErrorBoundaryProps {
    children: ReactNode
    fallback?: ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console (in production, send to error tracking service)
        console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null })
    }

    handleGoHome = () => {
        window.location.href = '/dashboard'
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="error-boundary">
                    <div className="error-boundary__content">
                        <div className="error-boundary__icon">
                            <Icon name="compass-cracked" size="hero" />
                        </div>

                        <h1 className="error-boundary__title">Something went wrong</h1>

                        <p className="error-boundary__message">
                            We hit an unexpected bump. This error has been noted, and we're working on it.
                        </p>

                        <div className="error-boundary__actions">
                            <button
                                type="button"
                                className="primary-button"
                                onClick={this.handleRetry}
                            >
                                Try again
                            </button>
                            <button
                                type="button"
                                className="ghost-button"
                                onClick={this.handleGoHome}
                            >
                                Go to Dashboard
                            </button>
                        </div>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="error-boundary__details">
                                <summary>Error details (dev only)</summary>
                                <pre>{this.state.error.message}</pre>
                                <pre>{this.state.error.stack}</pre>
                            </details>
                        )}
                    </div>

                    <style>{errorBoundaryStyles}</style>
                </div>
            )
        }

        return this.props.children
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const errorBoundaryStyles = `
.error-boundary {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--color-bg, #fafafa);
}

.error-boundary__content {
  max-width: 480px;
  text-align: center;
}

.error-boundary__icon {
  margin-bottom: 24px;
  opacity: 0.6;
}

.error-boundary__title {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-ink, #1a1a1a);
  margin: 0 0 12px;
}

.error-boundary__message {
  font-size: 15px;
  color: var(--color-ink-secondary, #666);
  margin: 0 0 32px;
  line-height: 1.5;
}

.error-boundary__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.error-boundary__details {
  margin-top: 32px;
  text-align: left;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e5e5e5);
  border-radius: 8px;
  padding: 12px;
}

.error-boundary__details summary {
  cursor: pointer;
  font-size: 12px;
  color: var(--color-ink-tertiary, #999);
  margin-bottom: 8px;
}

.error-boundary__details pre {
  font-size: 11px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 8px 0;
  padding: 8px;
  background: var(--color-bg, #f5f5f5);
  border-radius: 4px;
}
`

export default ErrorBoundary
