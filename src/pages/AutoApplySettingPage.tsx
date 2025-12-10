import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Container } from '../components/shared/Container'
import { FeatureGate, type TierLevel } from '../components/features/FeatureGate'
import { useAutoApplySettings } from '../hooks/useAutoApplySettings'
import { Icon } from '../components/ui/Icon'

export default function AutoApplySettingsPage(): JSX.Element {
  const { user } = useAuth()
  const { settings, loading, error, saveSettings } = useAutoApplySettings()

  const userTier: TierLevel =
    user?.user_metadata?.tier && ['starter', 'pro', 'premium'].includes(user.user_metadata.tier)
      ? (user.user_metadata.tier as TierLevel)
      : 'starter'

  if (!user) {
    return (
      <div className="page-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container maxWidth="lg" padding="md">
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', padding: '20px 0', textAlign: 'center' }}>
            Please log in to manage auto-apply preferences.
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div className="page-wrapper" style={{ flex: 1, display: 'flex' }}>
      <Container maxWidth="lg" padding="md">
        <div className="page-stack">
          <div className="hero-shell">
            <div className="hero-header">
              <div className="hero-header-main">
                <div className="hero__badge">
                  <div className="hero__badge-dot" />
                  <span>Guardrails</span>
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 700 }}>Auto-apply preferences</h1>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 560, lineHeight: 1.5 }}>
                  Set guardrails for when Relevnt can apply on your behalf. Keep control, require high
                  match scores, and make sure voice and values stay intact.
                </p>
              </div>
              <div className="hero-icon">
                <Icon name="key" size="lg" />
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 12 }}>
              Current tier: <strong style={{ color: 'var(--text)' }}>{userTier}</strong>
            </div>
          </div>

          <FeatureGate
            feature="batch-applications"
            requiredTier="pro"
            userTier={userTier}
            onUpgradeClick={() => { }}
          >
            {loading && (
              <div className="surface-card">
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading your settings…</span>
              </div>
            )}

            {error && (
              <div style={{ padding: '0.75rem', background: 'var(--color-bg-error)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-error)', marginBottom: 20 }}>
                <p style={{ fontSize: '13px', color: 'var(--color-error)', margin: 0 }}>{error}</p>
              </div>
            )}

            <section className="page-stack">
              <article className="surface-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="paper-airplane" size="sm" hideAccent />
                    <span style={{ fontWeight: 600 }}>Enable auto-apply</span>
                  </div>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings?.enabled ?? false}
                      onChange={(e) => saveSettings({ enabled: e.target.checked })}
                      style={{ width: 18, height: 18, accentColor: 'var(--color-accent)' }}
                    />
                    <span style={{ fontSize: 13 }}>
                      {settings?.enabled ? 'On' : 'Off'}
                    </span>
                  </label>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
                  Relevnt submits only when rules and thresholds are met. You can pause anytime.
                </p>
              </article>

              <article className="surface-card">
                <div style={{ fontWeight: 600, marginBottom: 16 }}>Core rules</div>
                <div className="rl-field-grid">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                    <div>
                      <label className="rl-label">Mode</label>
                      <select
                        value={settings?.mode || 'review'}
                        onChange={(e) => saveSettings({ mode: e.target.value as 'review' | 'full' })}
                        className="rl-select"
                        style={{ width: '100%' }}
                      >
                        <option value="review">Review first</option>
                        <option value="full">Full auto</option>
                      </select>
                      <p className="form-helper">Start in review to build trust, then switch to full auto.</p>
                    </div>
                    <div>
                      <label className="rl-label">Max applications per week</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={settings?.max_per_week ?? 5}
                        onChange={(e) => saveSettings({ max_per_week: Number(e.target.value) })}
                        className="rl-input"
                        style={{ width: '100%' }}
                      />
                      <p className="form-helper">Prevent spam and keep your search intentional.</p>
                    </div>
                    <div>
                      <label className="rl-label">Minimum match score</label>
                      <input
                        type="number"
                        min={50}
                        max={100}
                        value={settings?.min_match_score ?? 75}
                        onChange={(e) => saveSettings({ min_match_score: Number(e.target.value) })}
                        className="rl-input"
                        style={{ width: '100%' }}
                      />
                      <p className="form-helper">Only apply when your fit clears this bar.</p>
                    </div>
                    <div>
                      <label className="rl-label">Minimum salary (optional)</label>
                      <input
                        type="number"
                        min={0}
                        value={settings?.min_salary ?? ''}
                        onChange={(e) =>
                          saveSettings({
                            min_salary: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        className="rl-input"
                        style={{ width: '100%' }}
                        placeholder="e.g., 100000"
                      />
                      <p className="form-helper">Skip obvious lowball roles; leave blank to ignore salary.</p>
                    </div>
                  </div>
                </div>
              </article>

              <article className="surface-card" style={{ display: 'grid', gap: 16 }}>
                <div style={{ fontWeight: 600 }}>Safety & alignment</div>
                <div style={{ display: 'grid', gap: 12 }}>
                  <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings?.apply_only_canonical ?? true}
                      onChange={(e) => saveSettings({ apply_only_canonical: e.target.checked })}
                      style={{ marginTop: 4, width: 16, height: 16, accentColor: 'var(--color-accent)' }}
                    />
                    <div style={{ display: 'grid', gap: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>Prefer official ATS/company sites</span>
                      <span className="text-secondary" style={{ fontSize: 12 }}>Improves signal to real recruiters and reduces duplicates.</span>
                    </div>
                  </label>

                  <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings?.require_values_alignment ?? true}
                      onChange={(e) => saveSettings({ require_values_alignment: e.target.checked })}
                      style={{ marginTop: 4, width: 16, height: 16, accentColor: 'var(--color-accent)' }}
                    />
                    <div style={{ display: 'grid', gap: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>Require values alignment</span>
                      <span className="text-secondary" style={{ fontSize: 12 }}>Skip companies or industries that do not match your values.</span>
                    </div>
                  </label>
                </div>
                <div
                  style={{
                    marginTop: 8,
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: '1px dashed var(--border-subtle)',
                    backgroundColor: 'var(--surface-soft)',
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Icon name="check" size="sm" hideAccent className="inline-block mr-2 text-success" />
                  You are always in control. Pause or adjust rules at any time.
                </div>
              </article>
            </section>
          </FeatureGate>
        </div>
      </Container>
    </div>
  )
}
