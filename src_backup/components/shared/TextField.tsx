import React, { InputHTMLAttributes } from 'react';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  helperText?: string;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, size = 'md', fullWidth = false, helperText, className = '', ...props }, ref) => {
    const sizes = {
      sm: { padding: '0.45rem 0.8rem', fontSize: '0.875rem' },
      md: { padding: '0.55rem 0.9rem', fontSize: '0.95rem' },
      lg: { padding: '0.65rem 1rem', fontSize: '1rem' },
    };

    return (
      <div style={{ width: fullWidth ? '100%' : 'auto' }}>
        {label && (
          <label
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 500,
              fontSize: '0.9rem',
              color: 'var(--text)',
            }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          style={{
            ...sizes[size],
            width: fullWidth ? '100%' : 'auto',
            boxSizing: 'border-box',
            border: error ? '1px solid var(--danger)' : '1px solid var(--border-subtle)',
            borderRadius: '999px',
            fontFamily: 'inherit',
            background: 'var(--surface)',
            color: 'var(--text)',
            transition: 'all 0.2s ease',
          }}
          className={className}
          onFocus={(e) => {
            (e.currentTarget as HTMLElement).style.outline = '2px solid var(--focus-ring)';
            (e.currentTarget as HTMLElement).style.outlineOffset = '1px';
            (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLElement).style.outline = 'none';
            (e.currentTarget as HTMLElement).style.borderColor = error
              ? 'var(--danger)'
              : 'var(--border-subtle)';
          }}
          {...props}
        />
        {error && (
          <span
            style={{
              color: 'var(--danger)',
              fontSize: '0.875rem',
              display: 'block',
              marginTop: '0.25rem',
            }}
          >
            {error}
          </span>
        )}
        {helperText && !error && (
          <span
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
              display: 'block',
              marginTop: '0.25rem',
            }}
          >
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

TextField.displayName = 'TextField';

export default TextField;
