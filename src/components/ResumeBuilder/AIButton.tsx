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
      className={`btn btn-primary btn-sm ${isDisabled ? 'opacity-60' : ''}`}
    >
      {loading ? 'Thinking…' : label}
    </button>
  )
}
