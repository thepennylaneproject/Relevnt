/**
 * CARD COMPONENT
 * 
 * A wrapper component for card-based layouts with padding, shadow, and borders.
 */

import React from 'react';
import { useIsDarkMode } from '../../themes';

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
  const isDark = useIsDarkMode();

  const paddingSizes = {
    sm: '12px',
    md: '20px',
    lg: '28px',
  };

  const bgColor = isDark ? '#2D2D2D' : '#FFFFFF';
  const borderColor = isDark ? '#404040' : '#E7DCC8';
  const hoverBg = isDark ? '#383838' : '#F9F8F6';

  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '12px',
        padding: paddingSizes[padding],
        cursor: hoverable ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}
      onMouseEnter={(e) => {
        if (hoverable) {
          (e.currentTarget as HTMLElement).style.background = hoverBg;
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
          (e.currentTarget as HTMLElement).style.boxShadow =
            '0 4px 12px rgba(0, 0, 0, 0.12)';
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable) {
          (e.currentTarget as HTMLElement).style.background = bgColor;
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLElement).style.boxShadow =
            '0 2px 8px rgba(0, 0, 0, 0.08)';
        }
      }}
    >
      {children}
    </div>
  );
};

Card.displayName = 'Card';

export default Card;