// src/components/admin/ingestion/RunTimeline.tsx
/**
 * Run Timeline Dashboard
 * 
 * Shows recent ingestion runs with expandable per-source details.
 * Auto-refreshes every 30 seconds.
 */

import React, { useEffect, useState, useCallback } from 'react'
import { CustomIcon } from '../../ui/CustomIcon'

interface RunSourceDetail {
  source: string
  status: string
  total_normalized: number
  total_inserted: number
  total_duplicates: number
  error_summary: string | null
  started_at: string
  finished_at: string | null
}

interface RunSummary {
  id: string
  started_at: string
  finished_at: string | null
  duration_seconds: number
  status: 'running' | 'success' | 'partial' | 'failed'
  triggered_by: 'schedule' | 'manual' | 'admin'
  total_normalized: number
  total_inserted: number
  total_duplicates: number
  failed_source_count: number
  error_summary: string | null
  sources: RunSourceDetail[]
}

interface RunTimelineProps {
  adminSecret: string
}

export function RunTimeline({ adminSecret }: RunTimelineProps) {
  const [runs, setRuns] = useState<RunSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchRuns = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '30' })
      if (statusFilter) {
        params.set('status', statusFilter)
      }

      const res = await fetch(`/.netlify/functions/admin_ingestion_runs?${params}`, {
        headers: { 'x-admin-secret': adminSecret },
      })
      
      if (!res.ok) {
        throw new Error(`Failed to fetch runs: ${res.status}`)
      }

      const data = await res.json()
      setRuns(data.runs || [])
      setError(null)
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Failed to fetch runs:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [adminSecret, statusFilter])

  useEffect(() => {
    fetchRuns()
    const interval = setInterval(fetchRuns, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [fetchRuns])

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: string }> = {
      running: { bg: 'var(--color-info-bg)', text: 'var(--color-info)', icon: 'zap' },
      success: { bg: 'var(--color-success-bg)', text: 'var(--color-success)', icon: 'check-circle' },
      partial: { bg: 'var(--color-warning-bg)', text: 'var(--color-warning)', icon: 'alert-circle' },
      failed: { bg: 'var(--color-error-bg)', text: 'var(--color-error)', icon: 'alert-circle' },
    }
    const style = styles[status] || styles.failed
    
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.text,
      }}>
        <CustomIcon name={style.icon} size={14} color="ink" style={{ color: style.text }} />
        {status}
      </span>
    )
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading && runs.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading runs...
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CustomIcon name="compass" size={20} color="ink" />
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Run Timeline</h3>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--surface-input)',
              color: 'var(--text)',
              fontSize: 13,
            }}
          >
            <option value="">All statuses</option>
            <option value="running">Running</option>
            <option value="success">Success</option>
            <option value="partial">Partial</option>
            <option value="failed">Failed</option>
          </select>
          
          <button
            onClick={fetchRuns}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <CustomIcon name="refresh" size={14} color="ink" />
            Refresh
          </button>

          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Last: {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {error && (
        <div style={{
          padding: 12,
          marginBottom: 16,
          borderRadius: 6,
          background: 'var(--color-error-bg)',
          color: 'var(--color-error)',
          fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* Runs List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {runs.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
            No ingestion runs found
          </div>
        ) : (
          runs.map((run) => (
            <div
              key={run.id}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 8,
                overflow: 'hidden',
                background: 'var(--surface)',
              }}
            >
              {/* Run Header */}
              <div
                onClick={() => setExpandedRunId(expandedRunId === run.id ? null : run.id)}
                style={{
                  padding: '12px 16px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 100px 100px 120px 80px',
                  alignItems: 'center',
                  gap: 16,
                  cursor: 'pointer',
                  background: expandedRunId === run.id ? 'var(--surface-hover)' : 'transparent',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {getStatusBadge(run.status)}
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      via {run.triggered_by}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {formatTime(run.started_at)}
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-success)' }}>
                    {run.total_inserted}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>inserted</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
                    {run.total_normalized}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>normalized</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>
                    {formatDuration(run.duration_seconds)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>duration</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <CustomIcon 
                    name={expandedRunId === run.id ? 'chevron-up' : 'chevron-down'} 
                    size={16} 
                    color="ink" 
                  />
                </div>
              </div>

              {/* Expanded Source Details */}
              {expandedRunId === run.id && run.sources.length > 0 && (
                <div style={{ 
                  borderTop: '1px solid var(--border)',
                  padding: 16,
                  background: 'var(--surface-hover)',
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Source</th>
                        <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Normalized</th>
                        <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Inserted</th>
                        <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Duplicates</th>
                        <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {run.sources.map((source, idx) => (
                        <tr key={idx} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 500 }}>{source.source}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>{source.total_normalized}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--color-success)' }}>{source.total_inserted}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>{source.total_duplicates}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--color-error)', fontSize: 11 }}>
                            {source.error_summary ? source.error_summary.slice(0, 50) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Error summary */}
              {run.error_summary && (
                <div style={{
                  borderTop: '1px solid var(--border)',
                  padding: '8px 16px',
                  background: 'var(--color-error-bg)',
                  color: 'var(--color-error)',
                  fontSize: 12,
                }}>
                  {run.error_summary}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
