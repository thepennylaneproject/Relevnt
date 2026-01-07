import * as React from 'react'

type AIButtonProps = {
  label: string
  onClick?: () => void | Promise<void>
  disabled?: boolean
  loading?: boolean
}

export function AIButton({ label, onClick, disabled, loading }: AIButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className="action-helper"
    >
      {loading ? 'Thinking…' : label}
    </button>
  )
}

