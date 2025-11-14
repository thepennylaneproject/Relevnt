/**
 * ============================================================================
 * PAGE HEADER COMPONENT - FIXED
 * ============================================================================
 * ðŸŽ¯ PURPOSE: Consistent page headers with title + illustration
 * 
 * FIXES APPLIED:
 * - Line 51: Changed 'theme' to 'currentTheme' (or removed if not needed)
 * - Line 54: Use lowercase mode for asset lookup [mode.toLowerCase()]
 * - Simplified styling since we're using inline styles
 * ============================================================================
 */

import { CSSProperties } from 'react';
import { useTheme } from '../../contexts/useTheme';
import { assets } from '../../themes/assets';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  illustrationVersion: 'v1' | 'v2' | 'v3' | 'v4';
  illustrationPosition?: 'left' | 'right';
}

export function PageHeader({
  title,
  subtitle,
  illustrationVersion,
  illustrationPosition = 'right',
}: PageHeaderProps): JSX.Element {
  const { mode } = useTheme();

  // ✅ FIX: Removed 'theme' property - it doesn't exist on useTheme()
  // Only 'mode' and other properties are available
  // If you need theme colors, use mode to determine light/dark colors

  // ✅ FIX: Convert ThemeMode to lowercase for asset lookup
  const normalizedMode = mode.toLowerCase() as 'light' | 'dark';

  // Get illustration URL for current mode
  const illustrationAsset = assets.illustrations[normalizedMode][illustrationVersion];
  if (!illustrationAsset) {
    console.warn(`Illustration not found: ${normalizedMode}.${illustrationVersion}`);
  }

  const illustrationUrl = illustrationAsset?.svg || '';

  // Determine text colors based on mode
  const isDark = mode === 'Dark';
  const textColor = isDark ? '#F5F5F5' : '#1a1a1a';
  const secondaryTextColor = isDark ? '#D0D0D0' : '#666';

  // Styles
  const containerStyles: CSSProperties = {
    display: 'flex',
    gap: '3rem',
    alignItems: 'center',
    marginBottom: '3rem',
    flexWrap: 'wrap',
    flexDirection: illustrationPosition === 'right' ? 'row' : 'row-reverse',
  };

  const textContainerStyles: CSSProperties = {
    flex: 1,
    minWidth: '300px',
  };

  const titleStyles: CSSProperties = {
    fontSize: '2.5rem',
    fontWeight: 700,
    marginBottom: '1rem',
    color: textColor,  // ✅ Use determined color, not theme.colors.text
    lineHeight: 1.2,
  };

  const subtitleStyles: CSSProperties = {
    fontSize: '1.125rem',
    color: secondaryTextColor,  // ✅ Use determined color
    lineHeight: 1.6,
    marginTop: 0,
  };

  const illustrationContainerStyles: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: 'clamp(150px, 30%, 250px)',
    height: 'clamp(150px, 30%, 250px)',
  };

  const illustrationStyles: CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  };

  return (
    <div style={containerStyles}>
      {/* Text Content */}
      <div style={textContainerStyles}>
        <h1 style={titleStyles}>{title}</h1>
        {subtitle && <p style={subtitleStyles}>{subtitle}</p>}
      </div>

      {/* Illustration */}
      <div style={illustrationContainerStyles}>
        <img
          src={illustrationUrl}
          alt={title}
          style={illustrationStyles}
          loading="lazy"
        />
      </div>
    </div>
  );
}