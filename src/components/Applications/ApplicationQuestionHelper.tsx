
import React, { useState } from 'react'
import { Icon } from '../ui/Icon'
import { Button } from '../ui/Button'
import { LoadingSpinner } from '../ui/Phase5UI'
import { analytics } from '../../lib/analytics'
import { usePersonas } from '../../hooks/usePersonas'
import { supabase } from '../../lib/supabase'
import '../../styles/apply.css'

type HelperMode = "default" | "concise" | "confident" | "metrics" | "values"

interface HelperOutput {
    answer: string
    bullet_points: string[]
    follow_up_questions: string[]
    warnings: string[]
}

interface HelperResponse {
    ok: boolean
    output: HelperOutput
    trace_id: string
    provider: string
    model: string
    cache_hit: boolean
    error?: string
    details?: string
}

const MODES: { value: HelperMode; label: string; description: string; icon: string }[] = [
    { value: 'default', label: 'Standard', description: 'Balanced & clear', icon: 'check' },
    { value: 'concise', label: 'Concise', description: 'Tight & punchy', icon: 'scroll' },
    { value: 'confident', label: 'Confident', description: 'Bold & direct', icon: 'lighthouse' },
    { value: 'metrics', label: 'Metrics', description: 'Data-driven', icon: 'stars' },
    { value: 'values', label: 'Values', description: 'Purpose-led', icon: 'flower' },
]

