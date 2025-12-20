import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      disabled = false,
      onClick,
      fullWidth = false,
      type = 'button',
      className = '',
    },
    ref
  ) => {
    const sizes = {
      sm: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
      md: { padding: '0.6rem 1.2rem', fontSize: '0.95rem' },
      lg: { padding: '0.75rem 1.5rem', fontSize: '1rem' },
    };

    const sizeStyle = sizes[size];

    // Variant-specific styles using CSS tokens
    const getVariantStyle = () => {
      switch (variant) {
        case 'secondary':
          return {
            background: 'transparent',
            color: 'var(--accent)',
            border: '1px solid var(--accent)',
          };
        case 'ghost':
          return {
            background: 'transparent',
            color: 'var(--text)',
            border: 'none',
          };
        case 'primary':
        default:
          return {
            background: 'var(--accent)',
            color: 'var(--bg)',
            border: 'none',
          };
      }
    };

    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={className}
        style={{
          ...sizeStyle,
          ...getVariantStyle(),
          borderRadius: '999px',
          fontWeight: 500,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.2s ease',
          width: fullWidth ? '100%' : 'auto',
          fontFamily: 'inherit',
          WebkitAppearance: 'none',
          appearance: 'none',
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            if (variant === 'ghost') {
              (e.currentTarget as HTMLElement).style.background = 'var(--surface-soft)';
            } else {
              (e.currentTarget as HTMLElement).style.opacity = '0.9';
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
            }
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            if (variant === 'ghost') {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }
            (e.currentTarget as HTMLElement).style.opacity = disabled ? '0.5' : '1';
            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          }
        }}
        onFocus={(e) => {
          if (!disabled) {
            (e.currentTarget as HTMLElement).style.outline = '2px solid var(--focus-ring)';
            (e.currentTarget as HTMLElement).style.outlineOffset = '2px';
          }
        }}
        onBlur={(e) => {
          (e.currentTarget as HTMLElement).style.outline = 'none';
        }}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
