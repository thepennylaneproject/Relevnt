import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export type AutoApplySettings = {
  user_id: string;
  enabled: boolean;
  mode: 'review' | 'full';
  max_per_week: number;
  min_match_score: number;
  min_salary: number | null;
  apply_only_canonical: boolean;
  require_values_alignment: boolean;
};

type State = {
  loading: boolean;
  error: string | null;
  settings: AutoApplySettings | null;
};

export function useAutoApplySettings() {
  const { user } = useAuth();
  const [state, setState] = useState<State>({
    loading: false,
    error: null,
    settings: null,
  });

  const fetchSettings = useCallback(async () => {
    if (!user) return;
    setState((s) => ({ ...s, loading: true, error: null }));

    const { data, error } = await supabase
      .from('auto_apply_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      // if no row yet, we will create it lazily on first update
      if (error.code === 'PGRST116') {
        setState({ loading: false, error: null, settings: null });
        return;
      }
      setState({ loading: false, error: error.message, settings: null });
      return;
    }

    if (!data) {
      setState({ loading: false, error: null, settings: null });
      return;
    }

    setState({
      loading: false,
      error: null,
      settings: data as AutoApplySettings,
    });
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function saveSettings(patch: Partial<AutoApplySettings>) {
    if (!user) return;

    const existing = state.settings;

    // Upsert row for this user
    const payload = {
      ...(existing || { user_id: user.id }),
      ...patch,
    };

    const { data, error } = await supabase
      .from('auto_apply_settings')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      setState((s) => ({ ...s, error: error.message }));
      return;
    }

    setState((s) => ({
      ...s,
      error: null,
      settings: data as AutoApplySettings,
    }));
  }

  return {
    loading: state.loading,
    error: state.error,
    settings: state.settings,
    fetchSettings,
    saveSettings,
  };
}