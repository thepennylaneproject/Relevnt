
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/ui/Icon'
import { CollectionEmptyGuard } from '../components/ui/CollectionEmptyGuard'
import { Container } from '../components/shared/Container'
import { useToast } from '../components/ui/Toast'
import type { InterviewPrepRow, InterviewPracticeSession } from '../shared/types'
import '../styles/interview-prep.css'

export default function InterviewPrepCenter() {
    const { user } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const [preps, setPreps] = useState<InterviewPrepRow[]>([])
    const [sessions, setSessions] = useState<InterviewPracticeSession[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)

    // New Prep Form State
    const [position, setPosition] = useState('')
    const [company, setCompany] = useState('')
    const [jobDescription, setJobDescription] = useState('')

    useEffect(() => {
        if (user) fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])

    const fetchData = async () => {
        if (!user?.id) return
        setLoading(true)
        try {
            // 1. Fetch Prep Templates
            const { data: prepData, error: prepError } = await supabase
                .from('interview_prep')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (prepError) throw prepError
            setPreps(prepData as any[])

            // 2. Fetch Practice History
            const { data: sessionData, error: sessionError } = await supabase
                .from('interview_practice_sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (sessionError) throw sessionError
            setSessions(sessionData as any[])

        } catch (err) {
            console.error('Failed to fetch interview data', err)
        } finally {
            setLoading(false)
        }
    }

    const handleCreatePrep = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user?.id) return
        setIsCreating(true)

        try {
            const { data: { session } } = await supabase.auth.getSession()
            const response = await fetch('/.netlify/functions/interview_prepare', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ position, company, jobDescription })
            })

            if (!response.ok) throw new Error('Failed to generate prep')

            const result = await response.json()
            navigate(`/interview-practice/${result.data.prep.id}`)
        } catch (err) {
            console.error(err)
            showToast('Error creating interview prep. Please try again.', 'error')
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <div className="interview-prep-center">
            <Container maxWidth="lg" padding="md">
                <header className="prep-center__header">
                    <h1>Interview Prep Center</h1>
                    <p className="prep-center__subtitle">
                        Generate tailored practice sessions for any role. Refine your answers with AI-driven feedback based on your unique professional voice.
                    </p>
                </header>

                <div className="prep-center__grid">
                    <section className="prep-center__form-section">
                        <article className="surface-card prep-form">
                            <h3>Start New Prep Session</h3>
                            <form onSubmit={handleCreatePrep}>
                                <div className="input-group">
                                    <label>Target Position</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Senior Software Engineer"
                                        value={position}
                                        onChange={e => setPosition(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Company</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Google"
                                        value={company}
                                        onChange={e => setCompany(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Job Description (Optional)</label>
                                    <textarea
                                        placeholder="Paste the key requirements here for better tailored questions..."
                                        rows={4}
                                        value={jobDescription}
                                        onChange={e => setJobDescription(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className="primary-button" disabled={isCreating}>
                                    {isCreating ? 'Generating Session...' : 'Prepare my Interview'}
                                </button>
                            </form>
                        </article>
                    </section>

                    <section className="prep-center__templates">
                        <div className="section-header">
                            <h3>Your Prep Templates</h3>
                        </div>

                        {/* DEV: Validate empty state compliance */}
                        <CollectionEmptyGuard
                            itemsCount={preps.length}
                            hasEmptyState={true}
                            scopeId="interview-prep-templates"
                            expectedAction="Use form to generate first template"
                        />

                        {loading ? (
                            <div className="loading-state">Loading templates...</div>
                        ) : preps.length === 0 ? (
                            <>
                                <p>No prep templates yet.</p>
                                <p>Use the form to generate your first interview prep session.</p>
                            </>
                        ) : (
                            <div className="prep-list">
                                {preps.map(prep => (
                                    <article key={prep.id} className="prep-item" onClick={() => navigate(`/interview-practice/${prep.id}`)}>
                                        <div className="prep-item__content">
                                            <h4>{prep.position}</h4>
                                            <p>{prep.company}</p>
                                        </div>
                                        <div className="prep-item__meta">
                                            <span className="q-count">{prep.questions?.length || 0} Questions</span>
                                            <Icon name="paper-airplane" size="sm" />
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <section className="prep-center__history">
                    <div className="section-header">
                        <h3>Practice History</h3>
                    </div>

                    {/* DEV: Validate empty state compliance */}
                    <CollectionEmptyGuard
                        itemsCount={sessions.length}
                        hasEmptyState={true}
                        scopeId="interview-practice-history"
                        expectedAction="Complete a practice session"
                    />

                    {loading ? (
                        <div className="loading-state">Loading history...</div>
                    ) : sessions.length === 0 ? (
                        <>
                            <p>No practice sessions yet.</p>
                            <p>Once you complete a practice run, your history and scores will appear here.</p>
                        </>
                    ) : (
                        <div className="history-grid">
                            {sessions.map(session => {
                                const prepTemplate = preps.find(p => p.id === session.interview_prep_id)
                                const avgScore = session.practice_data.length > 0
                                    ? Math.round(session.practice_data.reduce((acc, curr) => acc + curr.score, 0) / session.practice_data.length)
                                    : 0

                                return (
                                    <article key={session.id} className="session-card surface-card">
                                        <div className="session-card__header">
                                            <div className="session-info">
                                                <h4>{prepTemplate?.position || 'Interview Practice'}</h4>
                                                <p>{prepTemplate?.company || 'Mock session'}</p>
                                            </div>
                                            <div className="session-score">
                                                <span className="score-val">{avgScore}</span>
                                                <span className="score-label">Avg. Score</span>
                                            </div>
                                        </div>
                                        <div className="session-card__footer">
                                            <span className="session-date">
                                                {new Date(session.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="session-stats">
                                                {session.practice_data.length} / {session.questions?.length || 0} Answered
                                            </span>
                                        </div>
                                    </article>
                                )
                            })}
                        </div>
                    )}
                </section>
            </Container>
        </div>
    )
}
