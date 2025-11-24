import React from 'react'
import { useRelevntColors } from '../../hooks'
import { Link } from 'react-router-dom'

type Props = {
  matchCount: number
  activeApplicationsCount: number
  resumeCount: number
}

export const NextMoveCard: React.FC<Props> = ({ matchCount, activeApplicationsCount, resumeCount }) => {
  const colors = useRelevntColors()

  let headline = 'Review one resume and one saved job.'
  let cta = { label: 'Open matches', to: '/jobs' }

  if (matchCount === 0 && resumeCount > 0) {
    headline = 'Browse matches using your default resume.'
    cta = { label: 'See matches', to: '/jobs' }
  } else if (activeApplicationsCount === 0 && matchCount > 0) {
    headline = 'Pick one good match and send a tailored app.'
    cta = { label: 'Send one app', to: '/jobs' }
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
      <div style={{ fontSize: 15, fontWeight: 800, color: colors.text }}>Next move</div>
      <div style={{ fontSize: 13, color: colors.textSecondary }}>{headline}</div>
      <Link
        to={cta.to}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 12px',
          borderRadius: 12,
          border: `1px solid ${colors.borderLight}`,
          background: colors.surfaceHover,
          color: colors.text,
          fontWeight: 700,
          textDecoration: 'none',
        }}
      >
        {cta.label}
      </Link>
    </div>
  )
}
