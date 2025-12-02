import React from 'react'

interface Props {
  label: string
  icon?: string
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
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '8px 10px',
        borderRadius: 999,
        border: 'none',
        background: active
          ? 'rgba(148, 163, 184, 0.24)'
          : 'transparent',
        color: active ? '#e5e7eb' : '#9ca3af',
        fontSize: 13,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        cursor: 'pointer',
      }}
    >
      {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
      <span>{label}</span>
    </button>
  )
}