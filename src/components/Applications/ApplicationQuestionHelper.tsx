
import React, { useState } from 'react'
import { Icon } from '../ui/Icon'
import { Button } from '../ui/Button'
import { LoadingSpinner } from '../ui/Phase5UI'
import { analytics } from '../../lib/analytics'
import { usePersonas } from '../../hooks/usePersonas'
import { supabase } from '../../lib/supabase'

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

const MODES: { value: HelperMode; label: string; icon: string }[] = [
    { value: 'default', label: 'Standard', icon: 'check-circle' },
    { value: 'concise', label: 'Concise', icon: 'scissors' },
    { value: 'confident', label: 'Confident', icon: 'lightning' },
    { value: 'metrics', label: 'Metrics', icon: 'chart-bar' },
    { value: 'values', label: 'Values', icon: 'heart' },
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
        <div className={`flex flex-wrap gap-2 ${mini ? 'mb-4' : 'mb-6'}`}>
            {MODES.map((m) => (
                <button
                    key={m.value}
                    type="button"
                    onClick={() => !loading && handleDraft(m.value)}
                    className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                        ${m.value === selectedMode && !mini
                            ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                        }
                    `}
                >
                    <Icon name={m.icon as any} size="xs" />
                    {mini ? `Rewrite: ${m.label}` : m.label}
                </button>
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
                            <Icon name="copy" size="sm" className="mr-2" />
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
                    <p className="text-xs font-semibold muted mb-3 uppercase tracking-wider">Quick Rewrite</p>
                    {renderModeSelector(true)}
                </div>
            </div>
        )
    }

    return (
        <div className="surface-card">
            <header className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                    <Icon name="sparkles" className="text-blue-500" />
                    <h2 className="text-lg font-semibold">Application Question Helper</h2>
                </div>
                <p className="text-sm muted">
                    Paste a question from an application, add some context, and get a tailored draft based on your experience.
                </p>
            </header>

            <div className="space-y-4">
                <div>
                    <label htmlFor="question" className="block text-sm font-medium mb-1.5">
                        Question from application
                    </label>
                    <textarea
                        id="question"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="e.g., 'Describe a time you failed and what you learned from it.'"
                        className="input w-full min-h-[100px] resize-y"
                    />
                </div>

                {/* Context Accordion */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setContextOpen(!contextOpen)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <span className="text-sm font-medium flex items-center gap-2">
                            <Icon name="briefcase" size="sm" />
                            Add Context (Optional)
                        </span>
                        <Icon name={contextOpen ? 'chevron-up' : 'chevron-down'} size="sm" />
                    </button>

                    {contextOpen && (
                        <div className="p-4 space-y-4 bg-white dark:bg-gray-900">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold muted mb-1 block">Target Role</label>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        placeholder="e.g. Senior Product Designer"
                                        value={roleTitle}
                                        onChange={e => setRoleTitle(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold muted mb-1 block">Company</label>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        placeholder="e.g. Acme Corp"
                                        value={companyName}
                                        onChange={e => setCompanyName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold muted mb-1 block">Job Description Excerpt</label>
                                <textarea
                                    className="input w-full min-h-[80px]"
                                    placeholder="Paste key requirements or duties..."
                                    value={jobDescription}
                                    onChange={e => setJobDescription(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold muted mb-1 block">Resume / Experience Context</label>
                                <textarea
                                    className="input w-full min-h-[80px]"
                                    placeholder="Paste relevant experience or resume summary..."
                                    value={resumeContext}
                                    onChange={e => setResumeContext(e.target.value)}
                                />
                                <p className="text-[10px] muted mt-1">
                                    We use this only to ground the answer in facts. It is not stored.
                                </p>
                            </div>

                            {personas.length > 0 && (
                                <div>
                                    <label className="text-xs font-semibold muted mb-1 block">Persona</label>
                                    <select
                                        className="input w-full"
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
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium">Tone / Mode</label>
                    {renderModeSelector()}
                </div>

                {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                        {error}
                    </div>
                )}

                <Button
                    variant="primary"
                    fullWidth
                    onClick={() => handleDraft()}
                    disabled={!question.trim()}
                >
                    Draft Answer
                </Button>
            </div>
        </div>
    )
}
