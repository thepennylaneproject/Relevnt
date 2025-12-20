import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className = '',
}: BadgeProps) {
  // ✅ FIXED: Use const with proper type
  const colors: Record<string, { bg: string; text: string }> = {
    default: { bg: '#f0f0f0', text: '#333' },
    success: { bg: '#d4edda', text: '#155724' },
    warning: { bg: '#fff3cd', text: '#856404' },
    error: { bg: '#f8d7da', text: '#721c24' },
  };

  const sizes: Record<string, { padding: string; fontSize: string }> = {
    sm: { padding: '4px 8px', fontSize: '12px' },
    md: { padding: '6px 12px', fontSize: '14px' },
    lg: { padding: '8px 16px', fontSize: '16px' },
  };

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: colors[variant]?.bg || colors.default.bg,
    color: colors[variant]?.text || colors.default.text,
    padding: sizes[size]?.padding,
    fontSize: sizes[size]?.fontSize,
    borderRadius: '999px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  };

  return (
    <span style={style} className={className}>
      {icon && <span>{icon}</span>}
      {children}
    </span>
  );
}