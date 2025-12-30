/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PRIMARY ACTION REGISTRY
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * DEV-only runtime guardrail for Design Constitution Rule 1:
 * "Primary Action Monogamy - Each page view or modal may have exactly ONE
 * visually dominant primary action."
 *
 * Usage:
 *   // Wrap a page or modal scope
 *   <PrimaryActionRegistryProvider scopeId="my-modal">
 *     <MyContent />
 *   </PrimaryActionRegistryProvider>
 *
 *   // In Button component (automatic when variant="primary")
 *   useRegisterPrimaryAction("Save Changes")
 *
 * In production: All functions are no-ops.
 * In development: Logs a warning when >1 primary action exists in scope.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface RegistryEntry {
    id: string;
    label: string;
    timestamp: number;
}

interface PrimaryActionRegistryContextValue {
    register: (label: string) => string;
    unregister: (id: string) => void;
    scopeId: string;
}

// ============================================================================
// CONTEXT
// ============================================================================

const PrimaryActionRegistryContext = createContext<PrimaryActionRegistryContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface PrimaryActionRegistryProviderProps {
    /** Identifier for this scope (e.g., "resume-builder-page", "add-app-modal") */
    scopeId?: string;
    children: React.ReactNode;
}

/**
 * Wrap a page or modal with this provider to enable primary action tracking.
 * In development, warns when more than one primary action is registered.
 */
export function PrimaryActionRegistryProvider({
    scopeId = 'unknown',
    children,
}: PrimaryActionRegistryProviderProps) {
    const registryRef = useRef<Map<string, RegistryEntry>>(new Map());
    const counterRef = useRef(0);
    const hasWarnedRef = useRef(false);

    const register = useCallback((label: string): string => {
        // No-op in production
        if (process.env.NODE_ENV === 'production') {
            return '';
        }

        const id = `primary-${scopeId}-${++counterRef.current}`;
        registryRef.current.set(id, {
            id,
            label,
            timestamp: Date.now(),
        });

        // Check for violations
        const count = registryRef.current.size;
        if (count > 1 && !hasWarnedRef.current) {
            hasWarnedRef.current = true;
            const entries = Array.from(registryRef.current.values());
            const labels = entries.map(e => `"${e.label}"`).join(', ');
            console.warn(
                `[Design Constitution] Primary Action Monogamy violation in scope "${scopeId}":\n` +
                `  Found ${count} primary actions: ${labels}\n` +
                `  Rule: Each page/modal may have exactly ONE primary action.\n` +
                `  Fix: Demote extra actions to variant="secondary" or variant="ghost".`
            );
        }

        return id;
    }, [scopeId]);

    const unregister = useCallback((id: string): void => {
        // No-op in production
        if (process.env.NODE_ENV === 'production') {
            return;
        }

        registryRef.current.delete(id);

        // Reset warning flag if we're back to 1 or fewer
        if (registryRef.current.size <= 1) {
            hasWarnedRef.current = false;
        }
    }, []);

    const value: PrimaryActionRegistryContextValue = {
        register,
        unregister,
        scopeId,
    };

    return (
        <PrimaryActionRegistryContext.Provider value={value}>
            {children}
        </PrimaryActionRegistryContext.Provider>
    );
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Register a primary action within the current scope.
 * Call this from Button when variant="primary".
 *
 * @param label - Descriptive label for debugging. If undefined, no registration occurs.
 */
export function useRegisterPrimaryAction(label: string | undefined): void {
    const context = useContext(PrimaryActionRegistryContext);

    useEffect(() => {
        // No-op if label is not provided (e.g., non-primary buttons)
        if (!label) {
            return;
        }

        // No-op in production
        if (process.env.NODE_ENV === 'production') {
            return;
        }

        // No-op if not inside a provider
        if (!context) {
            return;
        }

        const registrationId = context.register(label);

        return () => {
            if (registrationId) {
                context.unregister(registrationId);
            }
        };
    }, [context, label]);
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Check if we're inside a PrimaryActionRegistry scope.
 * Useful for conditional behavior in components.
 */
export function usePrimaryActionScope(): { isInScope: boolean; scopeId: string | null } {
    const context = useContext(PrimaryActionRegistryContext);
    return {
        isInScope: context !== null,
        scopeId: context?.scopeId ?? null,
    };
}

export default PrimaryActionRegistryProvider;
