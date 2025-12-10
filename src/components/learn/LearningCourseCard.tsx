import React from 'react'
import { Icon } from '../ui/Icon'
import type { LearningCourse } from '../../hooks/useLearningCourses'

interface Props {
  course: LearningCourse
  onOpen?: () => void
}

export function LearningCourseCard({ course, onOpen }: Props) {
  const handleOpen = () => {
    if (onOpen) onOpen()
    else if (course.url) window.open(course.url, '_blank', 'noreferrer')
  }

  const badgeStyle: React.CSSProperties = {
    padding: '4px 8px',
    borderRadius: 999,
    border: '1px solid var(--border-subtle)',
    backgroundColor: 'var(--surface-hover)',
    color: 'var(--text-secondary)',
    fontSize: 11,
    fontWeight: 500,
  }

  return (
    <div
      style={{
        border: '1px solid var(--border-subtle)',
        borderRadius: 14,
        padding: 14,
        backgroundColor: 'var(--surface)',
        display: 'grid',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ padding: 8, borderRadius: 12, backgroundColor: 'var(--surface-hover)', display: 'inline-flex' }}>
          <Icon name="book" size="sm" hideAccent />
        </div>
        <div style={{ display: 'grid', gap: 4, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{course.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {course.providerName || course.providerSlug || 'Course'} {course.language ? `• ${course.language}` : ''}
          </div>
          {course.shortDescription && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {course.shortDescription.length > 180 ? `${course.shortDescription.slice(0, 177)}…` : course.shortDescription}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            <span style={badgeStyle}>{course.isFree ? 'Free' : 'Paid'}</span>
            {course.estimatedHours != null && (
              <span style={badgeStyle}>{course.estimatedHours <= 4 ? 'Quick win' : `~${course.estimatedHours} hrs`}</span>
            )}
            {course.difficulty && <span style={badgeStyle}>{course.difficulty}</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpen}
          className="ghost-button"
          style={{
            alignSelf: 'center',
            fontSize: 12,
            whiteSpace: 'nowrap',
          }}
        >
          Open course
        </button>
      </div>
    </div>
  )
}
