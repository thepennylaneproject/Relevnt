// src/components/admin/ingestion/CompanyTargetsTable.tsx
/**
 * Company Targets Table
 * 
 * Displays and manages ATS company targets (Lever/Greenhouse) with inline controls.
 */

import React, { useEffect, useState, useCallback } from 'react'
import { CustomIcon } from '../../ui/CustomIcon'

interface CompanyTarget {
  id: string
  platform: 'lever' | 'greenhouse'
  company_slug: string
  company_id: string | null
  status: 'active' | 'paused' | 'bad'
  last_success_at: string | null
  next_allowed_at: string | null
  min_interval_minutes: number
  priority: number
  fail_count: number
  last_error: string | null
  new_jobs_last: number
}

interface CompanyTargetsTableProps {
  adminSecret: string
}

export function CompanyTargetsTable({ adminSecret }: CompanyTargetsTableProps) {
  const [targets, setTargets] = useState<CompanyTarget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [platformFilter, setPlatformFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [editingIntervalId, setEditingIntervalId] = useState<string | null>(null)
  const [editingIntervalValue, setEditingIntervalValue] = useState<string>('')

  const fetchTargets = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (platformFilter) params.set('platform', platformFilter)
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/.netlify/functions/admin_company_targets?${params}`, {
        headers: { 'x-admin-secret': adminSecret },
      })
      
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)

      const data = await res.json()
      setTargets(data.targets || [])
      setTotal(data.total || 0)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [adminSecret, platformFilter, statusFilter])

  useEffect(() => {
    fetchTargets()
  }, [fetchTargets])

  const updateTarget = async (id: string, updates: Record<string, any>) => {
    setUpdatingId(id)
    try {
      const res = await fetch('/.netlify/functions/admin_company_targets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret,
        },
        body: JSON.stringify({ id, ...updates }),
      })

      if (!res.ok) throw new Error(`Update failed: ${res.status}`)
      
      await fetchTargets()
    } catch (err) {
      console.error('Update error:', err)
      alert(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setUpdatingId(null)
    }
  }

  const toggleStatus = (target: CompanyTarget) => {
    const newStatus = target.status === 'active' ? 'paused' : 'active'
    updateTarget(target.id, { status: newStatus })
  }

  const resetCooldown = (target: CompanyTarget) => {
    updateTarget(target.id, { reset_cooldown: true })
  }

  const saveInterval = (id: string) => {
    const value = parseInt(editingIntervalValue, 10)
    if (isNaN(value) || value < 60) {
      alert('Interval must be at least 60 minutes')
      return
    }
    updateTarget(id, { min_interval_minutes: value })
    setEditingIntervalId(null)
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      active: { bg: 'var(--color-success-bg)', text: 'var(--color-success)' },
      paused: { bg: 'var(--color-warning-bg)', text: 'var(--color-warning)' },
      bad: { bg: 'var(--color-error-bg)', text: 'var(--color-error)' },
    }
    const color = colors[status] || colors.bad
    
    return (
      <span style={{
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        backgroundColor: color.bg,
        color: color.text,
      }}>
        {status}
      </span>
    )
  }

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '—'
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    
    if (diffMs < 0) {
      return 'Due now'
    }
    
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 60) return `in ${diffMins}m`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `in ${diffHours}h`
    return date.toLocaleDateString()
  }

  const formatLastSuccess = (isoString: string | null) => {
    if (!isoString) return 'Never'
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading && targets.length === 0) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Loading targets...</div>
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
          <CustomIcon name="briefcase" size={20} color="ink" />
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            Company Targets
            <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
              ({total} total)
            </span>
          </h3>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--surface-input)',
              fontSize: 13,
            }}
          >
            <option value="">All platforms</option>
            <option value="lever">Lever</option>
            <option value="greenhouse">Greenhouse</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--surface-input)',
              fontSize: 13,
            }}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="bad">Bad</option>
          </select>

          <button
            onClick={fetchTargets}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: 12,
          marginBottom: 16,
          borderRadius: 6,
          background: 'var(--color-error-bg)',
          color: 'var(--color-error)',
        }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ 
        border: '1px solid var(--border)', 
        borderRadius: 8, 
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ background: 'var(--surface-hover)' }}>
            <tr>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Company</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Platform</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Last Success</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Next Run</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Interval</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>New Jobs</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Fails</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {targets.map((target) => (
              <tr 
                key={target.id} 
                style={{ 
                  borderTop: '1px solid var(--border-subtle)',
                  opacity: updatingId === target.id ? 0.5 : 1,
                }}
              >
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ fontWeight: 500 }}>{target.company_slug}</div>
                  {target.last_error && (
                    <div style={{ 
                      fontSize: 11, 
                      color: 'var(--color-error)', 
                      marginTop: 2,
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {target.last_error}
                    </div>
                  )}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 500,
                    background: target.platform === 'lever' ? '#f0f9ff' : '#f0fdf4',
                    color: target.platform === 'lever' ? '#0369a1' : '#15803d',
                  }}>
                    {target.platform}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  {getStatusBadge(target.status)}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12 }}>
                  {formatLastSuccess(target.last_success_at)}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12 }}>
                  {formatTime(target.next_allowed_at)}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  {editingIntervalId === target.id ? (
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <input
                        type="number"
                        value={editingIntervalValue}
                        onChange={(e) => setEditingIntervalValue(e.target.value)}
                        style={{
                          width: 60,
                          padding: '2px 4px',
                          border: '1px solid var(--border)',
                          borderRadius: 4,
                          textAlign: 'center',
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveInterval(target.id)
                          if (e.key === 'Escape') setEditingIntervalId(null)
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => saveInterval(target.id)}
                        style={{
                          padding: '2px 6px',
                          border: 'none',
                          background: 'var(--color-success)',
                          color: 'white',
                          borderRadius: 4,
                          cursor: 'pointer',
                        }}
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <span
                      onClick={() => {
                        setEditingIntervalId(target.id)
                        setEditingIntervalValue(String(target.min_interval_minutes))
                      }}
                      style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}
                      title="Click to edit"
                    >
                      {target.min_interval_minutes}m
                    </span>
                  )}
                </td>
                <td style={{ 
                  padding: '10px 12px', 
                  textAlign: 'center',
                  color: target.new_jobs_last > 0 ? 'var(--color-success)' : 'var(--text-muted)',
                  fontWeight: target.new_jobs_last > 0 ? 600 : 400,
                }}>
                  {target.new_jobs_last}
                </td>
                <td style={{ 
                  padding: '10px 12px', 
                  textAlign: 'center',
                  color: target.fail_count > 0 ? 'var(--color-error)' : 'var(--text-muted)',
                }}>
                  {target.fail_count}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button
                      onClick={() => toggleStatus(target)}
                      disabled={updatingId === target.id}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid var(--border)',
                        borderRadius: 4,
                        background: target.status === 'active' ? 'var(--color-warning-bg)' : 'var(--color-success-bg)',
                        color: target.status === 'active' ? 'var(--color-warning)' : 'var(--color-success)',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                      title={target.status === 'active' ? 'Pause this target' : 'Resume this target'}
                    >
                      {target.status === 'active' ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={() => resetCooldown(target)}
                      disabled={updatingId === target.id}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid var(--border)',
                        borderRadius: 4,
                        background: 'var(--surface)',
                        cursor: 'pointer',
                        fontSize: 11,
                      }}
                      title="Reset cooldown (run ASAP)"
                    >
                      Run ASAP
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
