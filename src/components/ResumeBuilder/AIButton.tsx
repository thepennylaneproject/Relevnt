import React from 'react'
import { AiAssistIcon } from '../icons/RelevntIcons'

interface Props {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  label: string
}

export const AIButton: React.FC<Props> = ({ onClick, loading, disabled, label }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: '6px 12px',
        borderRadius: 999,
        border: '1px solid rgba(129, 140, 248, 0.7)',
        background: 'rgba(30, 64, 175, 0.1)',
        color: '#4f46e5', // Indigo 600
        fontSize: 12,
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.background = 'rgba(30, 64, 175, 0.15)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(30, 64, 175, 0.1)'
      }}
    >
      <AiAssistIcon size={14} />
      <span>{loading ? 'Thinking...' : label}</span>
    </button>
  )
}