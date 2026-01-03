import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Heading, Text } from '../components/ui/Typography'
import { Badge } from '../components/ui/Badge'
import { PageLayout } from '../components/layout/PageLayout'
import { Icon } from '../components/ui/Icon'
import { EmptyState } from '../components/ui/EmptyState'
import { CollectionEmptyGuard } from '../components/ui/CollectionEmptyGuard'
import { useCoverLetters, type CoverLetter } from '../hooks/useCoverLetters'
import { Button } from '../components/ui/Button'

export default function CoverLetterListPage({ embedded = false }: { embedded?: boolean }) {
    const navigate = useNavigate()
    const { coverLetters, loading, error, deleteCoverLetter } = useCoverLetters()
    const [viewingLetter, setViewingLetter] = useState<CoverLetter | null>(null)

    if (loading && !embedded) return <div className="p-8 muted">Loading letters...</div>

    const content = (
        <div className="space-y-12">
            <header className="border-b border-border/30 pb-6">
                <Heading level={4} className="uppercase tracking-widest text-xs">Letter Archives</Heading>
                <Text muted className="mt-1">Historical AI-generated context for your applications.</Text>
            </header>

            {error && (
                <Text className="text-error bg-error/5 p-4 border border-error/20 italic">
                    {error}
                </Text>
            )}

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
                    description="Cover letters are generated from your Applications page."
                    action={{
                        label: 'Go to Applications',
                        onClick: () => navigate('/applications'),
                    }}
                    secondaryAction={{
                        label: 'Browse Jobs',
                        onClick: () => navigate('/jobs'),
                        variant: 'secondary',
                    }}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {coverLetters.map((letter) => (
                        <Card key={letter.id} className="group flex flex-col justify-between">
                            <div className="mb-8">
                                <div className="flex justify-between items-start mb-2">
                                    <Heading level={4} className="group-hover:text-accent transition-colors truncate pr-4">
                                        {letter.title}
                                    </Heading>
                                    <Badge variant="neutral">Archive</Badge>
                                </div>
                                <Text muted className="text-[10px] tabular-nums">
                                    Generated {new Date(letter.created_at).toLocaleDateString()}
                                </Text>
                            </div>
                            
                            <div className="flex justify-between items-center pt-6 border-t border-border/30">
                                <button
                                    className="text-[10px] uppercase tracking-widest font-bold text-accent border-b border-accent/20 hover:border-accent transition-colors"
                                    onClick={() => setViewingLetter(letter)}
                                >
                                    Full Text
                                </button>
                                <button
                                    className="text-[10px] uppercase tracking-widest font-bold text-text-muted hover:text-error transition-colors"
                                    onClick={() => deleteCoverLetter(letter.id)}
                                >
                                    Archive Document
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {viewingLetter && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                        <header className="px-12 py-10 border-b border-border flex justify-between items-start bg-ivory">
                            <div>
                                <Heading level={2} className="mb-2">{viewingLetter.title}</Heading>
                                <div className="flex items-center gap-3">
                                    <Badge variant="neutral" className="font-bold">Record</Badge>
                                    <Text muted className="font-bold">{viewingLetter.company_name}</Text>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingLetter(null)}
                                className="text-text-muted hover:text-text transition-colors p-2 -mr-2"
                            >
                                <Icon name="x" size="sm" />
                            </button>
                        </header>
                        
                        <div className="flex-1 overflow-y-auto px-12 py-12 bg-ivory">
                            <div className="max-w-xl mx-auto">
                                <Text className="whitespace-pre-wrap leading-[1.8] tracking-wide text-text/90 font-serif text-lg">
                                    {viewingLetter.content}
                                </Text>
                            </div>
                        </div>

                        <footer className="px-12 py-8 bg-black/[0.02] border-t border-border flex justify-between items-center">
                            <Text muted className="text-[10px] uppercase tracking-widest font-bold">
                                Generated {new Date(viewingLetter.created_at).toLocaleString()}
                            </Text>
                            <div className="flex gap-8">
                                <button
                                    className="text-[10px] uppercase tracking-widest font-bold text-text-muted hover:text-text border-b border-transparent hover:border-text transition-colors"
                                    onClick={() => {
                                        navigator.clipboard.writeText(viewingLetter.content)
                                        // Silent success preferred in editorial or very subtle feedback
                                    }}
                                >
                                    Copy Script
                                </button>
                                <button
                                    className="text-[10px] uppercase tracking-widest font-bold text-text hover:text-accent transition-colors"
                                    onClick={() => setViewingLetter(null)}
                                >
                                    Dismiss
                                </button>
                            </div>
                        </footer>
                    </Card>
                </div>
            )}
        </div>
    )

    if (embedded) return content
    return (
        <PageLayout 
            title="Letter Archives"
            subtitle="Your collection of AI-generated tailoring scripts."
        >
            {content}
        </PageLayout>
    )
}
