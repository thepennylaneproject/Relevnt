import React, { useState, useMemo } from 'react'
import { useCompanySentiment, type CompanySentiment, type CompanySentimentTag } from '../../hooks/useCompanySentiment'
import { CompanySentimentBadge } from './CompanySentimentBadge'
import { Icon } from '../ui/Icon'

type SortBy = 'applications' | 'response-time' | 'response-rate'

/**
 * Dashboard component showing aggregated company responsiveness data
 */
export function CompanySentimentDashboard() {
  const { companySentiments, loading, error } = useCompanySentiment()
  const [sortBy, setSortBy] = useState<SortBy>('applications')
  const [filterTag, setFilterTag] = useState<CompanySentimentTag | 'all'>('all')
  const [isExpanded, setIsExpanded] = useState(false)

  // Filter and sort sentiments
  const filteredSentiments = useMemo(() => {
    let filtered = companySentiments

    // Apply tag filter
    if (filterTag !== 'all') {
      filtered = filtered.filter(s => s.tag === filterTag)
    }

    // Apply sorting
    const sorted = [...filtered]
    switch (sortBy) {
      case 'applications':
        sorted.sort((a, b) => b.totalApplications - a.totalApplications)
        break
      case 'response-time':
        sorted.sort((a, b) => {
          // Handle companies with no response data
          const aTime = a.avgResponseDays || 999
          const bTime = b.avgResponseDays || 999
          return aTime - bTime
        })
        break
      case 'response-rate':
        sorted.sort((a, b) => b.responseRate - a.responseRate)
        break
    }

    return sorted
  }, [companySentiments, sortBy, filterTag])

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Loading company data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorText}>Failed to load company sentiment data</div>
      </div>
    )
  }

  if (companySentiments.length === 0) {
    return null // Don't show anything if no applications exist
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Company Response Insights</h3>
          <p style={styles.subtitle}>
            Track which companies respond quickly to help prioritize your applications
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          style={styles.expandButton}
        >
          <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size="sm" hideAccent />
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {isExpanded && (
        <div style={styles.content}>
          {/* Filters */}
          <div style={styles.controls}>
            <div style={styles.filterGroup}>
              <label style={styles.label}>Filter by:</label>
              <div style={styles.filterButtons}>
                <button
                  type="button"
                  className={filterTag === 'all' ? 'active' : ''}
                  style={filterTag === 'all' ? { ...styles.filterButton, ...styles.filterButtonActive } : styles.filterButton}
                  onClick={() => setFilterTag('all')}
                >
                  All
                </button>
                <button
                  type="button"
                  className={filterTag === 'fast' ? 'active' : ''}
                  style={filterTag === 'fast' ? { ...styles.filterButton, ...styles.filterButtonActive } : styles.filterButton}
                  onClick={() => setFilterTag('fast')}
                >
                  Fast
                </button>
                <button
                  type="button"
                  className={filterTag === 'average' ? 'active' : ''}
                  style={filterTag === 'average' ? { ...styles.filterButton, ...styles.filterButtonActive } : styles.filterButton}
                  onClick={() => setFilterTag('average')}
                >
                  Average
                </button>
                <button
                  type="button"
                  className={filterTag === 'slow' ? 'active' : ''}
                  style={filterTag === 'slow' ? { ...styles.filterButton, ...styles.filterButtonActive } : styles.filterButton}
                  onClick={() => setFilterTag('slow')}
                >
                  Slow
                </button>
                <button
                  type="button"
                  className={filterTag === 'unresponsive' ? 'active' : ''}
                  style={filterTag === 'unresponsive' ? { ...styles.filterButton, ...styles.filterButtonActive } : styles.filterButton}
                  onClick={() => setFilterTag('unresponsive')}
                >
                  Unresponsive
                </button>
              </div>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.label}>Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                style={styles.select}
              >
                <option value="applications">Most Applications</option>
                <option value="response-time">Fastest Response</option>
                <option value="response-rate">Highest Response Rate</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {filteredSentiments.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No companies match the selected filter</p>
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Company</th>
                    <th style={styles.th}>Applications</th>
                    <th style={styles.th}>Avg Response Time</th>
                    <th style={styles.th}>Response Rate</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSentiments.map((sentiment) => (
                    <tr key={sentiment.companyName} style={styles.tr}>
                      <td style={styles.td}>
                        <span style={styles.companyName}>{sentiment.companyName}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.count}>{sentiment.totalApplications}</span>
                      </td>
                      <td style={styles.td}>
                        {sentiment.avgResponseDays > 0 ? (
                          <span>{sentiment.avgResponseDays.toFixed(1)} days</span>
                        ) : (
                          <span style={styles.muted}>No data</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span>{sentiment.responseRate.toFixed(0)}%</span>
                      </td>
                      <td style={styles.td}>
                        <CompanySentimentBadge tag={sentiment.tag} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-graphite-faint)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
  },

  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--color-ink)',
    marginBottom: '4px',
  },

  subtitle: {
    margin: 0,
    fontSize: '13px',
    color: 'var(--color-ink-secondary)',
  },

  expandButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: '1px solid var(--color-graphite-faint)',
    borderRadius: '6px',
    color: 'var(--color-ink)',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  content: {
    marginTop: '20px',
  },

  controls: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--color-graphite-faint)',
  },

  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },

  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--color-ink-secondary)',
    minWidth: '80px',
  },

  filterButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },

  filterButton: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 500,
    backgroundColor: 'transparent',
    border: '1px solid var(--color-graphite-faint)',
    borderRadius: '6px',
    color: 'var(--color-ink-secondary)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  filterButtonActive: {
    backgroundColor: 'var(--color-accent)',
    borderColor: 'var(--color-accent)',
    color: 'var(--color-ink)',
  },

  select: {
    padding: '6px 12px',
    fontSize: '13px',
    backgroundColor: 'var(--color-bg-alt)',
    border: '1px solid var(--color-graphite-faint)',
    borderRadius: '6px',
    color: 'var(--color-ink)',
    cursor: 'pointer',
  },

  tableContainer: {
    overflowX: 'auto' as const,
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },

  th: {
    padding: '12px',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--color-ink-tertiary)',
    textAlign: 'left' as const,
    borderBottom: '1px solid var(--color-graphite-faint)',
  },

  tr: {
    borderBottom: '1px solid var(--color-graphite-faint)',
  },

  td: {
    padding: '16px 12px',
    fontSize: '14px',
    color: 'var(--color-ink)',
  },

  companyName: {
    fontWeight: 600,
  },

  count: {
    fontWeight: 600,
    color: 'var(--color-accent)',
  },

  muted: {
    color: 'var(--color-ink-tertiary)',
    fontStyle: 'italic' as const,
  },

  emptyState: {
    padding: '40px 20px',
    textAlign: 'center' as const,
    color: 'var(--color-ink-secondary)',
    fontSize: '14px',
  },

  loadingText: {
    padding: '20px',
    textAlign: 'center' as const,
    color: 'var(--color-ink-secondary)',
    fontSize: '14px',
  },

  errorText: {
    padding: '20px',
    textAlign: 'center' as const,
    color: 'var(--color-error)',
    fontSize: '14px',
  },
}

export default CompanySentimentDashboard
