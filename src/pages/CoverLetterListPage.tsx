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
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="rounded-full bg-accent text-white p-2">
                        <Icon name="scroll" size="sm" />
                    </div>
                    <div>
                        <h1 className="text-lg font-display">Cover Letter Library</h1>
                        <p className="text-sm text-slate-600">
                            Manage and reuse your AI-generated cover letters.
                        </p>
                    </div>
                </div>
            </div>

            {error && <div className="p-4 bg-danger/10 text-danger rounded-lg text-xs">{error}</div>}

            {coverLetters.length === 0 && !loading ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-12 text-center">
                    <Icon name="scroll" size="lg" className="mx-auto mb-4 muted opacity-20" />
                    <p className="text-sm text-slate-600 mb-2 font-bold">No letters yet</p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        Generate cover letters directly from your Applications or the Jobs page to see them here.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {coverLetters.map((letter) => (
                        <div key={letter.id} className="item-card flex flex-col justify-between p-4 surface-card border border-subtle hover:border-accent transition-all">
                            <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-sm font-bold truncate pr-4">{letter.title}</h3>
                                    <button
                                        onClick={() => deleteCoverLetter(letter.id)}
                                        className="text-danger hover:text-danger/80 p-1"
                                    >
                                        <Icon name="anchor" size="sm" />
                                    </button>
                                </div>
                                <p className="text-[10px] muted uppercase font-bold">{letter.company_name || 'General'}</p>
                                <p className="text-xs text-slate-500 line-clamp-3">
                                    {letter.content}
                                </p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-subtle flex justify-between items-center">
                                <span className="text-[10px] muted">
                                    {new Date(letter.created_at).toLocaleDateString()}
                                </span>
                                <button
                                    onClick={() => setViewingLetter(letter)}
                                    className="ghost-button button-xs"
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
