import React, { useState } from 'react'
import { Icon } from '../components/ui/Icon'
import { useCoverLetters, type CoverLetter } from '../hooks/useCoverLetters'
import { Container } from '../components/shared/Container'
import PageBackground from '../components/shared/PageBackground'

export default function CoverLetterListPage({ embedded = false }: { embedded?: boolean }) {
    const { coverLetters, loading, error, deleteCoverLetter } = useCoverLetters()
    const [viewingLetter, setViewingLetter] = useState<CoverLetter | null>(null)

    if (loading && !embedded) return <div className="p-8 muted">Loading letters...</div>

    const content = (
        <div className="tab-pane active">
            <div className="section-header">
                <h2>Cover Letter Library</h2>
                <p>Manage and reuse your AI-generated cover letters.</p>
            </div>

            {error && <div className="card-info animate-in fade-in" style={{ borderColor: 'var(--color-error)' }}>{error}</div>}

            {coverLetters.length === 0 && !loading ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-12 text-center">
                    <Icon name="scroll" size="lg" className="mx-auto mb-4 muted opacity-20" />
                    <p className="text-sm text-slate-600 mb-2 font-bold">No letters yet</p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        Generate cover letters directly from your Applications or the Jobs page to see them here.
                    </p>
                </div>
            ) : (
                <div className="resume-list">
                    {coverLetters.map((letter) => (
                        <div key={letter.id} className="card-resume">
                            <div className="card-header">
                                <h3 className="text-sm font-semibold truncate pr-4">{letter.title}</h3>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span className="text-[10px] muted uppercase font-bold">{letter.company_name || 'General'}</span>
                                    <span className="meta">
                                        {new Date(letter.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div className="card-actions">
                                <button
                                    onClick={() => deleteCoverLetter(letter.id)}
                                    className="btn btn-destructive btn-sm"
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={() => setViewingLetter(letter)}
                                    className="btn btn-secondary btn-sm"
                                >
                                    View Full
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {viewingLetter && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <header className="p-6 border-b border-subtle flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold">{viewingLetter.title}</h2>
                                <p className="text-xs muted">{viewingLetter.company_name}</p>
                            </div>
                            <button
                                onClick={() => setViewingLetter(null)}
                                className="p-2 hover:bg-surface-accent rounded-full"
                            >
                                <Icon name="anchor" size="sm" />
                            </button>
                        </header>
                        <div className="p-8 max-h-[70vh] overflow-y-auto">
                            <div className="text-sm leading-relaxed whitespace-pre-wrap font-serif text-slate-800">
                                {viewingLetter.content}
                            </div>
                        </div>
                        <footer className="p-4 bg-surface-accent border-top border-subtle flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(viewingLetter.content)
                                    alert('Copied to clipboard!')
                                }}
                                className="ghost-button button-sm"
                            >
                                Copy Content
                            </button>
                            <button
                                onClick={() => setViewingLetter(null)}
                                className="primary-button button-sm"
                            >
                                Close
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    )

    if (embedded) return content
    return <PageBackground><Container maxWidth="xl" padding="md">{content}</Container></PageBackground>
}
