/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RELEVNT THEME HOOK
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Hook for managing light/dark/system theme preferences.
 * Stores preference in localStorage and applies .dark class to document root.
 * 
 * Usage:
 *   const { theme, setTheme, resolvedTheme } = useTheme();
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'relevnt-theme';

function getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): Theme {
    if (typeof window === 'undefined') return 'system';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
    }
    return 'system';
}

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>(getStoredTheme);
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
        const initial = getStoredTheme();
        return initial === 'system' ? getSystemTheme() : initial;
    });

    // Apply theme to document
    const applyTheme = useCallback((newTheme: Theme) => {
        const root = document.documentElement;
        let resolved: 'light' | 'dark';

        if (newTheme === 'system') {
            resolved = getSystemTheme();
        } else {
            resolved = newTheme;
        }

        if (resolved === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.remove('dark');
            root.classList.add('light');
        }

        setResolvedTheme(resolved);
    }, []);

    // Set theme and persist to localStorage
    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem(STORAGE_KEY, newTheme);
        applyTheme(newTheme);
    }, [applyTheme]);

    // Initialize theme on mount
    useEffect(() => {
        applyTheme(theme);
    }, [applyTheme, theme]);

    // Listen for system preference changes
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = () => {
            applyTheme('system');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme, applyTheme]);

    return {
        theme,
        setTheme,
        resolvedTheme,
    };
}

export default useTheme;
