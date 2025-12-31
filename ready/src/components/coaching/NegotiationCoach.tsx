/**
 * NegotiationCoach - Ready App
 * 
 * Standalone salary negotiation coaching.
 * Persists to negotiation_sessions table.
 */

import React, { useState, useEffect } from 'react'
import { useAITask } from '../../hooks/useAITask'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../ui/Toast'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { supabase } from '../../lib/supabase'

interface NegotiationSession {
    id: string
    user_id: string
    job_title: string
    company: string
    offer_salary: number
    target_min: number
    target_max: number
    strategy: string
    responses: string[]
    created_at: string
    updated_at: string
}

interface NegotiationCoachProps {
    onComplete?: (session: NegotiationSession) => void
}

export function NegotiationCoach({ onComplete }: NegotiationCoachProps) {
    const { user } = useAuth()
    const { showToast } = useToast()
    const { execute: runAI, loading: aiLoading } = useAITask()

    // Form state
    const [jobTitle, setJobTitle] = useState('')
    const [company, setCompany] = useState('')
    const [offerSalary, setOfferSalary] = useState(0)
    const [targetMin, setTargetMin] = useState(0)
    const [targetMax, setTargetMax] = useState(0)

    // Results state
    const [strategy, setStrategy] = useState('')
    const [responses, setResponses] = useState<string[]>([])
    const [currentSession, setCurrentSession] = useState<NegotiationSession | null>(null)
    const [previousSessions, setPreviousSessions] = useState<NegotiationSession[]>([])

    useEffect(() => {
        if (user) {
            fetchPreviousSessions()
        }
    }, [user])

    const fetchPreviousSessions = async () => {
        if (!user?.id) return
        
        try {
            const { data } = await supabase
                .from('negotiation_sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5)

            if (data) {
                setPreviousSessions(data as any[])
            }
        } catch (err) {
            console.warn('No previous sessions found')
        }
    }

    const handleGenerateStrategy = async () => {
        if (!jobTitle || !offerSalary) {
            showToast('Please enter job title and offer salary', 'error')
            return
        }

        try {
            const result = await runAI('salary-negotiation', {
                jobTitle,
                company,
                offerSalary,
                targetMin,
                targetMax
            })

            if (result.success && result.data) {
                const data = result.data as any
                setStrategy(data.strategy || '')
                setResponses(data.responses || [])

                // Save to database
                if (user?.id) {
                    const { data: savedSession, error } = await supabase
                        .from('negotiation_sessions')
                        .insert({
                            user_id: user.id,
                            job_title: jobTitle,
                            company: company,
                            offer_salary: offerSalary,
                            target_min: targetMin,
                            target_max: targetMax,
                            strategy: data.strategy || '',
                            responses: data.responses || []
                        })
                        .select()
                        .single()

                    if (!error && savedSession) {
                        setCurrentSession(savedSession as any)
                        onComplete?.(savedSession as any)
                        fetchPreviousSessions()
                    }
                }
            }
        } catch (err) {
            console.error('Failed to generate strategy:', err)
            showToast('Failed to generate strategy', 'error')
        }
    }

    const handleLoadSession = (session: NegotiationSession) => {
        setJobTitle(session.job_title)
        setCompany(session.company)
        setOfferSalary(session.offer_salary)
        setTargetMin(session.target_min)
        setTargetMax(session.target_max)
        setStrategy(session.strategy)
        setResponses(session.responses)
        setCurrentSession(session)
    }

    const handleReset = () => {
        setJobTitle('')
        setCompany('')
        setOfferSalary(0)
        setTargetMin(0)
        setTargetMax(0)
        setStrategy('')
        setResponses([])
        setCurrentSession(null)
    }

    return (
        <div className="negotiation-coach surface-card p-6 rounded-xl">
            <div className="coach-header">
                <div className="header-content">
                    <Icon name="lighthouse" size="md" />
                    <div>
                        <h3 className="text-lg font-bold">Negotiation Coach</h3>
                        <p className="text-sm text-muted">Get AI-powered strategies and scripts for salary negotiation</p>
                    </div>
                </div>
                {strategy && (
                    <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
                        New Negotiation
                    </Button>
                )}
            </div>

            {!strategy && (
                <div className="coach-form">
                    <div className="form-row">
                        <div className="input-group">
                            <label>Job Title</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. Senior Software Engineer"
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                            />
                        </div>
                        <div className="input-group">
                            <label>Company</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. Stripe"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label>Their Offer ($)</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="e.g. 150000"
                                value={offerSalary || ''}
                                onChange={(e) => setOfferSalary(Number(e.target.value))}
                            />
                        </div>
                        <div className="input-group">
                            <label>Your Target Min ($)</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="e.g. 165000"
                                value={targetMin || ''}
                                onChange={(e) => setTargetMin(Number(e.target.value))}
                            />
                        </div>
                        <div className="input-group">
                            <label>Your Target Max ($)</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="e.g. 180000"
                                value={targetMax || ''}
                                onChange={(e) => setTargetMax(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="primary"
                        className="mt-4 w-full"
                        onClick={handleGenerateStrategy}
                        disabled={aiLoading || !jobTitle || !offerSalary}
                    >
                        {aiLoading ? 'Generating Strategy...' : 'Generate Negotiation Strategy'}
                    </Button>
                </div>
            )}

            {strategy && (
                <div className="coach-results">
                    <div className="strategy-section">
                        <label className="section-label">Strategic Approach</label>
                        <div className="strategy-box">
                            {strategy}
                        </div>
                    </div>

                    {responses.length > 0 && (
                        <div className="responses-section">
                            <label className="section-label">Negotiation Scripts</label>
                            <div className="responses-list">
                                {responses.map((res, i) => (
                                    <div key={i} className="response-item">
                                        <span className="response-number">{i + 1}</span>
                                        <p>"{res}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {previousSessions.length > 0 && !strategy && (
                <div className="previous-sessions">
                    <label className="section-label">Previous Sessions</label>
                    <div className="sessions-list">
                        {previousSessions.map((session) => (
                            <button
                                key={session.id}
                                className="session-item"
                                onClick={() => handleLoadSession(session)}
                            >
                                <div className="session-info">
                                    <span className="session-title">{session.job_title}</span>
                                    <span className="session-company">{session.company}</span>
                                </div>
                                <span className="session-date">
                                    {new Date(session.created_at).toLocaleDateString()}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <style>{negotiationCoachStyles}</style>
        </div>
    )
}

const negotiationCoachStyles = `
.negotiation-coach {
  border: 1px solid var(--border-subtle);
}

.coach-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.header-content {
  display: flex;
  gap: 1rem;
}

.coach-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.input-group label {
  display: block;
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text);
  font-size: 0.875rem;
}

.coach-results {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-label {
  display: block;
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--color-accent);
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.strategy-box {
  padding: 1rem;
  background: var(--surface);
  border: 1px solid var(--color-accent);
  border-left-width: 4px;
  border-radius: var(--radius-md);
  font-size: 0.9375rem;
  line-height: 1.6;
}

.responses-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.response-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-style: italic;
}

.response-number {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-accent);
  color: var(--bg);
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  font-style: normal;
}

.response-item p {
  margin: 0;
  line-height: 1.5;
}

.previous-sessions {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-subtle);
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.session-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color 0.2s;
  text-align: left;
  width: 100%;
}

.session-item:hover {
  border-color: var(--color-accent);
}

.session-info {
  display: flex;
  flex-direction: column;
}

.session-title {
  font-weight: 600;
  font-size: 0.875rem;
}

.session-company {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.session-date {
  font-size: 0.75rem;
  color: var(--text-secondary);
}
`;
