import React from 'react'
import { Modal } from '../shared/Modal'
import { useLearningCourses, type LearningCourse } from '../../hooks'

export interface SkillLearningModalProps {
  open: boolean
  onClose: () => void
  skillSlug: string | null
  skillName: string | null
}

export function SkillLearningModal({ open, onClose, skillSlug, skillName }: SkillLearningModalProps) {
  const { courses, isLoading, error } = useLearningCourses(skillSlug)

  const title = skillName ? `Learning options for ${skillName}` : 'Learning options'

  const renderCourse = (course: LearningCourse) => (
    <div
      key={course.id}
      className="surface-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
      }}
    >
      <div style={{ display: 'grid', gap: 4, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{course.title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {course.providerName || course.providerSlug} • {course.isFree ? 'Free' : 'Paid'}
          {course.estimatedHours != null ? ` • ~${course.estimatedHours} hrs` : ''}
        </div>
      </div>
      <a
        href={course.url || '#'}
        target="_blank"
        rel="noreferrer"
        className="ghost-button"
        style={{
          fontSize: 12,
          textDecoration: 'none',
        }}
      >
        Open course
      </a>
    </div>
  )

  return (
    <Modal isOpen={open} onClose={onClose} title={title} size="lg">
      <div style={{ display: 'grid', gap: 10 }}>
        {isLoading && <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Loading courses…</p>}
        {error && (
          <p style={{ fontSize: 12, color: 'var(--color-error)' }}>
            We couldn&apos;t load courses right now.
          </p>
        )}
        {!isLoading && !error && courses.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No courses found yet.</p>
        )}
        {!isLoading && !error && courses.map(renderCourse)}
      </div>
    </Modal>
  )
}
