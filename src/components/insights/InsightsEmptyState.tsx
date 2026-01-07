/**
 * =============================================================================
 * Insights Empty State Component
 * =============================================================================
 * Shown when user doesn't have enough data for meaningful insights
 * =============================================================================
 */

import React from 'react'
import './InsightsEmptyState.css'

interface InsightsEmptyStateProps {
  currentCount: number
  requiredCount: number
}

export default function InsightsEmptyState({
  currentCount,
  requiredCount,
}: InsightsEmptyStateProps): JSX.Element {
  const progress = Math.min((currentCount / requiredCount) * 100, 100)

  return (
    <div className="insights-empty-state">
      <h3 className="text-lg font-display mb-3">Insights loading...</h3>
      <p className="muted mb-6 italic">
        Once you've logged {requiredCount} applications, we'll show you patterns—what's working, 
        what to try differently, and where to focus next.
      </p>
      <p className="text-sm text-text-muted mb-6">
        You don't need to rush this.
      </p>

      {/* Visual tally instead of numeric fraction */}
      <div className="flex gap-1 mb-8">
        {Array.from({ length: requiredCount }).map((_, i) => (
          <div 
            key={i} 
            className={`w-2 h-6 border ${i < currentCount ? 'bg-text border-text' : 'border-border/50'}`}
            title={i < currentCount ? 'Logged' : 'Pending'}
          />
        ))}
      </div>

      <div className="empty-state-tips mb-8">
        <h4 className="text-sm font-medium mb-2">What we'll look for:</h4>
        <ul className="text-sm text-text-muted space-y-1">
          <li>— Patterns in your interview rates</li>
          <li>— Skills that get responses</li>
          <li>— Timing that works for you</li>
        </ul>
      </div>

      <div className="space-y-4 pt-2">
        <a href="/applications" className="block text-sm font-bold underline decoration-accent/30 hover:decoration-accent transition-all">
          Log an application
        </a>
        <a href="/jobs" className="block text-[10px] uppercase tracking-widest font-bold opacity-60 hover:opacity-100 transition-opacity">
          Browse roles
        </a>
      </div>
    </div>
  )
}
