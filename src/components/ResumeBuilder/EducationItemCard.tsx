// src/pages/ResumeBuilder/components/EducationItemCard.tsx
import React, { ChangeEvent } from 'react'
import { ResumeEducationItem } from '../../types/resume-builder.types' // adjust if needed
import { inputClass, itemCardClass, labelClass, removeButtonClass } from './sectionStyles'

interface EducationItemCardProps {
  item: ResumeEducationItem
  onChange: (item: ResumeEducationItem) => void
  onRemove: () => void
}

export const EducationItemCard: React.FC<EducationItemCardProps> = ({
  item,
  onChange,
  onRemove,
}) => {
  const handleFieldChange =
    (field: keyof ResumeEducationItem) =>
      (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange({
          ...item,
          [field]: e.target.value,
        })
      }

  return (
    <div
      className={itemCardClass}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>School</label>
          <input
            className={inputClass}
            value={(item.institution as string) || ''}
            onChange={handleFieldChange('institution')}
            placeholder="Iowa State University"
          />
        </div>
        <div>
          <label className={labelClass}>Degree</label>
          <input
            className={inputClass}
            value={(item.degree as string) || ''}
            onChange={handleFieldChange('degree')}
            placeholder="BA, Marketing"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Field of study</label>
          <input
            className={inputClass}
            value={(item.fieldOfStudy as string) || ''}
            onChange={handleFieldChange('fieldOfStudy')}
            placeholder="Digital Media and Communications"
          />
        </div>
        <div>
          <label className={labelClass}>Location</label>
          <input
            className={inputClass}
            value={(item.location as string) || ''}
            onChange={handleFieldChange('location')}
            placeholder="Ames, IA"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Start</label>
          <input
            className={inputClass}
            value={(item.startDate as string) || ''}
            onChange={handleFieldChange('startDate')}
            placeholder="2014-08"
          />
        </div>
        <div>
          <label className={labelClass}>End</label>
          <input
            className={inputClass}
            value={(item.endDate as string) || ''}
            onChange={handleFieldChange('endDate')}
            placeholder="2018-05"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className={removeButtonClass}
      >
        ✕ Remove education
      </button>
    </div>
  )
}
