// src/components/jobs/JobsFiltersBar.tsx
import React from 'react'

export type JobSourceRow = {
  id: string
  name: string
  slug: string
  enabled: boolean
}

type PostedSince = '' | '7d' | '30d' | '90d'

type JobsFiltersBarProps = {
  // values
  search: string
  locationFilter: string
  sourceSlug: string
  employmentType: string
  postedSince: PostedSince
  remoteOnly: boolean
  salaryMin: string

  // setters
  setSearch: (value: string) => void
  setLocationFilter: (value: string) => void
  setSourceSlug: (value: string) => void
  setEmploymentType: (value: string) => void
  setPostedSince: (value: PostedSince) => void
  setRemoteOnly: (value: boolean) => void
  setSalaryMin: (value: string) => void

  // sources
  sources: JobSourceRow[]
  sourcesError: string | null

  // actions
  onClearFilters: () => void
}

export default function JobsFiltersBar(props: JobsFiltersBarProps) {
  const {
    search,
    locationFilter,
    sourceSlug,
    employmentType,
    postedSince,
    remoteOnly,
    salaryMin,
    setSearch,
    setLocationFilter,
    setSourceSlug,
    setEmploymentType,
    setPostedSince,
    setRemoteOnly,
    setSalaryMin,
    sources,
    sourcesError,
    onClearFilters,
  } = props

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 6,
    color: 'var(--text)',
  }

  const inputStyle: React.CSSProperties = {
    height: 40,
    padding: '0 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    fontSize: 13,
    width: '100%',
    backgroundColor: 'var(--surface)',
    color: 'var(--text)',
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        marginBottom: 24,
      }}
    >
      {/* Top row of filter inputs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          alignItems: 'flex-end',
        }}
      >
        {/* Search */}
        <div style={{ flex: '2 1 220px', minWidth: 220 }}>
          <label style={labelStyle}>Search</label>
          <input
            type="text"
            placeholder="Title, company, keywords"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Location */}
        <div style={{ flex: '1.5 1 200px', minWidth: 200 }}>
          <label style={labelStyle}>Location</label>
          <input
            type="text"
            placeholder="City, country, region"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Source */}
        <div style={{ flex: '1 1 160px', minWidth: 160 }}>
          <label style={labelStyle}>Source</label>
          <select
            value={sourceSlug}
            onChange={(e) => setSourceSlug(e.target.value)}
            style={inputStyle}
          >
            <option value="">All sources</option>
            {sources.map((s) => (
              <option key={s.id} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Employment type */}
        <div style={{ flex: '1 1 140px', minWidth: 140 }}>
          <label style={labelStyle}>Employment type</label>
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            style={inputStyle}
          >
            <option value="">All</option>
            <option value="full_time">Full time</option>
            <option value="part_time">Part time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
        </div>

        {/* Minimum salary */}
        <div style={{ flex: '1 1 140px', minWidth: 140 }}>
          <label style={labelStyle}>Minimum salary</label>
          <input
            type="number"
            min={0}
            placeholder="e.g. 60000"
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Posted since */}
        <div style={{ flex: '1 1 140px', minWidth: 140 }}>
          <label style={labelStyle}>Posted in</label>
          <select
            value={postedSince}
            onChange={(e) =>
              setPostedSince(e.target.value as PostedSince)
            }
            style={inputStyle}
          >
            <option value="">Any time</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>

        {/* Remote only */}
        <div
          style={{
            flex: '0 0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingTop: 28, // Visually confirm alignment with inputs
            height: 66, // Align with input height + label
          }}
        >
          <input
            id="remote-only"
            type="checkbox"
            checked={remoteOnly}
            onChange={(e) => setRemoteOnly(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: 'var(--color-accent)' }}
          />
          <label
            htmlFor="remote-only"
            style={{ fontSize: 13, cursor: 'pointer', color: 'var(--text)' }}
          >
            Remote only
          </label>
        </div>
      </div>

      {/* Bottom row: clear + source error */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={onClearFilters}
          className="ghost-button button-sm"
        >
          Clear filters
        </button>

        {sourcesError && (
          <span
            style={{
              fontSize: 12,
              color: 'var(--color-error)',
              textAlign: 'right',
            }}
          >
            {sourcesError}
          </span>
        )}
      </div>
    </div>
  )
}