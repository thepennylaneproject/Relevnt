// src/pages/ResumeBuilder/components/SkillsSection.tsx
import React, { ChangeEvent, useState } from 'react'
import { SectionCard } from './SectionCard'
import { ResumeSkillGroup } from '../../types/resume-builder.types'
import { RelevntColors } from '../../hooks/useRelevntColors'
import { AIButton } from './AIButton'
import { useAITask } from '../../hooks/useAITask'

interface SkillsSectionProps {
  id: string
  skillGroups: ResumeSkillGroup[]
  onChange: (groups: ResumeSkillGroup[]) => void
  colors: RelevntColors
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({ id, skillGroups, onChange, colors }) => {
  const { execute, loading, error } = useAITask()
  const [lastActionIndex, setLastActionIndex] = useState<number | null>(null)

  const handleSuggestSkills = (index: number) => async () => {
    setLastActionIndex(index)
    const group = skillGroups[index]
    try {
      const result = await execute('suggest-skills', {
        category: group.label,
        currentSkills: group.skills,
      })

      if (result.success && result.data) {
        const newSkills = (result.data as any).skills || result.data
        // Merge with existing, avoiding duplicates
        const merged = Array.from(new Set([...group.skills, ...newSkills]))

        const next = [...skillGroups]
        next[index] = { ...next[index], skills: merged }
        onChange(next)
      }
    } catch (err) {
      console.error('Failed to suggest skills', err)
    } finally {
      setLastActionIndex(null)
    }
  }
  const handleGroupTitleChange =
    (index: number) =>
      (e: ChangeEvent<HTMLInputElement>) => {
        const next = [...skillGroups]
        next[index] = { ...next[index], label: e.target.value }
        onChange(next)
      }

  const handleGroupSkillsChange =
    (index: number) =>
      (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        const list = value.split(',').map((s) => s.trim()).filter(Boolean)
        const next = [...skillGroups]
        next[index] = { ...next[index], skills: list }
        onChange(next)
      }

  const addGroup = () => {
    onChange([
      ...skillGroups,
      {
        id: crypto.randomUUID(),
        label: 'New skill group',
        title: 'New skill group',
        skills: [],
      } as ResumeSkillGroup,
    ])
  }

  const removeGroup = (index: number) => {
    const next = skillGroups.filter((_, i) => i !== index)
    onChange(next)
  }

  return (
    <SectionCard
      id={id}
      title="Skills"
      icon="🧠"
      description="Group skills into themes: Core, Technical, Leadership, Tools, etc."
      colors={colors}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {skillGroups.map((group, index) => (
          <div
            key={group.label || index}
            style={{
              borderRadius: 12,
              border: '1px solid rgba(148, 163, 184, 0.6)',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Group title</label>
                <input
                  style={inputStyle}
                  value={group.label || ''}
                  onChange={handleGroupTitleChange(index)}
                  placeholder="Core Skills"
                />
              </div>
              <button
                type="button"
                onClick={() => removeGroup(index)}
                style={removeButtonStyle}
              >
                ✕
              </button>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Skills (comma separated)</label>
                <AIButton
                  label="Suggest Skills"
                  onClick={handleSuggestSkills(index)}
                  loading={loading && lastActionIndex === index}
                  disabled={!group.label}
                />
              </div>
              <input
                style={inputStyle}
                value={(group.skills || []).join(', ')}
                onChange={handleGroupSkillsChange(index)}
                placeholder="Demand generation, Campaign strategy, CRM architecture"
              />
              {error && lastActionIndex === index && (
                <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{error.message}</div>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addGroup}
          style={addButtonStyle}
        >
          + Add skill group
        </button>
      </div>
    </SectionCard>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: '#9ca3af',
  marginBottom: 4,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid rgba(148, 163, 184, 0.7)',
  background: 'rgba(15, 23, 42, 0.9)',
  color: '#e5e7eb',
  fontSize: 13,
}

const addButtonStyle: React.CSSProperties = {
  marginTop: 4,
  padding: '6px 10px',
  borderRadius: 999,
  border: '1px dashed rgba(148, 163, 184, 0.7)',
  background: 'transparent',
  color: '#e5e7eb',
  fontSize: 13,
  cursor: 'pointer',
  alignSelf: 'flex-start',
}

const removeButtonStyle: React.CSSProperties = {
  alignSelf: 'flex-end',
  marginTop: 20,
  padding: '4px 8px',
  borderRadius: 999,
  border: '1px solid rgba(248, 113, 113, 0.7)',
  background: 'rgba(127, 29, 29, 0.5)',
  color: '#fecaca',
  cursor: 'pointer',
  fontSize: 12,
}