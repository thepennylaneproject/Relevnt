import React, { useEffect, useState } from 'react'
import { TrendingUp, Calendar } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export interface DailyMetric {
  date: string
  total_inserted: number
  total_duplicates: number
  total_failed: number
  success_rate: number
  avg_duration_seconds: number
}

type TimeRange = '7d' | '30d' | '90d'

export function IngestionTrendsChart() {
  const [metrics, setMetrics] = useState<DailyMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')

  useEffect(() => {
    fetchMetrics()
  }, [timeRange])

  async function fetchMetrics() {
    try {
      setLoading(true)

      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysBack)

      const { data, error: err } = await supabase
        .from('daily_ingestion_metrics' as any)
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (err) throw err

      setMetrics((data as any) || [])
      setError(null)
    } catch (err) {
      console.error('Failed to fetch metrics:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const maxInserted = Math.max(...metrics.map(m => m.total_inserted || 0), 100)
  const maxDuplicates = Math.max(...metrics.map(m => m.total_duplicates || 0), 50)

  if (loading) {
    return <div className="text-gray-500 text-center py-4">Loading trends...</div>
  }

  if (error) {
    return <div className="bg-red-50 text-red-700 p-4 rounded border border-red-200">Error: {error}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Ingestion Trends
        </h3>
        <div className="flex gap-1 text-sm">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1 rounded ${timeRange === '7d' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
          >
            7d
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1 rounded ${timeRange === '30d' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
          >
            30d
          </button>
          <button
            onClick={() => setTimeRange('90d')}
            className={`px-3 py-1 rounded ${timeRange === '90d' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
          >
            90d
          </button>
        </div>
      </div>

      {metrics.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No data available for selected period</div>
      ) : (
        <>
          {/* Jobs Inserted Chart */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Jobs Inserted Per Day</h4>
            <div className="flex items-end gap-1 h-32 p-2 bg-gray-50 rounded border border-gray-200">
              {metrics.map((metric, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600"
                    style={{
                      height: `${(metric.total_inserted / maxInserted) * 100}%`,
                      minHeight: metric.total_inserted > 0 ? '4px' : '0px',
                    }}
                    title={`${metric.date}: ${metric.total_inserted} jobs`}
                  />
                  <div className="text-xs text-gray-500 text-center truncate w-full">
                    {new Date(metric.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Duplicates Chart */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Duplicates Detected Per Day</h4>
            <div className="flex items-end gap-1 h-20 p-2 bg-gray-50 rounded border border-gray-200">
              {metrics.map((metric, idx) => (
                <div key={idx} className="flex-1">
                  <div
                    className="w-full bg-orange-500 rounded-t transition-all hover:bg-orange-600"
                    style={{
                      height: `${(metric.total_duplicates / maxDuplicates) * 100}%`,
                      minHeight: metric.total_duplicates > 0 ? '2px' : '0px',
                    }}
                    title={`${metric.date}: ${metric.total_duplicates} duplicates`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Success Rate */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Success Rate</h4>
            <div className="flex items-end gap-1 h-20 p-2 bg-gray-50 rounded border border-gray-200">
              {metrics.map((metric, idx) => (
                <div key={idx} className="flex-1">
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                    style={{
                      height: `${metric.success_rate}%`,
                      minHeight: '2px',
                    }}
                    title={`${metric.date}: ${metric.success_rate.toFixed(1)}%`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-gray-200">
            <div className="text-center">
              <div className="text-xs text-gray-600">Total Inserted</div>
              <div className="text-lg font-semibold text-green-700">
                {metrics.reduce((sum, m) => sum + (m.total_inserted || 0), 0).toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Total Duplicates</div>
              <div className="text-lg font-semibold text-orange-700">
                {metrics.reduce((sum, m) => sum + (m.total_duplicates || 0), 0).toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Avg Success Rate</div>
              <div className="text-lg font-semibold text-blue-700">
                {(metrics.reduce((sum, m) => sum + (m.success_rate || 0), 0) / metrics.length).toFixed(1)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Days Tracked</div>
              <div className="text-lg font-semibold text-gray-700">
                {metrics.length}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
