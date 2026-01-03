/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SELECT COMPONENT — Functional, Not Friendly
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

export const Select = ({ 
  label, 
  error, 
  children,
  className = '', 
  ...props 
}: SelectProps) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-text uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        className={`
          w-full px-4 py-2
          bg-surface border border-border
          rounded-none
          text-base
          focus:border-text focus:outline-none transition-colors
          ${error ? 'border-error' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
};
