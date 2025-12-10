// src/components/layout/PageShell.tsx
import * as React from 'react'

type PageShellProps = {
  title: string
  children: React.ReactNode
}

export function PageShell({ title, children }: PageShellProps) {
  return (
    <main className="app-content min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto max-w-6xl px-4 py-8 lg:py-12">
        <header className="mb-6 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">
            {title}
          </h1>
        </header>
        {children}
      </div>
    </main>
  )
}
