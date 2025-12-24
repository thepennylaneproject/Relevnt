import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface AdminAlert {
  id: string
  alert_type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description?: string
  source_slug?: string
  metadata?: any
  is_read: boolean
  is_dismissed: boolean
  created_at: string
  triggered_at?: string
  resolved_at?: string
}

interface UseAdminAlertsOptions {
  refetchInterval?: number // milliseconds
  limit?: number
  onlyUnread?: boolean
}

export function useAdminAlerts(options: UseAdminAlertsOptions = {}) {
  const {
    refetchInterval = 10000,
    limit = 10,
    onlyUnread = true,
  } = options

  const [alerts, setAlerts] = useState<AdminAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  async function fetchAlerts() {
    try {
      let query = supabase
        .from('admin_alerts')
        .select('*')

      if (onlyUnread) {
        query = query.eq('is_dismissed', false)
      }

      const { data, error: err } = await query
        .order('created_at', { ascending: false })
        .limit(limit)

      if (err) throw err

      setAlerts(data || [])
      setError(null)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      console.error('Failed to fetch alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()

    if (refetchInterval > 0) {
      const interval = setInterval(fetchAlerts, refetchInterval)
      return () => clearInterval(interval)
    }
  }, [refetchInterval, limit, onlyUnread])

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
      throw err
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
      throw err
    }
  }

  return {
    alerts,
    loading,
    error,
    refetch: fetchAlerts,
    dismissAlert,
    markAsRead,
  }
}
