/**
 * Modal Component - Ready App
 * 
 * Dialog/popup that displays content on top of the page.
 * Simplified version without Relevnt-specific dependencies.
 */

import { CSSProperties, ReactNode } from 'react'
import { Button } from '../ui/Button'

// ============================================================================
// TYPES
// ============================================================================

export interface ModalProps {
    title?: string
    children: ReactNode
    isOpen: boolean
    onClose: () => void
    onConfirm?: () => void
    confirmLabel?: string
    showCloseButton?: boolean
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function Modal({
    title,
    children,
    isOpen,
    onClose,
    onConfirm,
    confirmLabel = 'Confirm',
    showCloseButton = true,
    size = 'md',
    className = '',
}: ModalProps) {
    if (!isOpen) return null

    const sizeMap = {
        sm: { maxWidth: '400px' },
        md: { maxWidth: '600px' },
        lg: { maxWidth: '800px' },
    }

    const currentSize = sizeMap[size] || sizeMap.md

    const styles = {
        backdrop: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
        } as CSSProperties,

        modal: {
            ...currentSize,
            width: '90%',
            backgroundColor: 'var(--color-surface, #fff)',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            maxHeight: '90vh',
            overflowY: 'auto',
            zIndex: 1000,
            position: 'fixed',
        } as CSSProperties,

        header: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px',
            borderBottom: '1px solid var(--color-border, #e0e0e0)',
        } as CSSProperties,

        title: {
            fontSize: '20px',
            fontWeight: 600,
            color: 'var(--color-ink, #1a1a1a)',
            margin: 0,
        } as CSSProperties,

        closeButton: {
            background: 'none',
            border: 'none',
            fontSize: '24px',
            color: 'var(--color-ink, #1a1a1a)',
            cursor: 'pointer',
            padding: '0',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
        } as CSSProperties,

        content: {
            padding: '24px',
            color: 'var(--color-ink, #1a1a1a)',
        } as CSSProperties,

        footer: {
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            padding: '24px',
            borderTop: '1px solid var(--color-border, #e0e0e0)',
        } as CSSProperties,
    }

    return (
        <>
            {/* Backdrop */}
            <div
                style={styles.backdrop}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal dialog */}
            <div
                style={styles.modal}
                className={className}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
            >
                {(title || showCloseButton) && (
                    <div style={styles.header}>
                        {title && (
                            <h2 id="modal-title" style={styles.title}>
                                {title}
                            </h2>
                        )}
                        {showCloseButton && (
                            <button
                                style={styles.closeButton}
                                onClick={onClose}
                                aria-label="Close modal"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                )}

                <div style={styles.content}>{children}</div>

                {onConfirm && (
                    <div style={styles.footer}>
                        <Button variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={onConfirm}>
                            {confirmLabel}
                        </Button>
                    </div>
                )}
            </div>
        </>
    )
}

export default Modal