// src/pages/ResumeBuilder/components/ProjectsSection.tsx
import React from 'react'
import { SectionCard } from './SectionCard'
import { ProjectItemCard } from './ProjectItemCard'
import { ResumeProjectItem } from '../../types/resume-builder.types'
import { RelevntColors } from '../../hooks/useRelevntColors'

interface ProjectsSectionProps {
  id: string
  items: ResumeProjectItem[]
  onChange: (items: ResumeProjectItem[]) => void
  colors: RelevntColors
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
      id={id}
      title="Projects"
      icon="🚀"
      description="Founder builds, side projects, and proof of concept work."
      colors={colors}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
          onClick={addItem}
          style={addButtonStyle}
        >
          + Add project
        </button>
      </div>
    </SectionCard>
  )
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