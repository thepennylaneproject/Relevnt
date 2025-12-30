/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COLLECTION EMPTY GUARD
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Design Constitution Rule 3: Active Void Rule
 * "No list/table/collection view may be empty without a next step,
 *  recommendation, or example."
 *
 * This DEV-only component validates that collection views provide actionable
 * empty states rather than dead-end experiences.
 *
 * Usage:
 *   <CollectionEmptyGuard
 *     itemsCount={items.length}
 *     hasEmptyState={true}
 *     scopeId="applications-list"
 *   />
 *
 * In production: renders nothing (no overhead)
 * In development: warns when collections are empty without proper empty states
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CollectionEmptyGuardProps {
  /**
   * Number of items in the collection (0 = empty)
   */
  itemsCount: number;

  /**
   * Whether an EmptyState component (or equivalent) with action is rendered
   * when the collection is empty. This should be true if you've implemented
   * a proper empty state with a CTA.
   */
  hasEmptyState: boolean;

  /**
   * Identifier for the collection (for debugging/logging)
   * e.g., "applications-list", "resume-grid", "saved-jobs"
   */
  scopeId: string;

  /**
   * Optional: describe the expected action for documentation
   * e.g., "Create first resume", "Browse jobs"
   */
  expectedAction?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * DEV-only guardrail that warns when collections are empty without
 * proper actionable empty states.
 *
 * In production, this component renders nothing and has no overhead.
 */
export function CollectionEmptyGuard({
  itemsCount,
  hasEmptyState,
  scopeId,
  expectedAction,
}: CollectionEmptyGuardProps): null {
  const hasWarnedRef = useRef(false);

  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    // Only check when collection is empty
    if (itemsCount > 0) {
      hasWarnedRef.current = false;
      return;
    }

    // Only warn once per empty state to avoid console spam
    if (hasWarnedRef.current) {
      return;
    }

    // If empty and no empty state, warn
    if (!hasEmptyState) {
      hasWarnedRef.current = true;

      const message = [
        `[Design Constitution Rule 3: Active Void Rule]`,
        ``,
        `Collection "${scopeId}" is empty but has no actionable empty state.`,
        ``,
        `Every empty collection MUST provide:`,
        `  • A clear explanation of what will appear here`,
        `  • A primary action to get started (button/link)`,
        `  • Optionally: examples, recommendations, or tips`,
        ``,
        expectedAction
          ? `Expected action: "${expectedAction}"`
          : `Add an EmptyState component with an 'action' prop.`,
        ``,
        `Fix: Use <EmptyState type="..." action={{ label: "...", onClick: ... }} />`,
      ].join('\n');

      console.warn(message);

      // Also add visual indicator in dev (optional enhancement)
      // This could be expanded to show an overlay in strict mode
    }
  }, [itemsCount, hasEmptyState, scopeId, expectedAction]);

  // Never render anything - this is a guardrail, not a UI component
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK VARIANT (for more flexible usage)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook variant for cases where component nesting is awkward.
 *
 * Usage:
 *   useCollectionEmptyGuard({
 *     itemsCount: items.length,
 *     hasEmptyState: true,
 *     scopeId: "my-list"
 *   });
 */
export function useCollectionEmptyGuard(props: CollectionEmptyGuardProps): void {
  const { itemsCount, hasEmptyState, scopeId, expectedAction } = props;
  const hasWarnedRef = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    if (itemsCount > 0) {
      hasWarnedRef.current = false;
      return;
    }

    if (hasWarnedRef.current) {
      return;
    }

    if (!hasEmptyState) {
      hasWarnedRef.current = true;

      console.warn(
        `[Active Void Rule] Collection "${scopeId}" is empty without an actionable empty state.` +
        (expectedAction ? ` Expected: "${expectedAction}"` : '')
      );
    }
  }, [itemsCount, hasEmptyState, scopeId, expectedAction]);
}

export default CollectionEmptyGuard;
