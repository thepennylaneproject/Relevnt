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
  let tone: 'neutral' | 'warning' | 'error' | 'success' = 'neutral'

  if (status === 'saving') {
    label = 'Saving…'
    tone = 'warning'
  } else if (status === 'error') {
    label = 'Save failed'
    tone = 'error'
  } else if (isDirty) {
    label = 'Unsaved changes'
    tone = 'warning'
  } else if (lastSavedAt) {
    const date = new Date(lastSavedAt)
    const timeString = date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    })
    label = `Saved at ${timeString}`
    tone = 'success'
  } else {
    label = 'Ready'
  }

  const toneStyles: Record<typeof tone, { container: string; dot: string }> = {
    neutral: {
      container: 'border-[#D6C8AA] bg-white/80 text-[#1F2933]',
      dot: 'bg-[#9CA3AF]',
    },
    warning: {
      container: 'border-amber-200 bg-amber-50 text-amber-700',
      dot: 'bg-amber-500',
    },
    error: {
      container: 'border-rose-200 bg-rose-50 text-rose-700',
      dot: 'bg-rose-500',
    },
    success: {
      container: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      dot: 'bg-emerald-500',
    },
  }

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm ${toneStyles[tone].container}`}>
      <span className={`h-2 w-2 rounded-full ${toneStyles[tone].dot}`} />
      <span className="whitespace-nowrap">{label}</span>
    </div>
  )
}
