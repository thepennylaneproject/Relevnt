/**
 * Confirmation Dialog Component
 * 
 * A reusable confirmation dialog for destructive actions.
 * Ensures users don't accidentally delete or perform irreversible actions.
 */

import React from 'react'
import { Icon } from './Icon'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ConfirmDialogProps {
    isOpen: boolean
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'danger' | 'warning' | 'default'
    onConfirm: () => void
    onCancel: () => void
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
    onConfirm,
    onCancel,
}: ConfirmDialogProps): JSX.Element | null {
    if (!isOpen) return null

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onCancel()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onCancel()
        }
    }

    return (
        <div
            className="confirm-dialog__backdrop"
            onClick={handleBackdropClick}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
        >
            <div className="confirm-dialog">
                <div className="confirm-dialog__icon">
                    <Icon
                        name={variant === 'danger' ? 'compass-cracked' : 'candle'}
                        size="lg"
                    />
                </div>

                <h2 id="confirm-dialog-title" className="confirm-dialog__title">
                    {title}
                </h2>

                <p className="confirm-dialog__message">{message}</p>

                <div className="confirm-dialog__actions">
                    <button
                        type="button"
                        className="ghost-button"
                        onClick={onCancel}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={`primary-button ${variant === 'danger' ? 'primary-button--danger' : ''}`}
                        onClick={onConfirm}
                        autoFocus
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>

            <style>{confirmDialogStyles}</style>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const confirmDialogStyles = `
.confirm-dialog__backdrop {
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: confirm-fade-in 0.15s ease-out;
}

@keyframes confirm-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.confirm-dialog {
  background: var(--color-surface, #fff);
  border-radius: 16px;
  padding: 32px;
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: confirm-slide-in 0.2s ease-out;
}

@keyframes confirm-slide-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.confirm-dialog__icon {
  margin-bottom: 16px;
}

.confirm-dialog__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-ink, #1a1a1a);
  margin: 0 0 8px;
}

.confirm-dialog__message {
  font-size: 14px;
  color: var(--color-ink-secondary, #666);
  margin: 0 0 24px;
  line-height: 1.5;
}

.confirm-dialog__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.primary-button--danger {
  background: var(--color-error, #ef4444) !important;
  border-color: var(--color-error, #ef4444) !important;
}

.primary-button--danger:hover {
  background: #dc2626 !important;
}
`

export default ConfirmDialog
