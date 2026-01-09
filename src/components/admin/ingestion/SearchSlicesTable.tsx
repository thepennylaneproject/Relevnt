// src/components/admin/ingestion/SearchSlicesTable.tsx
/**
 * Search Slices Table
 * 
 * Displays and manages aggregator search slices with cooling/warming indicators.
 */

import React, { useEffect, useState, useCallback } from 'react'
import { CustomIcon } from '../../ui/CustomIcon'

interface SearchSlice {
  id: string
  source: string
  query_hash: string
  params_json: {
    keywords?: string
    location?: string
    [key: string]: any
  }
  keywords: string
  location: string
  status: 'active' | 'paused' | 'bad'
  last_success_at: string | null
  next_allowed_at: string | null
  min_interval_minutes: number
  result_count_last: number
  new_jobs_last: number
  consecutive_empty_runs: number
  fail_count: number
  is_cooling: boolean
  is_productive: boolean
}

interface SearchSlicesTableProps {
  adminSecret: string
}

export function SearchSlicesTable({ adminSecret }: SearchSlicesTableProps) {
  const [slices, setSlices] = useState<SearchSlice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [sourceFilter, setSourceFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [editingSlice, setEditingSlice] = useState<SearchSlice | null>(null)

  const fetchSlices = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (sourceFilter) params.set('source', sourceFilter)
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/.netlify/functions/admin_search_slices?${params}`, {
        headers: { 'x-admin-secret': adminSecret },
      })
      
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)

      const data = await res.json()
      setSlices(data.slices || [])
      setTotal(data.total || 0)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [adminSecret, sourceFilter, statusFilter])

  useEffect(() => {
    fetchSlices()
  }, [fetchSlices])

  const updateSlice = async (id: string, updates: Record<string, any>) => {
    setUpdatingId(id)
    try {
      const res = await fetch('/.netlify/functions/admin_search_slices', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret,
        },
        body: JSON.stringify({ id, ...updates }),
      })

      if (!res.ok) throw new Error(`Update failed: ${res.status}`)
      
      await fetchSlices()
      setEditingSlice(null)
    } catch (err) {
      console.error('Update error:', err)
      alert(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setUpdatingId(null)
    }
  }

  const toggleStatus = (slice: SearchSlice) => {
    const newStatus = slice.status === 'active' ? 'paused' : 'active'
    updateSlice(slice.id, { status: newStatus })
  }

  const resetCooldown = (slice: SearchSlice) => {
    updateSlice(slice.id, { reset_cooldown: true })
  }

  const getStatusBadge = (slice: SearchSlice) => {
    if (slice.status === 'paused') {
      return (
        <span style={{
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 600,
          backgroundColor: 'var(--color-warning-bg)',
          color: 'var(--color-warning)',
        }}>
          ⏸️ paused
        </span>
      )
    }
    if (slice.status === 'bad') {
      return (
        <span style={{
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 600,
          backgroundColor: 'var(--color-error-bg)',
          color: 'var(--color-error)',
        }}>
          ❌ bad
        </span>
      )
    }
    if (slice.is_cooling) {
      return (
        <span style={{
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 600,
          backgroundColor: '#fef2f2',
          color: '#dc2626',
        }}>
          🔴 cooling
        </span>
      )
    }
    if (slice.is_productive) {
      return (
        <span style={{
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 600,
          backgroundColor: '#f0fdf4',
          color: '#16a34a',
        }}>
          🟢 productive
        </span>
      )
    }
    return (
      <span style={{
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        backgroundColor: 'var(--color-success-bg)',
        color: 'var(--color-success)',
      }}>
        active
      </span>
    )
  }

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '—'
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    
    if (diffMs < 0) return 'Due now'
    
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 60) return `in ${diffMins}m`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `in ${diffHours}h`
    return date.toLocaleDateString()
  }

  // Get unique sources for filter
  const uniqueSources = [...new Set(slices.map(s => s.source))].sort()

  if (loading && slices.length === 0) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Loading slices...</div>
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
          <CustomIcon name="search" size={20} color="ink" />
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            Search Slices
            <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
              ({total} total)
            </span>
          </h3>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--surface-input)',
              fontSize: 13,
            }}
          >
            <option value="">All sources</option>
            {uniqueSources.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
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
            onClick={fetchSlices}
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

      {/* Edit Modal */}
      {editingSlice && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--surface)',
            borderRadius: 12,
            padding: 24,
            width: 400,
            maxWidth: '90vw',
          }}>
            <h4 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>
              Edit Search Slice
            </h4>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                Source
              </label>
              <input
                type="text"
                value={editingSlice.source}
                disabled
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  background: 'var(--surface-hover)',
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                Keywords
              </label>
              <input
                type="text"
                value={editingSlice.params_json.keywords || ''}
                onChange={(e) => setEditingSlice({
                  ...editingSlice,
                  params_json: { ...editingSlice.params_json, keywords: e.target.value },
                })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                Location
              </label>
              <input
                type="text"
                value={editingSlice.params_json.location || ''}
                onChange={(e) => setEditingSlice({
                  ...editingSlice,
                  params_json: { ...editingSlice.params_json, location: e.target.value },
                })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>
                Interval (minutes)
              </label>
              <input
                type="number"
                value={editingSlice.min_interval_minutes}
                onChange={(e) => setEditingSlice({
                  ...editingSlice,
                  min_interval_minutes: parseInt(e.target.value, 10) || 360,
                })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditingSlice(null)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  background: 'var(--surface)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => updateSlice(editingSlice.id, {
                  params_json: editingSlice.params_json,
                  min_interval_minutes: editingSlice.min_interval_minutes,
                })}
                disabled={updatingId === editingSlice.id}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: 6,
                  background: 'var(--color-accent)',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {updatingId === editingSlice.id ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
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
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Source</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Keywords</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Location</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>New Jobs</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Empty Runs</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Interval</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Next Run</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {slices.map((slice) => (
              <tr 
                key={slice.id} 
                style={{ 
                  borderTop: '1px solid var(--border-subtle)',
                  opacity: updatingId === slice.id ? 0.5 : 1,
                  background: slice.is_cooling ? 'rgba(220, 38, 38, 0.05)' : 'transparent',
                }}
              >
                <td style={{ padding: '10px 12px', fontWeight: 500 }}>
                  {slice.source}
                </td>
                <td style={{ padding: '10px 12px', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {slice.keywords || '—'}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  {slice.location || '—'}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  {getStatusBadge(slice)}
                </td>
                <td style={{ 
                  padding: '10px 12px', 
                  textAlign: 'center',
                  color: slice.new_jobs_last > 0 ? 'var(--color-success)' : 'var(--text-muted)',
                  fontWeight: slice.new_jobs_last > 0 ? 600 : 400,
                }}>
                  {slice.new_jobs_last}
                </td>
                <td style={{ 
                  padding: '10px 12px', 
                  textAlign: 'center',
                  color: slice.consecutive_empty_runs >= 3 ? 'var(--color-error)' : 'var(--text-muted)',
                  fontWeight: slice.consecutive_empty_runs >= 3 ? 600 : 400,
                }}>
                  {slice.consecutive_empty_runs}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  {slice.min_interval_minutes}m
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12 }}>
                  {formatTime(slice.next_allowed_at)}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                    <button
                      onClick={() => toggleStatus(slice)}
                      disabled={updatingId === slice.id}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid var(--border)',
                        borderRadius: 4,
                        background: slice.status === 'active' ? 'var(--color-warning-bg)' : 'var(--color-success-bg)',
                        color: slice.status === 'active' ? 'var(--color-warning)' : 'var(--color-success)',
                        cursor: 'pointer',
                        fontSize: 11,
                      }}
                    >
                      {slice.status === 'active' ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={() => setEditingSlice(slice)}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid var(--border)',
                        borderRadius: 4,
                        background: 'var(--surface)',
                        cursor: 'pointer',
                        fontSize: 11,
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => resetCooldown(slice)}
                      disabled={updatingId === slice.id}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid var(--border)',
                        borderRadius: 4,
                        background: 'var(--surface)',
                        cursor: 'pointer',
                        fontSize: 11,
                      }}
                      title="Reset cooldown"
                    >
                      Reset
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
