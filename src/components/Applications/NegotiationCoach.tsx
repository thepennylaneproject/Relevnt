import React, { useState } from 'react'
import { Icon } from '../ui/Icon'
import { PoeticVerseMinimal } from '../ui/PoeticVerse'
import { getPoeticVerse } from '../../lib/poeticMoments'
import { useAITask } from '../../hooks/useAITask'
import { useApplications, type Application } from '../../hooks/useApplications'

interface NegotiationCoachProps {
    application: Application
}

export function NegotiationCoach({ application }: NegotiationCoachProps) {
    const { updateApplication } = useApplications()
    const { execute: runAI, loading: aiLoading } = useAITask()

    const [targetMin, setTargetMin] = useState(application.target_salary_min || 0)
    const [targetMax, setTargetMax] = useState(application.target_salary_max || 0)
    const [offerDetails, setOfferDetails] = useState(application.offer_details || { salary: 0, bonus: 0, equity: '' })

    const [strategy, setStrategy] = useState(application.negotiation_strategy || '')
    const [responses, setResponses] = useState<string[]>(JSON.parse(application.negotiation_notes || '[]'))

    const handleGenerateStrategy = async () => {
        try {
            const result = await runAI('salary-negotiation', {
                jobTitle: application.position,
                company: application.company,
                offerSalary: offerDetails.salary,
                targetMin: targetMin,
                targetMax: targetMax,
                marketData: application.job // Using linked job data if available
            })

            if (result.success && result.data) {
                const data = (result as any).data
                setStrategy(data.strategy)
                setResponses(data.responses)

                // Persist to DB
                await updateApplication(application.id, {
                    negotiation_strategy: data.strategy,
                    negotiation_notes: JSON.stringify(data.responses),
                    target_salary_min: targetMin,
                    target_salary_max: targetMax,
                    offer_details: offerDetails
                })
            }
        } catch (err) {
            console.error('Failed to generate strategy:', err)
        }
    }

    const handleSaveDraft = async () => {
        await updateApplication(application.id, {
            negotiation_strategy: strategy,
            negotiation_notes: JSON.stringify(responses),
            target_salary_min: targetMin,
            target_salary_max: targetMax,
            offer_details: offerDetails
        })
    }

    return (
        <div className="negotiation-coach space-y-6 p-4 surface-accent rounded-xl">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold flex items-center gap-2">
                    <Icon name="lighthouse" size="sm" />
                    Negotiation Coach
                </h3>
                <button
                    onClick={handleGenerateStrategy}
                    disabled={aiLoading}
                    className="primary-button button-xs"
                >
                    {aiLoading ? 'Thinking...' : 'Generate strategy'}
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold muted">Target Range (Min)</label>
                    <input
                        type="number"
                        value={targetMin}
                        onChange={(e) => setTargetMin(Number(e.target.value))}
                        className="rl-input w-full text-xs"
                        placeholder="Min salary"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold muted">Target Range (Max)</label>
                    <input
                        type="number"
                        value={targetMax}
                        onChange={(e) => setTargetMax(Number(e.target.value))}
                        className="rl-input w-full text-xs"
                        placeholder="Max salary"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-bold muted">Current Offer Base</label>
                <input
                    type="number"
                    value={offerDetails.salary}
                    onChange={(e) => setOfferDetails({ ...offerDetails, salary: Number(e.target.value) })}
                    className="rl-input w-full text-xs font-bold"
                    placeholder="Enter base salary offered"
                />
            </div>

            {strategy && (
                <div className="space-y-4 animate-in fade-in duration-500">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-accent">Strategic Approach</label>
                        <div className="p-3 surface-card rounded-lg text-xs leading-relaxed border border-accent/20">
                            {strategy}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-accent">Rebuttal Scripts</label>
                        <div className="space-y-2">
                            {responses.map((res, i) => (
                                <div key={i} className="p-3 surface-card rounded-lg text-xs italic border-l-2 border-accent">
                                    "{res}"
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Poetic moment: Offer negotiation */}
                    <div className="pt-3 border-t border-accent/10">
                        <p className="text-[10px] font-bold text-muted mb-2">The road you take</p>
                        <PoeticVerseMinimal verse={getPoeticVerse('offer-negotiation')} />
                    </div>
                </div>
            )}

            <div className="pt-2 flex justify-end">
                <button onClick={handleSaveDraft} className="ghost-button button-xs">
                    Save Draft Notes
                </button>
            </div>
        </div>
    )
}
