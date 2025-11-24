import React from 'react'
import { CoursesIcon } from '../icons/RelevntIcons'
import { useRelevntColors } from '../../hooks'
import type { LearningCourse } from '../../hooks/useLearningCourses'

interface Props {
  course: LearningCourse
  onOpen?: () => void
}

export function LearningCourseCard({ course, onOpen }: Props) {
  const colors = useRelevntColors()

  const handleOpen = () => {
    if (onOpen) onOpen()
    else if (course.url) window.open(course.url, '_blank', 'noreferrer')
  }

  const badgeStyle: React.CSSProperties = {
    padding: '4px 8px',
    borderRadius: 999,
    border: `1px solid ${colors.borderLight}`,
    backgroundColor: colors.surfaceHover,
    color: colors.textSecondary,
    fontSize: 11,
  }

  return (
    <div
      style={{
        border: `1px solid ${colors.borderLight}`,
        borderRadius: 14,
        padding: 14,
        backgroundColor: colors.surface,
        display: 'grid',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ padding: 8, borderRadius: 12, backgroundColor: colors.surfaceHover, display: 'inline-flex' }}>
          <CoursesIcon size={18} strokeWidth={1.6} />
        </div>
        <div style={{ display: 'grid', gap: 4, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>{course.title}</div>
          <div style={{ fontSize: 12, color: colors.textSecondary }}>
            {course.providerName || course.providerSlug || 'Course'} {course.language ? `• ${course.language}` : ''}
          </div>
          {course.shortDescription && (
            <div style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.4 }}>
              {course.shortDescription.length > 180 ? `${course.shortDescription.slice(0, 177)}…` : course.shortDescription}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
          style={{
            alignSelf: 'center',
            padding: '8px 12px',
            borderRadius: 12,
            border: `1px solid ${colors.borderLight}`,
            backgroundColor: colors.surfaceHover,
            color: colors.text,
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Open course
        </button>
      </div>
    </div>
  )
}
