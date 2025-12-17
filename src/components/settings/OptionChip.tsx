import React from 'react'
import { Icon } from '../ui/Icon'

interface OptionChipProps {
    label: string
    selected?: boolean
    onClick?: () => void
    onRemove?: () => void
    disabled?: boolean
    size?: 'sm' | 'md'
}

export function OptionChip({
    label,
    selected = false,
    onClick,
    onRemove,
    disabled = false,
    size = 'md',
}: OptionChipProps) {
    const isRemovable = !!onRemove
    const isClickable = !!onClick && !disabled

    return (
        <button
            type="button"
            className={`option-chip ${selected ? 'is-selected' : ''} ${size === 'sm' ? 'option-chip--sm' : ''}`}
            onClick={isRemovable ? undefined : onClick}
            disabled={disabled}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: size === 'sm' ? '4px 10px' : '6px 14px',
                fontSize: size === 'sm' ? 12 : 13,
                fontWeight: 500,
                borderRadius: 'var(--radius-full, 9999px)',
                border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--border-subtle)'}`,
                background: selected ? 'var(--color-accent-subtle, rgba(255, 199, 0, 0.1))' : 'transparent',
                color: selected ? 'var(--color-accent)' : 'var(--text)',
                cursor: isClickable ? 'pointer' : 'default',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.15s ease',
            }}
        >
            <span>{label}</span>
            {isRemovable && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        onRemove()
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        border: 'none',
                        background: 'transparent',
                        color: 'inherit',
                        cursor: 'pointer',
                        opacity: 0.6,
                    }}
                    aria-label={`Remove ${label}`}
                >
                    <Icon name="compass-cracked" size="sm" hideAccent />
                </button>
            )}
        </button>
    )
}
