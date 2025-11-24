import React from 'react'
import { HandSparkIcon } from '../icons/handdrawn/HanddrawnIcons'
import { useRelevntColors } from '../../hooks'

type Props = {
  resumeCount: number
  matchCount: number
  activeApplicationsCount: number
}

export const ThisWeekPanel: React.FC<Props> = ({ resumeCount, matchCount, activeApplicationsCount }) => {
  const colors = useRelevntColors()

  const suggestions: string[] = []
  if (resumeCount > 3) suggestions.push('Archive older resumes; keep 2–3 sharp versions.')
  if (matchCount === 0) suggestions.push('Adjust filters or add a skill to find a fresh match.')
  if (activeApplicationsCount > 0) suggestions.push('Revisit one quiet application and send a nudge.')
  while (suggestions.length < 3) {
    suggestions.push('Review one saved job and jot a quick tailored bullet.')
  }

  return (
    <div
      style={{
        border: `1px solid ${colors.borderLight}`,
        borderRadius: 16,
        padding: 16,
        background: colors.surface,
        display: 'grid',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <HandSparkIcon size={20} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: colors.text }}>This week</div>
          <div style={{ fontSize: 13, color: colors.textSecondary }}>Three quick moves to keep momentum without the burnout.</div>
        </div>
      </div>
      <ul style={{ margin: 0, paddingLeft: 16, display: 'grid', gap: 6 }}>
        {suggestions.slice(0, 3).map((s, idx) => (
          <li key={idx} style={{ fontSize: 13, color: colors.text }}>
            {s}
          </li>
        ))}
      </ul>
    </div>
  )
}
