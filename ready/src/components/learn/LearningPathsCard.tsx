/**
 * Learning Paths Card - Dashboard component
 * 
 * Shows recommended learning paths based on skill gaps.
 */

import React from 'react'
import { useLearningPaths, type LearningPath } from '../../hooks/useLearningPaths'

interface LearningPathsCardProps {
  skillGaps?: string[];
}

export function LearningPathsCard({ skillGaps }: LearningPathsCardProps) {
  const { paths, isLoading, error } = useLearningPaths(skillGaps)

  if (isLoading) {
    return (
      <section className="dashboard-card">
        <h3 className="dashboard-card-title">Learning Paths</h3>
        <p className="dashboard-card-body text-sm text-muted">Loading your paths…</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="dashboard-card">
        <h3 className="dashboard-card-title">Learning Paths</h3>
        <p className="dashboard-card-body text-sm text-error">{error}</p>
      </section>
    )
  }

  if (!paths || paths.length === 0) {
    return (
      <section className="dashboard-card">
        <h3 className="dashboard-card-title">Learning Paths</h3>
        <p className="dashboard-card-body text-sm text-muted">
          Complete a skills gap analysis to get personalized learning recommendations.
        </p>
      </section>
    )
  }

  return (
    <section className="dashboard-card">
      <h3 className="dashboard-card-title">Learning Paths</h3>
      <ul className="learning-paths-list">
        {paths.map((path: LearningPath) => (
          <li key={path.id} className="learning-path-item">
            <div className="learning-path-title">{path.title}</div>
            {path.short_description && (
              <p className="learning-path-desc">{path.short_description}</p>
            )}
            <div className="learning-path-meta">
              {path.estimated_minutes != null && (
                <span>{path.estimated_minutes} min</span>
              )}
              {path.difficulty && <span>{path.difficulty}</span>}
              {path.is_free && <span className="free-badge">FREE</span>}
            </div>
          </li>
        ))}
      </ul>

      <style>{`
        .learning-paths-list {
          list-style: none;
          padding: 0;
          margin: 0.75rem 0 0 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .learning-path-item {
          padding: 0.75rem;
          background: var(--surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
        }
        
        .learning-path-title {
          font-size: 0.875rem;
          font-weight: 600;
        }
        
        .learning-path-desc {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin: 0.25rem 0 0 0;
        }
        
        .learning-path-meta {
          display: flex;
          gap: 0.75rem;
          font-size: 0.6875rem;
          color: var(--text-secondary);
          margin-top: 0.5rem;
        }
        
        .free-badge {
          font-weight: 700;
          color: #A8D5BA;
        }
      `}</style>
    </section>
  )
}

export default LearningPathsCard