export const ApplicationQuestionHelper: React.FC = () => {
    // State
    const [question, setQuestion] = useState('')
    const [contextOpen, setContextOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<HelperOutput | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Context Fields
    const [roleTitle, setRoleTitle] = useState('')
    const [companyName, setCompanyName] = useState('')
    const [jobDescription, setJobDescription] = useState('')
    const [resumeContext, setResumeContext] = useState('')
    const [selectedPersonaId, setSelectedPersonaId] = useState<string>('')
    const [selectedMode, setSelectedMode] = useState<HelperMode>('default')

    const { personas } = usePersonas()

    // Handlers
    const handleDraft = async (modeOverride?: HelperMode) => {
        const modeToUse = modeOverride || selectedMode
        setLoading(true)
        setError(null)
        setResult(null)

        analytics.track('application_helper_submitted', {
            mode: modeToUse,
            has_context: contextOpen,
            has_persona: !!selectedPersonaId
        })

        try {
            const { data: session } = await supabase.auth.getSession()
            const token = session?.session?.access_token

            if (!token) throw new Error('Not authenticated')

            const res = await fetch('/.netlify/functions/application_helper', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    question,
                    mode: modeToUse,
                    roleTitle,
                    companyName,
                    jobDescription,
                    resumeContext,
                    personaId: selectedPersonaId
                })
            })

            const data: HelperResponse = await res.json()

            if (!res.ok || !data.ok) {
                throw new Error(data.error || data.details || 'Failed to generate answer')
            }

            setResult(data.output)

        } catch (err: any) {
            console.error(err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = () => {
        if (!result) return
        navigator.clipboard.writeText(result.answer)
        analytics.track('application_helper_copied')
        // Could show a toast here, but for now button text change or similar is enough visual feedback usually, 
        // but let's just tracking it.
    }

    const reset = () => {
        setResult(null)
        setError(null)
    }

    // Render Helpers
    const renderModeSelector = (mini = false) => (
        <div className={mini ? 'flex flex-wrap gap-2' : 'tone-selector'}>
            {MODES.map((m) => (
                <div
                    key={m.value}
                    className={`${mini ? 'btn btn--ghost btn--sm' : 'tone-option'} ${m.value === selectedMode ? (mini ? 'btn--active' : 'selected') : ''}`}
                    onClick={() => !loading && setSelectedMode(m.value)}
                >
                    {!mini && <Icon name={m.icon as any} size="md" className="mb-2" />}
                    <div className={mini ? '' : 'tone-option-label'}>{m.label}</div>
                    {!mini && <div className="tone-option-description">{m.description}</div>}
                </div>
            ))}
        </div>
    )

    if (loading) {
        return (
            <div className="surface-card min-h-[400px] flex items-center justify-center">
                <LoadingSpinner message="Drafting your answer..." />
            </div>
        )
    }

    if (result) {
        return (
            <div className="surface-card space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">Suggested Answer</h3>
                        <p className="text-xs muted">Generated with Relevnt AI • Check for accuracy before sending.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={reset}>
                            Start Over
                        </Button>
                        <Button variant="primary" size="sm" onClick={handleCopy}>
                            <Icon name="check" size="sm" className="mr-2" />
                            Copy
                        </Button>
                    </div>
                </div>

                {result.warnings.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-200">
                        <strong>Note:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                            {result.warnings.map((w, i) => (
                                <li key={i}>{w}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{result.answer}</p>
                </div>

                {result.bullet_points.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold mb-2">Key Points Covered</h4>
                        <ul className="list-disc list-inside text-sm muted space-y-1">
                            {result.bullet_points.map((bp, i) => <li key={i}>{bp}</li>)}
                        </ul>
                    </div>
                )}

                {result.follow_up_questions.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold mb-2">Potential Follow-ups to Prepare</h4>
                        <ul className="list-disc list-inside text-sm muted space-y-1">
                            {result.follow_up_questions.map((q, i) => <li key={i}>{q}</li>)}
                        </ul>
                    </div>
                )}

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-semibold muted mb-3">Quick rewrite</p>
                    {renderModeSelector(true)}
                </div>
            </div>
        )
    }

    return (
        <main className="apply-page">
            <header className="apply-header">
                <h1>Application Question Helper</h1>
                <p className="apply-subtitle">
                    Paste a question from an application, add some context, and get a tailored draft based on your experience.
                </p>
            </header>

            <div className="apply-content">
                <section className="apply-workspace">
                    <div className="input-group">
                        <label htmlFor="question" className="input-label">
                            Question from application
                        </label>
                        <textarea
                            id="question"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="e.g., 'Describe a time you failed and what you learned from it.'"
                            className="input apply-textarea"
                            rows={4}
                        />
                    </div>

                    <button
                        type="button"
                        className="context-toggle"
                        onClick={() => setContextOpen(!contextOpen)}
                    >
                        <Icon name={contextOpen ? 'chevron-up' : 'plus'} size="sm" />
                        {contextOpen ? 'Hide Context' : 'Add Context (Optional)'}
                    </button>

                    {contextOpen && (
                        <div className="p-6 space-y-6 bg-color-bg-interactive rounded-xl border border-color-border animate-in fade-in slide-in-from-top-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="input-group">
                                    <label className="input-label">Target Role</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="e.g. Senior Product Designer"
                                        value={roleTitle}
                                        onChange={e => setRoleTitle(e.target.value)}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Company</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="e.g. Acme Corp"
                                        value={companyName}
                                        onChange={e => setCompanyName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Job Description Excerpt</label>
                                <textarea
                                    className="input min-h-[80px]"
                                    placeholder="Paste key requirements or duties..."
                                    value={jobDescription}
                                    onChange={e => setJobDescription(e.target.value)}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Resume / Experience Context</label>
                                <textarea
                                    className="input min-h-[80px]"
                                    placeholder="Paste relevant experience or resume summary..."
                                    value={resumeContext}
                                    onChange={e => setResumeContext(e.target.value)}
                                />
                                <p className="text-[10px] text-color-text-tertiary mt-1 italic">
                                    We use this only to ground the answer in facts. It is not stored.
                                </p>
                            </div>

                            {personas.length > 0 && (
                                <div className="input-group">
                                    <label className="input-label">Persona</label>
                                    <select
                                        className="input"
                                        value={selectedPersonaId}
                                        onChange={e => setSelectedPersonaId(e.target.value)}
                                    >
                                        <option value="">Default Profile</option>
                                        {personas.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="tone-group">
                        <label className="section-label">Tone / Mode</label>
                        {renderModeSelector()}
                    </div>

                    {error && (
                        <div className="alert alert--error">
                            {error}
                        </div>
                    )}

                    <Button
                        type="button"
                        variant="primary"
                        size="lg"
                        className="apply-cta"
                        onClick={() => handleDraft()}
                        disabled={!question.trim()}
                    >
                        Draft Answer
                    </Button>
                </section>

                <aside className="apply-preview">
                    {loading ? (
                        <div className="flex h-full items-center justify-center">
                            <LoadingSpinner message="Drafting your answer..." />
                        </div>
                    ) : (
                        <div className="preview-empty">
                            <p>Your draft will appear here</p>
                        </div>
                    )}
                </aside>
            </div>
        </main>
    )
}
