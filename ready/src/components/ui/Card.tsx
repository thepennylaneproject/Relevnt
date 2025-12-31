/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RELEVNT CARD COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Card component with surface background and subtle shadow.
 * 
 * Usage:
 *   <Card>Content here</Card>
 *   <Card elevated>Elevated card</Card>
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
    padding = 'md',
    children,
    className = '',
    ...props
}) => {
    const paddingClasses: Record<string, string> = {
        none: 'card--no-padding',
        sm: 'card--padding-sm',
        md: '',
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
