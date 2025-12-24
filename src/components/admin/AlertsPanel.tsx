import React, { useEffect, useState } from 'react'
import { CustomIcon } from '../ui/CustomIcon'
import { supabase } from '../../lib/supabase'

export interface Alert {
  id: string
  alert_type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description?: string
  source_slug?: string
  is_read: boolean
  is_dismissed: boolean
  created_at: string
  triggered_at?: string
  resolved_at?: string
}

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAlerts()

    // Subscribe to real-time updates on admin_alerts table
    const subscription = supabase
      .channel('admin_alerts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_alerts',
          filter: 'is_dismissed=eq.false',
        },
        () => {
          fetchAlerts()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function fetchAlerts() {
    try {
      const { data, error: err } = await supabase
        .from('admin_alerts' as any)
        .select('*')
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(10)

      if (err) throw err
      setAlerts((data as any) || [])
      setError(null)
    } catch (err) {
      console.error('Failed to fetch alerts:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function dismissAlert(alertId: string) {
    try {
      const { error: err } = await supabase
        .from('admin_alerts' as any)
        .update({ is_dismissed: true } as any)
        .eq('id', alertId)

      if (err) throw err
      setAlerts(alerts.filter(a => a.id !== alertId))
    } catch (err) {
      console.error('Failed to dismiss alert:', err)
    }
  }

  async function markAsRead(alertId: string) {
    try {
      const { error: err } = await supabase
        .from('admin_alerts' as any)
        .update({ is_read: true } as any)
        .eq('id', alertId)

      if (err) throw err
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, is_read: true } : a))
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <CustomIcon name="alert-circle" size={20} color="ink" style={{ color: '#dc2626' }} />
      case 'high':
        return <CustomIcon name="alert-circle" size={20} color="ink" style={{ color: '#ea580c' }} />
      case 'medium':
        return <CustomIcon name="zap" size={20} color="ink" style={{ color: '#ca8a04' }} />
      default:
        return <CustomIcon name="check-circle" size={20} color="ink" style={{ color: '#2563eb' }} />
    }
  }

  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
      case 'high':
        return 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
      case 'medium':
        return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
      default:
        return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin inline-block w-5 h-5 border-2 border-emerald border-t-transparent rounded-full" style={{ borderColor: '#013E30', borderTopColor: 'transparent' }} />
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Loading alerts…</p>
      </div>
    )
  }

  if (error) {
    return <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800">Error: {error}</div>
  }

  if (alerts.length === 0) {
    return (
      <div className="p-4 bg-emerald/10 text-emerald rounded-lg border border-emerald/20 flex items-center gap-2" style={{ backgroundColor: 'rgba(1, 62, 48, 0.1)', color: '#013E30', borderColor: 'rgba(1, 62, 48, 0.2)' }}>
        <CustomIcon name="check-circle" size={20} color="emerald" />
        <span>All systems operational - no active alerts</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className={`p-4 rounded-lg border ${getSeverityBgColor(alert.severity)} flex items-start gap-3 transition-all ${
            !alert.is_read ? 'ring-2 ring-offset-1 ring-emerald/30' : ''
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getSeverityIcon(alert.severity)}
          </div>

          <div className="flex-grow">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 style={{ fontWeight: 600, color: 'var(--text)' }}>{alert.title}</h3>
                {alert.description && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {alert.description}
                  </p>
                )}
                {alert.source_slug && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Source: <code style={{ background: 'var(--surface-input)', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>
                      {alert.source_slug}
                    </code>
                  </p>
                )}
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {new Date(alert.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            {!alert.is_read && (
              <button
                onClick={() => markAsRead(alert.id)}
                style={{
                  fontSize: '0.875rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Mark as read"
              >
                Read
              </button>
            )}
            <button
              onClick={() => dismissAlert(alert.id)}
              style={{
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '1.25rem',
                lineHeight: 1,
                border: 'none',
                background: 'transparent',
                padding: '2px 4px',
              }}
              className="hover:text-error dark:hover:text-red-400"
              title="Dismiss alert"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
