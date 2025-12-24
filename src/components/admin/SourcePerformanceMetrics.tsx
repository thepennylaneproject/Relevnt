import React, { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, AlertCircle, Zap } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export interface SourceMetric {
  source_slug: string
  success_rate_7d: number
  avg_jobs_per_run_7d: number
  total_runs_7d: number
  failed_runs_7d: number
  consecutive_failures: number
  last_error?: string
  last_error_at?: string
  is_degraded: boolean
  health_score: number
  updated_at: string
}

export function SourcePerformanceMetrics() {
  const [metrics, setMetrics] = useState<SourceMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'health' | 'success' | 'jobs'>('health')

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  async function fetchMetrics() {
    try {
      const { data, error: err } = await supabase
        .from('source_performance_metrics' as any)
        .select('*')
        .order('health_score', { ascending: false })

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

  const getSortedMetrics = () => {
    if (sortBy === 'success') {
      return [...metrics].sort((a, b) => b.success_rate_7d - a.success_rate_7d)
    } else if (sortBy === 'jobs') {
      return [...metrics].sort((a, b) => b.avg_jobs_per_run_7d - a.avg_jobs_per_run_7d)
    }
    return metrics
  }

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 border-green-300'
    if (score >= 70) return 'bg-yellow-100 border-yellow-300'
    if (score >= 50) return 'bg-orange-100 border-orange-300'
    return 'bg-red-100 border-red-300'
  }

  const getHealthTextColor = (score: number) => {
    if (score >= 90) return 'text-green-700'
    if (score >= 70) return 'text-yellow-700'
    if (score >= 50) return 'text-orange-700'
    return 'text-red-700'
  }

  if (loading) {
    return <div className="p-4 text-gray-500 text-center">Loading source metrics...</div>
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-700 rounded border border-red-200">Error: {error}</div>
  }

  const sortedMetrics = getSortedMetrics()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          Source Health & Performance
        </h3>
        <div className="flex gap-1 text-sm">
          <button
            onClick={() => setSortBy('health')}
            className={`px-2 py-1 rounded ${sortBy === 'health' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
          >
            Health
          </button>
          <button
            onClick={() => setSortBy('success')}
            className={`px-2 py-1 rounded ${sortBy === 'success' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
          >
            Success Rate
          </button>
          <button
            onClick={() => setSortBy('jobs')}
            className={`px-2 py-1 rounded ${sortBy === 'jobs' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
          >
            Jobs/Run
          </button>
        </div>
      </div>

      {sortedMetrics.length === 0 ? (
        <div className="p-4 text-center text-gray-500">No metrics available</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedMetrics.map(metric => (
            <div
              key={metric.source_slug}
              className={`p-4 rounded border-2 ${getHealthColor(metric.health_score)} ${
                metric.is_degraded ? 'ring-2 ring-offset-1 ring-red-400' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 capitalize">
                    {metric.source_slug.replace(/_/g, ' ')}
                  </h4>
                  {metric.is_degraded && (
                    <div className="flex items-center gap-1 text-xs text-red-700 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Degraded</span>
                    </div>
                  )}
                </div>

                <div className={`text-right`}>
                  <div className={`text-2xl font-bold ${getHealthTextColor(metric.health_score)}`}>
                    {metric.health_score}
                  </div>
                  <div className="text-xs text-gray-600">Health Score</div>
                </div>
              </div>

              {/* Success Rate */}
              <div className="mb-3 pb-3 border-b border-gray-300">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Success Rate (7d)</span>
                  <span className="font-semibold text-green-700">{metric.success_rate_7d.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-300 rounded h-2 mt-1">
                  <div
                    className="bg-green-500 h-2 rounded transition-all"
                    style={{ width: `${metric.success_rate_7d}%` }}
                  />
                </div>
              </div>

              {/* Runs & Jobs */}
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <div className="text-gray-600 text-xs">Runs (7d)</div>
                  <div className="font-semibold text-gray-900">{metric.total_runs_7d}</div>
                  {metric.failed_runs_7d > 0 && (
                    <div className="text-xs text-red-600">{metric.failed_runs_7d} failed</div>
                  )}
                </div>
                <div>
                  <div className="text-gray-600 text-xs">Avg Jobs/Run</div>
                  <div className="font-semibold text-gray-900">{metric.avg_jobs_per_run_7d}</div>
                </div>
              </div>

              {/* Failures */}
              {metric.consecutive_failures > 0 && (
                <div className="p-2 bg-red-50 rounded text-xs mb-3">
                  <div className="text-red-700 font-semibold">{metric.consecutive_failures} consecutive failures</div>
                  {metric.last_error && (
                    <div className="text-red-600 mt-1 truncate">{metric.last_error}</div>
                  )}
                </div>
              )}

              {/* Updated timestamp */}
              <div className="text-xs text-gray-500 text-right">
                {new Date(metric.updated_at).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
