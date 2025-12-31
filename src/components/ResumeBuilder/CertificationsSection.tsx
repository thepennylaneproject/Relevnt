// src/pages/ResumeBuilder/components/CertificationsSection.tsx
import React, { ChangeEvent } from 'react'
import { SectionCard } from './SectionCard'
import { ResumeCertificationItem } from '../../types/resume-builder.types'
import { RelevntColors } from '../../hooks/useRelevntColors'
import { Button } from '../ui/Button'
import { inputClass, itemCardClass, labelClass } from './sectionStyles'
import { Award } from "lucide-react"

interface CertificationsSectionProps {
  id: string
  items: ResumeCertificationItem[]
  onChange: (items: ResumeCertificationItem[]) => void
  colors?: RelevntColors
}

export const CertificationsSection: React.FC<CertificationsSectionProps> = ({
  id,
  items,
  onChange,
  colors,
}) => {
  const handleFieldChange =
    (index: number, field: keyof ResumeCertificationItem) =>
      (e: ChangeEvent<HTMLInputElement>) => {
        const next = [...items]
        next[index] = {
          ...next[index],
          [field]: e.target.value,
        }
        onChange(next)
      }

  const addItem = () => {
    const newItem: ResumeCertificationItem = {
      id: crypto.randomUUID(),
      name: '',
      issuer: '',
      issueDate: '',
      expiryDate: '',
      url: '',
    } as ResumeCertificationItem

    onChange([...items, newItem])
  }

  const removeItem = (index: number) => {
    const next = items.filter((_, i) => i !== index)
    onChange(next)
  }

  return (
    <SectionCard
      title="Certifications"
      description="License, certs, and credentials that move the needle."
      icon={<Award className="w-4 h-4 text-[#1F2933]" />}
    >
      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={item.id || index}
            className={itemCardClass}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  className={inputClass}
                  value={(item.name as string) || ''}
                  onChange={handleFieldChange(index, 'name')}
                  placeholder="Hydrafacial Certified Provider"
                />
              </div>
              <div>
                <label className={labelClass}>Issuer</label>
                <input
                  className={inputClass}
                  value={(item.issuer as string) || ''}
                  onChange={handleFieldChange(index, 'issuer')}
                  placeholder="Hydrafacial / Manufacturer"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Issued</label>
                <input
                  className={inputClass}
                  value={(item.year as string) || ''}
                  onChange={handleFieldChange(index, 'year')}
                  placeholder="2022-04"
                />
              </div>
              <div>
                <label className={labelClass}>Expires (optional)</label>
                <input
                  className={inputClass}
                  value={(item.year as string) || ''}
                  onChange={handleFieldChange(index, 'year')}
                  placeholder="2025-04"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>URL (optional)</label>
              <input
                className={inputClass}
                value={(item.link as string) || ''}
                onChange={handleFieldChange(index, 'link')}
                placeholder="Link to license or credential"
              />
            </div>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => removeItem(index)}
            >
              ✕ Remove certification
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addItem}
        >
          + Add certification
        </Button>
      </div>
    </SectionCard>
  )
}
