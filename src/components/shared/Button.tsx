/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DEPRECATED: Use @/components/ui/Button instead
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This file is deprecated and will be removed in a future version.
 * Please update imports to use the canonical Button component:
 *
 *   // Before (deprecated)
 *   import { Button } from '@/components/shared/Button'
 *
 *   // After (canonical)
 *   import { Button } from '@/components/ui/Button'
 *
 * The canonical Button in ui/Button.tsx:
 * - Uses CSS design tokens for consistent styling
 * - Supports: primary, secondary, ghost, destructive variants
 * - Integrates with PrimaryActionRegistry for Rule 1 enforcement
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Re-export from canonical location
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from '../ui/Button';
export { default } from '../ui/Button';

// Development-only deprecation warning (runs once on module load)
if (process.env.NODE_ENV !== 'production') {
    console.warn(
        '[Deprecation] @/components/shared/Button is deprecated.\n' +
        '  Please use @/components/ui/Button instead.\n' +
        '  See: src/components/ui/Button.tsx for the canonical implementation.'
    );
}
