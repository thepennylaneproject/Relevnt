import React, { useEffect, useState } from 'react'
import { CustomIcon } from '../ui/CustomIcon'
import { supabase } from '../../lib/supabase'

export interface ActivityLog {
  id: string
  run_id?: string
  sources_requested: string[]
  trigger_type: string
  status: 'running' | 'success' | 'partial' | 'failed'
  total_inserted: number
  total_duplicates: number
  total_failed: number
  started_at: string
  finished_at?: string
  duration_seconds?: number
  error_message?: string
  progress_percent: number
  created_at: string
}

export function IngestionActivityFeed() {
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchActivities()

    // Subscribe to real-time updates on ingestion_activity_log table
    const subscription = supabase
      .channel('ingestion_activity_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ingestion_activity_log',
        },
        () => {
          fetchActivities()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function fetchActivities() {
    try {
      const { data, error: err } = await supabase
        .from('ingestion_activity_log' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (err) throw err
      setActivities((data as any) || [])
      setError(null)
    } catch (err) {
      console.error('Failed to fetch activities:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CustomIcon name="zap" size={16} color="ink" style={{ color: '#2eac80' }} className="animate-pulse" />
      case 'success':
        return <CustomIcon name="check-circle" size={16} color="ink" style={{ color: '#2eac80' }} />
      case 'partial':
        return <CustomIcon name="alert-circle" size={16} color="ink" style={{ color: '#D4A16C' }} />
      case 'failed':
        return <CustomIcon name="alert-circle" size={16} color="ink" style={{ color: '#C86C6C' }} />
      default:
        return <CustomIcon name="compass" size={16} color="ink" style={{ color: '#8a8a8a' }} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-50 border-blue-200'
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'partial':
        return 'bg-yellow-50 border-yellow-200'
      case 'failed':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return '...'
    if (seconds < 60) return `${seconds}s`
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  }

  if (loading) {
    return <div className="p-4 text-gray-500 text-center">Loading activity...</div>
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-700 rounded border border-red-200">Error: {error}</div>
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-4">
        <CustomIcon name="compass" size={20} color="ink" style={{ color: '#013E30' }} />
        <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Recent Ingestion Activity</h3>
      </div>

      {activities.length === 0 ? (
        <div className="p-4 text-center text-gray-500">No recent activity</div>
      ) : (
        activities.map(activity => (
          <div
            key={activity.id}
            className={`p-3 rounded border ${getStatusColor(activity.status)} text-sm`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-grow">
                <div className="mt-0.5">{getStatusIcon(activity.status)}</div>
                <div>
                  <div className="font-medium text-gray-900">
                    {activity.sources_requested.join(', ')}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Trigger: <span className="font-mono bg-gray-200 px-1 rounded">{activity.trigger_type}</span>
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-gray-600">
                  {formatDuration(activity.duration_seconds)}
                </div>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-gray-600">Inserted:</span>
                <span className="ml-1 font-semibold text-green-700">{activity.total_inserted}</span>
              </div>
              <div>
                <span className="text-gray-600">Duplicates:</span>
                <span className="ml-1 font-semibold text-yellow-700">{activity.total_duplicates}</span>
              </div>
              <div>
                <span className="text-gray-600">Failed:</span>
                <span className="ml-1 font-semibold text-red-700">{activity.total_failed}</span>
              </div>
            </div>

            {activity.status === 'running' && activity.progress_percent > 0 && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded h-2">
                  <div
                    className="bg-blue-500 h-2 rounded transition-all"
                    style={{ width: `${activity.progress_percent}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600 mt-1">{activity.progress_percent}% complete</div>
              </div>
            )}

            {activity.error_message && (
              <div className="mt-2 p-2 bg-red-100 rounded text-red-700 text-xs font-mono">
                {activity.error_message.substring(0, 150)}
                {activity.error_message.length > 150 ? '...' : ''}
              </div>
            )}

            <div className="text-xs text-gray-500 mt-2">
              {new Date(activity.created_at).toLocaleString()}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
