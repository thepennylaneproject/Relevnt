import React from 'react';
import { useTheme } from '../../contexts/useTheme';

export type PageBackgroundProps = {
  children: React.ReactNode;
  parallax?: boolean;
  className?: string;
  /**
   * Background design version: v1 (lighter) or v2 (richer accent).
   * Keeps your existing page calls like version="v1" / "v2" type-safe.
   */
  version?: 'v1' | 'v2';
  /**
   * Optional override for overlay/texture opacity.
   * If not provided, it is derived from theme + version.
   */
  overlayOpacity?: number;
};

export function PageBackground({
  children,
  parallax = false,
  className = '',
  version = 'v2',
  overlayOpacity,
}: PageBackgroundProps): JSX.Element {
  const { mode } = useTheme();
  const normalizedMode = (mode ?? 'Light').toLowerCase() as 'light' | 'dark';

  const backgroundColor =
    normalizedMode === 'dark' ? '#020617' : '#f3f4f6';

  // Base texture opacity from theme + version
  const baseOpacity =
    normalizedMode === 'dark'
      ? version === 'v1'
        ? 0.12
        : 0.18
      : version === 'v1'
        ? 0.06
        : 0.08;

  const finalOverlayOpacity =
    typeof overlayOpacity === 'number' ? overlayOpacity : baseOpacity;

  return (
    <div
      className={className}
      style={{
        minHeight: '100vh',
        backgroundColor,
        backgroundImage:
          'radial-gradient(circle at 0 0, rgba(148, 163, 184, 0.25), transparent 55%), radial-gradient(circle at 100% 100%, rgba(30, 64, 175, 0.25), transparent 55%)',
        backgroundAttachment: parallax ? 'fixed' : 'scroll',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
      }}
    >
      {/* subtle overlay / texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: finalOverlayOpacity,
          pointerEvents: 'none',
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default PageBackground;