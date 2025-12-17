import { useCallback, useEffect, useRef, useState } from 'react'

type SaveFn = () => Promise<boolean | void>

interface UseSettingsAutoSaveOptions {
    debounceMs?: number
    onSaveStart?: () => void
    onSaveComplete?: () => void
    onSaveError?: (error: string) => void
}

export type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

interface UseSettingsAutoSaveReturn {
    status: AutoSaveStatus
    triggerSave: () => void
    forceSave: () => Promise<void>
}

/**
 * Hook for debounced auto-save functionality.
 * Call triggerSave() whenever data changes, and it will debounce
 * and call the saveFn after the specified delay.
 */
export function useSettingsAutoSave(
    saveFn: SaveFn,
    options: UseSettingsAutoSaveOptions = {}
): UseSettingsAutoSaveReturn {
    const { debounceMs = 800, onSaveStart, onSaveComplete, onSaveError } = options

    const [status, setStatus] = useState<AutoSaveStatus>('idle')
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const saveFnRef = useRef(saveFn)

    // Keep saveFn ref updated
    useEffect(() => {
        saveFnRef.current = saveFn
    }, [saveFn])

    const doSave = useCallback(async () => {
        setStatus('saving')
        onSaveStart?.()

        try {
            const result = await saveFnRef.current()
            if (result === false) {
                setStatus('error')
                onSaveError?.('Failed to save')
            } else {
                setStatus('saved')
                onSaveComplete?.()
                // Reset to idle after 2 seconds
                setTimeout(() => setStatus('idle'), 2000)
            }
        } catch (err) {
            console.error('Auto-save error:', err)
            setStatus('error')
            onSaveError?.(err instanceof Error ? err.message : 'Unknown error')
        }
    }, [onSaveStart, onSaveComplete, onSaveError])

    const triggerSave = useCallback(() => {
        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        setStatus('pending')

        // Schedule new save
        timeoutRef.current = setTimeout(() => {
            doSave()
        }, debounceMs)
    }, [debounceMs, doSave])

    const forceSave = useCallback(async () => {
        // Clear any pending debounce
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
        await doSave()
    }, [doSave])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return {
        status,
        triggerSave,
        forceSave,
    }
}
