/**
 * =============================================================================
 * useAutoTuning Hook
 * =============================================================================
 * Detects patterns in user behavior and proactively suggests filter adjustments.
 * Shifts from "showing you patterns" to "fixing them for you" (concierge mode).
 * Part of Phase 3: The Concierge Shift
 * =============================================================================
 */

import { useState, useEffect, useCallback } from 'react'
import { useJobInteractions, type DismissalPattern } from './useJobInteractions'

export interface AutoTuneSuggestion {
    id: string
    factor: string
    pattern: DismissalPattern
    suggestionTitle: string
    suggestionMessage: string
    action: 'adjust_filter' | 'remove_filter' | 'add_preference'
    actionLabel: string
    isDismissed: boolean
}

export interface UseAutoTuningReturn {
    suggestions: AutoTuneSuggestion[]
    loading: boolean
    applySuggestion: (suggestionId: string) => Promise<void>
    dismissSuggestion: (suggestionId: string) => void
    hasSuggestions: boolean
}

const SUGGESTION_THRESHOLD = 60 // Show suggestion if 60%+ of dismissals had low score for a factor

export function useAutoTuning(): UseAutoTuningReturn {
    const { getDismissalPatterns, loading: patternsLoading } = useJobInteractions()
    const [suggestions, setSuggestions] = useState<AutoTuneSuggestion[]>([])
    const [loading, setLoading] = useState(true)
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
    
    // Generate suggestions from dismissal patterns
    const generateSuggestions = useCallback(async () => {
        setLoading(true)
        
        try {
            const patterns = await getDismissalPatterns()
            
            // Filter for strong patterns (60%+ dismissals)
            const strongPatterns = patterns.filter(p => p.percentage >= SUGGESTION_THRESHOLD)
            
            const newSuggestions: AutoTuneSuggestion[] = strongPatterns.map(pattern => {
                const id = `autotune-${pattern.factor}-${Date.now()}`
                
                // Generate context-specific suggestions
                let suggestionTitle = ''
                let suggestionMessage = ''
                let action: AutoTuneSuggestion['action'] = 'adjust_filter'
                let actionLabel = ''
                
                switch (pattern.factor) {
                    case 'salary':
                        suggestionTitle = 'Salary mismatch detected'
                        suggestionMessage = `You've dismissed ${pattern.percentage}% of jobs due to low salary scores. Would you like me to adjust your minimum salary requirement upward?`
                        action = 'adjust_filter'
                        actionLabel = 'Adjust salary filter'
                        break
                        
                    case 'location':
                        suggestionTitle = 'Location preference unclear'
                        suggestionMessage = `${pattern.percentage}% of your dismissals had poor location matches. Should I tighten your location filters?`
                        action = 'adjust_filter'
                        actionLabel = 'Update location preferences'
                        break
                        
                    case 'remote preference':
                        suggestionTitle = 'Remote work preference detected'
                        suggestionMessage = `You're consistently dismissing on-site roles (${pattern.percentage}% of dismissals). Want me to prioritize remote opportunities?`
                        action = 'add_preference'
                        actionLabel = 'Prioritize remote jobs'
                        break
                        
                    case 'skills':
                        suggestionTitle = 'Skill requirements too broad'
                        suggestionMessage = `${pattern.percentage}% of dismissals had poor skill matches. I can narrow down to roles that better match your expertise.`
                        action = 'adjust_filter'
                        actionLabel = 'Refine skill matching'
                        break
                        
                    case 'industry':
                        suggestionTitle = 'Industry focus needed'
                        suggestionMessage = `You've dismissed ${pattern.percentage}% of jobs outside your preferred industries. Should I filter more strictly by industry?`
                        action = 'adjust_filter'
                        actionLabel = 'Tighten industry filters'
                        break
                        
                    case 'job title':
                        suggestionTitle = 'Job title mismatch'
                        suggestionMessage = `${pattern.percentage}% of dismissals were for roles that don't match your target titles. Want me to be more selective?`
                        action = 'adjust_filter'
                        actionLabel = 'Refine title matching'
                        break
                        
                    default:
                        suggestionTitle = 'Pattern detected'
                        suggestionMessage = `You've dismissed ${pattern.percentage}% of jobs with low ${pattern.factor} scores.`
                        action = 'adjust_filter'
                        actionLabel = 'Adjust preferences'
                }
                
                return {
                    id,
                    factor: pattern.factor,
                    pattern,
                    suggestionTitle,
                    suggestionMessage,
                    action,
                    actionLabel,
                    isDismissed: dismissedIds.has(id)
                }
            })
            
            setSuggestions(newSuggestions.filter(s => !s.isDismissed))
        } catch (err) {
            console.error('Error generating auto-tune suggestions:', err)
        } finally {
            setLoading(false)
        }
    }, [getDismissalPatterns, dismissedIds])
    
    useEffect(() => {
        generateSuggestions()
    }, [generateSuggestions])
    
    // Apply a suggestion (would integrate with user preferences/filters)
    const applySuggestion = useCallback(async (suggestionId: string) => {
        const suggestion = suggestions.find(s => s.id === suggestionId)
        if (!suggestion) return
        
        // TODO: Integrate with actual user preferences system
        // For now, we just remove it from the list
        console.log('Applying suggestion:', suggestion)
        
        // Remove from suggestions
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
        
        // Mark as applied (would persist this)
        setDismissedIds(prev => new Set(prev).add(suggestionId))
    }, [suggestions])
    
    // Dismiss a suggestion without applying
    const dismissSuggestion = useCallback((suggestionId: string) => {
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
        setDismissedIds(prev => new Set(prev).add(suggestionId))
    }, [])
    
    return {
        suggestions,
        loading: loading || patternsLoading,
        applySuggestion,
        dismissSuggestion,
        hasSuggestions: suggestions.length > 0
    }
}

export default useAutoTuning
