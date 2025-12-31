/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RELEVNT ALERT COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Alert component for success, warning, error, and info messages.
 * Uses brand voice for warm, helpful messaging.
 * 
 * Usage:
 *   <Alert variant="success">Profile saved.</Alert>
 *   <Alert variant="error" onDismiss={handleDismiss}>Something went wrong.</Alert>
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { Icon, type IconName } from './Icon';

export type AlertVariant = 'success' | 'warning' | 'error' | 'info';

export interface AlertProps {
    variant: AlertVariant;
    children: React.ReactNode;
    onDismiss?: () => void;
    className?: string;
}

const variantIcons: Record<AlertVariant, IconName> = {
    success: 'flower',
    warning: 'candle',
    error: 'compass-cracked',
    info: 'lighthouse',
};

export const Alert: React.FC<AlertProps> = ({
    variant,
    children,
    onDismiss,
    className = '',
}) => {
    const classes = [
        'alert',
        `alert--${variant}`,
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} role="alert">
            <Icon name={variantIcons[variant]} size="sm" hideAccent />
            <div className="alert__content">
                {children}
            </div>
            {onDismiss && (
                <button
                    type="button"
                    className="alert__dismiss"
                    onClick={onDismiss}
                    aria-label="Dismiss"
                >
                    ×
                </button>
            )}
        </div>
    );
};

export default Alert;
