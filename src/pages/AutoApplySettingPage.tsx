import React, { CSSProperties } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Container } from '../components/shared/Container'
import { FeatureGate, type TierLevel } from '../components/features/FeatureGate'
import { useAutoApplySettings } from '../hooks/useAutoApplySettings'
import { useRelevntColors } from '../hooks'
import { AutoApplyIcon, PreferencesIcon } from '../components/icons/RelevntIcons'

export default function AutoApplySettingsPage(): JSX.Element {
  const { user } = useAuth()
  const colors = useRelevntColors()
  const { settings, loading, error, saveSettings } = useAutoApplySettings()

  const userTier: TierLevel =
    user?.user_metadata?.tier && ['starter', 'pro', 'premium'].includes(user.user_metadata.tier)
      ? (user.user_metadata.tier as TierLevel)
      : 'starter'

  const wrapper: CSSProperties = {
    flex: 1,
    backgroundColor: colors.background,
  }

  const pageHeader: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 24,
    flexWrap: 'wrap',
  }

  const titleRow: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  }

  const title: CSSProperties = {
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: '0.02em',
    color: colors.text,
  }

  const subtitle: CSSProperties = {
    fontSize: 13,
    color: colors.textSecondary,
    maxWidth: 560,
    lineHeight: 1.5,
  }

  const badge: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 10px',
    borderRadius: 999,
    border: `1px solid ${colors.borderLight}`,
    backgroundColor: colors.surfaceHover,
    fontSize: 11,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: colors.textSecondary,
  }

  const card: CSSProperties = {
    padding: '16px 16px 14px',
    borderRadius: 16,
    backgroundColor: colors.surface,
    border: `1px solid ${colors.borderLight}`,
    display: 'grid',
    gap: 12,
  }

  const label: CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: colors.text,
    marginBottom: 4,
  }

  const input: CSSProperties = {
    width: '100%',
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.background,
    color: colors.text,
    padding: '10px 12px',
    fontSize: 13,
  }

  const hint: CSSProperties = {
    fontSize: 12,
    color: colors.textSecondary,
  }

  const grid: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 12,
  }

  if (!user) {
    return (
      <div style={wrapper}>
        <Container maxWidth="lg" padding="md">
          <div style={{ fontSize: 14, color: colors.textSecondary, padding: '20px 0' }}>
            Please log in to manage auto-apply preferences.
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div style={wrapper}>
      <Container maxWidth="lg" padding="md">
        <header style={pageHeader}>
          <div style={titleRow}>
            <h1 style={title}>Auto-apply preferences</h1>
            <p style={subtitle}>
              Set guardrails for when Relevnt can apply on your behalf. Keep control, require high
              match scores, and make sure voice and values stay intact.
            </p>
          </div>
          <div style={badge}>
            <PreferencesIcon size={16} strokeWidth={1.6} />
            <span>Guardrails</span>
          </div>
        </header>

        <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>
          Current tier: <strong style={{ color: colors.text }}>{userTier}</strong>
        </div>

        <FeatureGate
          feature="batch-applications"
          requiredTier="pro"
          userTier={userTier}
          onUpgradeClick={() => {}}
        >
          {loading && (
            <div style={card}>
              <span style={{ fontSize: 13, color: colors.textSecondary }}>Loading your settings…</span>
            </div>
          )}

          {error && (
            <div style={card}>
              <span style={{ fontSize: 13, color: colors.error }}>{error}</span>
            </div>
          )}

          <section style={{ display: 'grid', gap: 12 }}>
            <article style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AutoApplyIcon size={18} strokeWidth={1.7} />
                  <span style={{ fontWeight: 600, color: colors.text }}>Enable auto-apply</span>
                </div>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings?.enabled ?? false}
                    onChange={(e) => saveSettings({ enabled: e.target.checked })}
                    style={{ width: 18, height: 18 }}
                  />
                  <span style={{ fontSize: 13, color: colors.text }}>
                    {settings?.enabled ? 'On' : 'Off'}
                  </span>
                </label>
              </div>
              <p style={hint}>
                Relevnt submits only when rules and thresholds are met. You can pause anytime.
              </p>
            </article>

            <article style={card}>
              <div style={{ fontWeight: 600, color: colors.text }}>Core rules</div>
              <div style={grid}>
                <div>
                  <div style={label}>Mode</div>
                  <select
                    value={settings?.mode || 'review'}
                    onChange={(e) => saveSettings({ mode: e.target.value as 'review' | 'full' })}
                    style={input}
                  >
                    <option value="review">Review first</option>
                    <option value="full">Full auto</option>
                  </select>
                  <p style={hint}>Start in review to build trust, then switch to full auto.</p>
                </div>
                <div>
                  <div style={label}>Max applications per week</div>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={settings?.max_per_week ?? 5}
                    onChange={(e) => saveSettings({ max_per_week: Number(e.target.value) })}
                    style={input}
                  />
                  <p style={hint}>Prevent spam and keep your search intentional.</p>
                </div>
                <div>
                  <div style={label}>Minimum match score</div>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={settings?.min_match_score ?? 75}
                    onChange={(e) => saveSettings({ min_match_score: Number(e.target.value) })}
                    style={input}
                  />
                  <p style={hint}>Only apply when your fit clears this bar.</p>
                </div>
                <div>
                  <div style={label}>Minimum salary (optional)</div>
                  <input
                    type="number"
                    min={0}
                    value={settings?.min_salary ?? ''}
                    onChange={(e) =>
                      saveSettings({
                        min_salary: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    style={input}
                    placeholder="e.g., 100000"
                  />
                  <p style={hint}>Skip obvious lowball roles; leave blank to ignore salary.</p>
                </div>
              </div>
            </article>

            <article style={card}>
              <div style={{ fontWeight: 600, color: colors.text }}>Safety & alignment</div>
              <div style={{ display: 'grid', gap: 10 }}>
                <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings?.apply_only_canonical ?? true}
                    onChange={(e) => saveSettings({ apply_only_canonical: e.target.checked })}
                    style={{ marginTop: 4, width: 16, height: 16 }}
                  />
                  <div style={{ display: 'grid', gap: 4 }}>
                    <span style={{ fontSize: 13, color: colors.text }}>Prefer official ATS/company sites</span>
                    <span style={hint}>Improves signal to real recruiters and reduces duplicates.</span>
                  </div>
                </label>

                <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings?.require_values_alignment ?? true}
                    onChange={(e) => saveSettings({ require_values_alignment: e.target.checked })}
                    style={{ marginTop: 4, width: 16, height: 16 }}
                  />
                  <div style={{ display: 'grid', gap: 4 }}>
                    <span style={{ fontSize: 13, color: colors.text }}>Require values alignment</span>
                    <span style={hint}>Skip companies or industries that do not match your values.</span>
                  </div>
                </label>
              </div>
              <div
                style={{
                  marginTop: 8,
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: `1px dashed ${colors.borderLight}`,
                  backgroundColor: colors.background,
                  fontSize: 12,
                  color: colors.textSecondary,
                }}
              >
                You are always in control. Pause or adjust rules at any time.
              </div>
            </article>
          </section>
        </FeatureGate>
      </Container>
    </div>
  )
}
