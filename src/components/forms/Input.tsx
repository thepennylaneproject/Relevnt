/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INPUT COMPONENT — Functional, Not Friendly
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Forms are data entry, not experiences.
 * 
 * Sharp corners (rounded-none).
 * Labels are uppercase with editorial tracking.
 * Compact padding (not generous).
 * Focus changes border to text color (subtle), not gold.
 * No ring glow (no "friendly" focus state).
 * 
 * Printable test: Would this form feel correct on paper? Yes.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = ({ 
  label, 
  error, 
  helperText, 
  className = '', 
  ...props 
}: InputProps) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-text uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-2
          bg-surface border border-border
          rounded-none
          text-base
          focus:border-text focus:outline-none transition-colors
          placeholder:text-text-muted placeholder:italic
          ${error ? 'border-error' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-sm text-error">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-text-muted italic">{helperText}</p>
      )}
    </div>
  );
};
