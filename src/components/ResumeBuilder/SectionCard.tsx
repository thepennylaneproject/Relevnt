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
        <header className="flex items-start gap-3">
          {icon && (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F6] text-[#1F2933]">
              {icon}
            </span>
          )}
          <div className="space-y-1">
            {title && (
              <h2 className="text-sm font-semibold text-neutral-900">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs leading-relaxed text-neutral-600">
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