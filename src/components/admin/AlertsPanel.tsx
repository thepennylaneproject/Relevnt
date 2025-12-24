import React, { useEffect, useState } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle, Zap, X } from 'lucide-react'
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
    const interval = setInterval(fetchAlerts, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [])

  async function fetchAlerts() {
    try {
      const { data, error: err } = await supabase
        .from('admin_alerts')
        .select('*')
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(10)

      if (err) throw err
      setAlerts(data || [])
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
        .from('admin_alerts')
        .update({ is_dismissed: true })
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
        .from('admin_alerts')
        .update({ is_read: true })
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
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />
      case 'medium':
        return <Zap className="w-5 h-5 text-yellow-500" />
      default:
        return <CheckCircle className="w-5 h-5 text-blue-500" />
    }
  }

  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200'
      case 'high':
        return 'bg-orange-50 border-orange-200'
      case 'medium':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  if (loading) return <div className="p-4 text-gray-500">Loading alerts...</div>

  if (error) {
    return <div className="p-4 bg-red-50 text-red-700 rounded border border-red-200">Error: {error}</div>
  }

  if (alerts.length === 0) {
    return (
      <div className="p-4 bg-green-50 text-green-700 rounded border border-green-200 flex items-center gap-2">
        <CheckCircle className="w-5 h-5" />
        <span>All systems operational - no active alerts</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className={`p-4 rounded border ${getSeverityBgColor(alert.severity)} flex items-start gap-3 ${
            !alert.is_read ? 'ring-2 ring-offset-1 ring-blue-300' : ''
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getSeverityIcon(alert.severity)}
          </div>

          <div className="flex-grow">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                {alert.description && (
                  <p className="text-sm text-gray-700 mt-1">{alert.description}</p>
                )}
                {alert.source_slug && (
                  <p className="text-xs text-gray-600 mt-1">
                    Source: <code className="bg-gray-200 px-1 py-0.5 rounded">{alert.source_slug}</code>
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(alert.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            {!alert.is_read && (
              <button
                onClick={() => markAsRead(alert.id)}
                className="text-sm px-2 py-1 bg-white rounded hover:bg-gray-100 transition"
                title="Mark as read"
              >
                Read
              </button>
            )}
            <button
              onClick={() => dismissAlert(alert.id)}
              className="text-gray-500 hover:text-gray-700 transition"
              title="Dismiss alert"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
