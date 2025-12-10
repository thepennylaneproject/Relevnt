import React from 'react'
import { useSkillInsights } from '../../hooks/useSkillInsights'

interface SkillMapCardProps {
  onSkillSelected?: (slug: string) => void
}

export function SkillMapCard({ onSkillSelected }: SkillMapCardProps) {
  const { insights, isLoading, error } = useSkillInsights()

  const topInsights = insights
    .slice(0, 8)
    .sort((a, b) => b.demandScore - a.demandScore)

  if (isLoading) {
    return (
      <div className="surface-card">
        <div style={{ height: 14, width: 180, background: 'var(--surface-hover)', borderRadius: 8, marginBottom: 8 }} />
        <div style={{ height: 12, width: 220, background: 'var(--surface-hover)', borderRadius: 8 }} />
      </div>
    )
  }

  if (error || topInsights.length === 0) {
    return null
  }

  const badgeColor = (status: string) => {
    if (status === 'solid') return 'var(--surface-hover)'
    if (status === 'gap') return 'var(--color-bg-error)'
    return 'var(--surface)'
  }

  return (
    <div className="surface-card" style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Your skill story</div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
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
            className="chip"
            style={{
              borderRadius: 'var(--radius-full)',
              backgroundColor: badgeColor(skill.status),
              color: 'var(--text)',
              borderColor: 'var(--border-subtle)',
              borderWidth: 1,
              borderStyle: 'solid',
            }}
          >
            <span>{skill.displayName}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
              {skill.status}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
