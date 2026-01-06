/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TEXTAREA COMPONENT — Functional, Not Friendly
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = ({ 
  label, 
  error, 
  helperText,
  className = '', 
  ...props 
}: TextareaProps) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-text uppercase tracking-wider">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full px-4 py-2
          bg-surface border border-border
          rounded-none
          text-base
          leading-relaxed
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
