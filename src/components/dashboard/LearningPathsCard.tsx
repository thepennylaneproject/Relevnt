// src/components/dashboard/LearningPathsCard.tsx
import React from 'react'
import { useLearningPaths, type LearningPath } from '../../hooks/useLearningPaths'

function LearningPathsCard() {
  const { paths, isLoading, error } = useLearningPaths()

  if (isLoading) {
    return (
      <section className="dashboard-card">
        <h3 className="dashboard-card-title">Learning paths</h3>
        <p className="dashboard-card-body text-sm text-muted-foreground">Loading your paths…</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="dashboard-card">
        <h3 className="dashboard-card-title">Learning paths</h3>
        <p className="dashboard-card-body text-sm text-red-600">
          {error}
        </p>
      </section>
    )
  }

  if (!paths || paths.length === 0) {
    return (
      <section className="dashboard-card">
        <h3 className="dashboard-card-title">Learning paths</h3>
        <p className="dashboard-card-body text-sm text-muted-foreground">
          Once we see your skill gaps, we will suggest short, focused learning paths here.
        </p>
      </section>
    )
  }

  return (
    <section className="dashboard-card">
      <h3 className="dashboard-card-title">Learning paths</h3>
      <ul className="space-y-3 mt-3">
        {paths.map((path: LearningPath) => (
          <li key={path.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
            <div className="text-sm font-semibold">{path.title}</div>
            {path.short_description && (
              <p className="text-xs text-muted-foreground mt-1">
                {path.short_description}
              </p>
            )}
            <div className="mt-2 flex text-[11px] text-muted-foreground gap-3">
              {path.estimated_minutes != null && (
                <span>{path.estimated_minutes} min</span>
              )}
              {path.difficulty && <span>{path.difficulty}</span>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default LearningPathsCard
export { LearningPathsCard }