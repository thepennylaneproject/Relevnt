import React from 'react';

interface ReadinessScoreProps {
    score: number;
}

export const ReadinessScore: React.FC<ReadinessScoreProps> = ({ score }) => {
    // Simple gauge implementation
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-4">Readiness Score</h3>
            <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        fill="transparent"
                        stroke="var(--color-border-light, #f0f0f0)"
                        strokeWidth="8"
                    />
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        fill="transparent"
                        stroke="var(--color-ready, #A8C3A2)"
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                    />
                </svg>
                <span className="absolute text-3xl font-bold">{score}%</span>
            </div>
            <p className="mt-4 text-sm text-ink-secondary text-center">
                You're trending upward! Complete 2 more practice sessions to hit 80%.
            </p>
        </div>
    );
};
