/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RELEVNT BADGE COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Badge/tag component for status indicators and labels.
 * 
 * Usage:
 *   <Badge>Default</Badge>
 *   <Badge variant="accent">Match: 85%</Badge>
 *   <Badge variant="success">Hired</Badge>
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';

export type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'error';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
    variant = 'default',
    children,
    className = '',
    ...props
}) => {
    const variantClasses: Record<BadgeVariant, string> = {
        default: '',
        accent: 'badge--accent',
        success: 'badge--success',
        warning: 'badge--warning',
        error: 'badge--error',
    };

    const classes = [
        'badge',
        variantClasses[variant],
        className,
    ].filter(Boolean).join(' ');

    return (
        <span className={classes} {...props}>
            {children}
        </span>
    );
};

export default Badge;
