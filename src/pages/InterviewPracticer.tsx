
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Icon } from '../components/ui/Icon'
import { Container } from '../components/shared/Container'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ui/Toast'
import { useInterviewPrep } from '../hooks/useInterviewPrep'
import type { InterviewPrepRow, InterviewQuestion } from '../shared/types'
import '../styles/interview-prep.css'

export default function InterviewPracticer() {
    const { id } = useParams<{ id: string }>()
    const { user } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()
    const { currentSession, startSession, recordAnswer, completeSession, loading: sessionLoading } = useInterviewPrep()

    const [prep, setPrep] = useState<InterviewPrepRow | null>(null)
    const [prepLoading, setPrepLoading] = useState(true)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

    // Evaluation state
    const [userAnswer, setUserAnswer] = useState('')
    const [isEvaluating, setIsEvaluating] = useState(false)
    const [evaluation, setEvaluation] = useState<any>(null)

    useEffect(() => {
        if (id && user) fetchPrepAndStartSession()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, user])

    const fetchPrepAndStartSession = async () => {
        if (!id || !user?.id) return
        setPrepLoading(true)
        try {
            // 1. Fetch Prep Questions
            const { data, error } = await supabase
                .from('interview_prep')
                .select('*')
                .eq('id', id)
                .eq('user_id', user.id)
                .single()

            if (error) throw error
            if (data) {
                setPrep(data as any)
                // 2. Start a new session if one doesn't exist for this practice run
                // For now, we always start a fresh session when entering from the center
                await startSession(
                    (data.questions as any) as InterviewQuestion[],
                    data.id,
                    undefined, // No job_id on this row
                    data.application_id || undefined
                )
            }
        } catch (err) {
            console.error(err)
            showToast('Failed to load interview prep.', 'error')
        } finally {
            setPrepLoading(false)
        }
    }

    const handleEvaluate = async () => {
        if (!userAnswer.trim() || !user || !currentSession) return
        setIsEvaluating(true)
        setEvaluation(null)

        try {
            const { data: { session: authSession } } = await supabase.auth.getSession()
            const question = prep?.questions[currentQuestionIndex]

            const response = await fetch('/.netlify/functions/interview_evaluate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authSession?.access_token}`
                },
                body: JSON.stringify({
                    question: question?.text,
                    userAnswer,
                    position: prep?.position,
                    company: prep?.company,
                    interview_prep_id: prep?.id
                })
            })

            if (!response.ok) throw new Error('Evaluation failed')

            const result = await response.json()
            const evalData = result.data.evaluation
            setEvaluation(evalData)

            // Persistence: Record this answer in our session
            await recordAnswer(
                question?.text || '',
                userAnswer,
                evalData,
                evalData.score
            )

        } catch (err) {
            console.error(err)
            showToast('Error evaluating answer. Please try again.', 'error')
        } finally {
            setIsEvaluating(false)
        }
    }

    const nextQuestion = () => {
        setEvaluation(null)
        setUserAnswer('')
        setCurrentQuestionIndex(prev => prev + 1)
    }

    const handleFinish = async () => {
        await completeSession()
        navigate('/interview-prep')
        showToast('Practice session saved successfully!', 'success')
    }

    if (prepLoading || sessionLoading) return <div className="loading-screen">Preparing Practice Environment...</div>
    if (!prep || !currentSession) return <div className="error-screen">Session not found</div>

    const question = prep.questions[currentQuestionIndex]
    const isLast = currentQuestionIndex === prep.questions.length - 1

    return (
        <div className="interview-practicer">
            <Container maxWidth="md" padding="md">
                <header className="practicer-header">
                    <button className="back-link" onClick={() => navigate('/interview-prep')}>
                        <Icon name="compass" size="sm" /> Back to Center
                    </button>
                    <div className="practicer-progress">
                        Question {currentQuestionIndex + 1} of {prep.questions.length}
                    </div>
                </header>

                <main className="practicer-main">
                    <section className="question-card surface-card">
                        <h2>{question.text}</h2>
                        <div className="talking-points-hint">
                            <Icon name="stars" size="sm" />
                            <p>Tip: Focus on your {question.talking_points?.[0] || 'unique value'}</p>
                        </div>
                    </section>

                    <section className="answer-section">
                        <textarea
                            className="answer-input"
                            placeholder="Frame your answer here. Imagine you're speaking to the interviewer..."
                            value={userAnswer}
                            onChange={e => setUserAnswer(e.target.value)}
                            disabled={isEvaluating || !!evaluation}
                            rows={6}
                        />

                        {!evaluation && (
                            <div className="action-row">
                                <button
                                    className="primary-button"
                                    onClick={handleEvaluate}
                                    disabled={isEvaluating || !userAnswer.trim()}
                                >
                                    {isEvaluating ? 'AI is analyzing...' : 'Get Feedback'}
                                </button>
                            </div>
                        )}
                    </section>

                    {evaluation && (
                        <section className="feedback-section animate-in fade-in slide-in-from-bottom-4">
                            <div className="feedback-header">
                                <div className="score-ring">
                                    <span className="score-val">{evaluation.score}</span>
                                    <span className="score-max">/10</span>
                                </div>
                                <div className="feedback-summary">
                                    <h3>AI Feedback</h3>
                                    <p>{evaluation.feedback}</p>
                                </div>
                            </div>

                            <div className="feedback-grid">
                                <div className="feedback-cols">
                                    <div className="feedback-col">
                                        <h4><Icon name="check" size="sm" /> Strengths</h4>
                                        <ul>
                                            {evaluation.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                        </ul>
                                    </div>
                                    <div className="feedback-col">
                                        <h4><Icon name="stars" size="sm" /> Improvements</h4>
                                        <ul>
                                            {evaluation.areas_to_improve.map((im: string, i: number) => <li key={i}>{im}</li>)}
                                        </ul>
                                    </div>
                                </div>

                                {evaluation.suggested_better_answer && (
                                    <div className="suggested-answer">
                                        <h4>Suggested Refinement</h4>
                                        <p>{evaluation.suggested_better_answer}</p>
                                    </div>
                                )}
                            </div>

                            <div className="action-row">
                                {!isLast ? (
                                    <button className="primary-button" onClick={nextQuestion}>
                                        Next Question <Icon name="paper-airplane" size="sm" />
                                    </button>
                                ) : (
                                    <button className="secondary-button" onClick={handleFinish}>
                                        Finish & Save Session
                                    </button>
                                )}
                            </div>
                        </section>
                    )}
                </main>
            </Container>
        </div>
    )
}
