/**
 * ═══════════════════════════════════════════════════════════════════════════
 * READY BUTTON COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The single source of truth for buttons in Ready.
 * Uses design tokens for consistent styling.
 *
 * Variants:
 *   - primary:     Accent background - the dominant CTA
 *   - secondary:   Outlined, transparent - good for secondary actions
 *   - ghost:       Text-only appearance - for low-emphasis actions
 *   - destructive: Red/danger styling - for delete, remove actions
 *
 * Usage:
 *   <Button variant="primary" onClick={handleSave}>Save</Button>
 *   <Button variant="secondary">Cancel</Button>
 *   <Button variant="ghost" size="sm">Learn more</Button>
 *   <Button variant="destructive" onClick={handleDelete}>Delete</Button>
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
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
        destructive: 'btn--ghost btn--destructive',
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

    // Inline destructive styles (color override)
    const destructiveStyle: React.CSSProperties = variant === 'destructive'
        ? { color: 'var(--color-error, #c44a4a)' }
        : {};

    return (
        <button
            className={classes}
            disabled={disabled || loading}
            style={destructiveStyle}
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
