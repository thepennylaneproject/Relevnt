// src/pages/ResumeBuilder/components/ProjectItemCard.tsx
import React, { ChangeEvent } from 'react'
import { ResumeProjectItem } from '../../types/resume-builder.types'
import { inputClass, itemCardClass, labelClass, textareaClass } from './sectionStyles'
import { InlineQuestionHelper } from '../Applications/InlineQuestionHelper'


interface ProjectItemCardProps {
  item: ResumeProjectItem
  onChange: (item: ResumeProjectItem) => void
  onRemove: () => void
}

export const ProjectItemCard: React.FC<ProjectItemCardProps> = ({
  item,
  onChange,
  onRemove,
}) => {
  const handleFieldChange =
    (field: keyof ResumeProjectItem) =>
      (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange({
          ...item,
          [field]: e.target.value,
        })
      }

  const handleTechChange =
    (e: ChangeEvent<HTMLInputElement>) => {
      const list = e.target.value
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      onChange({
        ...item,
        techStack: list,
      } as ResumeProjectItem)
    }

  return (
    <div
      className={itemCardClass}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Project name</label>
          <input
            className={inputClass}
            value={(item.name as string) || ''}
            onChange={handleFieldChange('name')}
            placeholder="Relevnt, AI career platform"
          />
        </div>
        <div>
          <label className={labelClass}>Role</label>
          <input
            className={inputClass}
            value={(item.role as string) || ''}
            onChange={handleFieldChange('role')}
            placeholder="Founder, Product and Marketing"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className={labelClass}>Project link (optional)</label>
        <input
          className={inputClass}
          value={(item.link as string) || ''}
          onChange={handleFieldChange('link')}
          placeholder="https://relevnt.work"
        />
      </div>

      <div className="mt-4">
        <label className={labelClass}>Highlights/Impact</label>
        <textarea
          className={textareaClass}
          rows={4}
          value={(item.description as string) || ''}
          onChange={handleFieldChange('description')}
          placeholder="Built full stack architecture, integrated LLM APIs, drove 200%+ IG growth…"
        />
        <InlineQuestionHelper
          questionText={`Describe the impact and highlights of ${(item.name as string) || 'this project'}.`}
          fieldValue={(item.description as string) || ''}
          onInsert={(text) => onChange({ ...item, description: text })}
        />
      </div>

      <div className="mt-4">
        <label className={labelClass}>Technologies (comma separated)</label>
        <input
          className={inputClass}
          value={Array.isArray(item.techStack) ? item.techStack.join(', ') : ''}
          onChange={handleTechChange}
          placeholder="React, Supabase, Netlify, Tailwind, OpenAI"
        />
      </div>

      <button
        type="button"
        className="action-remove mt-4"
        onClick={onRemove}
        aria-label="Remove project"
      >
        Remove project
      </button>
    </div>
  )
}

