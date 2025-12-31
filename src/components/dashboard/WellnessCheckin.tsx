
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
        return (
            <div className="card card--job-listing">
                <h3 className="card-title text-sm mb-4">How you're feeling</h3>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center">
                        <Icon name="check" size="sm" />
                    </div>
                    <p className="text-xs text-secondary">Check-in captured for today.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="card card--job-listing">
            <div className="flex items-start justify-between mb-2">
                <h3 className="card-title text-sm">Wellness Check-in</h3>
                <Icon name="stars" size="sm" className="text-accent" />
            </div>
            <p className="text-xs text-secondary mb-4 leading-relaxed">
                Refining your experience based on today's focus.
            </p>

            <div className="flex flex-col gap-3">
                <button
                    onClick={() => {
                        setSelectedScore(5);
                        saveCheckin(5, "Quick check-in");
                        setSubmitted(true);
                    }}
                    className="btn btn--primary w-full text-xs py-2"
                >
                    Capture daily reflection
                </button>
                <p className="text-[10px] text-secondary/60 text-center italic">
                    Adjusts dashboard pace to your energy.
                </p>
            </div>
        </div>
    )
}
