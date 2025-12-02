// src/components/ResumeBuilder/SectionCard.tsx
import React from 'react'
import type { RelevntColors } from '../../hooks/useRelevntColors' // adjust import if needed

export interface Props {
  id?: string
  title: string
  description?: string
  icon?: string
  colors: RelevntColors
  showAIButton?: boolean
  children?: React.ReactNode
}

export function SectionCard({ colors, title, description, children }: Props) {
  return (
    <section
      style={{
        background: colors.surface,
        borderRadius: 16,
        border: `1px solid ${colors.border}`,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ borderBottom: `1px solid ${colors.border}`, paddingBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          {title}
        </h2>
        {description && (
          <p style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 1.5 }}>
            {description}
          </p>
        )}
      </div>
      <div>{children}</div>
    </section>
  )
}