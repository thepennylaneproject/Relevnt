// src/pages/ResumeBuilder/components/ExperienceSection.tsx
import React from 'react'
import { SectionCard } from './SectionCard'
import { ExperienceItemCard } from './ExperienceItemCard'
import { ResumeExperienceItem } from '../../types/resume-builder.types'
import { RelevntColors } from '../../hooks/useRelevntColors'
import { Button } from '../ui/Button'
import { Briefcase } from "lucide-react"

interface ExperienceSectionProps {
  id: string
  items: ResumeExperienceItem[]
  onChange: (items: ResumeExperienceItem[]) => void
  colors?: RelevntColors
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  id,
  items,
  onChange,
  colors,
}) => {
  const addItem = () => {
    const newItem: ResumeExperienceItem = {
      id: crypto.randomUUID(),
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      bullets: '',
    }
    onChange([...items, newItem])
  }

  const updateItem = (index: number, item: ResumeExperienceItem) => {
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
      title="Experience"
      description="Roles where you did the most damage, quantified and structured."
      icon={<Briefcase className="w-4 h-4 text-[#1F2933]" />}
    >
      <div className="space-y-4">
        {items.map((item, index) => (
          <ExperienceItemCard
            key={item.id || index}
            item={item}
            onChange={(updated) => updateItem(index, updated)}
            onRemove={() => removeItem(index)}
          />
        ))}

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addItem}
        >
          + Add experience
        </Button>
      </div>
    </SectionCard>
  )
}
