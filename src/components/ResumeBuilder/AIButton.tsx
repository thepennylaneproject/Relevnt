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
      className="inline-flex items-center justify-center rounded-lg border border-border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? 'Thinking…' : label}
    </button>
  )
}
