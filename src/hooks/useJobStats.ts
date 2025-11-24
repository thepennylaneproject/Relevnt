// src/hooks/useJobStats.ts
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useJobStats() {
  const { user } = useAuth()
  const userId = user?.id
  const [total, setTotal] = useState(0)
  const [saved, setSaved] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const [{ count: totalCount }, { count: savedCount }] = await Promise.all([
          supabase
            .from('jobs')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId),
          supabase
            .from('jobs')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'saved'),
        ])
        setTotal(totalCount || 0)
        setSaved(savedCount || 0)
      } catch (err) {
        console.error(err)
        setError('Unable to load job stats.')
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [userId])

  return { total, saved, loading, error }
}