/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BADGE COMPONENT — Semantic Labels
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * A badge is a semantic marker, like margin notes in a journal.
 * 
 * NO decorative backgrounds. Border + text color only.
 * Sharp corners (rounded-none). Editorial spacing.
 * 
 * NO gold variant. Gold is not for badges.
 * 
 * Printable test: Would this look correct printed on paper? Yes.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { ReactNode } from 'react';

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'error';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export const Badge = ({ variant = 'neutral', children, className = '' }: BadgeProps) => {
  const variants = {
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
