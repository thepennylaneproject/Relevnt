import React from 'react'
import { useRelevntColors } from '../../hooks'

export type UpcomingEvent = {
  id: string
  type: 'follow_up' | 'interview' | 'deadline' | 'task'
  label: string
  date: string // ISO
}

type Props = {
  events: UpcomingEvent[]
}

export const ThisWeekScheduleTeaser: React.FC<Props> = ({ events }) => {
  const colors = useRelevntColors()

  const formatter = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

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
      <div style={{ fontSize: 15, fontWeight: 800, color: colors.text }}>This week’s schedule</div>
      {events.length === 0 ? (
        <div style={{ fontSize: 13, color: colors.textSecondary }}>
          We’ll start filling this in as you add follow-ups and interview dates.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {events.slice(0, 3).map((event) => (
            <div
              key={event.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                borderRadius: 12,
                background: colors.surfaceHover,
                border: `1px dashed ${colors.borderLight}`,
              }}
            >
              <div style={{ display: 'grid', gap: 2 }}>
                <span style={{ fontSize: 13, color: colors.text, fontWeight: 700 }}>{formatter.format(new Date(event.date))}</span>
                <span style={{ fontSize: 12, color: colors.textSecondary }}>{event.label}</span>
              </div>
              <span style={{ fontSize: 11, color: colors.textSecondary, textTransform: 'capitalize' }}>{event.type.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        style={{
          justifySelf: 'start',
          padding: '6px 10px',
          borderRadius: 10,
          border: `1px solid ${colors.borderLight}`,
          background: 'transparent',
          color: colors.textSecondary,
          cursor: 'pointer',
          fontSize: 12,
        }}
      >
        Open timeline (coming soon)
      </button>
    </div>
  )
}
