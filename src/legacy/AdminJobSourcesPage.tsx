import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Container } from '../components/shared/Container'
import { useRelevntColors } from '../hooks'

type AuthMode = 'none' | 'single_key' | 'public_secret' | null
type SourceMode = 'api' | 'rss' | null

interface JobSourceRow {
  id: string
  name: string
  slug: string | null
  website_url: string | null
  endpoint_url: string | null
  enabled: boolean
  mode: SourceMode
  auth_mode: AuthMode
  update_frequency: string | null
  last_sync: string | null
  last_error: string | null
}

interface IngestResult {
  id: string
  name: string
  ok: boolean
  mode: SourceMode
  auth_mode: AuthMode
  count: number
  error?: string
}

const AdminJobSourcesPage: React.FC = () => {
  const colors = useRelevntColors()
  const [sources, setSources] = useState<JobSourceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [runStatus, setRunStatus] =
    useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [runError, setRunError] = useState<string | null>(null)
  const [runResults, setRunResults] = useState<IngestResult[] | null>(null)
  const [runningSourceId, setRunningSourceId] = useState<string | null>(null)

  async function fetchSources() {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('job_sources')
        .select('*')
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

  async function callIngest(sourceSlug?: string) {
    setRunStatus('running')
    setRunError(null)
    setRunResults(null)
    setRunningSourceId(sourceSlug ?? null)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const token = session?.access_token

      const res = await fetch('/.netlify/functions/ingest_jobs', {
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
      setRunningSourceId(null)
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

  const wrapper: React.CSSProperties = {
    flex: 1,
    backgroundColor: colors.background,
  }

  const headerRow: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  }

  const titleBlock: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  }

  const titleStyle: React.CSSProperties = {
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: '0.03em',
    color: colors.text,
  }

  const subtitleStyle: React.CSSProperties = {
    fontSize: 13,
    color: colors.textSecondary,
    maxWidth: 520,
  }

  const adminBadge: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: 999,
    border: `1px solid ${colors.borderLight}`,
    fontSize: 11,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: colors.textSecondary,
    backgroundColor: colors.surfaceHover,
  }

  const toolbarRow: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  }

  const runAllButton: React.CSSProperties = {
    padding: '7px 14px',
    borderRadius: 999,
    border: 'none',
    backgroundColor: colors.primary,
    color: colors.text,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  }

  const refreshButton: React.CSSProperties = {
    padding: '7px 12px',
    borderRadius: 999,
    border: `1px solid ${colors.borderLight}`,
    backgroundColor: colors.surface,
    color: colors.textSecondary,
    fontSize: 12,
    cursor: 'pointer',
  }

  const statusText: React.CSSProperties = {
    fontSize: 12,
    color: colors.textSecondary,
  }

  const tableWrapper: React.CSSProperties = {
    borderRadius: 18,
    border: `1px solid ${colors.borderLight}`,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  }

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
  }

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    fontWeight: 500,
    padding: '10px 14px',
    borderBottom: `1px solid ${colors.borderLight}`,
    backgroundColor: colors.surface,
    color: colors.textSecondary,
    fontSize: 12,
  }

  const tdStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderBottom: `1px solid ${colors.borderLight}`,
    verticalAlign: 'top',
  }

  const nameCellTitle: React.CSSProperties = {
    fontWeight: 500,
    color: colors.text,
  }

  const nameCellSub: React.CSSProperties = {
    fontSize: 11,
    color: colors.textSecondary,
  }

  const chip: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3px 8px',
    borderRadius: 999,
    fontSize: 11,
    border: `1px solid ${colors.borderLight}`,
    backgroundColor: colors.surfaceHover,
  }

  const apiChip: React.CSSProperties = {
    ...chip,
    fontWeight: 500,
  }

  const warningPill: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 8px',
    borderRadius: 999,
    border: `1px solid ${colors.borderLight}`,
    backgroundColor: colors.surfaceHover,
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  }

  const enabledToggle: React.CSSProperties = {
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

  const runButton: React.CSSProperties = {
    padding: '6px 11px',
    borderRadius: 999,
    border: 'none',
    backgroundColor: colors.accent,
    color: colors.text,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  }

  const smallDot: React.CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: '#4ade80',
  }

  const smallDotDisabled: React.CSSProperties = {
    ...smallDot,
    backgroundColor: colors.borderLight,
  }

  const errorText: React.CSSProperties = {
    marginTop: 8,
    fontSize: 12,
    color: colors.warning,
  }

  return (
    <div style={wrapper}>
      <Container maxWidth="xl" padding="lg">
        <header style={headerRow}>
          <div style={titleBlock}>
            <h1 style={titleStyle}>Job sources</h1>
            <p style={subtitleStyle}>
              Turn individual sources on or off, inspect their configuration, and manually trigger
              ingestion runs. Changes here update the underlying job_sources table so you do not
              need to touch the database directly.
            </p>
            {runStatus === 'done' && (
              <span style={statusText}>Run complete: jobs ingested successfully.</span>
            )}
            {runStatus === 'error' && (
              <span style={errorText}>
                Run failed: {runError || 'Unknown error. Check function logs in Netlify.'}
              </span>
            )}
            {error && <span style={errorText}>{error}</span>}
          </div>
          <div style={adminBadge}>Admin tools</div>
        </header>

        <div style={toolbarRow}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              style={runAllButton}
              onClick={() => callIngest()}
              disabled={runStatus === 'running'}
            >
              {runStatus === 'running' && !runningSourceId ? 'Running all…' : 'Run all now'}
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
            {sources.length} configured sources. Use toggles to enable or disable, and “Run now” for
            one-off tests.
          </div>
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
                  if (src.auth_mode === 'public_secret') authLabel = 'Public + secret required'

                  return (
                    <tr key={src.id}>
                      <td style={tdStyle}>
                        <div style={nameCellTitle}>{src.name}</div>
                        <div style={nameCellSub}>
                          {src.website_url || 'No website URL set'}
                          <br />
                          <span>Slug: {src.slug || 'n/a'}</span>
                        </div>
                      </td>

                      <td style={tdStyle}>
                        <div style={apiChip}>{src.mode?.toUpperCase() || 'N/A'}</div>
                        <div style={nameCellSub}>{authLabel}</div>
                      </td>

                      <td style={tdStyle}>
                        <div style={nameCellSub}>
                          {hasEndpoint ? src.endpoint_url : 'N/A'}
                          <br />
                          <span>Frequency: {frequency}</span>
                        </div>
                        {!hasEndpoint && (
                          <div style={warningPill}>⚠ No endpoint_url configured</div>
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

                      <td style={tdStyle}>
                        <button
                          type="button"
                          style={runButton}
                          onClick={() => callIngest(src.slug || undefined)}
                          disabled={runStatus === 'running'}
                        >
                          {runStatus === 'running' && runningSourceId === (src.slug || undefined)
                            ? 'Running…'
                            : 'Run now'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </Container>
    </div>
  )
}

export default AdminJobSourcesPage