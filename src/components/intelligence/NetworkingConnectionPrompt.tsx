/**
 * =============================================================================
 * NetworkingConnectionPrompt Component
 * =============================================================================
 * Displays a prompt when the user has a networking contact at a company.
 * Part of Lyra Intelligence Layer - Phase 1.2
 * =============================================================================
 */

import React, { useState } from 'react'
import { Users, MessageSquare, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { useNetworkLookup } from '../../hooks/useNetworkLookup'
import type { Contact } from '../../hooks/useNetworking'

interface NetworkingConnectionPromptProps {
    company: string | null | undefined
    className?: string
    variant?: 'inline' | 'card' | 'badge'
    onGenerateMessage?: (contact: Contact) => void
}

export function NetworkingConnectionPrompt({
    company,
    className = '',
    variant = 'card',
    onGenerateMessage
}: NetworkingConnectionPromptProps) {
    const { contacts, loading, hasMatch } = useNetworkLookup(company)
    const [isExpanded, setIsExpanded] = useState(false)

    // Don't render anything if no match or still loading
    if (loading || !hasMatch) return null

    const primaryContact = contacts[0]
    const additionalContacts = contacts.slice(1)

    // Badge variant - minimal inline indicator
    if (variant === 'badge') {
        return (
            <span className={`networking-badge ${className}`} title={`You know ${primaryContact.name} at ${company}`}>
                <Users size={12} />
                <span>Connection</span>
                <style>{`
                    .networking-badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        padding: 2px 8px;
                        background: var(--accent-success-subtle, rgba(34, 197, 94, 0.15));
                        color: var(--accent-success, #22c55e);
                        font-size: 11px;
                        font-weight: 600;
                        border-radius: 12px;
                    }
                `}</style>
            </span>
        )
    }

    // Inline variant - single line with name
    if (variant === 'inline') {
        return (
            <div className={`networking-inline ${className}`}>
                <Users size={14} />
                <span>
                    You know <strong>{primaryContact.name}</strong>
                    {primaryContact.role && ` (${primaryContact.role})`} at {company}
                </span>
                {onGenerateMessage && (
                    <button
                        className="networking-action-btn"
                        onClick={() => onGenerateMessage(primaryContact)}
                    >
                        <MessageSquare size={12} />
                        Draft message
                    </button>
                )}
                <style>{`
                    .networking-inline {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 8px 12px;
                        background: var(--accent-success-subtle, rgba(34, 197, 94, 0.1));
                        border-left: 3px solid var(--accent-success, #22c55e);
                        border-radius: 4px;
                        font-size: 13px;
                        color: var(--text-secondary, #aaa);
                    }
                    .networking-inline strong {
                        color: var(--text-primary, #fff);
                    }
                    .networking-action-btn {
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        padding: 4px 8px;
                        background: var(--accent-success, #22c55e);
                        color: white;
                        border: none;
                        border-radius: 4px;
                        font-size: 11px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: opacity 0.15s;
                    }
                    .networking-action-btn:hover {
                        opacity: 0.9;
                    }
                `}</style>
            </div>
        )
    }

    // Card variant - full expandable card
    return (
        <div className={`networking-prompt-card ${className}`}>
            <button
                className="networking-prompt-header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="networking-prompt-header-left">
                    <Users size={16} className="networking-prompt-icon" />
                    <div>
                        <span className="networking-prompt-title">
                            🔗 You have {contacts.length === 1 ? 'a connection' : `${contacts.length} connections`} at {company}
                        </span>
                        <span className="networking-prompt-subtitle">
                            {primaryContact.name}
                            {additionalContacts.length > 0 && ` and ${additionalContacts.length} more`}
                        </span>
                    </div>
                </div>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isExpanded && (
                <div className="networking-prompt-content">
                    {contacts.map((contact: Contact) => (
                        <div key={contact.id} className="networking-contact-row">
                            <div className="networking-contact-info">
                                <strong>{contact.name}</strong>
                                {contact.role && <span className="networking-contact-role">{contact.role}</span>}
                                <span className={`networking-contact-status status-${contact.status}`}>
                                    {contact.status}
                                </span>
                            </div>
                            <div className="networking-contact-actions">
                                {contact.linkedin_url && (
                                    <a
                                        href={contact.linkedin_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="ghost-button button-sm"
                                    >
                                        <ExternalLink size={12} />
                                        LinkedIn
                                    </a>
                                )}
                                {onGenerateMessage && (
                                    <button
                                        className="networking-action-btn"
                                        onClick={() => onGenerateMessage(contact)}
                                    >
                                        <MessageSquare size={12} />
                                        Draft intro
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    <p className="networking-tip">
                        💡 A warm introduction can significantly increase your chances. Consider reaching out!
                    </p>
                </div>
            )}

            <style>{`
                .networking-prompt-card {
                    background: var(--surface-elevated, #1a1a2e);
                    border: 1px solid var(--accent-success, #22c55e);
                    border-radius: 12px;
                    overflow: hidden;
                    margin-bottom: 16px;
                }

                .networking-prompt-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    padding: 12px 16px;
                    background: var(--accent-success-subtle, rgba(34, 197, 94, 0.1));
                    border: none;
                    cursor: pointer;
                    color: var(--text-primary, #fff);
                    transition: background 0.15s ease;
                }

                .networking-prompt-header:hover {
                    background: var(--accent-success-subtle-hover, rgba(34, 197, 94, 0.15));
                }

                .networking-prompt-header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .networking-prompt-icon {
                    color: var(--accent-success, #22c55e);
                }

                .networking-prompt-title {
                    display: block;
                    font-weight: 600;
                    font-size: 14px;
                }

                .networking-prompt-subtitle {
                    display: block;
                    font-size: 12px;
                    color: var(--text-muted, #888);
                }

                .networking-prompt-content {
                    padding: 16px;
                    border-top: 1px solid var(--border-subtle, rgba(255,255,255,0.05));
                }

                .networking-contact-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px;
                    background: var(--surface-sunken, rgba(0,0,0,0.2));
                    border-radius: 8px;
                    margin-bottom: 8px;
                }

                .networking-contact-row:last-of-type {
                    margin-bottom: 12px;
                }

                .networking-contact-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .networking-contact-info strong {
                    font-size: 14px;
                }

                .networking-contact-role {
                    font-size: 12px;
                    color: var(--text-muted, #888);
                }

                .networking-contact-status {
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 10px;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .status-connected {
                    background: var(--accent-success-subtle, rgba(34, 197, 94, 0.2));
                    color: var(--accent-success, #22c55e);
                }

                .status-requested {
                    background: var(--accent-warning-subtle, rgba(245, 158, 11, 0.2));
                    color: var(--accent-warning, #f59e0b);
                }

                .status-identified {
                    background: var(--surface-hover, rgba(255,255,255,0.1));
                    color: var(--text-muted, #888);
                }

                .status-replied, .status-met {
                    background: var(--accent-primary-subtle, rgba(99, 102, 241, 0.2));
                    color: var(--accent-primary, #6366f1);
                }

                .networking-contact-actions {
                    display: flex;
                    gap: 8px;
                }

                .networking-action-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 6px 10px;
                    background: var(--accent-success, #22c55e);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: opacity 0.15s;
                }

                .networking-action-btn:hover {
                    opacity: 0.9;
                }

                .networking-tip {
                    font-size: 12px;
                    color: var(--text-muted, #888);
                    margin: 0;
                    padding: 8px 12px;
                    background: var(--surface-sunken, rgba(0,0,0,0.2));
                    border-radius: 6px;
                    border-left: 3px solid var(--accent-primary, #6366f1);
                }
            `}</style>
        </div>
    )
}

export default NetworkingConnectionPrompt
