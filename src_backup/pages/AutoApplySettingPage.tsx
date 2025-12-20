/**
 * ============================================================================
 * AUTO APPLY SETTINGS PAGE (REFACTORED - PHASE 6.2)
 * ============================================================================
 * 🎯 PURPOSE: Configure automated job application settings
 *
 * Features:
 * - Enable/disable auto-apply
 * - Set match score threshold
 * - Configure weekly application limits
 * - Set salary minimums
 * - Safety guardrails (canonical sites only, values alignment)
 *
 * Tier Gating:
 * - Pro+ feature (uses FeatureGate component)
 *
 * Backend Integration:
 * - useAutoApplySettings hook for settings management
 *
 * Theme Integration:
 * - useRelevntColors for centralized color system
 * - PageBackground wrapper
 * ============================================================================
 */

import { CSSProperties } from 'react';
import { PageBackground } from '../components/shared/PageBackground';
import { PageHeader } from '../components/shared/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import {
  FeatureGate,
  type TierLevel,
} from '../components/features/FeatureGate';
import { useAutoApplySettings } from '../hooks/useAutoApplySettings';
import { useRelevntColors } from '../hooks';

export default function AutoApplySettingsPage(): JSX.Element {
  const { user } = useAuth();
  const colors = useRelevntColors();
  const { settings, loading, error, saveSettings } = useAutoApplySettings();

  const userTier = ((user?.user_metadata?.tier as string) || 'starter') as TierLevel;

  // ============================================================
  // STYLES
  // ============================================================

  const containerStyles: CSSProperties = {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '60px 20px',
    color: colors.text,
  };

  const cardStyles: CSSProperties = {
    padding: '2rem',
    background: colors.surface,
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
    marginBottom: '1.5rem',
  };

  const labelStyles: CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: colors.text,
    marginBottom: '0.5rem',
  };

  const inputStyles: CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '14px',
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    background: colors.background,
    color: colors.text,
  };

  const helpTextStyles: CSSProperties = {
    fontSize: '12px',
    color: colors.textSecondary,
    marginTop: '0.5rem',
  };

  const sectionTitleStyles: CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: colors.text,
    marginBottom: '1rem',
  };

  const gridStyles: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (!user) {
    return (
      <PageBackground>
        <div style={containerStyles}>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: colors.textSecondary }}>
              You need to be signed in to manage Auto Apply settings.
            </p>
          </div>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground>
      <div style={containerStyles}>
        {/* PAGE HEADER */}
        <PageHeader
          title="Auto Apply Assistant"
          subtitle="Let Relevnt apply on your behalf for high-confidence matches, using your authentic voice and rules that you control."
          
          textPosition="left"
        />

        <div style={{ marginBottom: '1.5rem', fontSize: '14px', color: colors.textSecondary }}>
          Current plan tier: <strong>{userTier.charAt(0).toUpperCase() + userTier.slice(1)}</strong>
        </div>

        {/* GATED CONTENT - Pro+ Only */}
        <FeatureGate
          feature="batch-applications"
          requiredTier="pro"
          userTier={userTier}
          onUpgradeClick={() => {
            console.log('Upgrade flow not implemented yet');
          }}
        >
          {/* Loading/Error States */}
          {loading && (
            <div style={{ padding: '1rem', marginBottom: '1rem', background: colors.surface, borderRadius: '8px' }}>
              <p style={{ fontSize: '14px', color: colors.textSecondary }}>
                Loading your Auto Apply settings…
              </p>
            </div>
          )}

          {error && (
            <div style={{ padding: '1rem', marginBottom: '1rem', background: colors.error + '20', borderRadius: '8px' }}>
              <p style={{ fontSize: '14px', color: colors.error }}>{error}</p>
            </div>
          )}

          {/* ENABLE/DISABLE */}
          <div style={cardStyles}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <h2 style={sectionTitleStyles}>Enable Auto Apply</h2>
                <p style={helpTextStyles}>
                  When enabled, Relevnt can submit applications on your behalf for roles that meet your rules and pass a match threshold.
                </p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings?.enabled || false}
                  onChange={(e) => saveSettings({ enabled: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', fontWeight: 600, color: colors.text }}>
                  {settings?.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>
          </div>

          {/* CORE SETTINGS */}
          <div style={cardStyles}>
            <h2 style={{ ...sectionTitleStyles, marginBottom: '1.5rem' }}>Core Settings</h2>

            <div style={gridStyles}>
              {/* Mode */}
              <div>
                <label style={labelStyles}>Mode</label>
                <select
                  value={settings?.mode || 'review'}
                  onChange={(e) => saveSettings({ mode: e.target.value as 'review' | 'full' })}
                  style={inputStyles}
                >
                  <option value="review">Review mode: you approve before submit</option>
                  <option value="full">Full Auto: Relevnt submits within your rules</option>
                </select>
                <p style={helpTextStyles}>
                  Start in review mode until you trust the agent, then switch to full auto when ready.
                </p>
              </div>

              {/* Max per week */}
              <div>
                <label style={labelStyles}>Maximum applications per week</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={settings?.max_per_week ?? 5}
                  onChange={(e) => saveSettings({ max_per_week: Number(e.target.value) })}
                  style={inputStyles}
                />
                <p style={helpTextStyles}>
                  Hard cap to prevent spam and keep your search intentional.
                </p>
              </div>

              {/* Min match score */}
              <div>
                <label style={labelStyles}>Minimum match score</label>
                <input
                  type="number"
                  min={50}
                  max={100}
                  step={1}
                  value={settings?.min_match_score ?? 75}
                  onChange={(e) => saveSettings({ min_match_score: Number(e.target.value) })}
                  style={inputStyles}
                />
                <p style={helpTextStyles}>
                  Relevnt will only auto apply when your match score meets or exceeds this level.
                </p>
              </div>

              {/* Min salary */}
              <div>
                <label style={labelStyles}>Minimum salary (optional, yearly)</label>
                <input
                  type="number"
                  min={0}
                  value={settings?.min_salary ?? ''}
                  onChange={(e) =>
                    saveSettings({
                      min_salary: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  style={inputStyles}
                  placeholder="e.g., 100000"
                />
                <p style={helpTextStyles}>
                  If set, Relevnt will skip roles that clearly advertise compensation below this.
                </p>
              </div>
            </div>
          </div>

          {/* SAFETY & ALIGNMENT */}
          <div style={cardStyles}>
            <h2 style={sectionTitleStyles}>Safety and Alignment</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings?.apply_only_canonical ?? true}
                  onChange={(e) => saveSettings({ apply_only_canonical: e.target.checked })}
                  style={{ marginTop: '2px', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <div>
                  <span style={{ fontSize: '14px', color: colors.text }}>
                    Only apply on the company or canonical ATS site when available
                  </span>
                  <p style={helpTextStyles}>
                    Relevnt prefers employer sites over job boards to maximize signal to real recruiters.
                  </p>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings?.require_values_alignment ?? true}
                  onChange={(e) => saveSettings({ require_values_alignment: e.target.checked })}
                  style={{ marginTop: '2px', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <div>
                  <span style={{ fontSize: '14px', color: colors.text }}>
                    Require values alignment for auto apply
                  </span>
                  <p style={helpTextStyles}>
                    Relevnt will ignore roles at companies or in industries that do not match your values profile.
                  </p>
                </div>
              </label>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem', background: colors.background, borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', color: colors.textSecondary }}>
                💡 You can pause Auto Apply at any time. Your agent will always follow these rules when searching and applying on your behalf.
              </p>
            </div>
          </div>
        </FeatureGate>
      </div>
    </PageBackground>
  );
}
