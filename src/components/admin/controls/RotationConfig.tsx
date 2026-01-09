// src/components/admin/controls/RotationConfig.tsx
/**
 * Rotation Config Panel
 * 
 * Edit rotation settings via admin_config table.
 */

import React, { useEffect, useState, useCallback } from 'react'
import { CustomIcon } from '../../ui/CustomIcon'

interface ConfigItem {
  key: string
  value: any
  description: string | null
}

interface RotationConfigProps {
  adminSecret: string
}

export function RotationConfig({ adminSecret }: RotationConfigProps) {
  const [config, setConfig] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})

  const rotationKeys = [
    'rotation.max_company_targets_per_run',
    'rotation.max_search_slices_per_run',
  ]

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/.netlify/functions/admin_config', {
        headers: { 'x-admin-secret': adminSecret },
      })
      
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)

      const data = await res.json()
      const allConfig = data.config || []
      const rotationConfig = allConfig.filter((c: ConfigItem) => 
        rotationKeys.includes(c.key)
      )
      setConfig(rotationConfig)
      
      // Initialize edited values
      const values: Record<string, string> = {}
      rotationConfig.forEach((c: ConfigItem) => {
        values[c.key] = typeof c.value === 'string' ? c.value : JSON.stringify(c.value)
      })
      setEditedValues(values)
      
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [adminSecret])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const promises = Object.entries(editedValues).map(([key, value]) => {
        return fetch('/.netlify/functions/admin_config', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-admin-secret': adminSecret,
          },
          body: JSON.stringify({ key, value }),
        })
      })

      const results = await Promise.all(promises)
      const failed = results.filter(r => !r.ok)

      if (failed.length > 0) {
        throw new Error(`${failed.length} config updates failed`)
      }

      setSuccess('Rotation settings updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
      
      await fetchConfig()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = config.some(c => {
    const original = typeof c.value === 'string' ? c.value : JSON.stringify(c.value)
    return editedValues[c.key] !== original
  })

  const getLabel = (key: string) => {
    const labels: Record<string, string> = {
      'rotation.max_company_targets_per_run': 'Company targets per run',
      'rotation.max_search_slices_per_run': 'Search slices per run',
    }
    return labels[key] || key
  }

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Loading config...</div>
  }

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: 20,
      background: 'var(--surface)',
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8,
        marginBottom: 20,
      }}>
        <CustomIcon name="settings" size={20} color="ink" />
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
          Rotation Settings
        </h3>
      </div>

      {error && (
        <div style={{
          padding: 12,
          marginBottom: 16,
          borderRadius: 6,
          background: 'var(--color-error-bg)',
          color: 'var(--color-error)',
          fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: 12,
          marginBottom: 16,
          borderRadius: 6,
          background: 'var(--color-success-bg)',
          color: 'var(--color-success)',
          fontSize: 13,
        }}>
          {success}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {config.map((item) => (
          <div key={item.key}>
            <label style={{ 
              display: 'block', 
              marginBottom: 6, 
              fontSize: 13, 
              fontWeight: 500,
              color: 'var(--text)',
            }}>
              {getLabel(item.key)}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="number"
                value={editedValues[item.key] || ''}
                onChange={(e) => setEditedValues({
                  ...editedValues,
                  [item.key]: e.target.value,
                })}
                style={{
                  width: 120,
                  padding: '8px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  fontSize: 14,
                  background: 'var(--surface-input)',
                }}
              />
              {item.description && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {item.description}
                </span>
              )}
            </div>
          </div>
        ))}

        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0' }}>
          Changes take effect on the next ingestion run.
        </p>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: 6,
              background: hasChanges ? 'var(--color-accent)' : 'var(--surface-hover)',
              color: hasChanges ? 'white' : 'var(--text-muted)',
              cursor: hasChanges ? 'pointer' : 'not-allowed',
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          {hasChanges && (
            <button
              onClick={fetchConfig}
              style={{
                padding: '10px 20px',
                border: '1px solid var(--border)',
                borderRadius: 6,
                background: 'var(--surface)',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
