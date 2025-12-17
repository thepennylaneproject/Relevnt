import React from 'react'
import type { AutoSaveStatus } from '../../hooks/useSettingsAutoSave'
import { Icon, type IconName } from '../ui/Icon'

interface AutoSaveIndicatorProps {
    status: AutoSaveStatus
}

export function AutoSaveIndicator({ status }: AutoSaveIndicatorProps) {
    if (status === 'idle') return null

    const statusConfig: Record<AutoSaveStatus, { text: string; color: string; icon?: IconName }> = {
        idle: { text: '', color: '' },
        pending: { text: 'Unsaved changes', color: 'var(--text-secondary)' },
        saving: { text: 'Saving...', color: 'var(--text-secondary)' },
        saved: { text: 'Saved', color: 'var(--color-success, #22c55e)', icon: 'check' },
        error: { text: 'Failed to save', color: 'var(--color-error)', icon: 'compass-cracked' },
    }

    const config = statusConfig[status]

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: config.color,
                opacity: status === 'pending' ? 0.7 : 1,
                transition: 'opacity 0.2s ease',
            }}
        >
            {config.icon && <Icon name={config.icon} size="sm" hideAccent />}
            <span>{config.text}</span>
        </div>
    )
}
