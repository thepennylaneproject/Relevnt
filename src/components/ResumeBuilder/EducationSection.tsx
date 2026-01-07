// src/pages/ResumeBuilder/components/EducationSection.tsx
import React from 'react'
import { SectionCard } from './SectionCard'
import { EducationItemCard } from './EducationItemCard'
import { ResumeEducationItem } from '../../types/resume-builder.types'
import { RelevntColors } from '../../hooks/useRelevntColors'
import { GraduationCap } from "lucide-react"

interface EducationSectionProps {
  id: string
  items: ResumeEducationItem[]
  onChange: (items: ResumeEducationItem[]) => void
  colors?: RelevntColors
}

export const EducationSection: React.FC<EducationSectionProps> = ({
  id,
  items,
  onChange,
  colors,
}) => {
  const addItem = () => {
    const newItem: ResumeEducationItem = {
      id: crypto.randomUUID(),
      institution: '',
      school: '',
      degree: '',
      fieldOfStudy: '',
      location: '',
      startDate: '',
      endDate: '',
      details: '',
    } as ResumeEducationItem

    onChange([...items, newItem])
  }

  const updateItem = (index: number, item: ResumeEducationItem) => {
    const next = [...items]
    next[index] = item
    onChange(next)
  }

  const removeItem = (index: number) => {
    const next = items.filter((_, i) => i !== index)
    onChange(next)
  }

  return (
    <SectionCard
      title="Education"
      description="Formal education, bootcamps, and high impact training."
      icon={<GraduationCap className="w-4 h-4 text-[var(--color-ink)]" />}
    >
      <div className="space-y-4">
        {items.map((item, index) => (
          <EducationItemCard
            key={item.id || index}
            item={item}
            onChange={(updated) => updateItem(index, updated)}
            onRemove={() => removeItem(index)}
          />
        ))}

        <button
          type="button"
          className="action-add"
          onClick={addItem}
        >
          + Add education
        </button>
      </div>
    </SectionCard>
  )
}

