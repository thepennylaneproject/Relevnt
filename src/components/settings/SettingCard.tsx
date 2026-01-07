import React from 'react'

interface SettingCardProps {
    title: string
    isInteractive: boolean
    children: React.ReactNode
}

/**
 * SettingCard - A small focused card containing 1 setting group (2-4 controls max)
 * Cards are only interactive when within the Authority Band (±15° of centerline)
 */
export function SettingCard({ title, isInteractive, children }: SettingCardProps) {
    return (
        <div className={`setting-card ${isInteractive ? 'interactive' : 'inert'}`}>
            {/* Title removed: no semantic section headers */}
            <div className="setting-card-body">
                {children}
            </div>
        </div>
    )
}
