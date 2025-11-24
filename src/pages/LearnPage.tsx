// src/pages/LearnPage.tsx
import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSkillGaps, type SkillGap } from '../hooks/useSkillGaps'
import { useLearningCourses } from '../hooks/useLearningCourses'

export default function LearnPage() {
  const { user } = useAuth()
  const { data: skillGaps, isLoading: gapsLoading, error: gapsError } = useSkillGaps(user?.id)
  const { courses, isLoading: coursesLoading, error: coursesError } = useLearningCourses()

  const loading = gapsLoading || coursesLoading

  return (
    <div className="page-root">
      <header className="page-header">
        <h1 className="page-title">Learn</h1>
        <p className="page-subtitle text-sm text-muted-foreground">
          Close the gaps the market cares about most, without signing your life away to another bootcamp.
        </p>
      </header>

      {loading && (
        <p className="text-sm text-muted-foreground mt-4">
          Loading your skill gaps and learning suggestions…
        </p>
      )}

      {!loading && (gapsError || coursesError) && (
        <p className="text-sm text-red-600 mt-4">
          {gapsError || coursesError}
        </p>
      )}

      {!loading && !gapsError && skillGaps && skillGaps.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold mb-2">Your top skill gaps</h2>
          <ul className="space-y-2">
            {skillGaps.map((gap: SkillGap) => (
              <li
                key={gap.skill_key}
                className="flex items-start justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
              >
                <div>
                  <div className="text-sm font-medium">{gap.skill_key}</div>
                  {gap.explanation && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {gap.explanation}
                    </p>
                  )}
                </div>
                <div className="text-right text-[11px] text-muted-foreground">
                  <div>{gap.job_count} jobs</div>
                  {gap.priority != null && <div>Priority {gap.priority}</div>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!loading && !coursesError && courses && courses.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold mb-2">Suggested courses</h2>
          <ul className="space-y-2">
            {courses.slice(0, 8).map((course) => (
              <li
                key={course.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
              >
                <div className="text-sm font-medium">{course.title}</div>
                {course.providerName && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {course.providerName}
                  </div>
                )}
                <div className="mt-1 text-[11px] text-muted-foreground flex gap-3">
                  {course.level && <span>{course.level}</span>}
                  {course.estimatedHours != null && (
                    <span>{course.estimatedHours} hours</span>
                  )}
                  {course.isFree && <span>Free</span>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}