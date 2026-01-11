// src/hooks/useAdminUsers.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setLoading(false);
    if (!error && data) setUsers(data);
  }

  async function updateUser(id: string, patch: Record<string, any>) {
    await supabase.from('profiles').update(patch).eq('id', id);
    await fetchUsers();
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, updateUser, refetch: fetchUsers };
}