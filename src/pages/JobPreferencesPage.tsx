import React, { CSSProperties, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRelevntColors, useJobPreferences } from '../hooks'
import type { JobPreferences } from '../hooks/useJobPreferences' // ⬅️ add this
import { Container } from '../components/shared/Container'
import {
  PreferencesIcon,
  JobsIcon,
  AutoApplyIcon,
  MatchScoreIcon,
} from '../components/icons/RelevntIcons'

type ChipField =
  | 'related_titles'
  | 'preferred_locations'
  | 'allowed_timezones'
  | 'exclude_titles'
  | 'exclude_companies'
  | 'exclude_contract_types'

const seniorityOptions = ['Junior', 'Mid level', 'Senior', 'Lead', 'Director']
const locationOptions = ['Remote', 'Hybrid', 'On site', 'Flexible']
const currencyOptions = ['USD', 'CAD', 'EUR', 'GBP']
const salaryUnitOptions = ['yearly', 'hourly']

const cardStyle = (colors: ReturnType<typeof useRelevntColors>): CSSProperties => ({
  display: 'grid',
  gap: 12,
  padding: '24px',
  borderRadius: 16,
  backgroundColor: colors.surface,
  border: `1px solid ${colors.borderLight}`,
})

const headerSkeletonRow = (colors: ReturnType<typeof useRelevntColors>) => ({
  width: 200,
  height: 18,
  backgroundColor: colors.surfaceHover,
  borderRadius: 10,
})

