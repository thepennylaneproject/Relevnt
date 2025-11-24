/**
 * CARD COMPONENT
 *
 * A wrapper component for card-based layouts with padding, shadow, and borders.
 * Uses CSS tokens for consistent theming.
 */

import React from 'react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CardProps {
  /** Card content */
  children: React.ReactNode;

  /** Enable hover effect */
  hoverable?: boolean;

  /** Click handler */
  onClick?: () => void;

  /** Padding size */
  padding?: 'sm' | 'md' | 'lg';

  /** CSS class */
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  onClick,
  padding = 'md',
  className = '',
}) => {
  const paddingSizes = {
    sm: '12px',
    md: '20px',
    lg: '28px',
  };

  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: paddingSizes[padding],
        cursor: hoverable ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        boxShadow: '0 8px 18px rgba(15, 18, 20, 0.08)',
      }}
      onMouseEnter={(e) => {
        if (hoverable) {
          (e.currentTarget as HTMLElement).style.background = 'var(--surface-soft)';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
          (e.currentTarget as HTMLElement).style.boxShadow =
            '0 12px 24px rgba(15, 18, 20, 0.12)';
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable) {
          (e.currentTarget as HTMLElement).style.background = 'var(--surface)';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLElement).style.boxShadow =
            '0 8px 18px rgba(15, 18, 20, 0.08)';
        }
      }}
    >
      {children}
    </div>
  );
};

Card.displayName = 'Card';

export default Card;
