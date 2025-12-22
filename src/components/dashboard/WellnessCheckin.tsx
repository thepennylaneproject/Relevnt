
import React, { useState } from 'react'
import { useWellnessCheckin } from '../../hooks/useWellnessCheckin'
import { Icon } from '../ui/Icon'

const MOODS = [
    { score: 1, label: 'Exhausted', emoji: '😫' },
    { score: 3, label: 'Stressed', emoji: '😰' },
    { score: 5, label: 'Neutral', emoji: '😐' },
    { score: 7, label: 'Motivated', emoji: '💪' },
    { score: 10, label: 'Confident', emoji: '🚀' },
]

const MOOD_TIPS: Record<number, { tip: string; quote: string }> = {
    1: {
        tip: "It's okay to take it slow today. Even small progress counts.",
        quote: "Rest if you must, but don't quit."
    },
    3: {
        tip: "Consider focusing on just one task. You don't have to do it all today.",
        quote: "Searching is a marathon, not a sprint."
    },
    5: {
        tip: "Steady wins the race. Keep moving forward at your pace.",
        quote: "Consistency beats intensity over time."
    },
    7: {
        tip: "Great energy! This is a good day to tackle that challenging application.",
        quote: "Momentum is your friend — ride it."
    },
    10: {
        tip: "You're in the zone. Consider reaching out directly to hiring managers.",
        quote: "Confidence opens doors. Keep going."
    },
}

export function WellnessCheckin() {
    const { checkins, saveCheckin, loading } = useWellnessCheckin()
    const [selectedScore, setSelectedScore] = useState<number | null>(null)
    const [note, setNote] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [saving, setSaving] = useState(false)

    const hasCheckedInToday = checkins.some(c => {
        const today = new Date().toISOString().split('T')[0]
        return c.created_at.split('T')[0] === today
    })

    const handleSubmit = async () => {
        if (selectedScore === null) return
        setSaving(true)
        try {
            await saveCheckin(selectedScore, note)
            setSubmitted(true)
        } catch (err) {
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return null

    if (hasCheckedInToday || submitted) {
        const todayCheckin = checkins.find(c => {
            const today = new Date().toISOString().split('T')[0]
            return c.created_at.split('T')[0] === today
        })
        const score = submitted ? selectedScore : todayCheckin?.mood_score
        const moodData = MOOD_TIPS[score as number] || MOOD_TIPS[5]

        return (
            <div className="sidebar-card">
                <h3 className="sidebar-card-title">How you're feeling</h3>
                <div className="wellness-complete">
                    <div className="wellness-complete-icon">
                        <Icon name="check" size="sm" />
                    </div>
                    <p className="text-xs muted">Check-in captured for today.</p>
                </div>
                <p className="wellness-quote">"{moodData.quote}"</p>
            </div>
        )
    }

    const selectedMoodData = selectedScore !== null ? MOOD_TIPS[selectedScore] : null

    return (
        <div className="sidebar-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                <h3 className="sidebar-card-title">How are you feeling today?</h3>
                <div style={{ position: 'relative', group: 'hover' }}>
                    <Icon name="question" size="sm" style={{ cursor: 'help', color: 'var(--text-secondary)' }} title="Your mood helps us adjust your dashboard pace and tone. Gentle mode reduces pressure when you need it." />
                </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.4 }}>
                Your mood helps us adjust your dashboard. Gentle mode reduces pressure when needed.
            </p>

            <div className="mood-selector">
                {MOODS.map((m) => (
                    <button
                        key={m.score}
                        onClick={() => setSelectedScore(m.score)}
                        className={`mood-pill ${selectedScore === m.score ? 'is-selected' : ''}`}
                    >
                        <span className="mood-emoji">{m.emoji}</span>
                        <span className="mood-label">{m.label}</span>
                    </button>
                ))}
            </div>

            {selectedMoodData && (
                <div className="mood-tip animate-in fade-in slide-in-from-top-2">
                    <strong>Tip:</strong> {selectedMoodData.tip}
                </div>
            )}

            {selectedScore !== null && (
                <div className="animate-in fade-in slide-in-from-top-2">
                    <textarea
                        className="rl-textarea text-xs p-2 mb-3 h-16 w-full"
                        placeholder="Any reflections? (Optional)"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="primary-button w-full text-xs py-2"
                    >
                        {saving ? 'Saving...' : 'Save check-in'}
                    </button>
                </div>
            )}
        </div>
    )
}
