// src/pages/LearnPage.tsx
import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSkillGaps, type SkillGap } from '../hooks/useSkillGaps'
import { useLearningCourses } from '../hooks/useLearningCourses'
import PageBackground from '../components/shared/PageBackground'
import { Container } from '../components/shared/Container'
import { Icon } from '../components/ui/Icon'
import { EmptyState } from '../components/ui/EmptyState'
import { copy } from '../lib/copy'

export default function LearnPage() {
  const { user } = useAuth()
  const { data: skillGaps, isLoading: gapsLoading, error: gapsError } = useSkillGaps(user?.id)
  const { courses, isLoading: coursesLoading, error: coursesError } = useLearningCourses()

  const loading = gapsLoading || coursesLoading
  const hasContent = (skillGaps && skillGaps.length > 0) || (courses && courses.length > 0)

  return (
    <PageBackground>
      <Container maxWidth="xl" padding="md">
        <div className="page-stack">
          {/* HERO */}
          <section className="hero-shell">
            <div className="hero-header">
              <div className="hero-icon">
                <Icon name="book" size="md" />
              </div>
              <div className="hero-header-main">
                <p className="text-xs muted">{copy.learn.pageTitle}</p>
                <h1 className="font-display">{copy.learn.pageSubtitle}</h1>
              </div>
            </div>
          </section>

          {loading && (
            <section className="surface-card">
              <div className="flex flex-col items-center gap-4 py-12">
                <Icon name="candle" size="lg" className="text-graphite-light animate-pulse-soft" />
                <p className="muted">{copy.transparency.loading}</p>
              </div>
            </section>
          )}

          {!loading && (gapsError || coursesError) && (
            <section className="surface-card">
              <div className="alert alert--error">
                <Icon name="compass-cracked" size="sm" hideAccent />
                <span>{gapsError || coursesError}</span>
              </div>
            </section>
          )}

          {!loading && !hasContent && (
            <EmptyState type="learn" />
          )}

          {!loading && !gapsError && skillGaps && skillGaps.length > 0 && (
            <section className="surface-card">
              <h2 className="text-sm font-semibold mb-4">Your top skill gaps</h2>
              <ul className="space-y-2">
                {skillGaps.map((gap: SkillGap) => (
                  <li
                    key={gap.skill_key}
                    className="card flex items-start justify-between"
                  >
                    <div>
                      <div className="text-sm font-medium">{gap.skill_key}</div>
                      {gap.explanation && (
                        <p className="muted text-xs mt-1">
                          {gap.explanation}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs muted">
                      <div>{gap.job_count} jobs</div>
                      {gap.priority != null && <div>Priority {gap.priority}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!loading && !coursesError && courses && courses.length > 0 && (
            <section className="surface-card">
              <h2 className="text-sm font-semibold mb-4">Suggested courses</h2>
              <ul className="space-y-2">
                {courses.slice(0, 8).map((course) => (
                  <li
                    key={course.id}
                    className="card"
                  >
                    <div className="text-sm font-medium">{course.title}</div>
                    {course.providerName && (
                      <div className="muted text-xs mt-0.5">
                        {course.providerName}
                      </div>
                    )}
                    <div className="mt-1 text-xs muted flex gap-3">
                      {course.level && <span>{course.level}</span>}
                      {course.estimatedHours != null && (
                        <span>{course.estimatedHours} hours</span>
                      )}
                      {course.isFree && <span className="badge badge--accent">Free</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </Container>
    </PageBackground>
  )
}