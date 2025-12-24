import * as React from 'react'
import type { RelevntColors } from '../../hooks/useRelevntColors'

type Props = {
  children: React.ReactNode
  title?: string
  description?: string
  icon?: React.ReactNode
  colors?: RelevntColors | any
  className?: string
}

export const SectionCard: React.FC<Props> = ({
  title,
  description,
  icon,
  className = '',
  children,
}) => {
  const base = 'card space-y-5' // uses global .card

  return (
    <section className={[base, className].filter(Boolean).join(' ')}>
      {(title || description || icon) && (
        <header className="flex items-start gap-4 mb-6">
          {icon && (
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-bg-alt)] text-[var(--color-accent)] border border-[var(--color-graphite-faint)]">
              {icon}
            </span>
          )}
          <div className="space-y-1">
            {title && (
              <h2 className="text-base font-semibold text-[var(--color-ink)] font-serif">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs leading-relaxed text-[var(--color-ink-secondary)]">
                {description}
              </p>
            )}
          </div>
        </header>
      )}

      <div className="space-y-4">
        {children}
      </div>
    </section>
  )
}

export default SectionCard