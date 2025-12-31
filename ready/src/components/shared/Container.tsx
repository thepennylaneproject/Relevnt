// src/components/shared/Container.tsx
import React from 'react'

export interface ContainerProps {
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
}

export const Container: React.FC<ContainerProps> = ({
  children,
  maxWidth = 'lg',
  padding = 'lg',
  className = '',
}) => {
  const maxWidths: Record<NonNullable<ContainerProps['maxWidth']>, string> = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    full: '100%',
  }

  const paddings: Record<NonNullable<ContainerProps['padding']>, string> = {
    none: '0',
    sm: '0.75rem',
    md: '1.25rem',
    lg: '2rem',
  }

  return (
    <div
      className={className}
      style={{
        maxWidth: maxWidths[maxWidth],
        margin: '0 auto',
        padding: paddings[padding],
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  )
}

Container.displayName = 'Container'