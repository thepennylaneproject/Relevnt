// src/pages/ResumeBuilder/components/ProjectsSection.tsx
import React from 'react'
import { SectionCard } from './SectionCard'
import { ProjectItemCard } from './ProjectItemCard'
import { ResumeProjectItem } from '../../types/resume-builder.types'
import { RelevntColors } from '../../hooks/useRelevntColors'
import { FolderOpen } from "lucide-react"

interface ProjectsSectionProps {
  id: string
  items: ResumeProjectItem[]
  onChange: (items: ResumeProjectItem[]) => void
  colors?: RelevntColors
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  id,
  items,
  onChange,
  colors,
}) => {
  const addItem = () => {
    const newItem: ResumeProjectItem = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      role: '',
      link: '',
      startDate: '',
      endDate: '',
      highlights: '',
      technologies: [],
    } as ResumeProjectItem

    onChange([...items, newItem])
  }

  const updateItem = (index: number, item: ResumeProjectItem) => {
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
      title="Projects"
      description="Founder builds, side projects, and proof of concept work."
      icon={<FolderOpen className="w-4 h-4 text-[var(--color-ink)]" />}
    >
      <div className="space-y-4">
        {items.map((item, index) => (
          <ProjectItemCard
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
          + Add project
        </button>
      </div>
    </SectionCard>
  )
}

