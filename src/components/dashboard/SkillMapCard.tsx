import React from 'react'
import { useSkillInsights } from '../../hooks/useSkillInsights'
import { useRelevntColors } from '../../hooks'

interface SkillMapCardProps {
  onSkillSelected?: (slug: string) => void
}

export function SkillMapCard({ onSkillSelected }: SkillMapCardProps) {
  const { insights, isLoading, error } = useSkillInsights()
  const colors = useRelevntColors()

  const topInsights = insights
    .slice(0, 8)
    .sort((a, b) => b.demandScore - a.demandScore)

  if (isLoading) {
    return (
      <div
        style={{
          padding: '16px 16px 14px',
          borderRadius: 16,
          backgroundColor: colors.surface,
          border: `1px solid ${colors.borderLight}`,
        }}
      >
        <div style={{ height: 14, width: 180, background: colors.surfaceHover, borderRadius: 8, marginBottom: 8 }} />
        <div style={{ height: 12, width: 220, background: colors.surfaceHover, borderRadius: 8 }} />
      </div>
    )
  }

  if (error || topInsights.length === 0) {
    return null
  }

  const badgeColor = (status: string) => {
    if (status === 'solid') return colors.surfaceHover
    if (status === 'gap') return colors.error + '20'
    return colors.surface
  }

  return (
    <div
      style={{
        padding: '16px 16px 14px',
        borderRadius: 16,
        backgroundColor: colors.surface,
        border: `1px solid ${colors.borderLight}`,
        display: 'grid',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>Your skill story</div>
          <p style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            Click a skill to explore matching roles.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {topInsights.map((skill) => (
          <button
            key={skill.slug}
            type="button"
            onClick={() => onSkillSelected?.(skill.slug)}
            style={{
              padding: '8px 10px',
              borderRadius: 999,
              border: `1px solid ${colors.borderLight}`,
              backgroundColor: badgeColor(skill.status),
              color: colors.text,
              fontSize: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <span>{skill.displayName}</span>
            <span style={{ color: colors.textSecondary, fontSize: 11 }}>
              {skill.status}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
