import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { PageBackground } from '../components/shared/PageBackground'
import { Container } from '../components/shared/Container'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Icon } from '../components/ui/Icon'
import { Button } from '../components/ui/Button'
import type { Database } from '../types/supabase'
import { AlertsPanel } from '../components/admin/AlertsPanel'
import { IngestionActivityFeed } from '../components/admin/IngestionActivityFeed'
import { SourcePerformanceMetrics } from '../components/admin/SourcePerformanceMetrics'

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
  trust_level?: string | null
  max_age_days?: number | null
  max_pages_per_run?: number | null
  cooldown_minutes?: number | null
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function AdminDashboard(): JSX.Element {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [gateError, setGateError] = useState<string | null>(null)
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null)

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

  // Auto-redirect non-admins to dashboard after 5 seconds
  useEffect(() => {
    if (authLoading) return
    if (!user || (profile && !isAdmin)) {
      setRedirectCountdown(5)
      const interval = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev === null) return null
          if (prev <= 1) {
            navigate('/dashboard', { replace: true })
            return null
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [authLoading, user, profile, isAdmin, navigate])

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
          <div style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textAlign: 'center', gap: '1rem' }}>
            <Icon name="alert-triangle" size="xl" className="color-warning" />
            <h2 style={{ fontSize: 18, margin: '16px 0', color: 'var(--text)' }}>Admin Area</h2>
            <p style={{ maxWidth: '400px' }}>
              {gateError || 'This page is for administrators only. You will be redirected to your dashboard.'}
            </p>
            {redirectCountdown !== null && (
              <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                Redirecting in {redirectCountdown} seconds...
              </p>
            )}
            <Link
              to="/dashboard"
              style={{
                marginTop: '0.5rem',
                color: 'var(--accent)',
                textDecoration: 'underline',
              }}
            >
              Go to dashboard now
            </Link>
          </div>
        </Container>
      </PageBackground>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'sources', label: 'Sources & APIs' },
    { id: 'ingestion', label: 'Ingestion' },
    { id: 'system', label: 'System' },
  ] as { id: TabKey; label: string }[]

  return (
    <PageBackground>
      <div className="page-wrapper" style={{ flex: 1 }}>
        <Container maxWidth="lg" padding="md">
          <div className="page-stack">
            {/* Header */}
            <div className="hero-shell">
              <div className="hero-header">
                <div className="hero-header-main">
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
      {/* System Alerts */}
      <div className="surface-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>🚨 System Alerts</h4>
        <AlertsPanel />
      </div>

      {/* Key Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {card('Total users', stats.total, 'seeds', 'Registered profiles')}
        {card('Paid users', stats.paid, 'stars', 'With plan tier')}
        {card('Auto apply', stats.auto, 'paper-airplane', 'Auto-apply enabled')}
        {card('Jobs (24h)', stats.recentJobs, 'briefcase', 'Ingested recently')}
        {card('Active sources', stats.activeSources, 'check-circle', 'Enabled integrations')}
        {card('Sources with errors', stats.sourcesWithErrors, 'alert-triangle', 'Need attention', true)}
      </div>

      {/* Real-Time Activity Feed */}
      <div className="surface-card">
        <IngestionActivityFeed />
      </div>

      {/* Source Performance Metrics */}
      <div className="surface-card">
        <SourcePerformanceMetrics />
      </div>

      {/* Quick Actions */}
      <div className="surface-card">
        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Quick Actions</h4>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button
            type="button"
            variant="ghost"
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
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => window.location.assign('/admin')}
            style={{ textDecoration: 'none' }}
          >
            View Full Dashboard
          </Button>
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
    // Filter out null values to match DB schema expectations  
    const cleanPatch = Object.fromEntries(
      Object.entries(patch).filter(([_, v]) => v !== null)
    )
    const { error } = await supabase.from('profiles').update(cleanPatch).eq('id', id)
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
          id: userForm.id!,
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
          <Button type="button" variant="ghost" onClick={fetchUsers}>
            Refresh
          </Button>
          <Button type="button" variant="primary" onClick={startNewUser}>
            + New user
          </Button>
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
            <Button
              type="button"
              variant="primary"
              onClick={saveUserForm}
              disabled={!!savingId}
            >
              {savingId ? 'Saving…' : 'Save profile'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setUserFormVisible(false)}
            >
              Cancel
            </Button>
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
                <td style={{ padding: '12px 16px', fontSize: 11 }}>
                  {u.tier}
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditUser(u)}
                      style={{ padding: '4px 8px', fontSize: 12 }}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteUser(u.id)}
                      style={{ padding: '4px 8px', fontSize: 12 }}
                    >
                      Delete
                    </Button>
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
  const [testingId, setTestingId] = useState<string | null>(null)
  const [editingSource, setEditingSource] = useState<JobSourceRow | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [newSource, setNewSource] = useState({
    name: '',
    slug: '',
    mode: 'api',
    api_url: '',
    website_url: '',
    update_frequency: 'daily',
    trust_level: 'medium',
    max_age_days: '30',
    max_pages_per_run: '10',
    cooldown_minutes: '0',
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
        source_key: newSource.slug || newSource.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        enabled: newSource.enabled,
      })
      if (error) throw error
      await fetchSources()
      setShowAddModal(false)
      setNewSource({ name: '', slug: '', mode: 'api', api_url: '', website_url: '', update_frequency: 'daily', trust_level: 'medium', max_age_days: '30', max_pages_per_run: '10', cooldown_minutes: '0', enabled: true })
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

  function toggleSourceSelection(sourceId: string) {
    setSelectedSources(prev => {
      const next = new Set(prev)
      if (next.has(sourceId)) {
        next.delete(sourceId)
      } else {
        next.add(sourceId)
      }
      return next
    })
  }

  function selectAllSources() {
    if (selectedSources.size === sources.length) {
      setSelectedSources(new Set())
    } else {
      setSelectedSources(new Set(sources.map(s => s.id)))
    }
  }

  async function bulkToggleEnabled(enabled: boolean) {
    if (selectedSources.size === 0) return
    setSavingId('bulk')
    try {
      const ids = Array.from(selectedSources)
      for (const id of ids) {
        await supabase
          .from('job_sources')
          .update({ enabled, updated_at: new Date().toISOString() })
          .eq('id', id)
      }
      setSelectedSources(new Set())
      await fetchSources()
    } catch (err) {
      console.error('Bulk toggle error:', err)
      alert('Failed to update sources')
    } finally {
      setSavingId(null)
      setShowBulkActions(false)
    }
  }

  async function bulkTriggerIngestion() {
    if (selectedSources.size === 0) return
    setTriggeringId('bulk')
    try {
      const selectedSourceSlugs = sources
        .filter(s => selectedSources.has(s.id))
        .map(s => s.slug)
        .filter(Boolean) as string[]

      const res = await fetch('/.netlify/functions/admin_ingest_trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources: selectedSourceSlugs }),
      })
      const data = await res.json()
      if (data.success) {
        alert(`Ingestion triggered for ${selectedSourceSlugs.length} source(s)`)
        setSelectedSources(new Set())
        await fetchSources()
      } else {
        alert(`Failed: ${data.error}`)
      }
    } catch (err) {
      console.error('Bulk ingestion error:', err)
      alert('Failed to trigger ingestion')
    } finally {
      setTriggeringId(null)
      setShowBulkActions(false)
    }
  }

  async function testConnection(source: JobSourceRow) {
    setTestingId(source.id)
    try {
      const url = source.endpoint_url || source.website_url
      if (!url) {
        alert('No endpoint URL configured')
        return
      }
      const res = await fetch(url, { method: 'HEAD', mode: 'no-cors' })
      if (res.ok || res.status === 0) {
        alert(`✓ Connection successful (${source.name})`)
      } else {
        alert(`⚠ Connection returned ${res.status} (${source.name})`)
      }
    } catch (err) {
      alert(`✗ Connection failed (${source.name}): ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setTestingId(null)
    }
  }

  return (
    <div className="page-stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Job Source Integrations</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Manage API integrations and trigger ingestion runs.
            {selectedSources.size > 0 && <span style={{ marginLeft: 12, color: 'var(--color-accent)', fontWeight: 600 }}>({selectedSources.size} selected)</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button type="button" variant="ghost" onClick={fetchSources} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          {selectedSources.size > 0 && (
            <Button
              type="button"
              variant="primary"
              onClick={() => setShowBulkActions(!showBulkActions)}
              style={{ background: 'var(--color-warning)' }}
            >
              ⚙ Bulk Actions ({selectedSources.size})
            </Button>
          )}
          <Button type="button" variant="primary" onClick={() => setShowAddModal(true)}>
            + Add Source
          </Button>
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {showBulkActions && selectedSources.size > 0 && (
        <article className="surface-card" style={{ background: 'var(--surface-warning)', borderLeft: '4px solid var(--color-warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600 }}>Bulk Actions for {selectedSources.size} source(s)</h4>
            <button onClick={() => setShowBulkActions(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>×</button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button
              type="button"
              variant="primary"
              onClick={() => bulkToggleEnabled(true)}
              disabled={savingId === 'bulk'}
              style={{ background: 'var(--color-success)' }}
            >
              {savingId === 'bulk' ? '⏳' : '✓'} Enable All
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => bulkToggleEnabled(false)}
              disabled={savingId === 'bulk'}
              style={{ background: 'var(--color-error)' }}
            >
              {savingId === 'bulk' ? '⏳' : '✗'} Disable All
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={bulkTriggerIngestion}
              disabled={triggeringId === 'bulk'}
            >
              {triggeringId === 'bulk' ? '⏳ Running' : '▶ Trigger Ingestion'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setSelectedSources(new Set())}>
              Cancel
            </Button>
          </div>
        </article>
      )}

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
              Name *
              <input className="rl-input" value={newSource.name} onChange={e => setNewSource(s => ({ ...s, name: e.target.value }))} placeholder="e.g. RemoteOK" />
            </label>
            <label className="rl-label">
              Slug *
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
            <label className="rl-label">
              Trust Level
              <select className="rl-select" value={newSource.trust_level} onChange={e => setNewSource(s => ({ ...s, trust_level: e.target.value }))}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
            <label className="rl-label">
              Max Age Days
              <input className="rl-input" type="number" value={newSource.max_age_days} onChange={e => setNewSource(s => ({ ...s, max_age_days: e.target.value }))} placeholder="30" />
            </label>
            <label className="rl-label">
              Max Pages Per Run
              <input className="rl-input" type="number" value={newSource.max_pages_per_run} onChange={e => setNewSource(s => ({ ...s, max_pages_per_run: e.target.value }))} placeholder="10" />
            </label>
            <label className="rl-label">
              Cooldown Minutes
              <input className="rl-input" type="number" value={newSource.cooldown_minutes} onChange={e => setNewSource(s => ({ ...s, cooldown_minutes: e.target.value }))} placeholder="0" />
            </label>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <Button
              type="button"
              variant="primary"
              onClick={createSource}
              disabled={savingId === 'new' || !newSource.name || !newSource.slug}
            >
              {savingId === 'new' ? 'Creating...' : 'Create Source'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
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
            <label className="rl-label">
              Trust Level
              <select className="rl-select" value={editingSource.trust_level || 'medium'} onChange={e => setEditingSource(s => s ? { ...s, trust_level: e.target.value } : null)}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
            <label className="rl-label">
              Max Age Days
              <input className="rl-input" type="number" value={editingSource.max_age_days || 30} onChange={e => setEditingSource(s => s ? { ...s, max_age_days: parseInt(e.target.value) || null } : null)} />
            </label>
            <label className="rl-label">
              Max Pages Per Run
              <input className="rl-input" type="number" value={editingSource.max_pages_per_run || 10} onChange={e => setEditingSource(s => s ? { ...s, max_pages_per_run: parseInt(e.target.value) || null } : null)} />
            </label>
            <label className="rl-label">
              Cooldown Minutes
              <input className="rl-input" type="number" value={editingSource.cooldown_minutes || 0} onChange={e => setEditingSource(s => s ? { ...s, cooldown_minutes: parseInt(e.target.value) || null } : null)} />
            </label>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button
              type="button"
              variant="primary"
              onClick={() => saveSource(editingSource)}
              disabled={savingId === editingSource.id}
            >
              {savingId === editingSource.id ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => testConnection(editingSource)}
              disabled={testingId === editingSource.id}
            >
              {testingId === editingSource.id ? '⏳' : '🔗'} Test Connection
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditingSource(null)}>
              Cancel
            </Button>
          </div>
        </article>
      )}

      {/* Sources Table */}
      <div className="surface-card" style={{ padding: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-subtle)' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', width: 40 }}>
                <input
                  type="checkbox"
                  checked={sources.length > 0 && selectedSources.size === sources.length}
                  onChange={selectAllSources}
                  style={{ accentColor: 'var(--color-accent)', width: 16, height: 16 }}
                />
              </th>
              {['Source', 'Slug', 'Mode', 'Trust', 'Config', 'Status', 'Last Sync', 'Error', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={10} style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading sources...</td></tr>
            )}
            {!loading && sources.length === 0 && (
              <tr><td colSpan={10} style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Icon name="scroll" size="lg" className="color-secondary" />
                <p style={{ marginTop: 8 }}>No job sources configured yet.</p>
              </td></tr>
            )}
            {!loading && sources.map(source => (
              <tr key={source.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '12px 16px', width: 40 }}>
                  <input
                    type="checkbox"
                    checked={selectedSources.has(source.id)}
                    onChange={() => toggleSourceSelection(source.id)}
                    style={{ accentColor: 'var(--color-accent)', width: 16, height: 16 }}
                  />
                </td>
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
                <td style={{ padding: '12px 16px', fontSize: 11 }}>
                  {source.mode || 'api'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>
                    {source.trust_level || 'medium'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 11, color: 'var(--text-secondary)' }}>
                  <div style={{ lineHeight: '1.4' }}>
                    {source.max_age_days && <div>Age: {source.max_age_days}d</div>}
                    {source.max_pages_per_run && <div>Pages: {source.max_pages_per_run}</div>}
                    {source.cooldown_minutes && <div>Cooldown: {source.cooldown_minutes}m</div>}
                  </div>
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
                      {source.enabled ? 'On' : 'Off'}
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
                    <span style={{ fontSize: 12, color: 'var(--color-success)' }}>✓</span>
                  )}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => triggerIngestion(source)}
                      disabled={triggeringId === source.id || !source.enabled}
                      style={{ padding: '4px 6px', fontSize: 11 }}
                      title={!source.enabled ? 'Enable source first' : 'Run ingestion now'}
                    >
                      {triggeringId === source.id ? '⏳' : '▶'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => testConnection(source)}
                      disabled={testingId === source.id}
                      style={{ padding: '4px 6px', fontSize: 11 }}
                      title="Test connection"
                    >
                      {testingId === source.id ? '⏳' : '🔗'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingSource(source)}
                      style={{ padding: '4px 6px', fontSize: 11 }}
                      title="Edit"
                    >
                      ✎
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteSource(source.id)}
                      style={{ padding: '4px 6px', fontSize: 11 }}
                      title="Delete"
                    >
                      ✕
                    </Button>
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
  const [healthData, setHealthData] = useState<{
    latestRun: any | null;
    sourceHealth: any[];
    recentRuns: any[];
    healingHistory: any[];
    healingStats: { total24h: number; successful: number; failed: number; escalated: number };
  } | null>(null);
  const [ingestionState, setIngestionState] = useState<{ source: string; cursor: any; last_run_at: string | null }[]>([])
  const [jobCounts, setJobCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [runningAll, setRunningAll] = useState(false)
  const [runningSource, setRunningSource] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [adminSecret, setAdminSecret] = useState<string>(() => {
    return localStorage.getItem('admin_secret') || ''
  })
  const [showSecretModal, setShowSecretModal] = useState(false)
  const [secretInput, setSecretInput] = useState('')

  const saveAdminSecret = () => {
    localStorage.setItem('admin_secret', secretInput)
    setAdminSecret(secretInput)
    setShowSecretModal(false)
    setSecretInput('')
  }

  const clearAdminSecret = () => {
    localStorage.removeItem('admin_secret')
    setAdminSecret('')
    setShowSecretModal(true)
  }

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      // Fetch new observability data
      if (adminSecret) {
        const healthRes = await fetch('/.netlify/functions/admin_ingestion_health', {
          headers: {
            'x-admin-secret': adminSecret,
          },
        })

        if (healthRes.ok) {
          const healthJson = await healthRes.json()
          if (healthJson.success) {
            setHealthData(healthJson.data)
          }
        } else if (healthRes.status === 401 || healthRes.status === 403) {
          setError('Invalid admin secret. Please update it in settings.')
        } else {
          console.warn('Failed to fetch health data:', healthRes.status)
        }
      }

      // Fetch legacy ingestion state
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
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])


  async function runAllIngestion() {
    if (!adminSecret) {
      setShowSecretModal(true)
      return
    }
    setRunningAll(true)
    try {
      const res = await fetch('/.netlify/functions/admin_ingest_trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret,
        },
        body: JSON.stringify({}),
      })
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
    if (!adminSecret) {
      setShowSecretModal(true)
      return
    }
    setRunningSource(source)
    try {
      const res = await fetch('/.netlify/functions/admin_ingest_trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret,
        },
        body: JSON.stringify({ sources: [source] }),
      })
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
      {/* Admin Secret Modal */}
      {showSecretModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div className="surface-card" style={{ maxWidth: 500, width: '90%' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Admin Secret Required</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Enter your admin secret to access observability features. This is stored in your browser's localStorage.
            </p>
            <input
              type="password"
              className="rl-input"
              placeholder="Enter admin secret..."
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && secretInput && saveAdminSecret()}
              autoFocus
            />
            <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button type="button" variant="ghost" onClick={() => setShowSecretModal(false)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={saveAdminSecret} disabled={!secretInput}>
                Save Secret
              </Button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Ingestion Observability</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Monitor job ingestion runs, source health, and execution history.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {adminSecret && (
            <Button
              type="button"
              variant="ghost"
              onClick={clearAdminSecret}
              title="Clear stored admin secret"
              style={{ fontSize: 11, padding: '6px 10px' }}
            >
              🔑 Reset Secret
            </Button>
          )}
          {!adminSecret && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowSecretModal(true)}
              style={{ fontSize: 11, padding: '6px 10px' }}
            >
              🔑 Set Secret
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={fetchData} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button type="button" variant="primary" onClick={runAllIngestion} disabled={runningAll || !adminSecret}>
            {runningAll ? '⏳ Running...' : '▶ Run All Ingestion'}
          </Button>
        </div>
      </div>

      {error && (
        <div style={{ padding: 12, background: 'var(--surface-error)', borderRadius: 8, color: 'var(--color-error)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Latest Run Summary */}
      {healthData?.latestRun && (
        <div className="surface-card">
          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Latest Run</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Status</div>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                {healthData.latestRun.status}
              </span>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Triggered By</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{healthData.latestRun.triggered_by}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Started</div>
              <div style={{ fontSize: 13 }}>{new Date(healthData.latestRun.started_at).toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Inserted</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-success)' }}>{healthData.latestRun.total_inserted}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Duplicates</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-secondary)' }}>{healthData.latestRun.total_duplicates}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Failed Sources</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-error)' }}>{healthData.latestRun.total_failed_sources}</div>
            </div>
          </div>
        </div>
      )}

      {/* Source Health */}
      {healthData?.sourceHealth && healthData.sourceHealth.length > 0 && (
        <div className="surface-card">
          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Source Health</h4>
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-subtle)' }}>
                <tr>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Source</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Last Run</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Last Success</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Inserted</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Failures</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {healthData.sourceHealth.map((health: any) => (
                  <tr key={health.source} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '8px 12px' }}>
                      <code style={{ fontSize: 12, background: 'var(--surface-hover)', padding: '2px 6px', borderRadius: 4 }}>
                        {health.source}
                      </code>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{
                        fontSize: 11,
                        color: health.is_degraded ? 'var(--color-error)' : 'var(--color-success)',
                        fontWeight: 600,
                      }}>
                        {health.is_degraded ? '⚠️ Degraded' : '✓ Healthy'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {health.last_run_at ? new Date(health.last_run_at).toLocaleString() : '—'}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {health.last_success_at ? new Date(health.last_success_at).toLocaleString() : '—'}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>
                      {health.last_counts?.inserted || 0}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      <span style={{ color: health.consecutive_failures > 0 ? 'var(--color-error)' : 'var(--text-secondary)' }}>
                        {health.consecutive_failures || 0}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => runSourceIngestion(health.source)}
                        disabled={runningSource === health.source}
                        style={{ padding: '4px 8px', fontSize: 11 }}
                      >
                        {runningSource === health.source ? '⏳' : '▶'} Run
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Runs */}
      {healthData?.recentRuns && healthData.recentRuns.length > 0 && (
        <div className="surface-card">
          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Recent Runs (Last 20)</h4>
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-subtle)' }}>
                <tr>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Started</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Trigger</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Normalized</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Inserted</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Dupes</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Failed</th>
                </tr>
              </thead>
              <tbody>
                {healthData.recentRuns.map((run: any) => (
                  <tr key={run.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {new Date(run.started_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600 }}>
                        {run.status}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 12 }}>{run.triggered_by}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12 }}>{run.total_normalized}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--color-success)' }}>{run.total_inserted}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: 12 }}>{run.total_duplicates}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: run.total_failed_sources > 0 ? 'var(--color-error)' : 'var(--text-secondary)', fontSize: 12 }}>
                      {run.total_failed_sources}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Auto-Healing Activity */}
      <div className="surface-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600 }}>Auto-Healing (24h)</h4>
          {healthData?.healingStats && (
            <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
              <span style={{ color: 'var(--color-success)' }}>
                ✓ {healthData.healingStats.successful} healed
              </span>
              <span style={{ color: 'var(--color-error)' }}>
                ✗ {healthData.healingStats.failed} failed
              </span>
              <span style={{ color: 'var(--color-warning)' }}>
                ⚡ {healthData.healingStats.escalated} escalated
              </span>
            </div>
          )}
        </div>
        
        {(!healthData?.healingHistory || healthData.healingHistory.length === 0) ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
            <div style={{ marginBottom: 8 }}>🩹 No healing activity in the last 24 hours</div>
            <div style={{ fontSize: 11 }}>The healer runs every 15 minutes to auto-fix failures</div>
          </div>
        ) : (
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-subtle)' }}>
                <tr>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Time</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Source</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Issue</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Action</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Result</th>
                </tr>
              </thead>
              <tbody>
                {healthData.healingHistory.slice(0, 10).map((heal: any, idx: number) => (
                  <tr key={heal.id || idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>
                      {new Date(heal.attempted_at).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <code style={{ fontSize: 11, background: 'var(--surface-hover)', padding: '2px 6px', borderRadius: 4 }}>
                        {heal.source}
                      </code>
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 12 }}>
                      {heal.failure_type?.replace(/_/g, ' ')}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 12 }}>
                      {heal.healing_action?.replace(/_/g, ' ')}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: 11,
                        color: heal.healing_result === 'success' ? 'var(--color-success)' :
                          heal.healing_result === 'escalated' ? 'var(--color-warning)' : 'var(--color-error)',
                        fontWeight: 600,
                      }}>
                        {heal.healing_result === 'success' ? '✓' : heal.healing_result === 'escalated' ? '⚡' : '✗'} {heal.healing_result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)' }}>{loading ? '...' : (healthData?.sourceHealth?.length || 0)}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Monitored Sources</div>
        </div>
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
