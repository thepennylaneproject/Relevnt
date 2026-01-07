import React, { useState } from 'react'
import { Icon } from '../ui/Icon'
import { Button } from '../ui/Button'
import { useGenerateCoverLetter } from '../../hooks/useGenerateCoverLetter'
import { useResumes } from '../../hooks/useResumes'
import { useCoverLetters } from '../../hooks/useCoverLetters'
import { useAuth } from '../../contexts/AuthContext'
import { type Application } from '../../hooks/useApplications'
import { InlineQuestionHelper } from './InlineQuestionHelper'


interface CoverLetterGeneratorProps {
    application: Application
}

export function CoverLetterGenerator({ application }: CoverLetterGeneratorProps) {
    const { user } = useAuth()
    const { resumes } = useResumes(user!)
    const { generate, loading: generating } = useGenerateCoverLetter()
    const { saveCoverLetter, loading: saving } = useCoverLetters()

    const [content, setContent] = useState('')
    const [strategy, setStrategy] = useState('')
    const [matches, setMatches] = useState<string[]>([])

    const [title, setTitle] = useState(`Cover Letter - ${application.company}`)
    const [isEditing, setIsEditing] = useState(false)
    const [isSaved, setIsSaved] = useState(false)

    // Use snapshot if available, otherwise default resume
    const snapshot = application.resume_snapshot
    const activeResume = snapshot || resumes.find(r => r.is_default) || resumes[0]
    const isSnapshot = !!snapshot

    const handleGenerate = async () => {
        if (!activeResume?.parsed_text) {
            alert("No resume content found. Please upload a resume first.")
            return
        }

        const result = await generate(
            activeResume.parsed_text,
            (application.job as any)?.description || application.notes || '',
            application.company
        )

        if (result?.success && result.data) {
            setContent(result.data.coverLetter)
            setStrategy(result.data.strategy || '')
            setMatches(result.data.matchingPoints || [])
            setIsEditing(true)
        }
    }

    const handleSave = async () => {
        const saved = await saveCoverLetter({
            application_id: application.id,
            resume_id: activeResume?.id,
            title,
            content,
            job_description: (application.job as any)?.description || application.notes || '',
            company_name: application.company
        })

        if (saved) {
            setIsSaved(true)
            setIsEditing(false)
            setTimeout(() => setIsSaved(false), 3000)
        }
    }

    return (
        <div className="cover-letter-generator p-4 surface-accent rounded-xl border border-accent/10">
            {!content && !generating && (
                <div className="text-center py-6">
                    <div className="dashboard-hero-icon mx-auto mb-4 bg-accent/10 text-accent">
                        <Icon name="scroll" size="md" />
                    </div>
                    <h3 className="text-sm font-bold">Tailored Cover Letter</h3>
                    <p className="muted text-xs max-w-xs mx-auto mt-2">
                        Generate a targeted cover letter using <span className="text-foreground font-bold">{activeResume?.title || 'your resume'}</span>
                        {isSnapshot && <span className="block text-[10px] text-accent mt-1">(Using snapshot from application)</span>}
                    </p>
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        className="mt-4"
                        onClick={handleGenerate}
                        disabled={!activeResume}
                    >
                        Generate with AI
                    </Button>
                    {!activeResume && <p className="text-[10px] text-danger mt-2">Upload a resume to begin.</p>}
                </div>
            )}

            {generating && (
                <div className="text-center py-12">
                    <div className="animate-pulse space-y-4">
                        <div className="h-2 bg-border-subtle rounded w-3/4 mx-auto"></div>
                        <div className="h-2 bg-border-subtle rounded w-5/6 mx-auto"></div>
                        <div className="h-2 bg-border-subtle rounded w-2/3 mx-auto"></div>
                        <p className="text-xs muted pt-4">Aligning your narrative...</p>
                    </div>
                </div>
            )}

            {content && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Icon name="stars" size="sm" className="text-accent" />
                            <h3 className="text-sm font-bold">AI Drafted Letter</h3>
                        </div>
                        <div className="flex gap-2">
                            {!isEditing ? (
                                <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                                    Edit
                                </Button>
                            ) : (
                                <Button type="button" variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                                    {saving ? 'Saving...' : isSaved ? 'Saved!' : 'Save to Library'}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Strategy Insight */}
                    {(strategy || matches.length > 0) && (
                        <div className="bg-surface border border-accent/20 rounded-lg p-3 space-y-2">
                            {strategy && (
                                <div className="text-xs text-muted">

                                    {strategy}
                                </div>
                            )}
                            {matches.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {matches.map((m, i) => (
                                        <span key={i} className="text-[10px] px-2 py-0.5 bg-accent/10 text-accent rounded-full border border-accent/20">
                                            {m}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="relative">
                        {isEditing ? (
                            <>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full h-64 p-3 text-xs bg-surface border border-subtle rounded-lg focus:ring-1 focus:ring-accent outline-none"
                                placeholder="Professional cover letter content..."
                            />
                            <InlineQuestionHelper
                                questionText={`Write a cover letter for the ${application.position} role at ${application.company}.`}
                                fieldValue={content}
                                onInsert={(text) => setContent(text)}
                                jobDescription={(application.job as any)?.description || application.notes || ''}
                            />
                            </>
                        ) : (
                            <div className="w-full h-64 p-3 text-xs bg-surface/50 border border-transparent rounded-lg overflow-y-auto whitespace-pre-wrap leading-relaxed">
                                {content}
                            </div>
                        )}
                        {isSaved && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-success font-bold bg-success/10 px-2 py-1 rounded">
                                <Icon name="check" size="sm" />
                                Added to Library
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
