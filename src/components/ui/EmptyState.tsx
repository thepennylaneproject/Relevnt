/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RELEVNT EMPTY STATE COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Displays a helpful, motivating message when a section has no content.
 * Uses brand voice: "Be clear. Be kind. Be accountable."
 * 
 * Design principle: Empty states should feel like the beginning of something,
 * not the absence of something.
 * 
 * Usage:
 *   <EmptyState
 *     type="applications"
 *     action={{ label: "Browse jobs", onClick: () => navigate('/jobs') }}
 *   />
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { Icon, IconName } from './Icon';
import { PoeticVerseMinimal } from './PoeticVerse';
import { getPoeticVerse, PoeticMoment } from '@/lib/poeticMoments';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type EmptyStateType =
  | 'applications'
  | 'jobs'
  | 'resumes'
  | 'saved'
  | 'matches'
  | 'search'
  | 'learn'
  | 'analysis'
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
  /** Show poetic verse below description */
  includeVerse?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// EMPTY STATE CONTENT
// Copy follows brand voice guide: motivational, not scolding
// ═══════════════════════════════════════════════════════════════════════════

interface EmptyStateContent {
  icon: IconName;
  title: string;
  description: string;
  poeticMoment?: PoeticMoment;
}

// Map empty state types to poetic moments
const emptyStateToPoetic: Record<EmptyStateType, PoeticMoment | undefined> = {
  applications: 'empty-applications',
  jobs: 'empty-jobs',
  resumes: 'empty-resumes',
  saved: 'empty-saved',
  matches: undefined,
  search: undefined,
  learn: undefined,
  analysis: undefined,
  generic: undefined,
};

const emptyStateContent: Record<EmptyStateType, EmptyStateContent> = {
  applications: {
    icon: 'paper-airplane',
    title: "Your story starts here",
    description: "When you apply to your first role, we'll track every step together — no spreadsheets required.",
  },
  
  jobs: {
    icon: 'briefcase',
    title: "Fresh opportunities await",
    description: "We haven't found jobs matching your criteria yet. Try adjusting your filters or check back soon.",
  },
  
  resumes: {
    icon: 'scroll',
    title: "Your story, ready to unfold",
    description: "Upload a résumé to see how the system sees you — and how to make it see you better.",
  },
  
  saved: {
    icon: 'anchor',
    title: "Nothing saved yet",
    description: "When you find a role worth holding onto, save it here. We'll keep it safe.",
  },
  
  matches: {
    icon: 'compass',
    title: "Finding your direction",
    description: "Once we know more about you, we'll surface roles that actually fit. Upload a résumé to get started.",
  },
  
  search: {
    icon: 'lighthouse',
    title: "No results found",
    description: "We couldn't find what you're looking for. Try different keywords or broaden your search.",
  },
  
  learn: {
    icon: 'book',
    title: "Coming soon",
    description: "We're building resources to close the gaps the market cares about — without signing your life away to another bootcamp.",
  },
  
  analysis: {
    icon: 'seeds',
    title: "No analyses yet",
    description: "Paste a job post or upload a résumé to see how the system sees you. We'll show our work.",
  },
  
  generic: {
    icon: 'seeds',
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
  includeVerse = false,
  className = '',
}) => {
  const content = emptyStateContent[type] || emptyStateContent.generic;

  const displayTitle = title || content.title;
  const displayDescription = description || content.description;

  const poeticMoment = emptyStateToPoetic[type];
  const verse = includeVerse && poeticMoment ? getPoeticVerse(poeticMoment) : null;

  return (
    <div className={`empty-state ${className}`}>
      {/* Illustration */}
      <div className="empty-state__illustration">
        <Icon
          name={content.icon}
          size="hero"
          className="text-graphite-light"
          label={displayTitle}
        />
      </div>

      {/* Title */}
      <h3 className="empty-state__title">
        {displayTitle}
      </h3>

      {/* Description */}
      <p className="empty-state__description">
        {displayDescription}
      </p>

      {/* Poetic Verse */}
      {verse && (
        <div className="empty-state__verse" style={{ marginTop: '1.5rem' }}>
          <PoeticVerseMinimal verse={verse} />
        </div>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="empty-state__actions">
          {action && (
            <button
              onClick={action.onClick}
              className={`btn ${action.variant === 'secondary' ? 'btn--secondary' : 'btn--primary'}`}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className={`btn ${secondaryAction.variant === 'primary' ? 'btn--primary' : 'btn--secondary'}`}
            >
              {secondaryAction.label}
            </button>
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

.empty-state__illustration {
  margin-bottom: var(--space-6);
  opacity: 0.8;
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
}
`;

export default EmptyState;
