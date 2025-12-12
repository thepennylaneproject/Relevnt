// src/pages/ResumeBuilder/components/SkillsSection.tsx
import React, { ChangeEvent, useState } from 'react'
import { SectionCard } from './SectionCard'
import { ResumeSkillGroup } from '../../types/resume-builder.types'
import { RelevntColors } from '../../hooks/useRelevntColors'
import { AIButton } from './AIButton'
import { useAITask } from '../../hooks/useAITask'
import { addButtonClass, inputClass, itemCardClass, labelClass, removeButtonClass } from './sectionStyles'
import { FileText } from "lucide-react"

interface SkillsSectionProps {
  id: string
  skillGroups: ResumeSkillGroup[]
  onChange: (groups: ResumeSkillGroup[]) => void
  colors?: RelevntColors
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
      title="Skills"
      description="Group skills into themes: Core, Technical, Leadership, Tools, etc."
      icon={<FileText className="w-4 h-4 text-[#1F2933]" />}
    >
      <div className="space-y-4">
        {skillGroups.map((group, index) => (
          <div
            key={group.label || index}
            className={itemCardClass}
          >
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={labelClass}>Group title</label>
                <input
                  className={inputClass}
                  value={group.label || ''}
                  onChange={handleGroupTitleChange(index)}
                  placeholder="Core Skills"
                />
              </div>
              <button
                type="button"
                onClick={() => removeGroup(index)}
                className={removeButtonClass}
              >
                ✕
              </button>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between gap-3">
                <label className={labelClass}>Skills (comma separated)</label>
                <AIButton
                  label="Suggest Skills"
                  onClick={handleSuggestSkills(index)}
                  loading={loading && lastActionIndex === index}
                  disabled={!group.label}
                />
              </div>
              <input
                className={inputClass}
                value={(group.skills || []).join(', ')}
                onChange={handleGroupSkillsChange(index)}
                placeholder="Demand generation, Campaign strategy, CRM architecture"
              />
              {error && lastActionIndex === index && (
                <div className="text-xs text-rose-600">{error.message}</div>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addGroup}
          className={addButtonClass}
        >
          + Add skill group
        </button>
      </div>
    </SectionCard>
  )
}
