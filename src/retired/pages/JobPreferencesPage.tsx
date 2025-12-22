import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useJobPreferences } from '../hooks'
import type { JobPreferences } from '../hooks/useJobPreferences'
import { Container } from '../components/shared/Container'
import { Icon } from '../components/ui/Icon'

type ChipField =
  | 'related_titles'
  | 'preferred_locations'
  | 'allowed_timezones'
  | 'exclude_titles'
  | 'exclude_companies'
  | 'exclude_contract_types'
  | 'include_keywords'
  | 'avoid_keywords'

const seniorityOptions = ['Junior', 'Mid level', 'Senior', 'Lead', 'Director']
const locationOptions = ['Remote', 'Hybrid', 'On site', 'Flexible']
const currencyOptions = ['USD', 'CAD', 'EUR', 'GBP']
const salaryUnitOptions = ['yearly', 'hourly']

export default function JobPreferencesPage(): JSX.Element {
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
    include_keywords: '',
    avoid_keywords: '',
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

  const sectionHeader = (icon: React.ReactNode, label: string, desc: string) => (
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
        {icon}
        <span>{label}</span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {desc}
      </p>
    </div>
  )

  if (loading || !prefs) {
    return (
      <div className="page-wrapper">
        <Container maxWidth="lg" padding="md">
          <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Loading preferences...</span>
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <Container maxWidth="lg" padding="md">
        <header className="hero-shell">
          <div className="hero-header">
            <div className="hero-header-main">
              <div className="hero__badge">
                <Icon name="pocket-watch" size="sm" hideAccent />
                <span>Job Preferences</span>
              </div>
              <h1>Job preferences</h1>
              <p className="hero-subtitle">
                Tell Relevnt what is worth your energy. We use this to score your matches,
                tune your Relevnt Feed, and set guardrails for auto apply, always on your
                terms and never shared with employers.
              </p>
            </div>

            <div className="hero-actions" style={{ justifyContent: 'flex-start', paddingTop: 0 }}>
              <Link to="/settings" className="ghost-button button-sm">
                <Icon name="pocket-watch" size="sm" hideAccent />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </header>

        <div className="page-stack">
          {/* Target roles */}
          <article className="surface-card">
            <div className="rl-field-grid">
              {sectionHeader(
                <Icon name="briefcase" size="sm" hideAccent />,
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
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {prefs.related_titles.map((item) => (
                      <span key={item} className="chip">
                        {item}
                        <button
                          type="button"
                          onClick={() => removeChip('related_titles', item)}
                        >
                          <Icon name="compass-cracked" size="sm" hideAccent />
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
                          className={`option-button ${active ? 'is-active' : ''}`}
                        >
                          {option}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="rl-help" style={{ marginTop: 12 }}>
              We also use your saved jobs and resume to suggest nearby titles.
            </div>
          </article>

          {/* Work style */}
          <article className="surface-card">
            <div className="rl-field-grid">
              {sectionHeader(
                <Icon name="compass" size="sm" hideAccent />,
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
                        className={`option-button ${active ? 'is-active' : ''}`}
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
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {prefs.preferred_locations.map((item) => (
                      <span key={item} className="chip">
                        {item}
                        <button
                          type="button"
                          onClick={() => removeChip('preferred_locations', item)}
                        >
                          <Icon name="compass-cracked" size="sm" hideAccent />
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
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {prefs.allowed_timezones.map((item) => (
                      <span key={item} className="chip">
                        {item}
                        <button
                          type="button"
                          onClick={() => removeChip('allowed_timezones', item)}
                        >
                          <Icon name="compass-cracked" size="sm" hideAccent />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Compensation */}
          <article className="surface-card">
            <div className="rl-field-grid">
              {sectionHeader(
                <Icon name="scroll" size="sm" hideAccent />,
                'Compensation',
                'This never gets shared with employers. It helps us compare your floor to current ranges and hide roles that are not financially respectful.'
              )}
              <div style={{ display: 'grid', gap: 12 }}>
                <label className="rl-label">
                  Minimum base salary
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
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
                      style={{ flex: 2 }}
                    />
                    <select
                      className="rl-select"
                      value={prefs.salary_currency}
                      onChange={(e) =>
                        updateField('salary_currency', e.target.value)
                      }
                      style={{ flex: 1 }}
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
                      style={{ flex: 1 }}
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

          {/* Keywords & filters */}
          <article className="surface-card">
            <div className="rl-field-grid">
              {sectionHeader(
                <Icon name="seeds" size="sm" hideAccent />,
                'Keywords & filters',
                'Tell Relevnt what language feels like a green flag or a red flag so we can gently up-rank or down-rank roles in your feed.'
              )}
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label className="rl-label">
                    Keywords to lean toward
                    <input
                      className="rl-input"
                      type="text"
                      value={chipDrafts.include_keywords}
                      onChange={(e) =>
                        setChipDrafts({
                          ...chipDrafts,
                          include_keywords: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addChip('include_keywords')
                        }
                      }}
                      placeholder="e.g., ethical AI, non-profit, public health, climate, women-led"
                    />
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {prefs.include_keywords?.map((item) => (
                      <span key={item} className="chip">
                        {item}
                        <button
                          type="button"
                          onClick={() => removeChip('include_keywords', item)}
                        >
                          <Icon name="compass-cracked" size="sm" hideAccent />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="rl-help">
                    Think of these as "this looks like my lane" signals. We use them to gently boost
                    jobs that sound like your people.
                  </div>
                </div>

                <div>
                  <label className="rl-label">
                    Words or phrases to avoid
                    <input
                      className="rl-input"
                      type="text"
                      value={chipDrafts.avoid_keywords}
                      onChange={(e) =>
                        setChipDrafts({
                          ...chipDrafts,
                          avoid_keywords: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addChip('avoid_keywords')
                        }
                      }}
                      placeholder="e.g., crypto, MLM, unpaid, commission only, hustle, rockstar"
                    />
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {prefs.avoid_keywords?.map((item) => (
                      <span key={item} className="chip">
                        {item}
                        <button
                          type="button"
                          onClick={() => removeChip('avoid_keywords', item)}
                        >
                          <Icon name="compass-cracked" size="sm" hideAccent />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="rl-help">
                    We use these as soft filters and down-rank signals, not hard blocks, so you never
                    miss something genuinely aligned that uses messy language.
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Safeties */}
          <article className="surface-card">
            <div className="rl-field-grid">
              {sectionHeader(
                <Icon name="compass-cracked" size="sm" hideAccent />,
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
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {prefs.exclude_titles.map((item) => (
                      <span key={item} className="chip">
                        {item}
                        <button
                          type="button"
                          onClick={() => removeChip('exclude_titles', item)}
                        >
                          <Icon name="compass-cracked" size="sm" hideAccent />
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
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {prefs.exclude_companies.map((item) => (
                      <span key={item} className="chip">
                        {item}
                        <button
                          type="button"
                          onClick={() => removeChip('exclude_companies', item)}
                        >
                          <Icon name="compass-cracked" size="sm" hideAccent />
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
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {prefs.exclude_contract_types.map((item) => (
                      <span key={item} className="chip">
                        {item}
                        <button
                          type="button"
                          onClick={() =>
                            removeChip('exclude_contract_types', item)
                          }
                        >
                          <Icon name="compass-cracked" size="sm" hideAccent />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Auto apply */}
          <article className="surface-card">
            <div className="rl-field-grid">
              {sectionHeader(
                <Icon name="paper-airplane" size="sm" hideAccent />,
                'Auto apply guardrails',
                'If you turn on auto apply, these are the rules we follow, including preferring the employer site when available so your applications look intentional, not spray and pray.'
              )}
              <div style={{ display: 'grid', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={prefs.enable_auto_apply}
                    onChange={(e) =>
                      updateField('enable_auto_apply', e.target.checked)
                    }
                    className="jobprefs-checkbox"
                    style={{ width: 16, height: 16, accentColor: 'var(--color-accent)' }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Allow Relevnt to auto-apply on my behalf</span>
                </label>

                <label className="rl-label">
                  Minimum match score
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon name="stars" size="sm" hideAccent />
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

        <div style={{ marginTop: 24, paddingBottom: 64, display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="primary-button"
            style={{ opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            {saving ? 'Saving…' : 'Save preferences'}
          </button>
          {saveStatus === 'saved' && (
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span style={{ fontSize: 13, color: 'var(--color-error)' }}>
              We could not save your preferences. Try again.
            </span>
          )}
          {error && (
            <span style={{ fontSize: 13, color: 'var(--color-error)' }}>{error}</span>
          )}
        </div>
      </Container>
    </div>
  )
}
