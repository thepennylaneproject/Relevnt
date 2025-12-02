import React from 'react'
import { ResumeBuilderStatus } from '@/hooks/useResumeBuilder'

interface Props {
  status: ResumeBuilderStatus
  isDirty: boolean
  lastSavedAt: string | null
}

export const AutosaveIndicator: React.FC<Props> = ({
  status,
  isDirty,
  lastSavedAt,
}) => {
  let label = ''
  let color = '#9ca3af'

  if (status === 'saving') {
    label = 'Saving…'
    color = '#eab308'
  } else if (status === 'error') {
    label = 'Save failed'
    color = '#f97373'
  } else if (isDirty) {
    label = 'Unsaved changes'
    color = '#eab308'
  } else if (lastSavedAt) {
    const date = new Date(lastSavedAt)
    const timeString = date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })
    label = `Saved at ${timeString}`
    color = '#22c55e'
  } else {
    label = 'Ready'
  }

  return (
    <div
      style={{
        fontSize: 12,
        color,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: color,
        }}
      />
      <span>{label}</span>
    </div>
  )
}