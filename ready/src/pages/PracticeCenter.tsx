/**
 * Practice Center - Ready App
 * 
 * Standalone practice sessions for interview preparation.
 * Routes: /practice
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/ui/Icon'
import { Container } from '../components/shared/Container'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import type { PracticePrepRow, PracticeSession } from '../shared/types'
import '../styles/practice.css'

export default function PracticeCenter() {
    const { user } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const [preps, setPreps] = useState<PracticePrepRow[]>([])
    const [sessions, setSessions] = useState<PracticeSession[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)

    // New Prep Form State
    const [position, setPosition] = useState('')
    const [company, setCompany] = useState('')
    const [focusArea, setFocusArea] = useState('')

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
                .from('practice_preps')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (prepError) throw prepError
            setPreps(prepData as any[])

            // 2. Fetch Practice History
            const { data: sessionData, error: sessionError } = await supabase
                .from('practice_sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (sessionError) throw sessionError
            setSessions(sessionData as any[])

        } catch (err) {
            console.error('Failed to fetch practice data', err)
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
                body: JSON.stringify({ 
                    position, 
                    company: company || 'General Practice',
                    focusArea 
                })
            })

            if (!response.ok) throw new Error('Failed to generate prep')

            const result = await response.json()
            navigate(`/practice/${result.data.prep.id}`)
        } catch (err) {
            console.error(err)
            showToast('Error creating practice session. Please try again.', 'error')
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <div className="practice-center">
            <Container maxWidth="lg" padding="md">
                <header className="practice-center__header">
                    <h1>Practice Center</h1>
                    <p className="practice-center__subtitle">
                        Build confidence through practice. Get AI-powered feedback on your responses and refine your interview skills.
                    </p>
                </header>

                <div className="practice-center__grid">
                    <section className="practice-center__form-section">
                        <article className="surface-card practice-form">
                            <h3>Start New Practice Session</h3>
                            <form onSubmit={handleCreatePrep}>
                                <div className="input-group">
                                    <label>Target Role</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Product Manager, Software Engineer"
                                        value={position}
                                        onChange={e => setPosition(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Company (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Google, or leave blank for general practice"
                                        value={company}
                                        onChange={e => setCompany(e.target.value)}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Focus Area (Optional)</label>
                                    <textarea
                                        placeholder="What would you like to practice? e.g. behavioral questions, technical skills, leadership scenarios..."
                                        rows={3}
                                        value={focusArea}
                                        onChange={e => setFocusArea(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" variant="primary" disabled={isCreating}>
                                    {isCreating ? 'Generating Questions...' : 'Start Practice'}
                                </Button>
                            </form>
                        </article>
                    </section>

                    <section className="practice-center__templates">
                        <div className="section-header">
                            <h3>Your Practice Templates</h3>
                        </div>

                        {loading ? (
                            <div className="loading-state">Loading templates...</div>
                        ) : preps.length === 0 ? (
                            <>
                                <p>No practice templates yet.</p>
                                <p>Use the form to generate your first practice session.</p>
                            </>
                        ) : (
                            <div className="prep-list">
                                {preps.map(prep => (
                                    <article key={prep.id} className="prep-item" onClick={() => navigate(`/practice/${prep.id}`)}>
                                        <div className="prep-item__content">
                                            <h4>{prep.position}</h4>
                                            <p>{prep.company || 'General Practice'}</p>
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

                <section className="practice-center__history">
                    <div className="section-header">
                        <h3>Practice History</h3>
                    </div>

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
                                const prepTemplate = preps.find(p => p.id === session.practice_prep_id)
                                const avgScore = session.practice_data.length > 0
                                    ? Math.round(session.practice_data.reduce((acc, curr) => acc + curr.score, 0) / session.practice_data.length)
                                    : 0

                                return (
                                    <article key={session.id} className="session-card surface-card">
                                        <div className="session-card__header">
                                            <div className="session-info">
                                                <h4>{prepTemplate?.position || 'Practice Session'}</h4>
                                                <p>{prepTemplate?.company || 'General'}</p>
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
