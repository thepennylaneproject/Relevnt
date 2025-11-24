/**
 * ============================================================================
 * USE RELEVNT COLORS HOOK
 * ============================================================================
 *
 * Centralized color palette extending the base theme with app-specific colors.
 * This hook ensures ALL pages use the same color system.
 *
 * Usage:
 * ```tsx
 * const colors = useRelevntColors();
 * return <div style={{ background: colors.surface, color: colors.text }}>
 * ```
 *
 * 🎓 LEARNING NOTE: This pattern prevents color duplication across pages.
 * Instead of each page defining its own colors, they all share this source of truth.
 * ============================================================================
 */

import { useMemo } from 'react';
import { useRelevntTheme } from '../contexts/RelevntThemeProvider';

export interface RelevntColors {
  // Base colors from theme
  background: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textSecondary: string;
  mutedText: string;
  border: string;
  borderLight: string;
  primary: string;
  primaryHover: string;
  secondary: string;
  secondaryHover: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  overlay: string;
  focus: string;

  // Extended app-specific colors
  tier: {
    starter: { bg: string; text: string };
    pro: { bg: string; text: string };
    premium: { bg: string; text: string };
    admin: { bg: string; text: string };
  };

  status: {
    applied: { bg: string; text: string };
    inProgress: { bg: string; text: string };
    rejected: { bg: string; text: string };
    offer: { bg: string; text: string };
  };

  // Brand accent colors
  accent: string;
  accentHover: string;
}

/**
 * Main hook to get all Relevnt-specific colors
 */
export function useRelevntColors(): RelevntColors {
  const { colors, isDark } = useRelevntTheme();

  return useMemo(() => {
    // Extended tier badge colors
    const tier = {
      starter: {
        bg: isDark ? '#2a2a2a' : '#f5f5f5',
        text: isDark ? '#e0e0e0' : '#333333',
      },
      pro: {
        bg: isDark ? '#0d3a3a' : '#e0f2f1',
        text: isDark ? '#4db8c4' : '#009b9b',
      },
      premium: {
        bg: isDark ? '#3d3d1a' : '#fef9e7',
        text: isDark ? '#e6d580' : '#b8860b',
      },
      admin: {
        bg: isDark ? '#3d1a3d' : '#f3e5f5',
        text: isDark ? '#d580e6' : '#7b1fa2',
      },
    };

    // Application status colors
    const status = {
      applied: {
        bg: isDark ? '#1e3a5f' : '#dbeafe',
        text: isDark ? '#60a5fa' : '#1e40af',
      },
      inProgress: {
        bg: isDark ? '#3d3d1a' : '#fef9e7',
        text: isDark ? '#facc15' : '#a16207',
      },
      rejected: {
        bg: isDark ? '#3d1a1a' : '#fee2e2',
        text: isDark ? '#f87171' : '#b91c1c',
      },
      offer: {
        bg: isDark ? '#1a3d2e' : '#d1fae5',
        text: isDark ? '#34d399' : '#047857',
      },
    };

    return {
      // Spread base theme colors
      ...colors,

      // Add extended colors
      tier,
      status,

      // Brand accent
      accent: '#D4A574',
      accentHover: '#B89558',
    };
  }, [colors, isDark]);
}

/**
 * Utility function to get tier colors
 */
export function useTierColors(tier: string): { bg: string; text: string } {
  const colors = useRelevntColors();

  switch (tier.toLowerCase()) {
    case 'pro':
      return colors.tier.pro;
    case 'premium':
      return colors.tier.premium;
    case 'admin':
      return colors.tier.admin;
    default:
      return colors.tier.starter;
  }
}

/**
 * Utility function to get application status colors
 */
export function useStatusColors(
  status: 'applied' | 'in-progress' | 'rejected' | 'offer' | 'accepted' | 'withdrawn'
): { bg: string; text: string } {
  const colors = useRelevntColors();

  switch (status) {
    case 'applied':
      return colors.status.applied;
    case 'in-progress':
      return colors.status.inProgress;
    case 'rejected':
      return colors.status.rejected;
    case 'offer':
    case 'accepted':
      return colors.status.offer; // Use offer colors for accepted too
    case 'withdrawn':
      return colors.status.rejected; // Use rejected colors for withdrawn
    default:
      return colors.status.applied;
  }
}
