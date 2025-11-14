// src/pages/AutoApplySettingsPage.tsx

import React from 'react';
import { PageBackground } from '../components/shared/PageBackground';
import { useTheme } from '../contexts/useTheme';
import { useAuth } from '../contexts/AuthContext';
import {
    FeatureGate,
    type TierLevel,
} from '../components/features/FeatureGate';
import { useAutoApplySettings } from '../hooks/useAutoApplySettings';

export default function AutoApplySettingsPage(): JSX.Element {
    const { mode } = useTheme();
    const { user } = useAuth();
    const { settings, loading, error, saveSettings } = useAutoApplySettings();

    const isDark = mode === 'Dark';

    // Derive tier from auth user metadata (same pattern as DashboardPage)
    const userTier = ((user?.user_metadata?.tier as string) ||
        'starter') as TierLevel;

    if (!user) {
        return (
            <PageBackground version="v2" overlayOpacity={0.12}>
                <div className="min-h-screen flex items-center justify-center px-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        You need to be signed in to manage Auto Apply settings.
                    </p>
                </div>
            </PageBackground>
        );
    }

    async function handleToggleEnabled(
        e: React.ChangeEvent<HTMLInputElement>,
    ) {
        await saveSettings({ enabled: e.target.checked });
    }

    return (
        <PageBackground version="v2" overlayOpacity={0.12}>
            <div
                className="min-h-screen px-4 py-8 flex justify-center"
                style={{
                    backgroundColor: isDark ? '#020617' : 'transparent',
                }}
            >
                <div className="w-full max-w-3xl space-y-8">
                    {/* Header */}
                    <header className="space-y-2">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                            Auto Apply Assistant
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl">
                            Let Relevnt apply on your behalf for high-confidence matches,
                            using your authentic voice and rules that you control.
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Current plan tier:{' '}
                            <span className="font-medium">
                                {userTier.charAt(0).toUpperCase() + userTier.slice(1)}
                            </span>
                        </p>
                    </header>

                    {/* Gated content – only Pro+ gets access to Auto Apply */}
                    <FeatureGate
                        feature="batch-applications"
                        requiredTier="pro"
                        userTier={userTier}
                        onUpgradeClick={() => {
                            // TODO: route to pricing or open upgrade modal
                            // For now this can be a no-op or console.log
                            console.log('Upgrade flow not implemented yet');
                        }}
                    >
                        <div className="space-y-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-4 py-5 shadow-sm">
                            {loading && (
                                <p className="text-xs text-slate-500 mb-2">
                                    Loading your Auto Apply settings…
                                </p>
                            )}
                            {error && (
                                <p className="text-xs text-rose-500 mb-2">
                                    {error}
                                </p>
                            )}

                            {/* Enable / disable */}
                            <section className="space-y-3">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                            Enable Auto Apply
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                                            When enabled, Relevnt can submit applications on your
                                            behalf for roles that meet your rules and pass a match
                                            threshold.
                                        </p>
                                    </div>
                                    <label className="inline-flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={settings?.enabled || false}
                                            onChange={handleToggleEnabled}
                                        />
                                        <span className="text-xs text-slate-700 dark:text-slate-200">
                                            {settings?.enabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </label>
                                </div>
                            </section>

                            <hr className="border-slate-200 dark:border-slate-800" />

                            {/* Core thresholds */}
                            <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
                                        Mode
                                    </label>
                                    <select
                                        value={settings?.mode || 'review'}
                                        onChange={(e) =>
                                            saveSettings({
                                                mode: e.target.value as 'review' | 'full',
                                            })
                                        }
                                        className="w-full text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                                    >
                                        <option value="review">
                                            Review mode: you approve before submit
                                        </option>
                                        <option value="full">
                                            Full Auto: Relevnt submits within your rules
                                        </option>
                                    </select>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Start in review mode until you trust the agent, then switch
                                        to full auto when you are ready.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
                                        Maximum applications per week
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={settings?.max_per_week ?? 5}
                                        onChange={(e) =>
                                            saveSettings({
                                                max_per_week: Number(e.target.value),
                                            })
                                        }
                                        className="w-full text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Hard cap to prevent spam and keep your search intentional.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
                                        Minimum match score
                                    </label>
                                    <input
                                        type="number"
                                        min={50}
                                        max={100}
                                        step={1}
                                        value={settings?.min_match_score ?? 75}
                                        onChange={(e) =>
                                            saveSettings({
                                                min_match_score: Number(e.target.value),
                                            })
                                        }
                                        className="w-full text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Relevnt will only auto apply when your match score meets or
                                        exceeds this level.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
                                        Minimum salary (optional, yearly)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={settings?.min_salary ?? ''}
                                        onChange={(e) =>
                                            saveSettings({
                                                min_salary: e.target.value
                                                    ? Number(e.target.value)
                                                    : null,
                                            })
                                        }
                                        className="w-full text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        If set, Relevnt will skip roles that clearly advertise
                                        compensation below this.
                                    </p>
                                </div>
                            </section>

                            <hr className="border-slate-200 dark:border-slate-800" />

                            {/* Safety & alignment */}
                            <section className="space-y-3">
                                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                    Safety and alignment
                                </h2>

                                <label className="flex items-start gap-3 text-xs text-slate-700 dark:text-slate-200">
                                    <input
                                        type="checkbox"
                                        className="mt-1"
                                        checked={settings?.apply_only_canonical ?? true}
                                        onChange={(e) =>
                                            saveSettings({
                                                apply_only_canonical: e.target.checked,
                                            })
                                        }
                                    />
                                    <span>
                                        Only apply on the company or canonical ATS site when
                                        available.
                                        <span className="block text-slate-500 dark:text-slate-400">
                                            Relevnt prefers employer sites over job boards to maximize
                                            signal to real recruiters.
                                        </span>
                                    </span>
                                </label>

                                <label className="flex items-start gap-3 text-xs text-slate-700 dark:text-slate-200">
                                    <input
                                        type="checkbox"
                                        className="mt-1"
                                        checked={settings?.require_values_alignment ?? true}
                                        onChange={(e) =>
                                            saveSettings({
                                                require_values_alignment: e.target.checked,
                                            })
                                        }
                                    />
                                    <span>
                                        Require values alignment for auto apply.
                                        <span className="block text-slate-500 dark:text-slate-400">
                                            Relevnt will ignore roles at companies or in industries
                                            that do not match your values profile.
                                        </span>
                                    </span>
                                </label>
                            </section>

                            {/* Footer note */}
                            <div className="pt-2 flex items-center justify-between gap-3">
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
                                    You can pause Auto Apply at any time. Your agent will always
                                    follow these rules when searching and applying on your behalf.
                                </p>
                            </div>
                        </div>
                    </FeatureGate>
                </div>
            </div>
        </PageBackground>
    );
}