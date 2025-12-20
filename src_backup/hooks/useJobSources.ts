// src/hooks/useJobSources.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useJobSources() {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchSources() {
    setLoading(true);
    const { data, error } = await supabase
      .from('job_sources')
      .select('*')
      .order('name', { ascending: true });
    setLoading(false);
    if (!error && data) setSources(data);
  }

  async function updateSource(id: string, patch: Record<string, any>) {
    await supabase.from('job_sources').update(patch).eq('id', id);
    await fetchSources();
  }

  useEffect(() => {
    fetchSources();
  }, []);

  return { sources, loading, updateSource, refetch: fetchSources };
}