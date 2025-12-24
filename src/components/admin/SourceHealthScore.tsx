import React, { useEffect, useState } from 'react'
import { BarChart3, Zap } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export interface HealthFactor {
  name: string
  weight: number
  score: number
  description: string
}

export interface SourceHealth {
  source_slug: string
  health_score: number
  health_factors: {
    success_rate?: number
    failures?: number
    freshness?: number
    duplicates?: number
    [key: string]: number | undefined
  }
  success_rate_7d: number
  consecutive_failures: number
  updated_at: string
}

export function SourceHealthScore() {
  const [sources, setSources] = useState<SourceHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSource, setSelectedSource] = useState<SourceHealth | null>(null)

  useEffect(() => {
    fetchSourceHealth()
  }, [])

  async function fetchSourceHealth() {
    try {
      setLoading(true)

      const { data, error: err } = await supabase
        .from('source_performance_metrics' as any)
        .select('*')
        .order('health_score', { ascending: false })

      if (err) throw err

      setSources((data as any) || [])
      if (data && data.length > 0) {
        setSelectedSource(data[0] as any)
      }
      setError(null)
    } catch (err) {
      console.error('Failed to fetch health scores:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 90) return { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700', label: 'Excellent' }
    if (score >= 75) return { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700', label: 'Good' }
    if (score >= 60) return { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700', label: 'Fair' }
    if (score >= 40) return { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700', label: 'Poor' }
    return { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700', label: 'Critical' }
  }

  const getFactorBreakdown = (factors: Record<string, number | undefined>): HealthFactor[] => {
    const breakdown: HealthFactor[] = [
      {
        name: 'Success Rate',
        weight: 40,
        score: Math.min((factors['success_rate'] || 0) * 100, 100),
        description: '% of successful runs',
      },
      {
        name: 'Failure Resilience',
        weight: 30,
        score: Math.max(100 - ((factors['failures'] || 0) * 10), 0),
        description: 'Resistance to consecutive failures',
      },
      {
        name: 'Data Freshness',
        weight: 20,
        score: factors['freshness'] || 50,
        description: 'How recently data was ingested',
      },
      {
        name: 'Dedup Effectiveness',
        weight: 10,
        score: Math.max(100 - ((factors['duplicates'] || 0) * 2), 0),
        description: 'Low duplication rate',
      },
    ]
    return breakdown
  }

  if (loading) {
    return <div className="text-gray-500 text-center py-4">Loading health scores...</div>
  }

  if (error) {
    return <div className="bg-red-50 text-red-700 p-4 rounded border border-red-200">Error: {error}</div>
  }

  if (sources.length === 0) {
    return <div className="text-center text-gray-500 py-8">No health data available</div>
  }

  const selected = selectedSource
  const colors = selected ? getHealthColor(selected.health_score) : null
  const factors = selected ? getFactorBreakdown(selected.health_factors) : []
  const calculatedScore = factors.reduce((sum, f) => sum + (f.score * f.weight / 100), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Source Health Score Breakdown</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Source List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 mb-2">All Sources</h4>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {sources.map(source => {
              const sc = getHealthColor(source.health_score)
              return (
                <button
                  key={source.source_slug}
                  onClick={() => setSelectedSource(source)}
                  className={`w-full text-left p-2 rounded border transition ${
                    selected?.source_slug === source.source_slug
                      ? `${sc.bg} ${sc.border} border-2`
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {source.source_slug.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-sm font-bold ${sc.text}`}>
                      {source.health_score}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Detailed Breakdown */}
        {selected && colors && (
          <div className="lg:col-span-2 space-y-4">
            {/* Score Display */}
            <div className={`${colors.bg} ${colors.border} border-2 rounded-lg p-6 text-center`}>
              <div className="text-sm font-medium text-gray-600 mb-2">Health Score</div>
              <div className={`text-5xl font-bold ${colors.text} mb-2`}>
                {selected.health_score}
              </div>
              <div className={`text-sm font-medium ${colors.text}`}>
                {colors.label}
              </div>
              <div className="mt-4 pt-4 border-t border-current border-opacity-20">
                <div className="text-xs text-gray-600">
                  <div>Success Rate: {selected.success_rate_7d.toFixed(1)}%</div>
                  <div>Consecutive Failures: {selected.consecutive_failures}</div>
                  <div>Last Updated: {new Date(selected.updated_at).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Factor Breakdown */}
            <div className="space-y-3">
              {factors.map((factor, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{factor.name}</div>
                      <div className="text-xs text-gray-500">{factor.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">{factor.score.toFixed(0)}</div>
                      <div className="text-xs text-gray-500">({factor.weight}%)</div>
                    </div>
                  </div>

                  {/* Score Bar */}
                  <div className="w-full bg-gray-200 rounded h-2">
                    <div
                      className="bg-blue-500 h-2 rounded transition-all"
                      style={{ width: `${Math.min(factor.score, 100)}%` }}
                    />
                  </div>

                  {/* Contribution to Total */}
                  <div className="text-xs text-gray-500">
                    Contribution: {(factor.score * factor.weight / 100).toFixed(1)} points
                  </div>
                </div>
              ))}
            </div>

            {/* Total Score Calculation */}
            <div className="p-3 bg-gray-50 rounded border border-gray-200 text-xs">
              <div className="font-medium text-gray-900 mb-2">Score Calculation</div>
              <div className="space-y-1 text-gray-600">
                {factors.map((f, i) => (
                  <div key={i}>
                    {f.name}: {f.score.toFixed(0)} × {f.weight}% = {(f.score * f.weight / 100).toFixed(1)} pts
                  </div>
                ))}
                <div className="pt-1 border-t border-gray-300 font-medium text-gray-900">
                  Total: {calculatedScore.toFixed(1)} ≈ {Math.round(calculatedScore)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-5 gap-2 pt-4 border-t border-gray-200 text-xs">
        <div className="text-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1" />
          <div>90+</div>
          <div className="text-gray-500">Excellent</div>
        </div>
        <div className="text-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-1" />
          <div>75-89</div>
          <div className="text-gray-500">Good</div>
        </div>
        <div className="text-center">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-1" />
          <div>60-74</div>
          <div className="text-gray-500">Fair</div>
        </div>
        <div className="text-center">
          <div className="w-3 h-3 bg-orange-500 rounded-full mx-auto mb-1" />
          <div>40-59</div>
          <div className="text-gray-500">Poor</div>
        </div>
        <div className="text-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1" />
          <div>0-39</div>
          <div className="text-gray-500">Critical</div>
        </div>
      </div>
    </div>
  )
}
