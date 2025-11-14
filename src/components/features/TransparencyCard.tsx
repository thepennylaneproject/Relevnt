/**
 * AI TRANSPARENCY COMPONENT
 * 
 * Displays the reasoning behind AI analysis scores and suggestions.
 * Core to Relevnt's brand: transparent, explainable AI.
 * 
 * Shows:
 * - Criteria weights (what factors were considered)
 * - Explanation in plain language
 * - Reasoning chain from model
 * - Specific examples from input
 * 
 * Usage:
 * <TransparencyCard
 *   score={87}
 *   explanation="Skills match strong; education gap noted."
 *   criteria={{ skills: 0.45, experience: 0.35, education: 0.20 }}
 *   examples={['Python match found', 'AWS certification missing']}
 * />
 */

import React, { useState } from 'react';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';

export interface TransparencyData {
  score: number;
  scoreLabel?: string;
  explanation: string;
  criteria: Record<string, number>;
  examples?: string[];
  reasoning?: string;
  timestamp?: string;
  modelUsed?: string;
}

export interface TransparencyCardProps {
  data: TransparencyData;
  expandedByDefault?: boolean;
  onExportClick?: () => void;
}

/**
 * Main transparency card component
 */
export function TransparencyCard({
  data,
  expandedByDefault = false,
  onExportClick,
}: TransparencyCardProps) {
  const [isExpanded, setIsExpanded] = useState(expandedByDefault);

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-teal-50 border-2 border-blue-100">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              How this score was calculated
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              We believe in explainable AI. Here's our reasoning.
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-900"
          >
            {isExpanded ? '−' : '+'}
          </Button>
        </div>

        {/* Score Summary */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600 font-medium">Score</span>
            <ScoreGauge score={data.score} />
          </div>
          <p className="text-gray-700 text-sm">{data.explanation}</p>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="space-y-4 border-t border-blue-200 pt-4">
            {/* Criteria Weights */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Factors considered:
              </h4>
              <div className="space-y-2">
                {Object.entries(data.criteria).map(([criterion, weight]) => (
                  <CriterionBar
                    key={criterion}
                    name={criterion}
                    weight={weight}
                  />
                ))}
              </div>
            </div>

            {/* Examples */}
            {data.examples && data.examples.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  What we found:
                </h4>
                <ul className="space-y-2">
                  {data.examples.map((example, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-teal-600">✓</span>
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Full Reasoning (if available) */}
            {data.reasoning && (
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-gray-500 mb-2">FULL REASONING:</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {data.reasoning}
                </p>
              </div>
            )}

            {/* Metadata */}
            <div className="text-xs text-gray-500 space-y-1">
              {data.modelUsed && <p>Model: {data.modelUsed}</p>}
              {data.timestamp && (
                <p>Calculated: {new Date(data.timestamp).toLocaleString()}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={onExportClick}
                className="flex-1"
              >
                Export explanation
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-blue-600"
              >
                Send feedback
              </Button>
            </div>
          </div>
        )}

        {/* Collapsed Hint */}
        {!isExpanded && (
          <p className="text-xs text-blue-600 cursor-pointer hover:text-blue-900">
            Click + to see our reasoning
          </p>
        )}
      </div>
    </Card>
  );
}

/**
 * Score gauge - visual representation of score
 */
function ScoreGauge({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 80) return 'text-green-600';
    if (s >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getLabel = (s: number) => {
    if (s >= 80) return 'Strong';
    if (s >= 60) return 'Good';
    return 'Needs work';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={
              score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
            }
            strokeWidth="8"
            strokeDasharray={`${(score / 100) * 251} 251`}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        </svg>
        <span className={`absolute text-2xl font-bold ${getColor(score)}`}>
          {score}
        </span>
      </div>
      <div>
        <p className={`text-sm font-semibold ${getColor(score)}`}>
          {getLabel(score)}
        </p>
        <p className="text-xs text-gray-600">{score}/100</p>
      </div>
    </div>
  );
}

/**
 * Criterion bar - shows weight of each criterion
 */
function CriterionBar({
  name,
  weight,
}: {
  name: string;
  weight: number;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm text-gray-700 capitalize">{name}</span>
        <span className="text-sm font-semibold text-gray-900">
          {Math.round(weight * 100)}%
        </span>
      </div>
      <div className="h-2 bg-white rounded-full overflow-hidden border border-blue-200">
        <div
          className="h-full bg-gradient-to-r from-teal-400 to-teal-600"
          style={{ width: `${weight * 100}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Inline transparency button
 * Use when you want to embed a "See how" link in text
 */
export function TransparencyLink({
  onClick,
  children = 'See how this was calculated',
}: {
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="text-blue-600 hover:text-blue-900 underline text-sm font-medium"
    >
      {children}
    </button>
  );
}

/**
 * Transparency modal - full-screen view of transparency data
 */
export function TransparencyModal({
  data,
  isOpen,
  onClose,
}: {
  data: TransparencyData;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            How this was calculated
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <TransparencyCard data={data} expandedByDefault={true} />

        <div className="mt-6 flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary">Send feedback</Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for managing transparency modal state
 */
export function useTransparency() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<TransparencyData | null>(null);

  return {
    isOpen,
    data,
    openTransparency: (transparencyData: TransparencyData) => {
      setData(transparencyData);
      setIsOpen(true);
    },
    closeTransparency: () => setIsOpen(false),
  };
}

/**
 * Example: Resume analysis transparency data
 */
export const EXAMPLE_RESUME_TRANSPARENCY: TransparencyData = {
  score: 78,
  scoreLabel: 'Good match',
  explanation:
    'Your résumé aligns well with the job description. Strong skill overlap, but some experience gaps noted.',
  criteria: {
    skills: 0.45,
    experience: 0.35,
    education: 0.2,
  },
  examples: [
    'Python and JavaScript skills match job requirements',
    'AWS and Docker experience valued',
    'Missing: Kubernetes (preferred, not required)',
    'Education: BS Computer Science (strong)',
  ],
  reasoning:
    'We analyzed 247 keywords from the job posting against your résumé. Your technical skills align with 89% of requirements. Experience level matches senior roles in your target. Education exceeds typical requirements for this level.',
  modelUsed: 'Claude 3 Opus',
  timestamp: new Date().toISOString(),
};
