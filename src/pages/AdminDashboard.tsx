import React, { CSSProperties, useEffect, useMemo, useState } from 'react'
import { PageBackground } from '../components/shared/PageBackground'
import { Container } from '../components/shared/Container'
import { useRelevntColors } from '../hooks'
import type { Database } from '../lib/database.types'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  ProfileIcon,
  SubscriptionTierIcon,
  AutoApplyIcon,
  SettingsIcon,
  JobsIcon,
  DashboardIcon,
  ApplicationsIcon,
  CoursesIcon,
} from '../components/icons/RelevntIcons'

type TabKey = 'overview' | 'users' | 'sources' | 'system'
const CARD_GAP = 24
const FIELD_GAP = 16

const AdminCard: React.FC<React.PropsWithChildren<{ title?: string; subtitle?: string; icon?: React.ReactNode; actions?: React.ReactNode }>> = ({
  title,
  subtitle,
  icon,
  actions,
  children,
}) => {
  const colors = useRelevntColors()
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 16,
        backgroundColor: colors.surface,
        border: `1px solid ${colors.borderLight}`,
        display: 'grid',
        gap: FIELD_GAP,
      }}
    >
      {(title || subtitle || actions) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: 4 }}>
            {title && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 600, color: colors.text }}>
                {icon}
                {title}
              </div>
            )}
            {subtitle && <div style={{ fontSize: 12, color: colors.textSecondary }}>{subtitle}</div>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  )
}

