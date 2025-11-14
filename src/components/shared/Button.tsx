import React from 'react';
import { useIsDarkMode } from '../../themes';


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
    const isDark = useIsDarkMode();

    const variantColors = {
      primary: {
        light: { bg: '#CDAA70', text: '#0B0B0B', hover: '#B89456' },
        dark: { bg: '#CDAA70', text: '#0B0B0B', hover: '#E0C495' },
      },
      secondary: {
        light: { bg: 'transparent', text: '#CDAA70', border: '1px solid #CDAA70', hover: '#F3F1ED' },
        dark: { bg: 'transparent', text: '#CDAA70', border: '1px solid #CDAA70', hover: 'rgba(205,170,112,0.1)' },
      },
      ghost: {
        light: { bg: 'transparent', text: '#0B0B0B', hover: 'rgba(0,0,0,0.05)' },
        dark: { bg: 'transparent', text: '#F3F1ED', hover: 'rgba(255,255,255,0.1)' },
      },
    };

    const sizes = {
      sm: { padding: '6px 12px', fontSize: '12px', height: '32px' },
      md: { padding: '10px 20px', fontSize: '14px', height: '40px' },
      lg: { padding: '12px 28px', fontSize: '16px', height: '48px' },
    };

    const colors = variantColors[variant][isDark ? 'dark' : 'light'];
    const sizeStyle = sizes[size];

    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={className}
        style={{
          ...sizeStyle,
          background: colors.bg,
          color: colors.text,
          border: 'none',
          borderRadius: '8px',
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.2s ease',
          width: fullWidth ? '100%' : 'auto',
          fontFamily: 'inherit',
          WebkitAppearance: 'none',
          appearance: 'none',
        }}
        onMouseEnter={(e) => {
          if (!disabled) (e.currentTarget as HTMLElement).style.background = colors.hover;
        }}
        onMouseLeave={(e) => {
          if (!disabled) (e.currentTarget as HTMLElement).style.background = colors.bg;
        }}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';