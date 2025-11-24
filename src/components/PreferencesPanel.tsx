// src/components/PreferencesPanel.tsx
import React, { useCallback } from 'react'
import { useUserPreferences } from '../hooks/useUserPreferences'

const cardStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 16,
  border: '1px solid var(--border, #e2e2e2)',
  background: 'var(--surface, #ffffff)',
  maxWidth: 640,
}

const sectionTitle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  marginBottom: 4,
}

const sectionHelp: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-subtle, #666)',
  marginBottom: 12,
}

const label: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  marginBottom: 4,
  display: 'block',
}

const row: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
  gap: 12,
}

const pillInput: React.CSSProperties = {
  height: 36,
  borderRadius: 999,
  border: '1px solid #e2e2e2',
  padding: '0 12px',
  fontSize: 13,
  width: '100%',
  backgroundColor: '#fff',
  boxSizing: 'border-box',
}

const textareaStyle: React.CSSProperties = {
  borderRadius: 12,
  border: '1px solid #e2e2e2',
  padding: 10,
  fontSize: 13,
  width: '100%',
  minHeight: 60,
  resize: 'vertical',
  boxSizing: 'border-box',
}

const metaRow: React.CSSProperties = {
  marginTop: 8,
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 11,
  color: '#777',
  gap: 8,
  flexWrap: 'wrap',
}

export function PreferencesPanel() {
  const {
    prefs,
    loading,
    saving,
    error,
    updatePreferences,
  } = useUserPreferences()

  const handleNumberChange = useCallback(
    (value: string) => {
      const numeric = value.replace(/[^\d]/g, '')
      const num =
        numeric === '' ? null : Number(numeric)
      void updatePreferences({ min_salary: num })
    },
    [updatePreferences]
  )

  if (loading && !prefs) {
    return (
      <div style={cardStyle}>
        <div style={sectionTitle}>
          Job match preferences
        </div>
        <p style={sectionHelp}>
          Loading how picky you want Relevnt to be…
        </p>
      </div>
    )
  }

  if (!prefs) {
    return (
      <div style={cardStyle}>
        <div style={sectionTitle}>
          Job match preferences
        </div>
        <p style={sectionHelp}>
          Sign in to tell Relevnt what a good fit looks
          like for you.
        </p>
      </div>
    )
  }

  return (
    <div style={cardStyle}>
      <div style={sectionTitle}>
        Job match preferences
      </div>
      <p style={sectionHelp}>
        These settings guide how your feed scores roles
        against you. We use them as guardrails, not
        hard walls, so you still see interesting edge
        cases.
      </p>

      {/* salary + remote */}
      <div style={row}>
        <div>
          <label style={label}>
            Minimum salary target (USD)
          </label>
          <input
            type="number"
            min={0}
            step={5000}
            defaultValue={
              prefs.min_salary ?? ''
            }
            onBlur={(e) =>
              handleNumberChange(e.target.value)
            }
            placeholder="For example 85000"
            style={pillInput}
          />
          <div
            style={{
              fontSize: 11,
              color: '#777',
              marginTop: 4,
            }}
          >
            We do not auto reject jobs below this yet,
            but we score roles that meet it higher.
          </div>
        </div>

        <div>
          <label style={label}>
            Work style preference
          </label>
          <select
            value={prefs.remote_preference}
            onChange={(e) =>
              updatePreferences({
                remote_preference:
                  e.target.value as
                    | 'remote_only'
                    | 'hybrid'
                    | 'onsite'
                    | '',
              })
            }
            style={pillInput}
          >
            <option value="">
              No strong preference
            </option>
            <option value="remote_only">
              Remote only
            </option>
            <option value="hybrid">
              Hybrid is ideal
            </option>
            <option value="onsite">
              Mostly onsite
            </option>
          </select>
          <div
            style={{
              fontSize: 11,
              color: '#777',
              marginTop: 4,
            }}
          >
            Remote friendly roles score higher if you
            choose remote or hybrid.
          </div>
        </div>
      </div>

      {/* locations */}
      <div style={{ marginTop: 16 }}>
        <label style={label}>
          Preferred locations
        </label>
        <textarea
          defaultValue={prefs.preferred_locations}
          onBlur={(e) =>
            updatePreferences({
              preferred_locations:
                e.target.value,
            })
          }
          placeholder="For example: Remote, Pacific Northwest, Seattle, Portland"
          style={textareaStyle}
        />
        <div
          style={{
            fontSize: 11,
            color: '#777',
            marginTop: 4,
          }}
        >
          We look for these phrases in job locations
          so roles in your regions float up.
        </div>
      </div>

      {/* titles */}
      <div style={{ marginTop: 16 }}>
        <label style={label}>
          Target titles
        </label>
        <textarea
          defaultValue={prefs.target_titles}
          onBlur={(e) =>
            updatePreferences({
              target_titles: e.target.value,
            })
          }
          placeholder="For example: Product Manager, Marketing Lead, Growth Strategist"
          style={textareaStyle}
        />
        <div
          style={{
            fontSize: 11,
            color: '#777',
            marginTop: 4,
          }}
        >
          We use this to check how closely a job title
          lines up with your goals.
        </div>
      </div>

      {/* include / exclude keywords */}
      <div style={{ marginTop: 16, ...row }}>
        <div>
          <label style={label}>
            Skills or themes to lean into
          </label>
          <textarea
            defaultValue={prefs.keywords_include}
            onBlur={(e) =>
              updatePreferences({
                keywords_include:
                  e.target.value,
              })
            }
            placeholder="For example: AI, social impact, education, creative strategy"
            style={textareaStyle}
          />
        </div>
        <div>
          <label style={label}>
            Hard no keywords
          </label>
          <textarea
            defaultValue={prefs.keywords_exclude}
            onBlur={(e) =>
              updatePreferences({
                keywords_exclude:
                  e.target.value,
              })
            }
            placeholder="For example: crypto, oil and gas, gambling"
            style={textareaStyle}
          />
        </div>
      </div>

      <div style={metaRow}>
        <span>
          {saving
            ? 'Saving your preferences…'
            : 'Your feed will start to respect this more as new roles come in.'}
        </span>
        {error && (
          <span style={{ color: '#b3261e' }}>
            {error}
          </span>
        )}
      </div>
    </div>
  )
}