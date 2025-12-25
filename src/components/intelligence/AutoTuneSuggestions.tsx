/**
 * =============================================================================
 * AutoTuneSuggestions Component
 * =============================================================================
 * Displays proactive suggestions to adjust filters based on user behavior.
 * Shifts from "here are your patterns" to "let me fix this for you".
 * Part of Phase 3: The Concierge Shift
 * =============================================================================
 */

import React from 'react'
import { Sparkles, X, ChevronRight } from 'lucide-react'
import { useAutoTuning } from '../../hooks/useAutoTuning'

interface AutoTuneSuggestionsProps {
    className?: string
}

export function AutoTuneSuggestions({ className = '' }: AutoTuneSuggestionsProps) {
    const { suggestions, loading, applyingId, applySuggestion, dismissSuggestion, hasSuggestions } = useAutoTuning()
    
    if (loading || !hasSuggestions) {
        return null
    }
    
    return (
        <div className={`autotune-suggestions ${className}`}>
            <div className="autotune-header">
                <div className="autotune-header-left">
                    <Sparkles size={18} className="autotune-icon" />
                    <h3 className="autotune-title">Concierge Suggestions</h3>
                </div>
                <span className="autotune-badge">{suggestions.length}</span>
            </div>
            
            <p className="autotune-subtitle">
                I've noticed some patterns. Want me to adjust your filters?
            </p>
            
            <div className="suggestions-list">
                {suggestions.map((suggestion) => (
                    <div key={suggestion.id} className="suggestion-card">
                        <button
                            className="suggestion-dismiss"
                            onClick={() => dismissSuggestion(suggestion.id)}
                            aria-label="Dismiss suggestion"
                        >
                            <X size={14} />
                        </button>
                        
                        <div className="suggestion-content">
                            <h4 className="suggestion-title">{suggestion.suggestionTitle}</h4>
                            <p className="suggestion-message">{suggestion.suggestionMessage}</p>
                            
                            <div className="suggestion-actions">
                                <button
                                    className="suggestion-apply-btn"
                                    onClick={() => applySuggestion(suggestion.id)}
                                    disabled={applyingId === suggestion.id}
                                >
                                    {applyingId === suggestion.id ? 'Applying...' : suggestion.actionLabel}
                                    {applyingId !== suggestion.id && <ChevronRight size={14} />}
                                </button>
                                <button
                                    className="suggestion-skip-btn"
                                    onClick={() => dismissSuggestion(suggestion.id)}
                                    disabled={applyingId === suggestion.id}
                                >
                                    Not now
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <style>{`
                .autotune-suggestions {
                    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);
                    border: 1px solid var(--accent-primary, #6366f1);
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 16px;
                }
                
                .autotune-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }
                
                .autotune-header-left {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .autotune-icon {
                    color: var(--accent-primary, #6366f1);
                }
                
                .autotune-title {
                    font-size: 16px;
                    font-weight: 700;
                    color: var(--text-primary, #fff);
                    margin: 0;
                }
                
                .autotune-badge {
                    background: var(--accent-primary, #6366f1);
                    color: white;
                    font-size: 11px;
                    font-weight: 700;
                    padding: 3px 8px;
                    border-radius: 12px;
                }
                
                .autotune-subtitle {
                    font-size: 13px;
                    color: var(--text-secondary, #aaa);
                    margin: 0 0 16px;
                }
                
                .suggestions-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .suggestion-card {
                    position: relative;
                    background: var(--surface-elevated, #1a1a2e);
                    border: 1px solid var(--border-subtle, rgba(255,255,255,0.1));
                    border-radius: 12px;
                    padding: 16px;
                    padding-right: 36px;
                }
                
                .suggestion-dismiss {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    background: transparent;
                    border: none;
                    color: var(--text-muted, #666);
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                }
                
                .suggestion-dismiss:hover {
                    background: var(--surface-hover, rgba(255,255,255,0.1));
                    color: var(--text-primary, #fff);
                }
                
                .suggestion-content {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .suggestion-title {
                    font-size: 14px;
                    font-weight: 700;
                    color: var(--text-primary, #fff);
                    margin: 0;
                }
                
                .suggestion-message {
                    font-size: 13px;
                    color: var(--text-secondary, #aaa);
                    margin: 0;
                    line-height: 1.5;
                }
                
                .suggestion-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 8px;
                }
                
                .suggestion-apply-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: var(--accent-primary, #6366f1);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    padding: 8px 14px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .suggestion-apply-btn:hover {
                    background: var(--accent-primary-hover, #5558dd);
                    transform: translateX(2px);
                }
                
                .suggestion-skip-btn {
                    background: transparent;
                    color: var(--text-muted, #888);
                    border: 1px solid var(--border-subtle, rgba(255,255,255,0.1));
                    border-radius: 8px;
                    padding: 8px 14px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .suggestion-skip-btn:hover {
                    border-color: var(--border-default, rgba(255,255,255,0.2));
                    color: var(--text-secondary, #aaa);
                }
            `}</style>
        </div>
    )
}

export default AutoTuneSuggestions
