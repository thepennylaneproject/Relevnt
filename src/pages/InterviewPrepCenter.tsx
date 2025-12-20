
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/ui/Icon'
import { Container } from '../components/shared/Container'
import type { InterviewPrepRow } from '../shared/types'
import '../styles/interview-prep.css'

export default function InterviewPrepCenter() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [preps, setPreps] = useState<InterviewPrepRow[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)

    // New Prep Form State
    const [position, setPosition] = useState('')
    const [company, setCompany] = useState('')
    const [jobDescription, setJobDescription] = useState('')

    useEffect(() => {
        if (user) fetchPreps()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])

    const fetchPreps = async () => {
        if (!user?.id) return
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('interview_prep')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            if (data) setPreps(data as any[])
        } catch (err) {
            console.error('Failed to fetch interview preps', err)
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
            alert('Error creating interview prep. Please try again.')
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <div className="interview-prep-center">
            <Container maxWidth="lg" padding="md">
                <header className="prep-center__header">
                    <div className="prep-center__title-badge">
                        <Icon name="microphone" size="sm" hideAccent />
                        <span>Career Coaching</span>
                    </div>
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

                    <section className="prep-center__history">
                        <div className="history-header">
                            <h3>Recent Sessions</h3>
                        </div>

                        {loading ? (
                            <div className="loading-state">Loading your sessions...</div>
                        ) : preps.length === 0 ? (
                            <div className="empty-state">
                                <Icon name="compass" size="lg" />
                                <p>Your previous prep sessions will appear here.</p>
                            </div>
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
            </Container>
        </div>
    )
}
