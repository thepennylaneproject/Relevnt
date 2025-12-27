import React from 'react'
import { Icon, IconName } from '../ui/Icon'

interface PipelineLineProps {
  icon: IconName
  label: string
  value: number | string
  subtext?: string
}

interface PipelineStatusProps {
  /** Array of pipeline stages to display */
  items: PipelineLineProps[]
  /** Optional market context (response rate, benchmark, etc.) */
  marketContext?: {
    metric: string
    userValue: number | string
    benchmarkValue: number | string
    interpretation?: string
  }
  /** Optional section title */
  title?: string
  /** Optional CSS classes */
  className?: string
}

/**
 * PipelineStatus — Calm, informational view of the user's journey
 *
 * Shows the funnel/pipeline with journey-themed icons:
 * - 🌱 Discovered
 * - 🧭 Applied
 * - 🕯️ Awaiting
 * - ✨ Interviews
 *
 * Also includes optional market context (response rates, benchmarks)
 * to help users understand their performance.
 *
 * Example:
 * ```jsx
 * <PipelineStatus
 *   title="Where you are in your search"
 *   items={[
 *     { icon: 'seeds', label: 'Discovered', value: 12, subtext: 'roles explored' },
 *     { icon: 'compass', label: 'Applied to', value: 5, subtext: 'applications' },
 *     { icon: 'candle', label: 'Awaiting responses', value: 3, subtext: 'avg 7 days' },
 *     { icon: 'flower', label: 'In interviews', value: 1, subtext: 'active' },
 *   ]}
 *   marketContext={{
 *     metric: 'Response Rate',
 *     userValue: '12%',
 *     benchmarkValue: '12%',
 *     interpretation: 'On par with industry average'
 *   }}
 * />
 * ```
 */
export function PipelineStatus({
  items,
  marketContext,
  title,
  className,
}: PipelineStatusProps) {
  return (
    <section className={`pipeline-status ${className || ''}`}>
      {title && (
        <h2 className="pipeline-status__title">{title}</h2>
      )}

      <div className="pipeline-status__items">
        {items.map((item, idx) => (
          <div key={`${item.label}-${idx}`} className="pipeline-line">
            <div className="pipeline-line__icon">
              <Icon name={item.icon} size="md" />
            </div>
            <div className="pipeline-line__content">
              <div className="pipeline-line__label">{item.label}</div>
              <div className="pipeline-line__value">{item.value}</div>
              {item.subtext && (
                <div className="pipeline-line__subtext">{item.subtext}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {marketContext && (
        <div className="pipeline-status__market-context">
          <div className="market-context__metric">
            {marketContext.metric}
          </div>
          <div className="market-context__values">
            <span className="market-context__user-value">
              {marketContext.userValue}
            </span>
            <span className="market-context__vs">vs</span>
            <span className="market-context__benchmark">
              {marketContext.benchmarkValue}
            </span>
          </div>
          {marketContext.interpretation && (
            <div className="market-context__interpretation">
              {marketContext.interpretation}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
