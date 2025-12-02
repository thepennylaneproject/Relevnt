// src/pages/ResumeBuilder/components/EducationSection.tsx
import React from 'react'
import { SectionCard } from './SectionCard'
import { EducationItemCard } from './EducationItemCard'
import { ResumeEducationItem } from '../../types/resume-builder.types'
import { RelevntColors } from '../../hooks/useRelevntColors'

interface EducationSectionProps {
  id: string
  items: ResumeEducationItem[]
  onChange: (items: ResumeEducationItem[]) => void
  colors: RelevntColors
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
      id={id}
      title="Education"
      icon="🎓"
      description="Formal education, bootcamps, and high impact training."
      colors={colors}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
          onClick={addItem}
          style={addButtonStyle}
        >
          + Add education
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