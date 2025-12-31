/**
 * You're Ready! - Celebration Page
 * 
 * Shown when user crosses the 80% readiness threshold.
 * Features confetti, achievement summary, and next-step CTAs.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { ReadinessGauge } from '../components/shared/ReadinessGauge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getRelevntUrl } from '../config/cross-product';

interface AchievementSummary {
    practiceSessions: number;
    assessmentsCompleted: number;
    skillsAddressed: number;
    hasNarrative: boolean;
    readinessScore: number;
}

export default function YoureReady() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [summary, setSummary] = useState<AchievementSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [showShareModal, setShowShareModal] = useState(false);

    // Fire confetti on mount
    useEffect(() => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 2000 };

        function randomInRange(min: number, max: number) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                clearInterval(interval);
                return;
            }

            const particleCount = 50 * (timeLeft / duration);

            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    // Fetch achievement summary
    useEffect(() => {
        async function fetchSummary() {
            if (!user?.id) return;

            try {
                // Practice sessions
                const { data: sessions } = await supabase
                    .from('interview_practice_sessions')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('status', 'completed');

                // Assessments
                const { data: linkedin } = await supabase
                    .from('linkedin_profiles')
                    .select('id')
                    .eq('user_id', user.id)
                    .not('analysis_results', 'is', null);

                const { data: portfolio } = await supabase
                    .from('portfolio_analyses')
                    .select('id')
                    .eq('user_id', user.id)
                    .not('analysis_results', 'is', null);

                // Skill gaps
                const { data: skillGaps } = await supabase
                    .from('skill_gap_analyses')
                    .select('gaps')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                const gaps = (skillGaps as any)?.gaps || [];
                const addressedGaps = gaps.filter((g: any) => g.status === 'addressed').length;

                // Career narrative
                const { data: narrative } = await supabase
                    .from('career_narratives')
                    .select('id')
                    .eq('user_id', user.id)
                    .limit(1)
                    .single();

                // Get latest readiness score
                const { data: snapshot } = await supabase
                    .from('readiness_snapshots')
                    .select('overall_score')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                setSummary({
                    practiceSessions: sessions?.length || 0,
                    assessmentsCompleted: (linkedin?.length || 0) + (portfolio?.length || 0),
                    skillsAddressed: addressedGaps,
                    hasNarrative: !!narrative,
                    readinessScore: (snapshot as any)?.overall_score || 80,
                });
            } catch (err) {
                console.error('Error fetching summary:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchSummary();
    }, [user]);

    const handleShare = () => {
        const shareText = `I just hit ${summary?.readinessScore}% interview readiness on Ready! 🎉`;
        const shareUrl = window.location.origin;

        if (navigator.share) {
            navigator.share({
                title: "I'm Interview Ready!",
                text: shareText,
                url: shareUrl,
            }).catch(() => {
                // Fallback to copy
                navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
                setShowShareModal(true);
            });
        } else {
            navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
            setShowShareModal(true);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                    <p className="text-ink-secondary">Loading your achievement...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-ready via-accent to-ready bg-clip-text text-transparent">
                        You're Ready! 🎉
                    </h1>
                    <p className="text-xl text-ink-secondary mb-8">
                        You've reached interview-ready status. Time to put your preparation into action!
                    </p>

                    {/* Readiness Gauge */}
                    <div className="flex justify-center mb-8">
                        <ReadinessGauge
                            score={summary?.readinessScore || 80}
                            size="lg"
                            showBadge={true}
                            animated={true}
                        />
                    </div>
                </div>

                {/* Achievement Summary */}
                <div className="bg-surface rounded-2xl border border-border shadow-lg p-8 mb-8">
                    <h2 className="text-2xl font-semibold mb-6 text-center">What You've Accomplished</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Practice Sessions */}
                        <div className="flex items-start gap-4 p-4 bg-background rounded-lg">
                            <div className="text-3xl">💪</div>
                            <div>
                                <h3 className="font-semibold text-lg mb-1">Practice Sessions</h3>
                                <p className="text-ink-secondary">
                                    Completed <span className="font-bold text-accent">{summary?.practiceSessions}</span> interview practice sessions
                                </p>
                            </div>
                        </div>

                        {/* Assessments */}
                        <div className="flex items-start gap-4 p-4 bg-background rounded-lg">
                            <div className="text-3xl">📊</div>
                            <div>
                                <h3 className="font-semibold text-lg mb-1">Profile Analysis</h3>
                                <p className="text-ink-secondary">
                                    Analyzed <span className="font-bold text-accent">{summary?.assessmentsCompleted}</span> professional profile{summary?.assessmentsCompleted !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="flex items-start gap-4 p-4 bg-background rounded-lg">
                            <div className="text-3xl">🎯</div>
                            <div>
                                <h3 className="font-semibold text-lg mb-1">Skills Development</h3>
                                <p className="text-ink-secondary">
                                    Addressed <span className="font-bold text-accent">{summary?.skillsAddressed}</span> skill gap{summary?.skillsAddressed !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>

                        {/* Narrative */}
                        <div className="flex items-start gap-4 p-4 bg-background rounded-lg">
                            <div className="text-3xl">📖</div>
                            <div>
                                <h3 className="font-semibold text-lg mb-1">Career Narrative</h3>
                                <p className="text-ink-secondary">
                                    {summary?.hasNarrative ? (
                                        <span className="font-bold text-ready">✓ Crafted your story</span>
                                    ) : (
                                        <span className="text-ink-tertiary">Not completed yet</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTAs */}
                <div className="bg-surface rounded-2xl border border-border shadow-lg p-8">
                    <h2 className="text-2xl font-semibold mb-6 text-center">What's Next?</h2>
                    
                    <div className="space-y-4">
                        {/* Start Applying */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-background rounded-lg">
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1">Start Applying</h3>
                                <p className="text-ink-secondary">Find roles that match your skills and goals</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => window.open(getRelevntUrl('/jobs'), '_blank')}
                                >
                                    Find Jobs on Relevnt
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => window.open('https://www.linkedin.com/jobs', '_blank')}
                                >
                                    LinkedIn
                                </Button>
                            </div>
                        </div>

                        {/* Keep Practicing */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-background rounded-lg">
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1">Keep Practicing</h3>
                                <p className="text-ink-secondary">Maintain your edge with continued practice</p>
                            </div>
                            <Button
                                variant="secondary"
                                onClick={() => navigate('/practice')}
                            >
                                Practice Center
                            </Button>
                        </div>

                        {/* Share Achievement */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-background rounded-lg">
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1">Share Your Achievement</h3>
                                <p className="text-ink-secondary">Celebrate your hard work with others</p>
                            </div>
                            <Button
                                variant="ghost"
                                onClick={handleShare}
                            >
                                📤 Share
                            </Button>
                        </div>
                    </div>

                    {/* Back to Dashboard */}
                    <div className="mt-8 text-center">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/')}
                        >
                            ← Back to Dashboard
                        </Button>
                    </div>
                </div>
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-semibold mb-3">Link Copied! 🎉</h3>
                        <p className="text-ink-secondary mb-6">
                            Share this link with your network to inspire others on their journey!
                        </p>
                        <Button
                            variant="primary"
                            fullWidth
                            onClick={() => setShowShareModal(false)}
                        >
                            Got it
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
