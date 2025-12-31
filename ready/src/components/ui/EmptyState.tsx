/**
 * ═══════════════════════════════════════════════════════════════════════════
 * READY EMPTY STATE COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Displays a helpful, motivating message when a section has no content.
 * 
 * Design principle: Empty states should feel like the beginning of something,
 * not the absence of something.
 * 
 * Usage:
 *   <EmptyState
 *     type="practice"
 *     action={{ label: "Start Practice", onClick: () => navigate('/practice') }}
 *   />
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { Button } from './Button';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type EmptyStateType =
  | 'practice'
  | 'assessments'
  | 'mirror'
  | 'learn'
  | 'skills'
  | 'search'
  | 'generic';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export interface EmptyStateProps {
  type: EmptyStateType;
  /** Override the default title */
  title?: string;
  /** Override the default description */
  description?: string;
  /** Primary action button */
  action?: EmptyStateAction;
  /** Secondary action button */
  secondaryAction?: EmptyStateAction;
  /** Additional CSS classes */
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// EMPTY STATE CONTENT
// Copy follows brand voice guide: motivational, not scolding
// ═══════════════════════════════════════════════════════════════════════════

interface EmptyStateContent {
  title: string;
  description: string;
}

const emptyStateContent: Record<EmptyStateType, EmptyStateContent> = {
  practice: {
    title: "Ready to practice?",
    description: "Start a mock interview to build confidence and get AI feedback on your responses.",
  },
  
  assessments: {
    title: "No assessments yet",
    description: "Take your first assessment to understand your readiness level and identify areas for growth.",
  },
  
  mirror: {
    title: "Your story awaits",
    description: "Import your LinkedIn or paste your portfolio to see how the world sees you.",
  },
  
  learn: {
    title: "Learning paths coming soon",
    description: "We're building personalized learning recommendations based on your skill gaps.",
  },
  
  skills: {
    title: "Skills assessment needed",
    description: "Complete a skills assessment to identify your strengths and areas for improvement.",
  },
  
  search: {
    title: "No results found",
    description: "We couldn't find what you're looking for. Try different keywords or broaden your search.",
  },
  
  generic: {
    title: "Nothing here yet",
    description: "This space is waiting for you. Let's get started.",
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}) => {
  const content = emptyStateContent[type] || emptyStateContent.generic;

  const displayTitle = title || content.title;
  const displayDescription = description || content.description;

  return (
    <div className={`empty-state ${className}`}>
      {/* Title */}
      <h3 className="empty-state__title">
        {displayTitle}
      </h3>

      {/* Description */}
      <p className="empty-state__description">
        {displayDescription}
      </p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="empty-state__actions">
          {action && (
            <Button
              type="button"
              onClick={action.onClick}
              variant={action.variant === 'secondary' ? 'secondary' : 'primary'}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              type="button"
              onClick={secondaryAction.onClick}
              variant={secondaryAction.variant === 'primary' ? 'primary' : 'secondary'}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// STYLES (can be moved to CSS or Tailwind)
// ═══════════════════════════════════════════════════════════════════════════

export const emptyStateStyles = `
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-12) var(--space-6);
  max-width: 400px;
  margin: 0 auto;
}

.empty-state__title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-ink);
  margin: 0 0 var(--space-2);
}

.empty-state__description {
  font-size: var(--text-base);
  color: var(--color-ink-secondary);
  margin: 0 0 var(--space-6);
  line-height: var(--leading-relaxed);
}

.empty-state__actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  justify-content: center;
  margin-top: var(--space-8);
}
`;

export default EmptyState;