export default function JobPreferencesPage(): JSX.Element {
  const colors = useRelevntColors()
  const {
    prefs,
    loading,
    saving,
    error,
    saveStatus,
    setField,
    save,
  } = useJobPreferences()

  const [chipDrafts, setChipDrafts] = useState<Record<ChipField, string>>({
    related_titles: '',
    preferred_locations: '',
    allowed_timezones: '',
    exclude_titles: '',
    exclude_companies: '',
    exclude_contract_types: '',
  })

  const updateField = <K extends keyof JobPreferences>(
    key: K,
    value: JobPreferences[K]
  ) => {
    if (!prefs) return
    setField(key, value)
  }

  const addChip = (field: ChipField) => {
    if (!prefs) return
    const draft = chipDrafts[field].trim()
    if (!draft) return
    const current = (prefs[field] as string[]) || []
    updateField(field as any, [...current, draft] as any)
    setChipDrafts({ ...chipDrafts, [field]: '' })
  }

  const removeChip = (field: ChipField, value: string) => {
    if (!prefs) return
    const current = (prefs[field] as string[]) || []
    updateField(
      field as any,
      current.filter((item) => item !== value) as any
    )
  }

  const handleSave = async () => {
    await save()
  }

  const header: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 24,
    flexWrap: 'wrap',
  }

  const titleRow: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  }

  const title: CSSProperties = {
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: '0.02em',
    color: colors.text,
  }

  const subtitle: CSSProperties = {
    fontSize: 13,
    color: colors.textSecondary,
    maxWidth: 620,
    lineHeight: 1.5,
  }

  const chipList: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  }

  const chip = (text: string): CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    borderRadius: 999,
    backgroundColor: colors.surfaceHover,
    border: `1px solid ${colors.borderLight}`,
    fontSize: 12,
    color: colors.text,
  })

  const sectionHeader = (icon: React.ReactNode, label: string, desc: string) => (
    <div style={{ display: 'grid', gap: 6 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 15,
          fontWeight: 600,
          color: colors.text,
        }}
      >
        {icon}
        <span>{label}</span>
      </div>
      <p style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.5 }}>
        {desc}
      </p>
    </div>
  )

  if (loading || !prefs) {
    return (
      <div style={{ flex: 1, backgroundColor: colors.background }}>
        <Container maxWidth="lg" padding="md">
          <div style={header}>
            <div style={titleRow}>
              <div style={headerSkeletonRow(colors)} />
              <div
                style={{
                  width: 320,
                  height: 14,
                  backgroundColor: colors.surfaceHover,
                  borderRadius: 10,
                }}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div
              style={{
                height: 180,
                borderRadius: 16,
                backgroundColor: colors.surfaceHover,
              }}
            />
            <div
              style={{
                height: 180,
                borderRadius: 16,
                backgroundColor: colors.surfaceHover,
              }}
            />
            <div
              style={{
                height: 180,
                borderRadius: 16,
                backgroundColor: colors.surfaceHover,
              }}
            />
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, backgroundColor: colors.background }}>
      <Container maxWidth="lg" padding="md">
        <header style={header}>
          <div style={titleRow}>
            <h1 style={title}>Job preferences</h1>
            <p style={subtitle}>
              Tell Relevnt what is worth your energy. We use this to score your matches,
              tune your Relevnt Feed, and set guardrails for auto apply, always on your
              terms and never shared with employers.
            </p>
          </div>
          <Link
            to="/settings"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 999,
              border: `1px solid ${colors.borderLight}`,
              backgroundColor: colors.surface,
              color: colors.text,
              fontSize: 12,
              textDecoration: 'none',
            }}
          >
            <PreferencesIcon size={16} strokeWidth={1.6} />
            <span>Settings</span>
          </Link>
        </header>

        <div style={{ display: 'grid', gap: 12 }}>
          {/* Target roles */}
          <article style={cardStyle(colors)}>
            <div className="rl-field-grid">
              {sectionHeader(
                <JobsIcon size={18} strokeWidth={1.7} />,
                'Target roles',
                'We start from the titles that feel most like you, then branch into nearby options using live job market data.'
              )}
              <div style={{ display: 'grid', gap: 12 }}>
                <label className="rl-label">
                  Primary title
                  <input
                    className="rl-input"
                    type="text"
                    value={prefs.primary_title}
                    onChange={(e) => updateField('primary_title', e.target.value)}
                    placeholder="e.g., Senior Content Strategist"
                  />
                </label>

                <div>
                  <label className="rl-label">
                    Related titles
                    <input
                      className="rl-input"
                      type="text"
                      value={chipDrafts.related_titles}
                      onChange={(e) =>
                        setChipDrafts({
                          ...chipDrafts,
                          related_titles: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addChip('related_titles')
                        }
                      }}
                      placeholder="Add related titles one by one"
                    />
                  </label>
                  <div style={chipList}>
                    {prefs.related_titles.map((item) => (
                      <span key={item} style={chip(item)}>
                        {item}
                        <button
                          type="button"
                          onClick={() => removeChip('related_titles', item)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: colors.textSecondary,
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="rl-label">Seniority levels</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {seniorityOptions.map((option) => {
                      const active = prefs.seniority_levels.includes(option)
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            const next = active
                              ? prefs.seniority_levels.filter((s) => s !== option)
                              : [...prefs.seniority_levels, option]
                            updateField('seniority_levels', next)
                          }}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 999,
                            border: active
                              ? `1px solid ${colors.primary}`
                              : `1px solid ${colors.borderLight}`,
                            backgroundColor: active
                              ? colors.surfaceHover
                              : colors.surface,
                            color: colors.text,
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          {option}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="rl-help">
              We also use your saved jobs and resume to suggest nearby titles.
            </div>
          </article>

          {/* Work style */}
          <article style={cardStyle(colors)}>
            <div className="rl-field-grid">
              {sectionHeader(
                <PreferencesIcon size={18} strokeWidth={1.7} />,
                'Work style',
                'Tell us how you actually work best so we can filter out roles that ignore your remote, hybrid, onsite, and timezone reality.'
              )}
              <div style={{ display: 'grid', gap: 12 }}>
                <label className="rl-label">Remote preference</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {locationOptions.map((option) => {
                    const value = option.toLowerCase()
                    const active = prefs.remote_preference === value
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateField('remote_preference', value)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 999,
                          border: active
                            ? `1px solid ${colors.primary}`
                            : `1px solid ${colors.borderLight}`,
                          backgroundColor: active
                            ? colors.surfaceHover
                            : colors.surface,
                          color: colors.text,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>

                <div>
                  <label className="rl-label">
                    Preferred locations
                    <input
                      className="rl-input"
                      type="text"
                      value={chipDrafts.preferred_locations}
                      onChange={(e) =>
                        setChipDrafts({
                          ...chipDrafts,
                          preferred_locations: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addChip('preferred_locations')
                        }
                      }}
                      placeholder="Cities or regions you are open to"
                    />
                  </label>
                  <div style={chipList}>
                    {prefs.preferred_locations.map((item) => (
                      <span key={item} style={chip(item)}>
                        {item}
                        <button
                          type="button"
                          onClick={() => removeChip('preferred_locations', item)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: colors.textSecondary,
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="rl-label">
                    Allowed timezones
                    <input
                      className="rl-input"
                      type="text"
                      value={chipDrafts.allowed_timezones}
                      onChange={(e) =>
                        setChipDrafts({
                          ...chipDrafts,
                          allowed_timezones: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addChip('allowed_timezones')
                        }
                      }}
                      placeholder="Optional: add timezones you align with"
                    />
                  </label>
                  <div style={chipList}>
                    {prefs.allowed_timezones.map((item) => (
                      <span key={item} style={chip(item)}>
                        {item}
                        <button
                          type="button"
                          onClick={() => removeChip('allowed_timezones', item)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: colors.textSecondary,
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Compensation */}
          <article style={cardStyle(colors)}>
            <div className="rl-field-grid">
              {sectionHeader(
                <PreferencesIcon size={18} strokeWidth={1.7} />,
                'Compensation',
                'This never gets shared with employers. It helps us compare your floor to current ranges and hide roles that are not financially respectful.'
              )}
              <div style={{ display: 'grid', gap: 12 }}>
                <label className="rl-label">
                  Minimum base salary
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <input
                      className="rl-input"
                      type="number"
                      value={prefs.min_salary ?? ''}
                      onChange={(e) =>
                        updateField(
                          'min_salary',
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      placeholder="e.g., 95000"
                      style={{ minWidth: 140, flex: '1 1 140px' }}
                    />
                    <select
                      className="rl-select"
                      value={prefs.salary_currency}
                      onChange={(e) =>
                        updateField('salary_currency', e.target.value)
                      }
                      style={{ minWidth: 110 }}
                    >
                      {currencyOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <select
                      className="rl-select"
                      value={prefs.salary_unit}
                      onChange={(e) =>
                        updateField(
                          'salary_unit',
                          e.target.value as JobPreferences['salary_unit']
                        )
                      }
                      style={{ minWidth: 110 }}
                    >
                      {salaryUnitOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
              </div>
            </div>
          </article>

          {/* Safeties */}
          <article style={cardStyle(colors)}>
            <div className="rl-field-grid">
              {sectionHeader(
                <PreferencesIcon size={18} strokeWidth={1.7} />,
                'Safeties',
                'Hard boundaries so you do not waste time or emotional energy.'
              )}
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label className="rl-label">
                    Titles to avoid
                    <input
                      className="rl-input"
                      type="text"
                      value={chipDrafts.exclude_titles}
                      onChange={(e) =>
                        setChipDrafts({
                          ...chipDrafts,
                          exclude_titles: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addChip('exclude_titles')
                        }
                      }}
                      placeholder="Add titles you will not consider"
                    />
                  </label>
                  <div style={chipList}>
                    {prefs.exclude_titles.map((item) => (
                      <span key={item} style={chip(item)}>
                        {item}
                        <button
                          type="button"
                          onClick={() => removeChip('exclude_titles', item)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: colors.textSecondary,
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="rl-label">
                    Companies to avoid
                    <input
                      className="rl-input"
                      type="text"
                      value={chipDrafts.exclude_companies}
                      onChange={(e) =>
                        setChipDrafts({
                          ...chipDrafts,
                          exclude_companies: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addChip('exclude_companies')
                        }
                      }}
                      placeholder="Add companies to skip"
                    />
                  </label>
                  <div style={chipList}>
                    {prefs.exclude_companies.map((item) => (
                      <span key={item} style={chip(item)}>
                        {item}
                        <button
                          type="button"
                          onClick={() => removeChip('exclude_companies', item)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: colors.textSecondary,
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="rl-label">
                    Contract types to exclude
                    <input
                      className="rl-input"
                      type="text"
                      value={chipDrafts.exclude_contract_types}
                      onChange={(e) =>
                        setChipDrafts({
                          ...chipDrafts,
                          exclude_contract_types: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addChip('exclude_contract_types')
                        }
                      }}
                      placeholder="Add contract types to avoid"
                    />
                  </label>
                  <div className="rl-help">
                    Examples: unpaid internship, 1099 only, commission only.
                  </div>
                  <div style={chipList}>
                    {prefs.exclude_contract_types.map((item) => (
                      <span key={item} style={chip(item)}>
                        {item}
                        <button
                          type="button"
                          onClick={() =>
                            removeChip('exclude_contract_types', item)
                          }
                          style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: colors.textSecondary,
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Auto apply */}
          <article style={cardStyle(colors)}>
            <div className="rl-field-grid">
              {sectionHeader(
                <AutoApplyIcon size={18} strokeWidth={1.7} />,
                'Auto apply guardrails',
                'If you turn on auto apply, these are the rules we follow, including preferring the employer site when available so your applications look intentional, not spray and pray.'
              )}
              <div style={{ display: 'grid', gap: 12 }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                    color: colors.text,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={prefs.enable_auto_apply}
                    onChange={(e) =>
                      updateField('enable_auto_apply', e.target.checked)
                    }
                    style={{ width: 16, height: 16 }}
                  />
                  <span>Allow Relevnt to auto-apply on my behalf</span>
                </label>

                <label className="rl-label">
                  Minimum match score
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MatchScoreIcon size={16} strokeWidth={1.6} />
                    <input
                      className="rl-input"
                      type="number"
                      min={0}
                      max={100}
                      value={prefs.auto_apply_min_match_score ?? ''}
                      onChange={(e) =>
                        updateField(
                          'auto_apply_min_match_score',
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      placeholder="e.g., 85"
                      style={{ flex: '1 1 140px' }}
                    />
                  </div>
                </label>

                <label className="rl-label">
                  Maximum auto applications per day
                  <input
                    className="rl-input"
                    type="number"
                    min={0}
                    value={prefs.auto_apply_max_apps_per_day ?? ''}
                    onChange={(e) =>
                      updateField(
                        'auto_apply_max_apps_per_day',
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    placeholder="e.g., 5"
                  />
                </label>
              </div>
            </div>
          </article>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 18,
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              border: 'none',
              backgroundColor: colors.primary,
              color: colors.text,
              fontSize: 13,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save preferences'}
          </button>
          {saveStatus === 'saved' && (
            <span style={{ fontSize: 12, color: colors.textSecondary }}>
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span style={{ fontSize: 12, color: colors.error }}>
              We could not save your preferences. Try again.
            </span>
          )}
          {error && (
            <span style={{ fontSize: 12, color: colors.error }}>{error}</span>
          )}
        </div>
      </Container>
    </div>
  )
}