/**
 * Toast Notification System
 * 
 * A lightweight, app-wide toast notification component.
 * Replaces native alert() calls with contextual, styled notifications.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Icon, IconName } from './Icon'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
    id: string
    message: string
    variant: ToastVariant
    duration?: number
}

interface ToastContextValue {
    showToast: (message: string, variant?: ToastVariant, duration?: number) => void
    dismissToast: (id: string) => void
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext)
    if (!context) {
        // Fallback for when provider isn't available
        return {
            showToast: (message) => console.warn('Toast provider not found:', message),
            dismissToast: () => { },
        }
    }
    return context
}

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

interface ToastProviderProps {
    children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps): JSX.Element {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((message: string, variant: ToastVariant = 'info', duration = 4000) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
        const toast: Toast = { id, message, variant, duration }

        setToasts(prev => [...prev, toast])

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id))
            }, duration)
        }
    }, [])

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ showToast, dismissToast }}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </ToastContext.Provider>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// TOAST CONTAINER
// ═══════════════════════════════════════════════════════════════════════════

interface ToastContainerProps {
    toasts: Toast[]
    onDismiss: (id: string) => void
}

const VARIANT_CONFIG: Record<ToastVariant, { icon: IconName; className: string }> = {
    success: { icon: 'flower', className: 'toast--success' },
    error: { icon: 'compass-cracked', className: 'toast--error' },
    warning: { icon: 'candle', className: 'toast--warning' },
    info: { icon: 'lighthouse', className: 'toast--info' },
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps): JSX.Element | null {
    if (toasts.length === 0) return null

    return (
        <div className="toast-container" role="region" aria-label="Notifications">
            {toasts.map(toast => {
                const config = VARIANT_CONFIG[toast.variant]
                return (
                    <div
                        key={toast.id}
                        className={`toast ${config.className}`}
                        role="alert"
                        aria-live="polite"
                    >
                        <Icon name={config.icon} size="sm" hideAccent />
                        <span className="toast__message">{toast.message}</span>
                        <button
                            type="button"
                            className="toast__dismiss"
                            onClick={() => onDismiss(toast.id)}
                            aria-label="Dismiss"
                        >
                            ×
                        </button>
                    </div>
                )
            })}
            <style>{toastStyles}</style>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const toastStyles = `
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  background: var(--color-surface, #fff);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border-left: 4px solid transparent;
  animation: toast-slide-in 0.3s ease-out;
}

@keyframes toast-slide-in {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.toast--success {
  border-left-color: var(--color-success, #22c55e);
}

.toast--error {
  border-left-color: var(--color-error, #ef4444);
}

.toast--warning {
  border-left-color: var(--color-warning, #f59e0b);
}

.toast--info {
  border-left-color: var(--color-accent, #6366f1);
}

.toast__message {
  flex: 1;
  font-size: 14px;
  color: var(--color-ink, #1a1a1a);
  line-height: 1.4;
}

.toast__dismiss {
  background: none;
  border: none;
  padding: 4px 8px;
  font-size: 18px;
  color: var(--color-ink-tertiary, #888);
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.15s;
}

.toast__dismiss:hover {
  opacity: 1;
}
`

export default ToastProvider
