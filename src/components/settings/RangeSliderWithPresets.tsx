import React from 'react'

interface Preset {
    label: string
    value: number
}

interface RangeSliderWithPresetsProps {
    label: string
    value: number
    min: number
    max: number
    step?: number
    presets?: Preset[]
    onChange: (value: number) => void
    formatValue?: (value: number) => string
    leftLabel?: string
    rightLabel?: string
}

export function RangeSliderWithPresets({
    label,
    value,
    min,
    max,
    step = 1,
    presets,
    onChange,
    formatValue,
    leftLabel,
    rightLabel,
}: RangeSliderWithPresetsProps) {
    const displayValue = formatValue ? formatValue(value) : value.toString()

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                    {label}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                    {displayValue}
                </span>
            </div>

            {presets && presets.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {presets.map((preset) => {
                        const isActive = value === preset.value
                        return (
                            <button
                                key={preset.label}
                                type="button"
                                onClick={() => onChange(preset.value)}
                                className={`option-button ${isActive ? 'is-active' : ''}`}
                                style={{ padding: '6px 12px', fontSize: 12 }}
                            >
                                {preset.label}
                            </button>
                        )
                    })}
                </div>
            )}

            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                style={{
                    width: '100%',
                    accentColor: 'var(--color-accent)',
                    cursor: 'pointer',
                }}
            />

            {(leftLabel || rightLabel) && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 11,
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}
                >
                    <span>{leftLabel}</span>
                    <span>{rightLabel}</span>
                </div>
            )}
        </div>
    )
}
