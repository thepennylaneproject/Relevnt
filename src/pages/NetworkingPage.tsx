import React, { useState } from 'react'
import { Plus, Linkedin, UserPlus, CheckCircle, MessageSquare } from 'lucide-react'
import PageBackground from '../components/shared/PageBackground'
import { Container } from '../components/shared/Container'
import { Icon } from '../components/ui/Icon'
import { useNetworking, type ContactStatus } from '../hooks/useNetworking'
import { formatRelativeTime } from '../lib/utils/time'
import '../styles/networking.css'

export default function NetworkingPage() {
    const { contacts, templates, loading, addContact, updateContactStatus } = useNetworking()
    const [isAddingContact, setIsAddingContact] = useState(false)
    const [newContact, setNewContact] = useState({ name: '', company: '', role: '', linkedin_url: '' })

    const handleAddContact = async (e: React.FormEvent) => {
        e.preventDefault()
        await addContact(newContact)
        setIsAddingContact(false)
        setNewContact({ name: '', company: '', role: '', linkedin_url: '' })
    }

    const getStatusIcon = (status: ContactStatus) => {
        switch (status) {
            case 'identified': return <Icon name="search" size="sm" hideAccent />
            case 'requested': return <UserPlus size={14} />
            case 'connected': return <CheckCircle size={14} className="text-success" />
            case 'replied': return <MessageSquare size={14} className="text-blue-500" />
            case 'met': return <Icon name="flower" size="sm" hideAccent />
            default: return null
        }
    }

    return (
        <PageBackground>
            <Container maxWidth="xl" padding="md">
                <div className="networking-page">
                    <section className="hero-shell">
                        <div className="hero-header">
                            <div className="hero-icon">
                                <Icon name="lighthouse" size="md" />
                            </div>
                            <div className="hero-header-main">
                                <p className="text-xs muted">Networking & Outreach</p>
                                <h1 className="font-display">Your Networking War Room</h1>
                                <p className="muted">
                                    Track your connections, logs, and follow-ups. Networking is 80% of the job search.
                                </p>
                            </div>
                        </div>

                        <div className="hero-actions-accent">
                            <button
                                className="primary-button"
                                onClick={() => setIsAddingContact(true)}
                            >
                                <Plus size={16} />
                                Add Contact
                            </button>
                        </div>
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                        <div className="lg:col-span-2 space-y-6">
                            <section className="surface-card">
                                <h2 className="text-sm font-semibold mb-4">Active Connections</h2>
                                {loading ? (
                                    <p className="muted text-sm">Loading contacts...</p>
                                ) : contacts.length === 0 ? (
                                    <div className="empty-networking py-12 text-center">
                                        <Icon name="compass" size="lg" />
                                        <p className="muted mt-4">No contacts yet. Start building your network!</p>
                                    </div>
                                ) : (
                                    <div className="contact-list">
                                        {contacts.map(contact => (
                                            <article key={contact.id} className="contact-card card mb-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-sm font-bold">{contact.name}</h3>
                                                        <p className="text-xs muted">
                                                            {contact.role} {contact.company ? `@ ${contact.company}` : ''}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {contact.linkedin_url && (
                                                            <a href={contact.linkedin_url} target="_blank" rel="noreferrer" className="ghost-button button-xs">
                                                                <Linkedin size={14} />
                                                            </a>
                                                        )}
                                                        <span className={`pill status-pill--${contact.status}`}>
                                                            {getStatusIcon(contact.status)}
                                                            <span className="ml-1 capitalize">{contact.status}</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="contact-actions mt-4 pt-4 border-t border-subtle flex gap-4">
                                                    <select
                                                        value={contact.status}
                                                        onChange={(e) => updateContactStatus(contact.id, e.target.value as ContactStatus)}
                                                        className="text-xs bg-surface-accent border-none rounded px-2 py-1"
                                                    >
                                                        <option value="identified">Identified</option>
                                                        <option value="requested">Requested</option>
                                                        <option value="connected">Connected</option>
                                                        <option value="replied">Replied</option>
                                                        <option value="met">Met</option>
                                                    </select>
                                                    <span className="text-[10px] muted uppercase self-center">
                                                        Added {formatRelativeTime(contact.created_at)}
                                                    </span>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>

                        <div className="lg:col-span-1 space-y-6">
                            <section className="surface-card">
                                <h2 className="text-sm font-semibold mb-4 text-accent">Outreach Templates</h2>
                                <div className="template-list space-y-4">
                                    {templates.map(t => (
                                        <div key={t.id} className="template-item p-3 bg-surface-accent rounded-lg border border-subtle">
                                            <h4 className="text-xs font-bold mb-1">{t.name}</h4>
                                            <p className="text-[11px] muted line-clamp-2">{t.content}</p>
                                            <button
                                                className="ghost-button button-xs mt-2 w-full justify-center"
                                                onClick={() => navigator.clipboard.writeText(t.content)}
                                            >
                                                Copy Template
                                            </button>
                                        </div>
                                    ))}
                                    <button className="ghost-button button-sm w-full border-dashed border-accent">
                                        <Plus size={14} />
                                        New Template
                                    </button>
                                </div>
                            </section>

                            <section className="surface-card">
                                <h3 className="text-xs font-bold uppercase muted mb-2">Power User Tip</h3>
                                <p className="text-xs leading-relaxed">
                                    Personalize every LinkedIn request. Mention a specific post, common interest, or mutual connection to increase acceptance rates by 40%.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>

                {isAddingContact && (
                    <div className="modal-overlay" onClick={() => setIsAddingContact(false)}>
                        <div className="modal-content surface-card" onClick={e => e.stopPropagation()}>
                            <h3>Add Networking Contact</h3>
                            <form onSubmit={handleAddContact} className="space-y-4 mt-4">
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    className="rl-input"
                                    required
                                    value={newContact.name}
                                    onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                                />
                                <input
                                    type="text"
                                    placeholder="Company"
                                    className="rl-input"
                                    value={newContact.company}
                                    onChange={e => setNewContact({ ...newContact, company: e.target.value })}
                                />
                                <input
                                    type="text"
                                    placeholder="Role"
                                    className="rl-input"
                                    value={newContact.role}
                                    onChange={e => setNewContact({ ...newContact, role: e.target.value })}
                                />
                                <input
                                    type="url"
                                    placeholder="LinkedIn URL"
                                    className="rl-input"
                                    value={newContact.linkedin_url}
                                    onChange={e => setNewContact({ ...newContact, linkedin_url: e.target.value })}
                                />
                                <div className="flex justify-end gap-2 mt-6">
                                    <button type="button" className="ghost-button" onClick={() => setIsAddingContact(false)}>Cancel</button>
                                    <button type="submit" className="primary-button">Save Contact</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </Container>
        </PageBackground>
    )
}