const AdminTable: React.FC<{ headers: string[]; children: React.ReactNode }> = ({ headers, children }) => {
  const colors = useRelevntColors()
  return (
    <div style={{ overflowX: 'auto', border: `1px solid ${colors.borderLight}`, borderRadius: 12 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: colors.surfaceHover, color: colors.textSecondary, fontSize: 12 }}>
            {headers.map((header) => (
              <th key={header} style={{ textAlign: 'left', padding: '10px 12px' }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

const AdminFormField: React.FC<{ label: string; children: React.ReactNode; helper?: string; inline?: boolean }> = ({
  label,
  children,
  helper,
  inline,
}) => {
  const colors = useRelevntColors()
  return (
    <label style={{ display: 'grid', gap: 6, flex: inline ? 1 : undefined }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{label}</span>
      {children}
      {helper && <span style={{ fontSize: 11, color: colors.textSecondary }}>{helper}</span>}
    </label>
  )
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

export type PlanTier = 'free' | 'pro' | 'premium' | 'admin'

export function normalizePlanTier(value: string | null): PlanTier {
  if (!value) return 'free'
  const v = value.toLowerCase()
  if (v === 'starter' || v === 'free') return 'free'
  if (v === 'premium') return 'premium'
  if (v === 'admin') return 'admin'
  return 'pro'
}
type JobSourceRow = {
  id: string
  name: string
  slug: string | null
  website_url: string | null
  endpoint_url: string | null
  enabled: boolean
  mode: string | null           // 'rss' | 'api' | 'html' or null
  auth_mode: string | null      // 'none' | 'single_key' | 'public_secret' or null
  update_frequency: string | null
  last_sync: string | null
  last_error: string | null
}

type LearningProviderRow = Database['public']['Tables']['learning_providers']['Row']
type LearningCourseRow = Database['public']['Tables']['learning_courses']['Row']

export default function AdminDashboard(): JSX.Element {
  const colors = useRelevntColors()
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
          <div style={{ padding: '40px 0', color: colors.textSecondary }}>Loading…</div>
        </Container>
      </PageBackground>
    )
  }

  if (!user || !isAdmin) {
    return (
      <PageBackground>
        <Container maxWidth="lg" padding="md">
          <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textSecondary }}>
            {gateError || 'You do not have access to the admin dashboard.'}
          </div>
        </Container>
      </PageBackground>
    )
  }

  const wrapper: CSSProperties = {
    flex: 1,
    backgroundColor: colors.background,
  }

  const headerCard: CSSProperties = {
    padding: '16px',
    borderRadius: 16,
    backgroundColor: colors.surface,
    border: `1px solid ${colors.borderLight}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 16,
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <DashboardIcon size={18} strokeWidth={1.8} /> },
    { id: 'users', label: 'Users', icon: <ProfileIcon size={18} strokeWidth={1.8} /> },
    { id: 'sources', label: 'Sources & APIs', icon: <JobsIcon size={18} strokeWidth={1.8} /> },
    { id: 'system', label: 'System', icon: <SettingsIcon size={18} strokeWidth={1.8} /> },
  ] as { id: TabKey; label: string; icon: React.ReactNode }[]

  const tabButton = (active: boolean): CSSProperties => ({
    padding: '8px 12px',
    borderRadius: 999,
    border: active ? `1px solid ${colors.primary}` : `1px solid ${colors.borderLight}`,
    backgroundColor: active ? colors.surfaceHover : colors.surface,
    color: active ? colors.text : colors.textSecondary,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  })

  return (
    <PageBackground>
      <div style={wrapper}>
        <Container maxWidth="lg" padding="md">
          <div style={headerCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 10px', borderRadius: 999, border: `1px solid ${colors.borderLight}`, backgroundColor: colors.surfaceHover, fontSize: 11, color: colors.textSecondary }}>
              Admin
            </span>
          </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>
              Admin dashboard
            </h1>
            <p style={{ fontSize: 13, color: colors.textSecondary }}>
              Manage users, job sources, and system health.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={tabButton(activeTab === tab.id)}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {tab.icon}
                  {tab.label}
                </span>
              </button>
            ))}
          </div>

{activeTab === 'overview' && <OverviewTab colors={colors} />}
{activeTab === 'users' && <UsersTab colors={colors} />}
{activeTab === 'sources' && <SourcesTab colors={colors} />}
{activeTab === 'system' && <SystemTab colors={colors} />}
        </Container>
      </div>
    </PageBackground>
  )
}

/* Overview */
function OverviewTab({ colors }: { colors: ReturnType<typeof useRelevntColors> }) {
  const [stats, setStats] = useState<{ total: number; paid: number; auto: number; recentJobs: number }>({
    total: 0,
    paid: 0,
    auto: 0,
    recentJobs: 0,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const total = await supabase.from('profiles').select('id', { head: true, count: 'exact' })
      const paid = await supabase
        .from('profiles')
        .select('id', { head: true, count: 'exact' })
        .not('plan_tier', 'is', null)
      const auto = await supabase
        .from('profiles')
        .select('id', { head: true, count: 'exact' })
        .eq('auto_apply_active', true)

      setStats({
        total: total.count || 0,
        paid: paid.count || 0,
        auto: auto.count || 0,
        recentJobs: 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  const card = (label: string, value: number, icon: React.ReactNode, caption?: string) => (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 16,
        backgroundColor: colors.surface,
        border: `1px solid ${colors.borderLight}`,
        display: 'grid',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: colors.textSecondary, fontSize: 12 }}>
        {icon}
        <span>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>
        {loading ? '…' : value}
      </div>
      {caption && <div style={{ fontSize: 11, color: colors.textSecondary }}>{caption}</div>}
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
      {card('Total users', stats.total, <ProfileIcon size={16} strokeWidth={1.6} />, 'Live count from profiles')}
      {card('Paid users', stats.paid, <SubscriptionTierIcon size={16} strokeWidth={1.6} />, 'Plan tier not null')}
      {card('Auto apply enabled', stats.auto, <AutoApplyIcon size={16} strokeWidth={1.6} />, 'Users with auto-apply on')}
      {card('Jobs ingested (last 24h)', stats.recentJobs, <JobsIcon size={16} strokeWidth={1.6} />, 'Placeholders until ingestion stats available')}
    </div>
  )
}

/* Users */
type AdminUser = Pick<
  ProfileRow,
  'id' | 'email' | 'full_name' | 'plan_tier' | 'tier' | 'auto_apply_active' | 'created_at'
>

function UsersTab({ colors }: { colors: ReturnType<typeof useRelevntColors> }) {
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

  const inputBase = {
    padding: '8px 12px',
    borderRadius: 12,
    border: `1px solid ${colors.borderLight}`,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 12,
  } as const

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>Users</div>
          <p style={{ fontSize: 12, color: colors.textSecondary }}>Manage tiers and auto-apply.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            style={{
              ...inputBase,
              borderRadius: 999,
            }}
          />
          <button
            type="button"
            onClick={fetchUsers}
            style={{
              padding: '8px 12px',
              borderRadius: 999,
              border: `1px solid ${colors.borderLight}`,
              backgroundColor: colors.surface,
              color: colors.text,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={startNewUser}
            style={{
              padding: '8px 12px',
              borderRadius: 999,
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.surfaceHover,
              color: colors.text,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            + Add user profile
          </button>
        </div>
      </div>

      {userFormVisible && (
        <div style={{ border: `1px solid ${colors.borderLight}`, borderRadius: 12, padding: 12, backgroundColor: colors.surface }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>
              {userForm.id ? 'Edit user profile' : 'Add user profile'}
            </div>
            <button
              type="button"
              onClick={() => setUserFormVisible(false)}
              style={{ fontSize: 12, color: colors.textSecondary, background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, color: colors.textSecondary }}>User id (auth uid)</label>
              <input
                type="text"
                value={userForm.id || ''}
                onChange={(e) => setUserForm((f) => ({ ...f, id: e.target.value }))}
                placeholder="Required for new profiles"
                style={{ ...inputBase, width: '100%' }}
                disabled={!!userForm.id}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: colors.textSecondary }}>Email</label>
              <input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
                style={{ ...inputBase, width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: colors.textSecondary }}>Full name</label>
              <input
                type="text"
                value={userForm.full_name}
                onChange={(e) => setUserForm((f) => ({ ...f, full_name: e.target.value }))}
                style={{ ...inputBase, width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: colors.textSecondary }}>Plan tier</label>
              <select
                value={userForm.plan_tier}
                onChange={(e) => setUserForm((f) => ({ ...f, plan_tier: e.target.value as PlanTier }))}
                style={{ ...inputBase, width: '100%' }}
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: colors.textSecondary }}>Tier (role)</label>
              <input
                type="text"
                value={userForm.tier}
                onChange={(e) => setUserForm((f) => ({ ...f, tier: e.target.value }))}
                style={{ ...inputBase, width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 12, color: colors.textSecondary }}>Auto apply</label>
              <input
                type="checkbox"
                checked={userForm.auto_apply_active}
                onChange={(e) => setUserForm((f) => ({ ...f, auto_apply_active: e.target.checked }))}
              />
            </div>
          </div>
          {userError && <div style={{ marginTop: 8, fontSize: 12, color: colors.error }}>{userError}</div>}
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={saveUserForm}
              disabled={!!savingId}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.surfaceHover,
                cursor: 'pointer',
              }}
            >
              {savingId ? 'Saving…' : 'Save profile'}
            </button>
            <button
              type="button"
              onClick={() => setUserFormVisible(false)}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: `1px solid ${colors.borderLight}`,
                backgroundColor: colors.surface,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto', border: `1px solid ${colors.borderLight}`, borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr style={{ backgroundColor: colors.surfaceHover, color: colors.textSecondary, fontSize: 12 }}>
              {['Name', 'Email', 'Tier', 'Plan', 'Auto apply', 'Joined', ''].map((header) => (
                <th key={header} style={{ textAlign: 'left', padding: '10px 12px' }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={{ padding: '12px', color: colors.textSecondary }}>
                  Loading…
                </td>
              </tr>
            )}
            {!loading &&
              users
                .filter((u) => {
                  if (!search.trim()) return true
                  const q = search.toLowerCase()
                  return (
                    (u.email || '').toLowerCase().includes(q) ||
                    (u.full_name || '').toLowerCase().includes(q)
                  )
                })
                .map((u) => (
                <tr key={u.id} style={{ borderTop: `1px solid ${colors.borderLight}` }}>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: colors.text }}>
                    {u.full_name || u.email}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: colors.textSecondary }}>
                    {u.email}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: colors.text }}>
                    <span
                      style={{
                        padding: '6px 10px',
                        borderRadius: 999,
                        border: `1px solid ${colors.borderLight}`,
                        backgroundColor: u.tier === 'admin' ? colors.surfaceHover : colors.surface,
                        color: colors.text,
                        fontSize: 12,
                      }}
                    >
                      {u.tier || 'user'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <select
                      value={normalizePlanTier(u.plan_tier)}
                      onChange={(e) => updateUser(u.id, { plan_tier: e.target.value })}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 12,
                        border: `1px solid ${colors.borderLight}`,
                        backgroundColor: colors.surface,
                        color: colors.text,
                        fontSize: 12,
                      }}
                      disabled={savingId === u.id}
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="premium">Premium</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: colors.textSecondary }}>
                      <input
                        type="checkbox"
                        checked={u.auto_apply_active ?? false}
                        onChange={(e) => updateUser(u.id, { auto_apply_active: e.target.checked })}
                        disabled={savingId === u.id}
                      />
                      Auto
                    </label>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: colors.textSecondary }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, color: colors.textSecondary, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => startEditUser(u)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 10,
                        border: `1px solid ${colors.borderLight}`,
                        backgroundColor: colors.surface,
                        cursor: 'pointer',
                        color: colors.text,
                        fontSize: 12,
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteUser(u.id)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 10,
                        border: `1px solid ${colors.borderLight}`,
                        backgroundColor: colors.surfaceHover,
                        cursor: 'pointer',
                        color: colors.textSecondary,
                        fontSize: 12,
                      }}
                    >
                      Delete
                    </button>
                    {savingId === u.id ? 'Saving…' : ''}
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
function SourcesTab({ colors }: { colors: ReturnType<typeof useRelevntColors> }) {
  const [sources, setSources] = useState<JobSourceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [runStatus, setRunStatus] =
    useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [runError, setRunError] = useState<string | null>(null)
  const [runResults, setRunResults] = useState<any[] | null>(null)
  const [runningSourceSlug, setRunningSourceSlug] = useState<string | null>(null)

  const [editing, setEditing] = useState<JobSourceRow | null>(null)
  const [editForm, setEditForm] = useState<Partial<JobSourceRow>>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<JobSourceRow | null>(null)
  const [deletingBusy, setDeletingBusy] = useState(false)
  
  async function fetchSources() {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('job_sources')
        .select(`
          id,
          name,
          slug,
          website_url,
          endpoint_url,
          enabled,
          mode,
          auth_mode,
          update_frequency,
          last_sync,
          last_error
        `)
        .order('name', { ascending: true })

      if (error) {
        console.error('Failed to load job_sources', error)
        setError(error.message ?? 'Failed to load job_sources')
        return
      }

      setSources((data as JobSourceRow[]) || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSources()
  }, [])


  function openEdit(src: JobSourceRow) {
    setEditing(src)
    setEditForm({
      name: src.name,
      slug: src.slug,
      website_url: src.website_url,
      endpoint_url: src.endpoint_url,
      mode: src.mode,
      auth_mode: src.auth_mode,
      update_frequency: src.update_frequency,
    })
  }

  function closeEdit() {
    setEditing(null)
    setEditForm({})
  }

  async function saveEdit() {
    if (!editing) return
    setSaving(true)
    try {
      const payload: Partial<JobSourceRow> = {
        name: editForm.name ?? editing.name,
        slug: editForm.slug ?? editing.slug,
        website_url: editForm.website_url ?? editing.website_url,
        endpoint_url: editForm.endpoint_url ?? editing.endpoint_url,
        mode: editForm.mode ?? editing.mode,
        auth_mode: editForm.auth_mode ?? editing.auth_mode,
        update_frequency: editForm.update_frequency ?? editing.update_frequency,
      }

      const { error } = await supabase
        .from('job_sources')
        .update(payload)
        .eq('id', editing.id)

      if (error) {
        console.error('Failed to update job_source', error)
        alert(`Failed to update source: ${error.message}`)
        return
      }

      // update local state
      setSources((prev) =>
        prev.map((s) => (s.id === editing.id ? { ...s, ...payload } : s))
      )

      closeEdit()
    } catch (err: any) {
      console.error('Exception updating job_source', err)
      alert(`Failed to update source: ${err?.message || String(err)}`)
    } finally {
      setSaving(false)
    }
  }

  function openDelete(src: JobSourceRow) {
    setDeleting(src)
  }

  function closeDelete() {
    setDeleting(null)
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeletingBusy(true)
    try {
      const { error } = await supabase
        .from('job_sources')
        .delete()
        .eq('id', deleting.id)

      if (error) {
        console.error('Failed to delete job_source', error)
        alert(`Failed to delete source: ${error.message}`)
        return
      }

      setSources((prev) => prev.filter((s) => s.id !== deleting.id))
      closeDelete()
    } catch (err: any) {
      console.error('Exception deleting job_source', err)
      alert(`Failed to delete source: ${err?.message || String(err)}`)
    } finally {
      setDeletingBusy(false)
    }
  }
  
  async function callIngest(sourceSlug?: string) {
    setRunStatus('running')
    setRunError(null)
    setRunResults(null)
    setRunningSourceSlug(sourceSlug ?? null)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const token = session?.access_token

      // Build URL so the backend can use either query params or JSON body
      const url = sourceSlug
        ? `/.netlify/functions/ingest_jobs?source=${encodeURIComponent(
            sourceSlug
          )}&source_slug=${encodeURIComponent(sourceSlug)}`
        : '/.netlify/functions/ingest_jobs'

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(sourceSlug ? { source_slug: sourceSlug } : {}),
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok || !json.success) {
        const message =
          json?.error ||
          `Ingest failed with HTTP ${res.status} ${res.statusText || ''}`.trim()

        console.error('Manual ingest error', message)
        setRunStatus('error')
        setRunError(message)
        setRunResults(json?.results || null)
        return
      }

      setRunStatus('done')
      setRunResults(json.results || [])
      await fetchSources()
    } catch (err: any) {
      console.error('Manual ingest exception', err)
      setRunStatus('error')
      setRunError(err?.message || String(err))
    } finally {
      setRunningSourceSlug(null)
    }
  }

  async function updateSourceEnabled(source: JobSourceRow, nextEnabled: boolean) {
    try {
      const { error } = await supabase
        .from('job_sources')
        .update({ enabled: nextEnabled })
        .eq('id', source.id)

      if (error) {
        console.error('Failed to update enabled flag', error)
        alert(`Failed to update source: ${error.message}`)
        return
      }

      setSources((prev) =>
        prev.map((s) =>
          s.id === source.id ? { ...s, enabled: nextEnabled } : s
        )
      )
    } catch (err: any) {
      console.error('Exception updating enabled flag', err)
      alert(`Failed to update source: ${err?.message || String(err)}`)
    }
  }

  const card: CSSProperties = {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    border: `1px solid ${colors.borderLight}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  }

  const toolbarRow: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  }

  const runAllButton: CSSProperties = {
    padding: '7px 14px',
    borderRadius: 999,
    border: 'none',
    backgroundColor: colors.primary,
    color: colors.text,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  }

  const refreshButton: CSSProperties = {
    padding: '7px 12px',
    borderRadius: 999,
    border: `1px solid ${colors.borderLight}`,
    backgroundColor: colors.surface,
    color: colors.textSecondary,
    fontSize: 12,
    cursor: 'pointer',
  }

  const statusText: CSSProperties = {
    fontSize: 12,
    color: colors.textSecondary,
  }

  const tableWrapper: CSSProperties = {
    borderRadius: 14,
    border: `1px solid ${colors.borderLight}`,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  }

  const tableStyle: CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
  }

  const thStyle: CSSProperties = {
    textAlign: 'left',
    fontWeight: 500,
    padding: '8px 12px',
    borderBottom: `1px solid ${colors.borderLight}`,
    backgroundColor: colors.surface,
    color: colors.textSecondary,
    fontSize: 11,
  }

  const tdStyle: CSSProperties = {
    padding: '10px 14px',
    borderBottom: `1px solid ${colors.borderLight}`,
    verticalAlign: 'top',
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
  }

  const nameCellTitle: CSSProperties = {
    fontWeight: 500,
    color: colors.text,
  }

  const nameCellSub: CSSProperties = {
    fontSize: 11,
    color: colors.textSecondary,
  }

  const chip: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3px 8px',
    borderRadius: 999,
    fontSize: 11,
    border: `1px solid ${colors.borderLight}`,
    backgroundColor: colors.surfaceHover,
  }

  const enabledToggle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 10px',
    borderRadius: 999,
    border: `1px solid ${colors.borderLight}`,
    backgroundColor: colors.surfaceHover,
    fontSize: 11,
    gap: 6,
    cursor: 'pointer',
  }

  const pillButtonBase: React.CSSProperties = {
    padding: '6px 11px',
    borderRadius: 999,
    border: 'none',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  }

  const runButton: React.CSSProperties = {
    ...pillButtonBase,
    backgroundColor: colors.accent,
    color: colors.text,
  }

  const editButton: React.CSSProperties = {
    ...pillButtonBase,
    backgroundColor: colors.surface,
    color: colors.textSecondary,
    border: `1px solid ${colors.borderLight}`,
    fontWeight: 500,
  }

  const deleteButton: React.CSSProperties = {
    ...pillButtonBase,
    backgroundColor: '#7f1d1d',
    color: '#fef2f2',
  }

  const smallDot: CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: '#4ade80',
  }

  const smallDotDisabled: CSSProperties = {
    ...smallDot,
    backgroundColor: colors.borderLight,
  }

  const errorText: CSSProperties = {
    marginTop: 4,
    fontSize: 12,
    color: colors.warning,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={card}>
        <div style={toolbarRow}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              style={runAllButton}
              onClick={() => callIngest()}
              disabled={runStatus === 'running'}
            >
              {runStatus === 'running' && !runningSourceSlug ? 'Running all…' : 'Run all now'}
            </button>
            <button
              type="button"
              style={refreshButton}
              onClick={fetchSources}
              disabled={loading}
            >
              Refresh list
            </button>
          </div>
          <div style={statusText}>
            {sources.length} job sources configured. Toggle enable and run one off tests here.
          </div>
        </div>
        {runStatus === 'done' && (
          <span style={statusText}>Last run complete: jobs ingested successfully.</span>
        )}
        {runStatus === 'error' && (
          <span style={errorText}>
            Run failed: {runError || 'Unknown error. Check Netlify function logs.'}
          </span>
        )}
        {error && <span style={errorText}>{error}</span>}
      </div>

      <div style={tableWrapper}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Mode</th>
              <th style={thStyle}>Endpoint</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Last sync</th>
              <th style={thStyle}>Controls</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td style={tdStyle} colSpan={6}>
                  Loading sources…
                </td>
              </tr>
            )}

            {!loading && sources.length === 0 && (
              <tr>
                <td style={tdStyle} colSpan={6}>
                  No job_sources rows found. Create rows in Supabase first.
                </td>
              </tr>
            )}

            {!loading &&
              sources.map((src) => {
                const hasEndpoint = Boolean(src.endpoint_url)
                const isEnabled = src.enabled
                const lastSync = src.last_sync
                  ? new Date(src.last_sync).toLocaleString()
                  : 'Never'

                const frequency = src.update_frequency || 'unspecified'

                let authLabel = 'No key required'
                if (src.auth_mode === 'single_key') authLabel = 'API key required'
                if (src.auth_mode === 'public_secret') authLabel = 'Public plus secret required'

                return (
                  <tr key={src.id}>
                    <td style={tdStyle}>
                      <div style={nameCellTitle}>{src.name}</div>
                      <div style={nameCellSub}>
                        {src.website_url || 'No website URL set'}
                        <br />
                        <span style={{ whiteSpace: 'nowrap' }}>
                          Slug: {src.slug || 'n/a'}
                        </span>
                      </div>
                    </td>

                    <td style={tdStyle}>
                      <div style={chip}>{src.mode?.toUpperCase() || 'N/A'}</div>
                      <div style={nameCellSub}>{authLabel}</div>
                    </td>

                    <td style={tdStyle}>
                      <div style={nameCellSub}>
                        {hasEndpoint ? src.endpoint_url : 'N/A'}
                        <br />
                        <span>Frequency: {frequency}</span>
                      </div>
                      {!hasEndpoint && (
                        <div style={errorText}>⚠ No endpoint_url configured</div>
                      )}
                    </td>

                    <td style={tdStyle}>
                      <div
                        style={enabledToggle}
                        onClick={() => updateSourceEnabled(src, !src.enabled)}
                      >
                        <span style={isEnabled ? smallDot : smallDotDisabled} />
                        <span>{isEnabled ? 'Enabled' : 'Disabled'}</span>
                      </div>
                      {src.last_error && (
                        <div style={errorText}>Last error: {src.last_error}</div>
                      )}
                    </td>

                    <td style={tdStyle}>
                      <div style={nameCellSub}>{lastSync}</div>
                    </td>

                    <td
                      style={{
                        ...tdStyle,
                        width: 170,            // gives buttons a bit more breathing room
                        whiteSpace: 'nowrap',  // keeps the column compact
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                          alignItems: 'flex-end',
                        }}
                      >
                        <button
                          type="button"
                          style={runButton}
                          onClick={() => callIngest(src.slug || undefined)}
                          disabled={runStatus === 'running' && runningSourceSlug === (src.slug || undefined)}
                        >
                          {runStatus === 'running' && runningSourceSlug === (src.slug || undefined)
                            ? 'Running…'
                            : 'Run now'}
                        </button>

                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            style={editButton}
                            onClick={() => openEdit(src)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            style={deleteButton}
                            onClick={() => openDelete(src)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </td>

                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
      {editing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
        >
          <div
            style={{
              width: 480,
              maxWidth: '90vw',
              borderRadius: 16,
              backgroundColor: colors.surface,
              border: `1px solid ${colors.borderLight}`,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 600 }}>Edit source</div>
            <div style={{ fontSize: 12, color: colors.textSecondary }}>
              Changes here update the job_sources row. Be careful with slug, mode, and endpoint, since
              ingest relies on them.
            </div>

            <label style={{ fontSize: 12 }}>
              Name
              <input
                style={{ width: '100%', marginTop: 4 }}
                value={editForm.name ?? ''}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </label>

            <label style={{ fontSize: 12 }}>
              Slug
              <input
                style={{ width: '100%', marginTop: 4 }}
                value={editForm.slug ?? ''}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, slug: e.target.value }))
                }
              />
            </label>

            <label style={{ fontSize: 12 }}>
              Website URL
              <input
                style={{ width: '100%', marginTop: 4 }}
                value={editForm.website_url ?? ''}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, website_url: e.target.value }))
                }
              />
            </label>

            <label style={{ fontSize: 12 }}>
              Endpoint URL
              <input
                style={{ width: '100%', marginTop: 4 }}
                value={editForm.endpoint_url ?? ''}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, endpoint_url: e.target.value }))
                }
              />
            </label>

            <label style={{ fontSize: 12 }}>
              Mode (api, rss, html)
              <input
                style={{ width: '100%', marginTop: 4 }}
                value={editForm.mode ?? ''}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, mode: e.target.value as any }))
                }
              />
            </label>

            <label style={{ fontSize: 12 }}>
              Auth mode (none, single_key, public_secret)
              <input
                style={{ width: '100%', marginTop: 4 }}
                value={editForm.auth_mode ?? ''}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    auth_mode: e.target.value as any,
                  }))
                }
              />
            </label>

            <label style={{ fontSize: 12 }}>
              Update frequency (e.g. daily, hourly)
              <input
                style={{ width: '100%', marginTop: 4 }}
                value={editForm.update_frequency ?? ''}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    update_frequency: e.target.value,
                  }))
                }
              />
            </label>

            <div
              style={{
                marginTop: 12,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
              }}
            >
              <button
                type="button"
                disabled={saving}
                onClick={closeEdit}
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: `1px solid ${colors.borderLight}`,
                  backgroundColor: colors.surface,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={saveEdit}
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  border: 'none',
                  backgroundColor: colors.primary,
                  color: colors.text,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
      {deleting && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
        >
          <div
            style={{
              width: 380,
              maxWidth: '90vw',
              borderRadius: 16,
              backgroundColor: colors.surface,
              border: `1px solid ${colors.borderLight}`,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 600 }}>Delete source?</div>
            <div style={{ fontSize: 13, color: colors.textSecondary }}>
              This will permanently remove <strong>{deleting.name}</strong> from job_sources. Any jobs
              already ingested will remain, but future ingests will not use this source unless you recreate it.
            </div>
            <div
              style={{
                marginTop: 12,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
              }}
            >
              <button
                type="button"
                disabled={deletingBusy}
                onClick={closeDelete}
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: `1px solid ${colors.borderLight}`,
                  backgroundColor: colors.surface,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingBusy}
                onClick={confirmDelete}
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  border: 'none',
                  backgroundColor: '#7f1d1d',
                  color: '#fef2f2',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {deletingBusy ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

    
    

/* System */
function SystemTab({ colors }: { colors: ReturnType<typeof useRelevntColors> }) {
  return (
    <div style={{ padding: '16px 16px 14px', borderRadius: 16, backgroundColor: colors.surface, border: `1px solid ${colors.borderLight}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: colors.text, marginBottom: 4 }}>
        <SettingsIcon size={16} strokeWidth={1.6} />
        <span>System status</span>
      </div>
      <p style={{ fontSize: 12, color: colors.textSecondary }}>
        Future home for ingestion logs, auto-apply runs, and analytics. For now, check Supabase logs and Netlify functions.
      </p>
    </div>
  )
}
