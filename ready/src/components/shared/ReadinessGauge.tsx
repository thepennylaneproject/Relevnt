/**
 * ReadinessGauge Component
 * 
 * Circular progress indicator showing readiness percentage with color coding
 * and a special badge when the user hits 80%+ (ready state).
 */

import React from 'react';

export interface ReadinessGaugeProps {
    score: number; // 0-100
    size?: 'sm' | 'md' | 'lg';
    showBadge?: boolean;
    animated?: boolean;
}

export const ReadinessGauge: React.FC<ReadinessGaugeProps> = ({
    score,
    size = 'md',
    showBadge = true,
    animated = true,
}) => {
    // Clamp score between 0 and 100
    const clampedScore = Math.max(0, Math.min(100, score));

    // Size configurations
    const sizeConfig = {
        sm: { radius: 28, strokeWidth: 6, fontSize: '1.5rem', container: 'w-24 h-24' },
        md: { radius: 36, strokeWidth: 8, fontSize: '2rem', container: 'w-32 h-32' },
        lg: { radius: 48, strokeWidth: 10, fontSize: '2.5rem', container: 'w-40 h-40' },
    };

    const config = sizeConfig[size];
    const radius = config.radius;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clampedScore / 100) * circumference;

    // Color based on score
    const getColor = (score: number): string => {
        if (score < 40) return 'var(--color-error, #ef4444)'; // Red
        if (score < 70) return 'var(--color-warning, #f59e0b)'; // Yellow/Orange
        return 'var(--color-ready, #10b981)'; // Green
    };

    const strokeColor = getColor(clampedScore);
    const isReady = clampedScore >= 80;

    return (
        <div className="flex flex-col items-center gap-4">
            <div className={`relative ${config.container} flex items-center justify-center`}>
                {/* SVG Circle */}
                <svg className="w-full h-full transform -rotate-90">
                    {/* Background circle */}
                    <circle
                        cx="50%"
                        cy="50%"
                        r={radius}
                        fill="transparent"
                        stroke="var(--color-border-light, #e5e7eb)"
                        strokeWidth={config.strokeWidth}
                    />
                    {/* Progress circle */}
                    <circle
                        cx="50%"
                        cy="50%"
                        r={radius}
                        fill="transparent"
                        stroke={strokeColor}
                        strokeWidth={config.strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{
                            transition: animated ? 'stroke-dashoffset 1s ease-in-out, stroke 0.3s ease' : 'none',
                        }}
                    />
                </svg>
                
                {/* Score percentage in center */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span
                        className="font-bold"
                        style={{
                            fontSize: config.fontSize,
                            color: strokeColor,
                        }}
                    >
                        {Math.round(clampedScore)}%
                    </span>
                </div>
            </div>

            {/* "You're Ready!" badge */}
            {showBadge && isReady && (
                <div
                    className="px-4 py-2 rounded-full font-semibold text-sm shadow-md"
                    style={{
                        backgroundColor: 'var(--color-ready, #10b981)',
                        color: 'white',
                        animation: animated ? 'pulse 2s ease-in-out infinite' : 'none',
                    }}
                >
                    🎉 You're Ready!
                </div>
            )}

            {/* Status text for non-ready states */}
            {showBadge && !isReady && (
                <div className="text-sm text-ink-secondary text-center">
                    {clampedScore < 40 && 'Getting started...'}
                    {clampedScore >= 40 && clampedScore < 70 && 'Making progress!'}
                    {clampedScore >= 70 && clampedScore < 80 && 'Almost there!'}
                </div>
            )}
        </div>
    );
};

export default ReadinessGauge;
