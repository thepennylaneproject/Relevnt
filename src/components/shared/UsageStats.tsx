/**
 * ============================================================================
 * USAGE STATS COMPONENT
 * ============================================================================
 * 🎯 PURPOSE: Display user's tier + current usage limits in top-right badge
 * 
 * Shows:
 * - Current tier (Starter/Pro/Premium)
 * - Analyses used / available this month
 * - Upgrade CTA if applicable
 * 
 * 🎓 LEARNING NOTE: This component demonstrates tier-aware styling.
 * It changes appearance based on user.tier, creating visual hierarchy
 * that reinforces upgrade value.
 * ============================================================================
 */

import { CSSProperties, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/useTheme';
import { TIERS } from '../../config/tiers';
import { copy } from '../../config/i18n.config';

interface UsageStatsProps {
  /**
   * Show in compact mode (just badge) or expanded (with details)
   */
  variant?: 'compact' | 'expanded';
  /**
   * Custom styling (e.g., position: absolute, top: 20px, right: 20px)
   */
  customStyles?: CSSProperties;
}

/**
 * UsageStats Component
 * 
 * Usage:
 * ```tsx
 * <UsageStats variant="expanded" />
 * 
 * // Or in top-right:
 * <UsageStats 
 *   variant="compact"
 *   customStyles={{ position: 'absolute', top: '20px', right: '20px' }}
 * />
 * ```
 */
export function UsageStats({
  variant = 'expanded',
  customStyles,
}: UsageStatsProps): JSX.Element | null {
  const { user } = useAuth();
  useTheme();

  // Color palette
  const colors = useMemo(() => ({
    starter: { bg: 'var(--color-bg-alt)', text: 'var(--color-ink)', accent: 'var(--color-ink-tertiary)' },
    pro: { bg: 'var(--color-info-bg)', text: 'var(--color-info)', accent: 'var(--color-info)' },
    premium: { bg: 'var(--color-accent-glow)', text: 'var(--color-accent)', accent: 'var(--color-accent)' },
  }), []);

  if (!user || !user.tier) return null;

  const tierConfig = TIERS[user.tier as 'starter' | 'pro' | 'premium'];
  const tierColors = colors[user.tier as keyof typeof colors] || colors.starter;
  
  // Mock usage data - in real app, fetch from backend
  const analysesUsed = user.tier === 'starter' ? 3 : user.tier === 'pro' ? 35 : 0;
  const analysesLimit = tierConfig.limits.analysesPerMonth;
  const usagePercent = Math.min((analysesUsed / analysesLimit) * 100, 100);
  const tierLabel = tierConfig.name
    ? tierConfig.name.charAt(0).toUpperCase() + tierConfig.name.slice(1).toLowerCase()
    : tierConfig.name;

  // ============================================================
  // STYLES
  // ============================================================

  const containerStyles: CSSProperties = {
    ...customStyles,
    padding: variant === 'compact' ? '8px 12px' : '16px',
    backgroundColor: tierColors.bg,
    borderRadius: '8px',
    border: `1px solid ${tierColors.accent}`,
    fontSize: variant === 'compact' ? '12px' : '14px',
    color: tierColors.text,
  };

  const tierNameStyles: CSSProperties = {
    fontWeight: 700,
    marginBottom: variant === 'compact' ? 0 : '8px',
    color: tierColors.accent,
  };

  const usageBarContainerStyles: CSSProperties = {
    display: variant === 'compact' ? 'none' : 'block',
    marginBottom: '8px',
  };

  const usageBarStyles: CSSProperties = {
    width: '100%',
    height: '4px',
    backgroundColor: 'var(--color-graphite-faint)',
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '4px',
  };

  const usageBarFillStyles: CSSProperties = {
    height: '100%',
    width: `${usagePercent}%`,
    backgroundColor: tierColors.accent,
    transition: 'width 0.3s ease',
  };

  const usageTextStyles: CSSProperties = {
    fontSize: '12px',
    color: 'var(--color-ink-tertiary)',
    display: variant === 'compact' ? 'none' : 'block',
  };

  const compactTextStyles: CSSProperties = {
    display: variant === 'compact' ? 'inline' : 'none',
    marginLeft: '4px',
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div style={containerStyles}>
      <div style={tierNameStyles}>
        {tierLabel}
        <span style={compactTextStyles}>
          • {analysesUsed}/{analysesLimit}
        </span>
      </div>

      {/* Expanded view */}
      {variant === 'expanded' && (
        <>
          <div style={usageBarContainerStyles}>
            <div style={usageBarStyles}>
              <div style={usageBarFillStyles} />
            </div>
            <div style={usageTextStyles}>
              {analysesUsed} of {analysesLimit} analyses used this month
            </div>
          </div>

          {/* Show upgrade CTA if on starter/pro */}
          {(user.tier === 'starter' || user.tier === 'pro') && (
            <div style={{ marginTop: '8px', fontSize: '12px' }}>
              <button
                style={{
                  backgroundColor: tierColors.accent,
                  color: 'var(--color-ink-inverse)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                onClick={() => {
                  // Navigate to pricing in Phase 6.2
                  window.location.href = '/pricing';
                }}
              >
                {user.tier === 'starter' ? copy.tier.upgradeToPro : copy.tier.unlockUnlimited}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default UsageStats;
