import React from 'react'
import { useRelevntColors, useSkillInsights, useLearningCourses } from '../../hooks'
import { HandSparkIcon, HandMatchIcon } from '../icons/handdrawn/HanddrawnIcons'
import { LearningCourseCard } from '../learn/LearningCourseCard'

export const SectionShell: React.FC<{ title: string; subtitle?: string; icon?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  subtitle,
  icon,
  children,
}) => {
  const colors = useRelevntColors()
  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon && <div style={{ padding: 8, borderRadius: 12, backgroundColor: colors.surfaceHover }}>{icon}</div>}
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: colors.text }}>{title}</h2>
          {subtitle && <p style={{ margin: 0, fontSize: 13, color: colors.textSecondary }}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

export const ThisWeek: React.FC<{ loading?: boolean }> = ({ loading }) => {
  const colors = useRelevntColors()
  const items = [
    'Refresh your default resume summary with this week’s wins.',
    'Narrow matches to the skills you’re leaning into.',
    'Nudge applications that have been quiet for 7+ days.',
  ]
  return (
    <SectionShell
      title="This week"
      subtitle="Three quick moves to keep momentum without the burnout."
      icon={<HandSparkIcon size={22} />}
    >
      <div style={{ display: 'grid', gap: 10 }}>
        {loading
          ? items.map((_, i) => <div key={i} className="sketch-skeleton" style={{ height: 16, width: '70%' }} />)
          : items.map((item) => (
              <div key={item} style={{ fontSize: 13, color: colors.text, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: colors.accent }} />
                {item}
              </div>
            ))}
      </div>
    </SectionShell>
  )
}

export const SkillGaps: React.FC<{ onViewLearning: (skill: string) => void }> = ({ onViewLearning }) => {
  const colors = useRelevntColors()
  const { insights, isLoading } = useSkillInsights()
  const gaps = insights.filter((s) => s.status === 'gap').slice(0, 3)

  return (
    <SectionShell
      title="Skill gaps we’re watching"
      subtitle="Only the skills that lift your ceiling on real roles."
      icon={<HandSparkIcon size={22} />}
    >
      {isLoading ? (
        <div style={{ display: 'grid', gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="sketch-skeleton" style={{ height: 64 }} />
          ))}
        </div>
      ) : gaps.length === 0 ? (
        <div style={{ fontSize: 13, color: colors.textSecondary }}>No major gaps right now. Keep strengthening your core story.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {gaps.map((gap) => (
            <div
              key={gap.slug}
              style={{
                border: `1px solid ${colors.borderLight}`,
                borderRadius: 14,
                padding: 12,
                background: colors.surface,
                display: 'grid',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: colors.text }}>{gap.displayName}</span>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: `1px solid ${colors.borderLight}`,
                    backgroundColor: colors.surfaceHover,
                    fontSize: 11,
                    color: colors.textSecondary,
                  }}
                >
                  {gap.status === 'gap' ? 'Gap' : gap.status}
                </span>
              </div>
              <div style={{ fontSize: 12, color: colors.textSecondary }}>High demand in your matches. Let’s close this next.</div>
              <div>
                <button
                  type="button"
                  onClick={() => onViewLearning(gap.slug)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 12,
                    border: `1px solid ${colors.borderLight}`,
                    background: colors.surfaceHover,
                    color: colors.text,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  See learning options
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  )
}

export const MatchIntelligence: React.FC<{ jobsCount: number; applicationsCount: number; loading?: boolean }> = ({
  jobsCount,
  applicationsCount,
  loading,
}) => {
  const colors = useRelevntColors()
  return (
    <SectionShell
      title="Match intelligence"
      subtitle="Where your energy should go next."
      icon={<HandMatchIcon size={22} />}
    >
      <div style={{ display: 'grid', gap: 10 }}>
        {loading ? (
          <>
            <div className="sketch-skeleton" style={{ height: 18, width: '40%' }} />
            <div className="sketch-skeleton" style={{ height: 18, width: '55%' }} />
          </>
        ) : (
          <>
            <div style={{ fontSize: 14, color: colors.text }}>
              {jobsCount} high-confidence matches in your queue. Focus on the top 5 this week.
            </div>
            <div style={{ fontSize: 14, color: colors.textSecondary }}>
              {applicationsCount} active applications. We’ll nudge you when timelines slip.
            </div>
          </>
        )}
      </div>
    </SectionShell>
  )
}

export const ResumeClarity: React.FC<{ resumesCount: number; loading?: boolean }> = ({ resumesCount, loading }) => {
  const colors = useRelevntColors()
  return (
    <SectionShell
      title="Resume clarity"
      subtitle="Lean, clear resumes that feel human and scan fast."
      icon={<HandSparkIcon size={22} />}
    >
      {loading ? (
        <div className="sketch-skeleton" style={{ height: 70 }} />
      ) : (
        <div
          style={{
            border: `1px solid ${colors.borderLight}`,
            borderRadius: 14,
            padding: 14,
            background: colors.surface,
            fontSize: 14,
            color: colors.text,
          }}
        >
          You have {resumesCount} active resumes. Keep 2–3 sharp versions; archive the rest to avoid noise.
        </div>
      )}
    </SectionShell>
  )
}

export const LearningFocus: React.FC<{ skillSlug: string | null; skillName: string | null }> = ({ skillSlug, skillName }) => {
  const colors = useRelevntColors()
  const { courses, isLoading } = useLearningCourses(skillSlug ? { skillKey: skillSlug } : undefined)

  if (!skillSlug) return null

  return (
    <SectionShell title={`Learning paths for ${skillName || skillSlug}`} subtitle="Short, focused courses to unblock your matches.">
      {isLoading ? (
        <div style={{ display: 'grid', gap: 10 }}>
          {[1, 2].map((i) => (
            <div key={i} className="sketch-skeleton" style={{ height: 90 }} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div style={{ fontSize: 13, color: colors.textSecondary }}>No curated courses yet. We’ll add more soon.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {courses.slice(0, 3).map((course) => (
            <LearningCourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </SectionShell>
  )
}
