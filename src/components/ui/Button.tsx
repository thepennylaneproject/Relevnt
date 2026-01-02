/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RELEVNT BUTTON COMPONENT (CANONICAL)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The single source of truth for buttons in Relevnt.
 * Uses design tokens for consistent styling.
 *
 * DESIGN CONSTITUTION RULE 1 - Primary Action Monogamy:
 * Each page/modal may have exactly ONE primary action. When variant="primary",
 * this button automatically registers with the PrimaryActionRegistry in DEV mode.
 *
 * Variants:
 *   - primary:     Gold/accent background - the dominant CTA (use sparingly!)
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
import { useRegisterPrimaryAction } from './PrimaryActionRegistry';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    fullWidth?: boolean;
    children: React.ReactNode;
    /**
     * Label for PrimaryActionRegistry tracking (DEV only).
     * If not provided, derived from aria-label or children text.
     */
    primaryLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    children,
    className = '',
    disabled,
    primaryLabel,
    ...props
}) => {
    // Derive label for primary action registry
    const derivedLabel = primaryLabel
        || props['aria-label']
        || (typeof children === 'string' ? children : undefined)
        || 'primary-button';

    // Register with PrimaryActionRegistry when variant is "primary"
    // This hook is a no-op in production and when not inside a Provider
    useRegisterPrimaryAction(variant === 'primary' ? derivedLabel : undefined);

    const variantClasses: Record<ButtonVariant, string> = {
        primary: 'btn--primary',
        secondary: 'btn--secondary',
        ghost: 'btn--ghost',
        destructive: 'btn--ghost btn--destructive', // Uses ghost base + destructive modifier
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
        ? { color: 'var(--color-error)' }
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
