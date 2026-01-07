/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RELEVNT BADGE COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Badge component for status indicators and labels.
 * 
 * Usage:
 *   <Badge>Default</Badge>
 *   <Badge variant="success">Active</Badge>
 *   <Badge variant="warning">Pending</Badge>
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
    variant?: BadgeVariant;
    children: React.ReactNode;
    className?: string;
};

export const Badge = ({ variant = 'neutral', children, className = '' }: BadgeProps) => {
  const variants = {
    primary: 'border-accent text-accent',
    neutral: 'border-border text-text-muted',
    success: 'border-success text-success',
    warning: 'border-warning text-warning',
    error: 'border-error text-error',
  };
  
  return (
    <span className={`
      inline-block
      px-2 py-0.5
      border ${variants[variant]}
      rounded-none
      text-xs font-medium
      tracking-wide
      uppercase
      ${className}
    `}>
      {children}
    </span>
  );
};
