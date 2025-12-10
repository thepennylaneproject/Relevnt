/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RELEVNT BUTTON COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Button component with primary, secondary, and ghost variants.
 * Uses design tokens for consistent styling.
 * 
 * Usage:
 *   <Button variant="primary" onClick={handleClick}>Save</Button>
 *   <Button variant="secondary" size="sm">Cancel</Button>
 *   <Button variant="ghost" disabled>Loading...</Button>
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    fullWidth?: boolean;
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    children,
    className = '',
    disabled,
    ...props
}) => {
    const variantClasses: Record<ButtonVariant, string> = {
        primary: 'btn--primary',
        secondary: 'btn--secondary',
        ghost: 'btn--ghost',
    };

    const sizeClasses: Record<ButtonSize, string> = {
        sm: 'btn--sm',
        md: '',
        lg: 'btn--lg',
    };

    const classes = [
        'btn',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'btn--full-width' : '',
        loading ? 'btn--loading' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <button
            className={classes}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <>
                    <span className="btn__spinner" aria-hidden="true" />
                    <span className="sr-only">Loading...</span>
                </>
            ) : (
                children
            )}
        </button>
    );
};

export default Button;
