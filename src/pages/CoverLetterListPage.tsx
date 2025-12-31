import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { EmptyState } from '../components/ui/EmptyState'
import { CollectionEmptyGuard } from '../components/ui/CollectionEmptyGuard'
import { useCoverLetters, type CoverLetter } from '../hooks/useCoverLetters'
import { Container } from '../components/shared/Container'
import PageBackground from '../components/shared/PageBackground'
import { Button } from '../components/ui/Button'

export default function CoverLetterListPage({ embedded = false }: { embedded?: boolean }) {
    const navigate = useNavigate()
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

            {/* DEV: Validate empty state compliance */}
            <CollectionEmptyGuard
                itemsCount={coverLetters.length}
                hasEmptyState={true}
                scopeId="cover-letter-list"
                expectedAction="Go to Applications to generate"
            />

            {coverLetters.length === 0 && !loading ? (
                <EmptyState
                    type="generic"
                    title="No letters yet"
                    description="Cover letters are generated from your Applications page. Start tracking an application to create tailored letters."
                    action={{
                        label: 'Go to Applications',
                        onClick: () => navigate('/applications'),
                    }}
                    secondaryAction={{
                        label: 'Browse Jobs',
                        onClick: () => navigate('/jobs'),
                        variant: 'secondary',
                    }}
                    includePoetry={false}
                />
            ) : (
                <div className="resume-list">
                    {coverLetters.map((letter) => (
                        <div key={letter.id} className="card-resume">
                            <div className="card-header">
                                <h3 className="text-sm font-semibold truncate pr-4">{letter.title}</h3>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>

                                    <span className="meta">
                                        {new Date(letter.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div className="card-actions">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => deleteCoverLetter(letter.id)}
                                >
                                    Delete
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setViewingLetter(letter)}
                                >
                                    View Full
                                </Button>
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
                                <Icon name="x" size="sm" />
                            </button>
                        </header>
                        <div className="p-8 max-h-[70vh] overflow-y-auto">
                            <div className="text-sm leading-relaxed whitespace-pre-wrap font-serif text-slate-800">
                                {viewingLetter.content}
                            </div>
                        </div>
                        <footer className="p-4 bg-surface-accent border-top border-subtle flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    navigator.clipboard.writeText(viewingLetter.content)
                                    alert('Copied to clipboard!')
                                }}
                            >
                                Copy Content
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                onClick={() => setViewingLetter(null)}
                            >
                                Close
                            </Button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    )

    if (embedded) return content
    return <PageBackground><Container maxWidth="xl" padding="md">{content}</Container></PageBackground>
}
