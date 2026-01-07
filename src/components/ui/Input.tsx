/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RELEVNT INPUT COMPONENT — Ledger System
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Baseline-only input styling (no filled rectangles).
 * Hairline rule at bottom, champagne focus state.
 * 
 * Usage:
 *   <Input placeholder="Enter your name" />
 *   <Input error="This field is required" />
 *   <Input type="email" label="Email address" />
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    helperText,
    fullWidth = true,
    className = '',
    id,
    ...props
}, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const inputClasses = [
        'input',
        error ? 'input--error' : '',
        fullWidth ? 'input--full-width' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className="input-wrapper">
            {label && (
                <label htmlFor={inputId} className="label">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                id={inputId}
                className={inputClasses}
                aria-invalid={!!error}
                aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
                {...props}
            />
            {error && (
                <span id={`${inputId}-error`} className="helper-text helper-text--error">
                    {error}
                </span>
            )}
            {!error && helperText && (
                <span id={`${inputId}-helper`} className="helper-text">
                    {helperText}
                </span>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
