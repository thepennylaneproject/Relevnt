/**
 * ============================================================================
 * PAGE HEADER COMPONENT - HERO SECTION
 * ============================================================================
 * 🎯 PURPOSE: Hero section with large background image and overlaid text
 *
 * Uses Hero asset (16:9, ~1200x675px) as background with title/subtitle overlay
 * ============================================================================
 */

import { CSSProperties } from 'react';
import { useRelevntColors } from '../../hooks/useRelevntColors';
import { useRelevntTheme } from '../../contexts/RelevntThemeProvider';
import { getAsset } from '../../themes/assets';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Position of the text within the hero section */
  textPosition?: 'left' | 'center' | 'right';
  /** Height of the hero section */
  minHeight?: string;
}

export function PageHeader({
  title,
  subtitle,
  textPosition = 'left',
  minHeight = '400px',
}: PageHeaderProps): JSX.Element {
  const colors = useRelevntColors();
  const { isDark } = useRelevntTheme();
  const overlayBase = isDark ? 'var(--color-ink)' : 'var(--color-ivory)';

  // Get Hero image for current mode
  const mode = isDark ? 'dark' : 'light';
  const heroUrl = getAsset('Hero', mode);

  // Determine text alignment based on position
  const getJustifyContent = () => {
    switch (textPosition) {
      case 'center':
        return 'center';
      case 'right':
        return 'flex-end';
      default:
        return 'flex-start';
    }
  };

  // Styles - Hero section with background image
  const heroContainerStyles: CSSProperties = {
    position: 'relative',
    minHeight: minHeight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: getJustifyContent(),
    marginBottom: '3rem',
    padding: '4rem 2rem',
    borderRadius: '16px',
    overflow: 'hidden',
    backgroundImage: heroUrl ? `url(${heroUrl})` : undefined,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
  };

  // Overlay for better text readability
  const overlayStyles: CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: `linear-gradient(135deg, color-mix(in srgb, ${overlayBase} 85%, transparent) 0%, color-mix(in srgb, ${overlayBase} 40%, transparent) 100%)`,
    pointerEvents: 'none',
  };

  const textContainerStyles: CSSProperties = {
    position: 'relative',
    zIndex: 1,
    maxWidth: '700px',
    padding: '2rem',
    textAlign: textPosition === 'center' ? 'center' : 'left',
  };

  const titleStyles: CSSProperties = {
    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
    fontWeight: 700,
    marginBottom: '1rem',
    color: colors.text,
    lineHeight: 1.2,
    textShadow: isDark
      ? '0 2px 12px rgba(0, 0, 0, 0.7)'
      : '0 2px 12px rgba(255, 255, 255, 0.7)',
  };

  const subtitleStyles: CSSProperties = {
    fontSize: 'clamp(1rem, 3vw, 1.5rem)',
    color: colors.textSecondary,
    lineHeight: 1.6,
    marginTop: 0,
    textShadow: isDark
      ? '0 1px 8px rgba(0, 0, 0, 0.7)'
      : '0 1px 8px rgba(255, 255, 255, 0.7)',
  };

  return (
    <div style={heroContainerStyles}>
      {/* Overlay for text readability */}
      <div style={overlayStyles} />

      {/* Text Content */}
      <div style={textContainerStyles}>
        <h1 style={titleStyles}>{title}</h1>
        {subtitle && <p style={subtitleStyles}>{subtitle}</p>}
      </div>
    </div>
  );
}
