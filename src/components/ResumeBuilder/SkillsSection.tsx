// src/pages/ResumeBuilder/components/SkillsSection.tsx
import React, { ChangeEvent, useEffect, useState } from 'react'
import { SectionCard } from './SectionCard'
import { ResumeSkillGroup } from '../../types/resume-builder.types'
import { RelevntColors } from '../../hooks/useRelevntColors'
import { AIButton } from './AIButton'
import { useAITask } from '../../hooks/useAITask'
import { inputClass, itemCardClass, labelClass } from './sectionStyles'
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
  const [skillInputs, setSkillInputs] = useState<Record<string, string>>({})
  const [pendingSuggestions, setPendingSuggestions] = useState<Record<string, string[]>>({})

  // Keep local text inputs in sync with incoming props while preserving edits in progress
  useEffect(() => {
    setSkillInputs((prev) => {
      const next: Record<string, string> = {}
      skillGroups.forEach((group, index) => {
        const key = group.id || `${id}-${index}`
        next[key] = prev[key] ?? (group.skills || []).join(', ')
      })
      return next
    })
  }, [skillGroups, id])

  const getGroupKey = React.useCallback((group: ResumeSkillGroup, index: number) => {
    return group.id || `${id}-${index}`
  }, [id])

  const handleAddSkill = (index: number, skillToAdd: string) => {
    const group = skillGroups[index]
    const key = getGroupKey(group, index)

    // Add to main skills list
    const merged = [...group.skills, skillToAdd]
    const next = [...skillGroups]
    next[index] = { ...next[index], skills: merged }

    // Update input state
    setSkillInputs(prev => ({
      ...prev,
      [key]: merged.join(', ')
    }))

    // Remove from pending
    setPendingSuggestions(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter(s => s !== skillToAdd)
    }))

    onChange(next)
  }

  const handleDismissSkill = (index: number, skillToDismiss: string) => {
    const group = skillGroups[index]
    const key = getGroupKey(group, index)

    setPendingSuggestions(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter(s => s !== skillToDismiss)
    }))
  }

  const handleSuggestSkills = (index: number) => async () => {
    setLastActionIndex(index)
    const group = skillGroups[index]
    const key = getGroupKey(group, index)

    try {
      const result = await execute('suggest-skills', {
        category: group.label,
        currentSkills: group.skills,
      })

      if (result.success && result.data) {
        let newSkills: string[] = []

        // Handle nested API response: { success: true, data: { skills: [...] } }
        if ((result.data as any).data && Array.isArray((result.data as any).data.skills)) {
          newSkills = (result.data as any).data.skills
        }
        // Handle direct response: { skills: [...] }
        else if (Array.isArray((result.data as any).skills)) {
          newSkills = (result.data as any).skills
        }
        // Handle direct array response (unlikely but possible)
        else if (Array.isArray(result.data)) {
          newSkills = result.data as string[]
        }

        // Filter out skills we already have
        const currentSet = new Set(group.skills.map(s => s.toLowerCase()))
        const suggestions = newSkills.filter(s => !currentSet.has(s.toLowerCase()))

        if (suggestions.length > 0) {
          setPendingSuggestions(prev => ({
            ...prev,
            [key]: suggestions
          }))
        }
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
    (index: number, key: string) =>
      (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSkillInputs((prev) => ({ ...prev, [key]: value }))
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
      icon={<FileText className="w-4 h-4 text-[var(--color-ink)]" />}
    >
      <div className="space-y-4">
        {skillGroups.map((group, index) => (
          <div
            key={getGroupKey(group, index)}
            className={itemCardClass}
          >
            <div className="flex gap-3 items-start">
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
                className="action-remove"
                onClick={() => removeGroup(index)}
                aria-label="Remove skill group"
              >
                Remove
              </button>
            </div>

            <div className="mt-4">
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
                value={skillInputs[getGroupKey(group, index)] ?? (group.skills || []).join(', ')}
                onChange={handleGroupSkillsChange(index, getGroupKey(group, index))}
                placeholder="Demand generation, Campaign strategy, CRM architecture"
              />

              {/* Pending Suggestions */}
              {pendingSuggestions[getGroupKey(group, index)]?.length > 0 && (
                <div className="mt-2 text-sm">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Suggestions (click to add):</span>
                  <div className="flex flex-wrap gap-2">
                    {pendingSuggestions[getGroupKey(group, index)].map((skill) => (
                      <div key={skill} className="flex overflow-hidden rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] animate-in slide-in-from-bottom-1">
                        <button
                          type="button"
                          onClick={() => handleAddSkill(index, skill)}
                          className="px-2 py-1 text-xs hover:bg-[var(--surface-2)] hover:text-[var(--color-text)] transition-colors"
                        >
                          + {skill}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDismissSkill(index, skill)}
                          className="border-l border-[var(--color-border)] px-1.5 py-1 text-xs hover:bg-[var(--surface-2)] hover:text-[var(--color-text)] transition-colors"
                          title="Dismiss"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPendingSuggestions(prev => {
                        const next = { ...prev }
                        delete next[getGroupKey(group, index)]
                        return next
                      })}
                      className="text-xs text-muted-foreground hover:text-foreground hover:underline px-1"
                    >
                      Dismiss All
                    </button>
                  </div>
                </div>
              )}

              {error && lastActionIndex === index && (
                <div className="text-xs text-rose-600">{error.message}</div>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          className="action-add"
          onClick={addGroup}
        >
          + Add skill group
        </button>
      </div>
    </SectionCard>
  )
}

