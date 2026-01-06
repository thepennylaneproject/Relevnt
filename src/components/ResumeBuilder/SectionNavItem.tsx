import React from 'react'

interface Props {
  label: string
  icon?: React.ReactNode
  active?: boolean
  onClick: () => void
}

export const SectionNavItem: React.FC<Props> = ({
  label,
  icon,
  active,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition',
        active
          ? 'bg-[var(--color-accent)] text-[var(--color-ink)] border border-[var(--color-accent-secondary)]'
          : 'bg-[var(--color-bg-alt)] text-[var(--color-ink)] border border-[var(--color-graphite-faint)] hover:bg-[var(--color-surface-hover)]',
      ].join(' ')}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {label}
    </button>
  )
}
