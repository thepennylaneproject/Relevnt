/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RELEVNT CARD COMPONENT — Ledger System
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * DEFAULT: Transparent, no chrome (no border, shadow, or background).
 * Use for layout grouping without visual containers.
 * 
 * ELEVATED: Visible container for modals, popovers only (rare).
 * 
 * Usage:
 *   <Card>Content with no visual container</Card>
 *   <Card elevated>Elevated card for modals</Card>
 *   <Card hoverable onClick={handleClick}>Clickable card</Card>
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    elevated?: boolean;
    hoverable?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
    elevated = false,
    hoverable = false,
    padding = 'none',
    children,
    className = '',
    ...props
}) => {
    const paddingClasses: Record<string, string> = {
        none: '',
        sm: 'card--padding-sm',
        md: 'card--padding-md',
        lg: 'card--padding-lg',
    };

    const classes = [
        'card',
        elevated ? 'card--elevated' : '',
        hoverable ? 'card--hoverable' : '',
        paddingClasses[padding],
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} {...props}>
            {children}
        </div>
    );
};

export default Card;
