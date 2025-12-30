/**
 * 🎨 MODAL COMPONENT
 * 
 * Dialog/popup that displays content on top of the page.
 * Used for confirmations, forms, alerts, etc.
 * 
 * 📚 LEARNING NOTE: Modals are "portal" components - they render at the root
 * of the document, not inline with other components. This prevents z-index issues.
 */

import { useRelevntTheme } from '../../contexts/RelevntThemeProvider'
import { CSSProperties, ReactNode } from 'react'
import { Button } from '../ui/Button'
import { PrimaryActionRegistryProvider } from '../ui/PrimaryActionRegistry'

// ============================================================================
// TYPES
// ============================================================================

export interface ModalProps {
    /** Modal title */
    title?: string

    /** Modal content */
    children: ReactNode

    /** Whether modal is open */
    isOpen: boolean

    /** Close handler */
    onClose: () => void

    /** Optional confirm button */
    onConfirm?: () => void

    /** Label for confirm button */
    confirmLabel?: string

    /** Confirm button variant */
    confirmVariant?: 'primary' | 'secondary' | 'outline'

    /** Show close button */
    showCloseButton?: boolean

    /** Size of modal */
    size?: 'sm' | 'md' | 'lg'

    /** Custom className */
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
    const { colors } = useRelevntTheme()
    const styles = getModalStyles(colors, size)

    // Don't render if not open
    if (!isOpen) return null

    return (
        <>
            {/* Backdrop - clicks close the modal */}
            <div
                style={styles.backdrop}
                onClick={onClose}
                /**
                 * 📚 ACCESSIBILITY: backdrop is inert (can't interact with it)
                 */
                aria-hidden="true"
            />

            {/* Modal dialog - wrapped with PrimaryActionRegistry for Rule 1 enforcement */}
            <PrimaryActionRegistryProvider scopeId={`modal-${title || 'dialog'}`}>
                <div
                    style={styles.modal}
                    className={className}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={title ? 'modal-title' : undefined}
                >
                    {/* Header with title and close button */}
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

                    {/* Content */}
                    <div style={styles.content}>{children}</div>

                    {/* Footer with buttons - Primary Action Monogamy: only confirm is primary */}
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
            </PrimaryActionRegistryProvider>
        </>
    )
}

// ============================================================================
// STYLES
// ============================================================================

function getModalStyles(colors: any, size: string) {
    const sizeMap = {
        sm: { maxWidth: '400px' },
        md: { maxWidth: '600px' },
        lg: { maxWidth: '800px' },
    }

    const currentSize = sizeMap[size as keyof typeof sizeMap] || sizeMap.md

    return {
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
            backgroundColor: colors.background,
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            maxHeight: '90vh',
            overflowY: 'auto',
            zIndex: 1000,
            animation: 'slideUp 0.3s ease',
        } as CSSProperties,

        header: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px',
            borderBottom: `1px solid ${colors.borderColor || '#e0e0e0'}`,
        } as CSSProperties,

        title: {
            fontSize: '20px',
            fontWeight: 600,
            color: colors.text,
            margin: 0,
        } as CSSProperties,

        closeButton: {
            background: 'none',
            border: 'none',
            fontSize: '24px',
            color: colors.text,
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
            color: colors.text,
        } as CSSProperties,

        footer: {
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            padding: '24px',
            borderTop: `1px solid ${colors.borderColor || '#e0e0e0'}`,
        } as CSSProperties,
    }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * 📚 HOW TO USE:
 * 
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false)
 * 
 * // Basic modal
 * <>
 *   <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
 *   
 *   <Modal
 *     isOpen={isOpen}
 *     onClose={() => setIsOpen(false)}
 *     title="Welcome"
 *   >
 *     <p>This is a modal dialog!</p>
 *   </Modal>
 * </>
 * 
 * // Modal with confirm action
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={() => {
 *     console.log('Confirmed!')
 *     setIsOpen(false)
 *   }}
 *   title="Delete Item?"
 *   confirmLabel="Delete"
 *   confirmVariant="error"
 * >
 *   <p>Are you sure you want to delete this item? This action cannot be undone.</p>
 * </Modal>
 * 
 * // Modal without close button
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => {}}
 *   showCloseButton={false}
 *   title="Information"
 * >
 *   <p>Important message</p>
 * </Modal>
 * 
 * // Different sizes
 * <Modal size="sm" isOpen={isOpen} onClose={() => {}} />
 * <Modal size="md" isOpen={isOpen} onClose={() => {}} />
 * <Modal size="lg" isOpen={isOpen} onClose={() => {}} />
 * ```
 */