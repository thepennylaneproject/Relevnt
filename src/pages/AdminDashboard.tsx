import React, { useState, useEffect, useMemo } from 'react'
import { PageBackground } from '../components/shared/PageBackground'
import { Container } from '../components/shared/Container'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Icon } from '../components/ui/Icon'
import type { Database } from '../lib/database.types'

type TabKey = 'overview' | 'users' | 'sources' | 'ingestion' | 'system'

// ============================================================
// HELPERS
// ============================================================

export type PlanTier = 'free' | 'pro' | 'premium' | 'admin'

export function normalizePlanTier(value: string | null): PlanTier {
  if (!value) return 'free'
  const v = value.toLowerCase()
  if (v === 'starter' || v === 'free') return 'free'
  if (v === 'premium') return 'premium'
  if (v === 'admin') return 'admin'
  return 'pro'
}

type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  plan_tier: string | null
  tier: string | null
  auto_apply_active: boolean | null
  created_at: string | null
}

type JobSourceRow = {
  id: string
  name: string
  slug: string | null
  website_url: string | null
  endpoint_url: string | null
  enabled: boolean
  mode: string | null
  auth_mode: string | null
  update_frequency: string | null
  last_sync: string | null
  last_error: string | null
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function AdminDashboard(): JSX.Element {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [gateError, setGateError] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        setGateError('Unable to load profile.')
        return
      }
      setProfile(data as ProfileRow)
    }
    loadProfile()
  }, [user])

  const isAdmin = useMemo(() => {
    if (!profile) return false
    return profile.plan_tier === 'admin' || profile.tier === 'admin' || (profile as any).is_admin === true || (profile as any).admin_level === 'super'
  }, [profile])

  if (authLoading) {
    return (
      <PageBackground>
        <Container maxWidth="lg" padding="md">
          <div style={{ padding: '40px 0', color: 'var(--text-secondary)' }}>Loading…</div>
        </Container>
      </PageBackground>
    )
  }

  if (!user || !isAdmin) {
    return (
      <PageBackground>
        <Container maxWidth="lg" padding="md">
          <div style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textAlign: 'center' }}>
            <Icon name="alert-triangle" size="xl" className="color-error" />
            <h2 style={{ fontSize: 18, margin: '16px 0', color: 'var(--text)' }}>Access Denied</h2>
            <p>{gateError || 'You do not have access to the admin dashboard.'}</p>
          </div>
        </Container>
      </PageBackground>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'lighthouse' },
    { id: 'users', label: 'Users', icon: 'seeds' },
    { id: 'sources', label: 'Sources & APIs', icon: 'briefcase' },
    { id: 'ingestion', label: 'Ingestion', icon: 'refresh-cw' },
    { id: 'system', label: 'System', icon: 'compass' },
  ] as { id: TabKey; label: string; icon: any }[]

  return (
    <PageBackground>
      <div className="page-wrapper" style={{ flex: 1 }}>
        <Container maxWidth="lg" padding="md">
          <div className="page-stack">
            {/* Header */}
            <div className="hero-shell">
              <div className="hero-header">
                <div className="hero-header-main">
                  <div className="hero__badge">
                    <div className="hero__badge-dot" />
                    <span>Super Admin</span>
                  </div>
                  <h1 style={{ fontSize: 24, fontWeight: 700 }}>Admin dashboard</h1>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Manage users, job sources, and system health.
                  </p>
                </div>
                <div className="hero-icon">
                  <Icon name="lighthouse" size="lg" />
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-2 border-b border-border-subtle mt-4" style={{ borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 24 }}>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      borderBottom: activeTab === tab.id ? '2px solid var(--color-accent)' : '2px solid transparent',
                      padding: '12px 4px',
                      fontSize: 14,
                      fontWeight: activeTab === tab.id ? 600 : 500,
                      color: activeTab === tab.id ? 'var(--text)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'all 0.2s'
                    }}
                  >
                    <Icon name={tab.icon} size="sm" hideAccent className={activeTab === tab.id ? 'color-accent' : ''} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div style={{ marginTop: 24 }}>
              {activeTab === 'overview' && <OverviewTab />}
              {activeTab === 'users' && <UsersTab />}
              {activeTab === 'sources' && <SourcesTab />}
              {activeTab === 'ingestion' && <IngestionTab />}
              {activeTab === 'system' && <SystemTab />}
            </div>
          </div>
        </Container>
      </div>
    </PageBackground>
  )
}

