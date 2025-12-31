import React from 'react'
import { useNetworkLookup } from '../../hooks/useNetworkLookup'
import { Icon } from '../ui/Icon'
import { useToast } from '../ui/Toast'
import { Button } from '../ui/Button'

interface NetworkingOverlayProps {
    company: string
}

export const NetworkingOverlay: React.FC<NetworkingOverlayProps> = ({ company }) => {
    const { contacts, loading, hasMatch } = useNetworkLookup(company)
    const { showToast } = useToast()

    if (loading) {
        return <div className="networking-overlay-loading text-xs muted">Finding connections at {company}...</div>
    }

    if (!hasMatch) return null

    const copyTemplate = (name: string) => {
        const text = `Hi ${name.split(' ')[0]}, I hope you're doing well! I'm applying for a role at ${company} and noticed you're working there. Would you be open to a quick chat about your experience there? No pressure at all, just curious about the culture!`
        navigator.clipboard.writeText(text)
        showToast(`Copied outreach template for ${name}`, 'success')
    }

    return (
        <div className="networking-overlay surface-card">
            <div className="networking-overlay__header">
                <Icon name="paper-airplane" size="sm" />
                <span className="text-xs font-medium">Inside Connections at {company}</span>
            </div>
            
            <div className="networking-overlay__list">
                {contacts.map(contact => (
                    <div key={contact.id} className="networking-contact-item">
                        <div className="contact-info">
                            <span className="contact-name text-xs font-semibold">{contact.name}</span>
                            {contact.role && <span className="contact-role text-[10px] muted">{contact.role}</span>}
                        </div>
                        <div className="contact-actions">
                            {contact.linkedin_url && (
                                <a 
                                    href={contact.linkedin_url} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="icon-button icon-button--sm"
                                    title="View LinkedIn"
                                >
                                    <Icon name="paper-airplane" size="sm" hideAccent />
                                </a>
                            )}
                            <Button 
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => copyTemplate(contact.name)}
                                title="Copy outreach template"
                            >
                                <Icon name="scroll" size="sm" hideAccent />
                                Template
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="networking-overlay__footer text-[10px] muted">
                Leveraging your network increases callback rates by 3x.
            </div>
        </div>
    )
}
