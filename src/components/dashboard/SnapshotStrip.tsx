import React, { useState } from 'react'
import { useRelevntColors } from '../../hooks'
import { HandResumeIcon, HandMatchIcon, HandApplicationIcon } from '../icons/handdrawn/HanddrawnIcons'

type SnapshotProps = {
  label: string
  value: string
  helper: string
  icon: React.ReactNode
  loading?: boolean
  onClick?: () => void
}

const SnapshotCard: React.FC<SnapshotProps> = ({ label, value, helper, icon, loading, onClick }) => {
  const colors = useRelevntColors()
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          setExpanded((v) => !v)
          onClick?.()
        }
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        borderRadius: 18,
        border: `1px solid ${colors.borderLight}`,
        backgroundColor: colors.surface,
        transition: 'transform 160ms ease, box-shadow 160ms ease',
        transform: expanded ? 'scale(1.01)' : 'scale(1)',
        boxShadow: expanded ? `0 12px 30px rgba(0,0,0,0.04)` : 'none',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClickCapture={onClick}
    >
      <div
        style={{
          padding: 10,
          borderRadius: 14,
          backgroundColor: colors.surfaceHover,
          display: 'inline-flex',
          transform: expanded ? 'scale(1.07)' : 'scale(1)',
          transition: 'transform 120ms ease',
        }}
      >
        {icon}
      </div>
      <div style={{ display: 'grid', gap: 4 }}>
        <div style={{ fontSize: 12, color: colors.textSecondary }}>{label}</div>
        {loading ? (
          <div className="sketch-skeleton" style={{ height: 18, width: 80 }} />
        ) : (
          <div style={{ fontSize: 20, fontWeight: 800, color: colors.text }}>{value}</div>
        )}
        <div style={{ fontSize: 12, color: colors.textSecondary, maxWidth: 320, lineHeight: 1.4 }}>
          {helper}
        </div>
      </div>
    </div>
  )
}

export const SnapshotStrip: React.FC<{
  resumesCount: number
  jobsCount: number
  applicationsCount: number
  loading?: boolean
}> = ({ resumesCount, jobsCount, applicationsCount, loading }) => {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <SnapshotCard
        label="Resumes"
        value={`${resumesCount}`}
        helper="Keep a clean few; show the clearest story for each path."
        icon={<HandResumeIcon />}
        loading={loading}
      />
      <SnapshotCard
        label="Matches"
        value={`${jobsCount}`}
        helper="High-signal roles you saved or we matched recently."
        icon={<HandMatchIcon />}
        loading={loading}
      />
      <SnapshotCard
        label="Applications"
        value={`${applicationsCount}`}
        helper="Active applications we’re tracking, so you’re never guessing."
        icon={<HandApplicationIcon />}
        loading={loading}
      />
    </div>
  )
}