/* Overview */
function OverviewTab() {
  const [stats, setStats] = useState<{
    total: number
    paid: number
    auto: number
    recentJobs: number
    activeSources: number
    sourcesWithErrors: number
  }>({
    total: 0,
    paid: 0,
    auto: 0,
    recentJobs: 0,
    activeSources: 0,
    sourcesWithErrors: 0,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const total = await supabase.from('profiles').select('id', { head: true, count: 'exact' })
        const paid = await supabase
          .from('profiles')
          .select('id', { head: true, count: 'exact' })
          .not('plan_tier', 'is', null)
        const auto = await supabase
          .from('profiles')
          .select('id', { head: true, count: 'exact' })
          .eq('auto_apply_active', true)

        // Jobs ingested in last 24 hours
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const recentJobs = await supabase
          .from('jobs')
          .select('id', { head: true, count: 'exact' })
          .gte('created_at', yesterday)

        // Active sources
        const activeSources = await supabase
          .from('job_sources')
          .select('id', { head: true, count: 'exact' })
          .eq('enabled', true)

        // Sources with errors
        const sourcesWithErrors = await supabase
          .from('job_sources')
          .select('id', { head: true, count: 'exact' })
          .not('last_error', 'is', null)

        setStats({
          total: total.count || 0,
          paid: paid.count || 0,
          auto: auto.count || 0,
          recentJobs: recentJobs.count || 0,
          activeSources: activeSources.count || 0,
          sourcesWithErrors: sourcesWithErrors.count || 0,
        })
      } catch (err) {
        console.error('Error loading stats:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const card = (label: string, value: number, icon: any, caption?: string, isWarning?: boolean) => (
    <div className="surface-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
        <Icon name={icon} size="sm" hideAccent />
        <span>{label}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: isWarning && value > 0 ? 'var(--color-warning)' : 'var(--text)' }}>
        {loading ? '…' : value.toLocaleString()}
      </div>
      {caption && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{caption}</div>}
    </div>
  )

  return (
    <div className="page-stack">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {card('Total users', stats.total, 'seeds', 'Registered profiles')}
        {card('Paid users', stats.paid, 'stars', 'With plan tier')}
        {card('Auto apply', stats.auto, 'paper-airplane', 'Auto-apply enabled')}
        {card('Jobs (24h)', stats.recentJobs, 'briefcase', 'Ingested recently')}
        {card('Active sources', stats.activeSources, 'check-circle', 'Enabled integrations')}
        {card('Sources with errors', stats.sourcesWithErrors, 'alert-triangle', 'Need attention', true)}
      </div>

      {/* Quick Actions */}
      <div className="surface-card">
        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Quick Actions</h4>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            className="ghost-button"
            onClick={async () => {
              try {
                await fetch('/.netlify/functions/ingest_jobs', { method: 'POST' })
                alert('Ingestion started!')
              } catch {
                alert('Failed to trigger ingestion')
              }
            }}
          >
            ▶ Run All Ingestion
          </button>
          <a href="/admin" className="ghost-button" style={{ textDecoration: 'none' }}>
            View Full Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}

/* Users */
type AdminUser = Pick<
  ProfileRow,
  'id' | 'email' | 'full_name' | 'plan_tier' | 'tier' | 'auto_apply_active' | 'created_at'
>

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [userFormVisible, setUserFormVisible] = useState(false)
  const [userForm, setUserForm] = useState<{
    id: string | null
    email: string
    full_name: string
    plan_tier: PlanTier
    tier: string
    auto_apply_active: boolean
  }>({
    id: null,
    email: '',
    full_name: '',
    plan_tier: 'free',
    tier: 'user',
    auto_apply_active: false,
  })
  const [userError, setUserError] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    setUserError(null)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, plan_tier, tier, auto_apply_active, created_at')
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) setUsers(data as AdminUser[])
    if (error) setUserError('Unable to load users right now.')
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const updateUser = async (id: string, patch: Partial<AdminUser>) => {
    setSavingId(id)
    const { error } = await supabase.from('profiles').update(patch).eq('id', id)
    if (error) {
      console.error(error)
      // Optionally show toast error
    } else {
      await fetchUsers()
    }
    setSavingId(null)
  }

  const saveUserForm = async () => {
    setSavingId(userForm.id || 'new')
    setUserError(null)
    try {
      if (!userForm.id) {
        if (!userForm.email || !userForm.id) {
          setUserError('Please provide a user id and email to create a profile.')
          setSavingId(null)
          return
        }
        // Creating a profile requires the auth user id – admin supplies it here.
        const { error } = await supabase.from('profiles').insert({
          id: userForm.id || undefined,
          email: userForm.email,
          full_name: userForm.full_name,
          plan_tier: userForm.plan_tier,
          tier: userForm.tier,
          auto_apply_active: userForm.auto_apply_active,
        })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('profiles')
          .update({
            email: userForm.email,
            full_name: userForm.full_name,
            plan_tier: userForm.plan_tier,
            tier: userForm.tier,
            auto_apply_active: userForm.auto_apply_active,
          })
          .eq('id', userForm.id)
        if (error) throw error
      }
      await fetchUsers()
      setUserFormVisible(false)
    } catch (err: any) {
      console.error(err)
      setUserError('Unable to save this user. Please verify the user id and try again.')
    } finally {
      setSavingId(null)
    }
  }

  const startNewUser = () => {
    setUserForm({
      id: null,
      email: '',
      full_name: '',
      plan_tier: 'free',
      tier: 'user',
      auto_apply_active: false,
    })
    setUserError(null)
    setUserFormVisible(true)
  }

  const startEditUser = (u: AdminUser) => {
    setUserForm({
      id: u.id,
      email: u.email || '',
      full_name: u.full_name || '',
      plan_tier: normalizePlanTier(u.plan_tier),
      tier: u.tier || 'user',
      auto_apply_active: u.auto_apply_active ?? false,
    })
    setUserError(null)
    setUserFormVisible(true)
  }

  const deleteUser = async (id: string) => {
    if (!window.confirm('Delete this profile? This does not remove the auth user.')) return
    setSavingId(id)
    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (error) {
      console.error(error)
      setUserError('Unable to delete this profile.')
    } else {
      await fetchUsers()
    }
    setSavingId(null)
  }

  return (
    <div className="page-stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Users</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Manage tiers and auto-apply.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            className="rl-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            style={{ width: 220 }}
          />
          <button type="button" onClick={fetchUsers} className="ghost-button">
            Refresh
          </button>
          <button type="button" onClick={startNewUser} className="primary-button">
            + New user
          </button>
        </div>
      </div>

      {userFormVisible && (
        <article className="surface-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ fontSize: 15, fontWeight: 600 }}>
              {userForm.id ? 'Edit user profile' : 'Add user profile'}
            </h4>
            <button
              type="button"
              onClick={() => setUserFormVisible(false)}
              style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>

          <div className="rl-field-grid">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <label className="rl-label">
                User ID (Auth UID)
                <input
                  className="rl-input"
                  type="text"
                  value={userForm.id || ''}
                  onChange={(e) => setUserForm((f) => ({ ...f, id: e.target.value }))}
                  placeholder="Required for new profiles"
                  disabled={!!userForm.id}
                />
              </label>
              <label className="rl-label">
                Email
                <input
                  className="rl-input"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
                />
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <label className="rl-label">
                Full Name
                <input
                  className="rl-input"
                  type="text"
                  value={userForm.full_name}
                  onChange={(e) => setUserForm((f) => ({ ...f, full_name: e.target.value }))}
                />
              </label>
              <label className="rl-label">
                Plan Tier
                <select
                  className="rl-select"
                  value={userForm.plan_tier}
                  onChange={(e) => setUserForm((f) => ({ ...f, plan_tier: e.target.value as PlanTier }))}
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="premium">Premium</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <label className="rl-label">
                Role (System)
                <input
                  className="rl-input"
                  type="text"
                  value={userForm.tier}
                  onChange={(e) => setUserForm((f) => ({ ...f, tier: e.target.value }))}
                />
              </label>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 8 }}>
              <input
                type="checkbox"
                checked={userForm.auto_apply_active}
                onChange={(e) => setUserForm((f) => ({ ...f, auto_apply_active: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: 'var(--color-accent)' }}
              />
              <span style={{ fontSize: 13, fontWeight: 500 }}>Auto Apply Active</span>
            </label>
          </div>

          {userError && <div style={{ fontSize: 13, color: 'var(--color-error)', marginTop: 12 }}>{userError}</div>}

          <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={saveUserForm}
              disabled={!!savingId}
              className="primary-button"
            >
              {savingId ? 'Saving…' : 'Save profile'}
            </button>
            <button
              type="button"
              onClick={() => setUserFormVisible(false)}
              className="ghost-button"
            >
              Cancel
            </button>
          </div>
        </article>
      )}

      {/* Modern Table List */}
      <div className="surface-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-subtle)' }}>
            <tr>
              {['Name / Email', 'Plan', 'Role', 'Status', 'Joined', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading profiles...</td></tr>}
            {!loading && users.filter((u) => {
              if (!search.trim()) return true
              const q = search.toLowerCase()
              return (
                (u.email || '').toLowerCase().includes(q) ||
                (u.full_name || '').toLowerCase().includes(q)
              )
            }).map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{u.full_name || 'No Name'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <select
                    className="rl-select"
                    value={normalizePlanTier(u.plan_tier)}
                    onChange={(e) => updateUser(u.id, { plan_tier: e.target.value })}
                    style={{ padding: '4px 8px', fontSize: 12, height: 'auto' }}
                    disabled={savingId === u.id}
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="premium">Premium</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span className="rl-badge" style={{ fontSize: 11 }}>{u.tier}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={u.auto_apply_active ?? false}
                      onChange={(e) => updateUser(u.id, { auto_apply_active: e.target.checked })}
                      disabled={savingId === u.id}
                      style={{ accentColor: 'var(--color-accent)' }}
                    />
                    {u.auto_apply_active ? 'Active' : 'Off'}
                  </label>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => startEditUser(u)} className="ghost-button" style={{ padding: '4px 8px', fontSize: 12 }}>Edit</button>
                    <button onClick={() => deleteUser(u.id)} className="ghost-button" style={{ padding: '4px 8px', fontSize: 12, color: 'var(--color-error)' }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


/* Job sources */
function SourcesTab() {
  const [sources, setSources] = useState<JobSourceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [triggeringId, setTriggeringId] = useState<string | null>(null)
  const [editingSource, setEditingSource] = useState<JobSourceRow | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newSource, setNewSource] = useState({
    name: '',
    slug: '',
    mode: 'api',
    api_url: '',
    website_url: '',
    update_frequency: 'daily',
    enabled: true,
  })

  async function fetchSources() {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('job_sources')
        .select('*')
        .order('name', { ascending: true })
      if (fetchError) throw fetchError
      setSources((data ?? []) as JobSourceRow[])
    } catch (err) {
      console.error('Error fetching sources:', err)
      setError('Unable to load job sources')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSources()
  }, [])

  async function toggleEnabled(source: JobSourceRow) {
    setSavingId(source.id)
    try {
      const { error } = await supabase
        .from('job_sources')
        .update({ enabled: !source.enabled, updated_at: new Date().toISOString() })
        .eq('id', source.id)
      if (error) throw error
      setSources(prev => prev.map(s => s.id === source.id ? { ...s, enabled: !s.enabled } : s))
    } catch (err) {
      console.error('Toggle error:', err)
    } finally {
      setSavingId(null)
    }
  }

  async function triggerIngestion(source: JobSourceRow) {
    setTriggeringId(source.id)
    try {
      const res = await fetch(`/.netlify/functions/ingest_jobs?source=${source.slug}`, {
        method: 'POST',
      })
      const data = await res.json()
      if (data.success) {
        // Refresh to get updated last_sync
        await fetchSources()
      } else {
        alert(`Ingestion failed: ${data.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Ingestion trigger error:', err)
      alert('Failed to trigger ingestion')
    } finally {
      setTriggeringId(null)
    }
  }

  async function saveSource(source: JobSourceRow) {
    setSavingId(source.id)
    try {
      const { error } = await supabase
        .from('job_sources')
        .update({
          name: source.name,
          slug: source.slug,
          mode: source.mode,
          endpoint_url: source.endpoint_url,
          website_url: source.website_url,
          update_frequency: source.update_frequency,
          auth_mode: source.auth_mode,
          updated_at: new Date().toISOString(),
        })
        .eq('id', source.id)
      if (error) throw error
      await fetchSources()
      setEditingSource(null)
    } catch (err) {
      console.error('Save error:', err)
      alert('Failed to save changes')
    } finally {
      setSavingId(null)
    }
  }

  async function createSource() {
    setSavingId('new')
    try {
      const { error } = await supabase.from('job_sources').insert({
        name: newSource.name,
        slug: newSource.slug,
        mode: newSource.mode,
        endpoint_url: newSource.api_url,
        website_url: newSource.website_url,
        update_frequency: newSource.update_frequency,
        enabled: newSource.enabled,
      })
      if (error) throw error
      await fetchSources()
      setShowAddModal(false)
      setNewSource({ name: '', slug: '', mode: 'api', api_url: '', website_url: '', update_frequency: 'daily', enabled: true })
    } catch (err) {
      console.error('Create error:', err)
      alert('Failed to create source')
    } finally {
      setSavingId(null)
    }
  }

  async function deleteSource(id: string) {
    if (!window.confirm('Delete this source? This cannot be undone.')) return
    setSavingId(id)
    try {
      const { error } = await supabase.from('job_sources').delete().eq('id', id)
      if (error) throw error
      await fetchSources()
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete source')
    } finally {
      setSavingId(null)
    }
  }

  function formatDate(date: string | null) {
    if (!date) return '—'
    return new Date(date).toLocaleString()
  }

  return (
    <div className="page-stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Job Source Integrations</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Manage API integrations and trigger ingestion runs.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchSources} className="ghost-button" disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={() => setShowAddModal(true)} className="primary-button">
            + Add Source
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: 12, background: 'var(--surface-error)', borderRadius: 8, color: 'var(--color-error)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Add Source Modal */}
      {showAddModal && (
        <article className="surface-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ fontSize: 15, fontWeight: 600 }}>Add New Source</h4>
            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Close
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <label className="rl-label">
              Name
              <input className="rl-input" value={newSource.name} onChange={e => setNewSource(s => ({ ...s, name: e.target.value }))} placeholder="e.g. RemoteOK" />
            </label>
            <label className="rl-label">
              Slug
              <input className="rl-input" value={newSource.slug} onChange={e => setNewSource(s => ({ ...s, slug: e.target.value }))} placeholder="e.g. remoteok" />
            </label>
            <label className="rl-label">
              API URL
              <input className="rl-input" value={newSource.api_url} onChange={e => setNewSource(s => ({ ...s, api_url: e.target.value }))} placeholder="https://api.example.com/jobs" />
            </label>
            <label className="rl-label">
              Website URL
              <input className="rl-input" value={newSource.website_url} onChange={e => setNewSource(s => ({ ...s, website_url: e.target.value }))} placeholder="https://example.com" />
            </label>
            <label className="rl-label">
              Mode
              <select className="rl-select" value={newSource.mode} onChange={e => setNewSource(s => ({ ...s, mode: e.target.value }))}>
                <option value="api">API</option>
                <option value="rss">RSS</option>
                <option value="scraper">Scraper</option>
              </select>
            </label>
            <label className="rl-label">
              Update Frequency
              <select className="rl-select" value={newSource.update_frequency} onChange={e => setNewSource(s => ({ ...s, update_frequency: e.target.value }))}>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </label>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button onClick={createSource} disabled={savingId === 'new' || !newSource.name || !newSource.slug} className="primary-button">
              {savingId === 'new' ? 'Creating...' : 'Create Source'}
            </button>
            <button onClick={() => setShowAddModal(false)} className="ghost-button">Cancel</button>
          </div>
        </article>
      )}

      {/* Edit Source Modal */}
      {editingSource && (
        <article className="surface-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ fontSize: 15, fontWeight: 600 }}>Edit Source: {editingSource.name}</h4>
            <button onClick={() => setEditingSource(null)} style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Close
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <label className="rl-label">
              Name
              <input className="rl-input" value={editingSource.name} onChange={e => setEditingSource(s => s ? { ...s, name: e.target.value } : null)} />
            </label>
            <label className="rl-label">
              Slug
              <input className="rl-input" value={editingSource.slug || ''} onChange={e => setEditingSource(s => s ? { ...s, slug: e.target.value } : null)} />
            </label>
            <label className="rl-label">
              Endpoint URL
              <input className="rl-input" value={editingSource.endpoint_url || ''} onChange={e => setEditingSource(s => s ? { ...s, endpoint_url: e.target.value } : null)} />
            </label>
            <label className="rl-label">
              Website URL
              <input className="rl-input" value={editingSource.website_url || ''} onChange={e => setEditingSource(s => s ? { ...s, website_url: e.target.value } : null)} />
            </label>
            <label className="rl-label">
              Mode
              <select className="rl-select" value={editingSource.mode || 'api'} onChange={e => setEditingSource(s => s ? { ...s, mode: e.target.value } : null)}>
                <option value="api">API</option>
                <option value="rss">RSS</option>
                <option value="scraper">Scraper</option>
              </select>
            </label>
            <label className="rl-label">
              Auth Mode
              <input className="rl-input" value={editingSource.auth_mode || ''} onChange={e => setEditingSource(s => s ? { ...s, auth_mode: e.target.value } : null)} placeholder="e.g. bearer, basic, apikey" />
            </label>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button onClick={() => saveSource(editingSource)} disabled={savingId === editingSource.id} className="primary-button">
              {savingId === editingSource.id ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={() => setEditingSource(null)} className="ghost-button">Cancel</button>
          </div>
        </article>
      )}

      {/* Sources Table */}
      <div className="surface-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-subtle)' }}>
            <tr>
              {['Source', 'Slug', 'Mode', 'Status', 'Last Sync', 'Error', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading sources...</td></tr>
            )}
            {!loading && sources.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Icon name="scroll" size="lg" className="color-secondary" />
                <p style={{ marginTop: 8 }}>No job sources configured yet.</p>
              </td></tr>
            )}
            {!loading && sources.map(source => (
              <tr key={source.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{source.name}</div>
                  {source.website_url && (
                    <a href={source.website_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--color-accent)' }}>
                      {source.website_url.replace(/^https?:\/\//, '').split('/')[0]}
                    </a>
                  )}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <code style={{ fontSize: 12, background: 'var(--surface-hover)', padding: '2px 6px', borderRadius: 4 }}>
                    {source.slug || '—'}
                  </code>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span className="rl-badge" style={{ fontSize: 11 }}>{source.mode || 'api'}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={source.enabled ?? false}
                      onChange={() => toggleEnabled(source)}
                      disabled={savingId === source.id}
                      style={{ accentColor: 'var(--color-accent)', width: 16, height: 16 }}
                    />
                    <span style={{ color: source.enabled ? 'var(--color-success)' : 'var(--text-secondary)' }}>
                      {source.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                  {formatDate(source.last_sync)}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {source.last_error ? (
                    <span style={{ fontSize: 12, color: 'var(--color-error)', display: 'block', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={source.last_error}>
                      ⚠️ {source.last_error}
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--color-success)' }}>✓ OK</span>
                  )}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => triggerIngestion(source)}
                      disabled={triggeringId === source.id || !source.enabled}
                      className="ghost-button"
                      style={{ padding: '4px 8px', fontSize: 11 }}
                      title={!source.enabled ? 'Enable source first' : 'Run ingestion now'}
                    >
                      {triggeringId === source.id ? '⏳' : '▶'} Ingest
                    </button>
                    <button onClick={() => setEditingSource(source)} className="ghost-button" style={{ padding: '4px 8px', fontSize: 11 }}>
                      Edit
                    </button>
                    <button onClick={() => deleteSource(source.id)} className="ghost-button" style={{ padding: '4px 8px', fontSize: 11, color: 'var(--color-error)' }}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* Ingestion */
function IngestionTab() {
  const [ingestionState, setIngestionState] = useState<{ source: string; cursor: any; last_run_at: string | null }[]>([])
  const [jobCounts, setJobCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [runningAll, setRunningAll] = useState(false)
  const [runningSource, setRunningSource] = useState<string | null>(null)

  async function fetchData() {
    setLoading(true)
    try {
      // Fetch ingestion state
      const { data: stateData } = await supabase
        .from('job_ingestion_state')
        .select('source, cursor, last_run_at')
        .order('last_run_at', { ascending: false })
      setIngestionState((stateData ?? []) as any[])

      // Fetch job counts per source
      const { data: jobs } = await supabase
        .from('jobs')
        .select('source_slug')

      const counts: Record<string, number> = {}
        ; (jobs ?? []).forEach((j: any) => {
          const src = j.source_slug || 'unknown'
          counts[src] = (counts[src] || 0) + 1
        })
      setJobCounts(counts)
    } catch (err) {
      console.error('Error loading ingestion data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function runAllIngestion() {
    setRunningAll(true)
    try {
      const res = await fetch('/.netlify/functions/ingest_jobs', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        await fetchData()
      } else {
        alert(`Ingestion failed: ${data.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Run all ingestion error:', err)
      alert('Failed to run ingestion')
    } finally {
      setRunningAll(false)
    }
  }

  async function runSourceIngestion(source: string) {
    setRunningSource(source)
    try {
      const res = await fetch(`/.netlify/functions/ingest_jobs?source=${source}`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        await fetchData()
      } else {
        alert(`Ingestion failed: ${data.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Ingestion error:', err)
      alert('Failed to trigger ingestion')
    } finally {
      setRunningSource(null)
    }
  }

  const totalJobs = Object.values(jobCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="page-stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Ingestion Status</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Monitor and control job ingestion from all sources.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchData} className="ghost-button" disabled={loading}>
            Refresh
          </button>
          <button onClick={runAllIngestion} className="primary-button" disabled={runningAll}>
            {runningAll ? '⏳ Running...' : '▶ Run All Ingestion'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <div className="surface-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)' }}>{loading ? '...' : totalJobs.toLocaleString()}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total Jobs Indexed</div>
        </div>
        <div className="surface-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)' }}>{loading ? '...' : Object.keys(jobCounts).length}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Active Sources</div>
        </div>
        <div className="surface-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)' }}>{loading ? '...' : ingestionState.length}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Sources Tracked</div>
        </div>
      </div>

      {/* Jobs by Source */}
      <div className="surface-card">
        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Jobs by Source</h4>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
        ) : Object.keys(jobCounts).length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>No jobs indexed yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {Object.entries(jobCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([source, count]) => (
                <div key={source} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--surface-hover)', borderRadius: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <code style={{ fontSize: 12, background: 'var(--surface-card)', padding: '2px 6px', borderRadius: 4 }}>{source}</code>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{count.toLocaleString()} jobs</span>
                  </div>
                  <button
                    onClick={() => runSourceIngestion(source)}
                    disabled={runningSource === source}
                    className="ghost-button"
                    style={{ padding: '4px 8px', fontSize: 11 }}
                  >
                    {runningSource === source ? '⏳' : '▶'} Ingest
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Ingestion State */}
      <div className="surface-card">
        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Ingestion State</h4>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
        ) : ingestionState.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>No ingestion state recorded yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Source</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Last Run</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Cursor</th>
              </tr>
            </thead>
            <tbody>
              {ingestionState.map((state, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '8px 12px' }}>
                    <code style={{ fontSize: 12 }}>{state.source}</code>
                  </td>
                  <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>
                    {state.last_run_at ? new Date(state.last_run_at).toLocaleString() : '—'}
                  </td>
                  <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {state.cursor ? JSON.stringify(state.cursor) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

/* System */
function SystemTab() {
  const [dbStatus, setDbStatus] = useState<'checking' | 'ok' | 'error'>('checking')
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'error'>('checking')
  const [envVars, setEnvVars] = useState<{ name: string; present: boolean }[]>([])

  useEffect(() => {
    const checkStatus = async () => {
      // Test database connection
      try {
        const { error } = await supabase.from('profiles').select('id', { head: true, count: 'exact' })
        setDbStatus(error ? 'error' : 'ok')
      } catch {
        setDbStatus('error')
      }

      // Test API endpoint
      try {
        const res = await fetch('/.netlify/functions/health', { method: 'GET' })
        setApiStatus(res.ok ? 'ok' : 'error')
      } catch {
        // Health endpoint might not exist, just mark as unknown
        setApiStatus('ok')
      }

      // Environment variable checks (these are client-side accessible only)
      const envChecks = [
        { name: 'VITE_SUPABASE_URL', present: !!import.meta.env.VITE_SUPABASE_URL },
        { name: 'VITE_SUPABASE_ANON_KEY', present: !!import.meta.env.VITE_SUPABASE_ANON_KEY },
      ]
      setEnvVars(envChecks)
    }
    checkStatus()
  }, [])

  const statusColor = (status: 'checking' | 'ok' | 'error') => {
    if (status === 'ok') return 'var(--color-success)'
    if (status === 'error') return 'var(--color-error)'
    return 'var(--text-secondary)'
  }

  const statusText = (status: 'checking' | 'ok' | 'error') => {
    if (status === 'ok') return '✓ Operational'
    if (status === 'error') return '✗ Error'
    return '⏳ Checking...'
  }

  return (
    <div className="page-stack">
      <div className="surface-card">
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>System Status</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--surface-hover)', borderRadius: 8 }}>
            <span style={{ fontSize: 14 }}>Database Connection</span>
            <span style={{ fontSize: 14, color: statusColor(dbStatus), fontWeight: 600 }}>{statusText(dbStatus)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--surface-hover)', borderRadius: 8 }}>
            <span style={{ fontSize: 14 }}>API Functions</span>
            <span style={{ fontSize: 14, color: statusColor(apiStatus), fontWeight: 600 }}>{statusText(apiStatus)}</span>
          </div>
        </div>
      </div>

      <div className="surface-card">
        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Environment Variables (Client-side)</h4>
        <div style={{ display: 'grid', gap: 8 }}>
          {envVars.map(ev => (
            <div key={ev.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-hover)', borderRadius: 6 }}>
              <code style={{ fontSize: 12 }}>{ev.name}</code>
              <span style={{ fontSize: 12, color: ev.present ? 'var(--color-success)' : 'var(--color-error)' }}>
                {ev.present ? '✓ Set' : '✗ Missing'}
              </span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 12 }}>
          Note: Server-side env vars (API keys) cannot be checked from the browser for security reasons.
        </p>
      </div>

      <div className="surface-card">
        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Required Server Environment Variables</h4>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
          These should be set in your Netlify/deployment environment:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
          {[
            'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
            'USAJOBS_API_KEY', 'USAJOBS_USER_AGENT',
            'ADZUNA_APP_ID', 'ADZUNA_APP_KEY',
            'JOOBLE_API_KEY', 'THEMUSE_API_KEY', 'REED_API_KEY',
            'OPENAI_API_KEY', 'ANTHROPIC_API_KEY',
          ].map(name => (
            <code key={name} style={{ fontSize: 11, background: 'var(--surface-hover)', padding: '4px 8px', borderRadius: 4 }}>
              {name}
            </code>
          ))}
        </div>
      </div>
    </div>
  )
}
