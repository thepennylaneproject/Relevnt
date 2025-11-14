import  { useEffect, useState } from 'react';
import PageBackground from '../components/shared/PageBackground';
import { useAuth } from '../hooks/useAuth';
// [Inference] Adjust this import if your Supabase client lives somewhere else.
import { supabase } from '../lib/supabase';

type AdminUser = {
  id: string;
  email: string;
  full_name: string | null;
  plan_tier: string | null;
  role: string | null;
  status: string | null;
  created_at: string;
  last_login_at: string | null;
};

type JobSource = {
  id: string;
  name: string;
  slug: string;
  type: string;
  base_url: string | null;
  auth_type: string | null;
  enabled: boolean;
  weight: number | null;
  last_sync_at: string | null;
  last_sync_status: string | null;
  notes: string | null;
};

type TabKey = 'overview' | 'users' | 'sources';

function classNames(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

export default function AdminDashboard(): JSX.Element {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  return (
    <PageBackground version="v2" overlayOpacity={0.12}>
      <div className="min-h-screen px-6 py-8 flex justify-center">
        <div className="w-full max-w-6xl space-y-8">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                Admin Dashboard
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Manage users, plans and job sources from a single control room.
              </p>
              {user?.email && (
                <p className="text-xs text-slate-400 mt-1">
                  Signed in as <span className="font-medium">{user.email}</span>
                </p>
              )}
            </div>
          </header>

          {/* Tabs */}
          <nav className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
            {(
              [
                { id: 'overview', label: 'Overview' },
                { id: 'users', label: 'Users' },
                { id: 'sources', label: 'Job Sources' },
              ] as { id: TabKey; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={classNames(
                  'px-3 py-2 text-sm border-b-2 -mb-px transition',
                  activeTab === tab.id
                    ? 'border-sky-600 text-sky-700 dark:text-sky-300'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <section>
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'sources' && <SourcesTab />}
          </section>
        </div>
      </div>
    </PageBackground>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 OVERVIEW                                   */
/* -------------------------------------------------------------------------- */

function OverviewTab() {
  const [stats, setStats] = useState<{
    totalUsers: number;
    activeUsers: number;
    adminCount: number;
    enabledSources: number;
  }>({
    totalUsers: 0,
    activeUsers: 0,
    adminCount: 0,
    enabledSources: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      // [Inference] Adjust table and column names if yours differ.
      const { data: users } = await supabase
        .from('profiles')
        .select('id, role, status');

      const { data: sources } = await supabase
        .from('job_sources')
        .select('id, enabled');

      if (cancelled) return;

      const totalUsers = users?.length || 0;
      const activeUsers =
        users?.filter((u: any) => u.status === 'active').length || 0;
      const adminCount =
        users?.filter((u: any) => u.role === 'admin').length || 0;
      const enabledSources =
        sources?.filter((s: any) => s.enabled).length || 0;

      setStats({ totalUsers, activeUsers, adminCount, enabledSources });
    }

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const cardClass =
    'rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm px-4 py-3 flex flex-col gap-1';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className={cardClass}>
        <span className="text-xs uppercase tracking-wide text-slate-400">
          Total users
        </span>
        <span className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          {stats.totalUsers}
        </span>
      </div>
      <div className={cardClass}>
        <span className="text-xs uppercase tracking-wide text-slate-400">
          Active users
        </span>
        <span className="text-2xl font-semibold text-emerald-600">
          {stats.activeUsers}
        </span>
      </div>
      <div className={cardClass}>
        <span className="text-xs uppercase tracking-wide text-slate-400">
          Admins
        </span>
        <span className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          {stats.adminCount}
        </span>
      </div>
      <div className={cardClass}>
        <span className="text-xs uppercase tracking-wide text-slate-400">
          Enabled sources
        </span>
        <span className="text-2xl font-semibold text-sky-600">
          {stats.enabledSources}
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   USERS                                    */
/* -------------------------------------------------------------------------- */

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select(
        'id, email, full_name, plan_tier, role, status, created_at, last_login_at'
      )
      .order('created_at', { ascending: false });

    setLoading(false);
    if (!error && data) {
      setUsers(data as AdminUser[]);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function updateUser(id: string, patch: Partial<AdminUser>) {
    setUpdatingId(id);
    await supabase.from('profiles').update(patch).eq('id', id);
    setUpdatingId(null);
    fetchUsers();
  }

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.full_name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Users
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Search, change plan tiers, and manage account status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            type="button"
            onClick={fetchUsers}
            className="px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/60 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Plan</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Last login</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-3 py-4 text-center text-slate-500" colSpan={7}>
                  Loading users…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-center text-slate-500" colSpan={7}>
                  No users found.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-slate-100 dark:border-slate-800"
                >
                  <td className="px-3 py-2">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900 dark:text-slate-50">
                        {u.full_name || 'Unnamed'}
                      </span>
                      <span className="text-xs text-slate-500">{u.email}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={u.plan_tier || 'starter'}
                      onChange={(e) =>
                        updateUser(u.id, { plan_tier: e.target.value })
                      }
                      className="text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1"
                      disabled={updatingId === u.id}
                    >
                      <option value="starter">Starter</option>
                      <option value="pro">Pro</option>
                      <option value="premium">Premium</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={u.role || 'user'}
                      onChange={(e) => updateUser(u.id, { role: e.target.value })}
                      className="text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1"
                      disabled={updatingId === u.id}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={u.status || 'active'}
                      onChange={(e) =>
                        updateUser(u.id, { status: e.target.value })
                      }
                      className={classNames(
                        'text-xs rounded px-2 py-1 border',
                        u.status === 'suspended'
                          ? 'border-amber-300 bg-amber-50 text-amber-900'
                          : u.status === 'deleted'
                            ? 'border-rose-300 bg-rose-50 text-rose-900'
                            : 'border-emerald-300 bg-emerald-50 text-emerald-900'
                      )}
                      disabled={updatingId === u.id}
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="deleted">Deleted</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString()
                      : '–'}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {u.last_login_at
                      ? new Date(u.last_login_at).toLocaleDateString()
                      : '–'}
                  </td>
                  <td className="px-3 py-2 text-right text-xs">
                    {updatingId === u.id && (
                      <span className="text-slate-400">Saving…</span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               JOB SOURCES                                  */
/* -------------------------------------------------------------------------- */

function SourcesTab() {
  const [sources, setSources] = useState<JobSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function fetchSources() {
    setLoading(true);
    const { data, error } = await supabase
      .from('job_sources')
      .select(
        'id, name, slug, type, base_url, auth_type, enabled, weight, last_sync_at, last_sync_status, notes'
      )
      .order('name', { ascending: true });

    setLoading(false);
    if (!error && data) setSources(data as JobSource[]);
  }

  useEffect(() => {
    fetchSources();
  }, []);

  async function updateSource(id: string, patch: Partial<JobSource>) {
    setUpdatingId(id);
    await supabase.from('job_sources').update(patch).eq('id', id);
    setUpdatingId(null);
    fetchSources();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Job sources
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Toggle job boards and adjust their influence on ranking.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchSources}
          className="px-3 py-2 text-xs rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/60 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Enabled</th>
              <th className="px-3 py-2">Weight</th>
              <th className="px-3 py-2">Last sync</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-slate-500">
                  Loading sources…
                </td>
              </tr>
            )}
            {!loading && sources.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-slate-500">
                  No job sources yet. Create rows in the job_sources table to get
                  started.
                </td>
              </tr>
            )}
            {!loading &&
              sources.map((s) => (
                <tr
                  key={s.id}
                  className="border-t border-slate-100 dark:border-slate-800 align-top"
                >
                  <td className="px-3 py-2">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900 dark:text-slate-50">
                        {s.name}
                      </span>
                      <span className="text-xs text-slate-500">{s.slug}</span>
                      {s.base_url && (
                        <span className="text-[11px] text-slate-400 truncate max-w-xs">
                          {s.base_url}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                    {s.type || 'api'}
                  </td>
                  <td className="px-3 py-2">
                    <label className="inline-flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={s.enabled}
                        onChange={(e) =>
                          updateSource(s.id, { enabled: e.target.checked })
                        }
                        disabled={updatingId === s.id}
                      />
                      <span>{s.enabled ? 'Enabled' : 'Disabled'}</span>
                    </label>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={s.weight ?? 50}
                      onChange={(e) =>
                        updateSource(s.id, { weight: Number(e.target.value) })
                      }
                      disabled={updatingId === s.id}
                    />
                    <span className="ml-2 text-xs text-slate-600 dark:text-slate-300">
                      {s.weight ?? 50}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {s.last_sync_at
                      ? new Date(s.last_sync_at).toLocaleString()
                      : 'Never'}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <span
                      className={classNames(
                        'inline-flex items-center rounded-full px-2 py-0.5 border',
                        s.last_sync_status === 'ok'
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                          : s.last_sync_status === 'error'
                            ? 'border-rose-300 bg-rose-50 text-rose-900'
                            : 'border-slate-300 bg-slate-50 text-slate-700'
                      )}
                    >
                      {s.last_sync_status || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500 max-w-xs">
                    {s.notes || '–'}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}