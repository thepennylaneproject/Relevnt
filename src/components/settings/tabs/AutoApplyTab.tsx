import React, { useEffect } from 'react'
import { useAutoApplySettings } from '../../../hooks/useAutoApplySettings'
import { FeatureGate, type TierLevel } from '../../features/FeatureGate'
import { useAuth } from '../../../hooks/useAuth'
import { Icon } from '../../ui/Icon'
import type { AutoSaveStatus } from '../../../hooks/useSettingsAutoSave'

interface AutoApplyTabProps {
    onAutoSaveStatusChange: (status: AutoSaveStatus) => void
}

import { Zap, ShieldCheck, Check } from 'lucide-react'

export function AutoApplyTab({ onAutoSaveStatusChange }: AutoApplyTabProps) {
    const { user } = useAuth()
    const { settings, loading, error, saveSettings } = useAutoApplySettings()

    const userTier: TierLevel =
        user?.user_metadata?.tier && ['starter', 'pro', 'premium'].includes(user.user_metadata.tier)
            ? (user.user_metadata.tier as TierLevel)
            : 'starter'

    useEffect(() => {
        onAutoSaveStatusChange('idle')
    }, [onAutoSaveStatusChange])

    if (loading) {
        return (
            <div className="tab-pane">
                <div className="card" style={{ textAlign: 'center' }}>
                    <p>Loading your settings…</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="tab-pane">
                <div className="card" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <p style={{ color: '#ef4444', margin: 0 }}>{error}</p>
                </div>
            </div>
        )
    }

    return (
        <FeatureGate
            feature="batch-applications"
            requiredTier="pro"
            userTier={userTier}
            onUpgradeClick={() => { }}
        >
            <div className="tab-pane">
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Zap size={16} strokeWidth={1.5} color="var(--color-accent)" />
                            <h3 style={{ margin: 0 }}>Enable auto-apply</h3>
                        </div>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={settings?.enabled ?? false}
                                onChange={(e) => saveSettings({ enabled: e.target.checked })}
                                style={{ width: 18, height: 18, accentColor: 'var(--color-accent)' }}
                            />
                            <span style={{ fontSize: '0.875rem' }}>
                                {settings?.enabled ? 'On' : 'Off'}
                            </span>
                        </label>
                    </div>
                    <p className="card-description" style={{ marginTop: 12 }}>
                        Save 2–3 hours per week by automating applications to matching roles. You stay in control with guardrails and can pause anytime.
                    </p>
                </div>

                <div className="card">
                    <h3>Core rules</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
                        <div className="form-group">
                            <label className="form-label">Mode</label>
                            <select
                                value={settings?.mode || 'review'}
                                onChange={(e) => saveSettings({ mode: e.target.value as 'review' | 'full' })}
                                className="form-select"
                            >
                                <option value="review">Review first</option>
                                <option value="full">Full auto</option>
                            </select>
                            <p className="card-description" style={{ fontSize: '0.75rem' }}>Start in review to build trust, then switch to full auto.</p>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Max applications per week</label>
                            <input
                                type="number"
                                min={1}
                                max={50}
                                value={settings?.max_per_week ?? 5}
                                onChange={(e) => saveSettings({ max_per_week: Number(e.target.value) })}
                                className="form-input"
                            />
                            <p className="card-description" style={{ fontSize: '0.75rem' }}>Prevent spam and keep your search intentional.</p>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Minimum match score</label>
                            <input
                                type="number"
                                min={50}
                                max={100}
                                value={settings?.min_match_score ?? 75}
                                onChange={(e) => saveSettings({ min_match_score: Number(e.target.value) })}
                                className="form-input"
                            />
                            <p className="card-description" style={{ fontSize: '0.75rem' }}>Only apply when your fit clears this bar.</p>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Minimum salary (optional)</label>
                            <input
                                type="number"
                                min={0}
                                value={settings?.min_salary ?? ''}
                                onChange={(e) =>
                                    saveSettings({
                                        min_salary: e.target.value ? Number(e.target.value) : null,
                                    })
                                }
                                className="form-input"
                                placeholder="e.g., 100000"
                            />
                            <p className="card-description" style={{ fontSize: '0.75rem' }}>Skip obvious lowball roles; leave blank to ignore salary.</p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <ShieldCheck size={16} strokeWidth={1.5} color="var(--color-accent)" />
                        <h3 style={{ margin: 0 }}>Safety & alignment</h3>
                    </div>
                    <div style={{ display: 'grid', gap: 16 }}>
                        <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={settings?.apply_only_canonical ?? true}
                                onChange={(e) => saveSettings({ apply_only_canonical: e.target.checked })}
                                style={{ marginTop: 4, width: 16, height: 16, accentColor: 'var(--color-accent)' }}
                            />
                            <div style={{ display: 'grid', gap: 2 }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Prefer official ATS/company sites</span>
                                <span className="card-description" style={{ fontSize: '0.75rem' }}>Improves signal to real recruiters and reduces duplicates.</span>
                            </div>
                        </label>

                        <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={settings?.require_values_alignment ?? true}
                                onChange={(e) => saveSettings({ require_values_alignment: e.target.checked })}
                                style={{ marginTop: 4, width: 16, height: 16, accentColor: 'var(--color-accent)' }}
                            />
                            <div style={{ display: 'grid', gap: 2 }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Require values alignment</span>
                                <span className="card-description" style={{ fontSize: '0.75rem' }}>Skip companies or industries that do not match your values.</span>
                            </div>
                        </label>
                    </div>
                    <div
                        style={{
                            marginTop: 24,
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px dashed var(--color-graphite-faint)',
                            backgroundColor: 'rgba(212, 165, 116, 0.05)',
                            fontSize: '0.75rem',
                            color: 'var(--color-ink)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                        }}
                    >
                        <Check size={14} color="var(--color-accent)" />
                        You are always in control. Pause or adjust rules at any time.
                    </div>
                </div>
            </div>
        </FeatureGate>
    )
}
