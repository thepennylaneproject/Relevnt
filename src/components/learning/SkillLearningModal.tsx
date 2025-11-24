import React from 'react'
import { Modal } from '../shared/Modal'
import { useLearningCourses, type LearningCourse } from '../../hooks'
import { useRelevntColors } from '../../hooks'

export interface SkillLearningModalProps {
  open: boolean
  onClose: () => void
  skillSlug: string | null
  skillName: string | null
}

export function SkillLearningModal({ open, onClose, skillSlug, skillName }: SkillLearningModalProps) {
  const { courses, isLoading, error } = useLearningCourses(skillSlug)
  const colors = useRelevntColors()

  const title = skillName ? `Learning options for ${skillName}` : 'Learning options'

  const renderCourse = (course: LearningCourse) => (
    <div
      key={course.id}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        borderRadius: 12,
        border: `1px solid ${colors.borderLight}`,
        backgroundColor: colors.surface,
      }}
    >
      <div style={{ display: 'grid', gap: 4, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{course.title}</div>
        <div style={{ fontSize: 12, color: colors.textSecondary }}>
          {course.providerName || course.providerSlug} • {course.isFree ? 'Free' : 'Paid'}
          {course.estimatedHours != null ? ` • ~${course.estimatedHours} hrs` : ''}
        </div>
      </div>
      <a
        href={course.url || '#'}
        target="_blank"
        rel="noreferrer"
        style={{
          padding: '8px 12px',
          borderRadius: 999,
          border: `1px solid ${colors.borderLight}`,
          backgroundColor: colors.background,
          color: colors.text,
          fontSize: 12,
          fontWeight: 600,
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
        {isLoading && <p style={{ fontSize: 12, color: colors.textSecondary }}>Loading courses…</p>}
        {error && (
          <p style={{ fontSize: 12, color: colors.error }}>
            We couldn&apos;t load courses right now.
          </p>
        )}
        {!isLoading && !error && courses.length === 0 && (
          <p style={{ fontSize: 12, color: colors.textSecondary }}>No courses found yet.</p>
        )}
        {!isLoading && !error && courses.map(renderCourse)}
      </div>
    </Modal>
  )
}
