// src/components/ResumeBuilder/NewResumeWizard.tsx
// Guided wizard for building a resume from scratch

import React, { useState } from 'react'
import { Icon } from '../ui/Icon'
import { Button } from '../ui/Button'
import { useAITask } from '../../hooks/useAITask'
import type { ResumeDraft } from '../../types/resume-builder.types'

// ============================================================================
// TYPES
// ============================================================================

type WizardStep = 'intro' | 'basics' | 'industry' | 'generating' | 'complete'

interface WizardData {
    fullName: string
    targetRole: string
    industry: string
    yearsExperience: string
    topSkills: string
    previousRole: string
    previousCompany: string
}

interface Props {
    onComplete: (draft: Partial<ResumeDraft>) => void
    onCancel: () => void
}

const INDUSTRIES = [
    { id: 'tech', label: 'Technology', icon: '💻' },
    { id: 'finance', label: 'Finance & Banking', icon: '📊' },
    { id: 'healthcare', label: 'Healthcare', icon: '🏥' },
    { id: 'marketing', label: 'Marketing & Sales', icon: '📈' },
    { id: 'education', label: 'Education', icon: '📚' },
    { id: 'consulting', label: 'Consulting', icon: '💼' },
    { id: 'creative', label: 'Creative & Design', icon: '🎨' },
    { id: 'other', label: 'Other', icon: '✨' },
]

const EXPERIENCE_LEVELS = [
    { id: 'entry', label: 'Entry Level (0-2 years)', value: '0-2' },
    { id: 'mid', label: 'Mid-Level (3-5 years)', value: '3-5' },
    { id: 'senior', label: 'Senior (6-10 years)', value: '6-10' },
    { id: 'executive', label: 'Executive (10+ years)', value: '10+' },
]

// ============================================================================
// COMPONENT
// ============================================================================

export const NewResumeWizard: React.FC<Props> = ({ onComplete, onCancel }) => {
    const { execute, loading } = useAITask()
    const [step, setStep] = useState<WizardStep>('intro')
    const [data, setData] = useState<WizardData>({
        fullName: '',
        targetRole: '',
        industry: '',
        yearsExperience: '',
        topSkills: '',
        previousRole: '',
        previousCompany: '',
    })

    const updateData = (field: keyof WizardData, value: string) => {
        setData(prev => ({ ...prev, [field]: value }))
    }

    const canProceed = () => {
        switch (step) {
            case 'intro':
                return true
            case 'basics':
                return data.fullName.trim() && data.targetRole.trim()
            case 'industry':
                return data.industry && data.yearsExperience
            default:
                return true
        }
    }

    const handleNext = async () => {
        switch (step) {
            case 'intro':
                setStep('basics')
                break
            case 'basics':
                setStep('industry')
                break
            case 'industry':
                await generateResume()
                break
        }
    }

    const generateResume = async () => {
        setStep('generating')

        try {
            // Generate a professional summary using the rewrite-text task
            const result = await execute('rewrite-text', {
                text: `Create a professional resume summary for a ${data.targetRole} with ${data.yearsExperience} years of experience in ${data.industry}. Skills include: ${data.topSkills}`,
                context: 'resume-summary',
            })

            if (result?.success) {
                const summary = (result as any).rewritten ||
                    (result as any).data?.rewritten ||
                    (result as any).text ||
                    ''

                const draft: Partial<ResumeDraft> = {
                    contact: {
                        fullName: data.fullName,
                        email: '',
                        phone: '',
                        location: '',
                        headline: data.targetRole,
                        links: [],
                    },
                    summary: {
                        headline: data.targetRole,
                        summary: summary || `Results-driven ${data.targetRole} with ${data.yearsExperience} years of experience. Skilled in ${data.topSkills || 'delivering impactful results'}.`,
                    },
                    skillGroups: data.topSkills
                        ? [{ label: 'Core Skills', skills: data.topSkills.split(',').map(s => s.trim()) }]
                        : [],
                    experience: [],
                    education: [],
                    certifications: [],
                    projects: [],
                }

                setStep('complete')
                setTimeout(() => onComplete(draft), 1000)
            } else {
                // Fallback to basic generation
                createBasicDraft()
            }
        } catch (err) {
            console.error('AI generation failed:', err)
            createBasicDraft()
        }
    }

    const createBasicDraft = () => {
        const draft: Partial<ResumeDraft> = {
            contact: {
                fullName: data.fullName,
                email: '',
                phone: '',
                location: '',
                headline: data.targetRole,
                links: [],
            },
            summary: {
                headline: data.targetRole,
                summary: `Results-driven ${data.targetRole} with ${data.yearsExperience} years of experience in the ${data.industry} industry. Skilled in ${data.topSkills || 'delivering impactful results'}. Proven track record of success in collaborative, fast-paced environments.`,
            },
            skillGroups: data.topSkills
                ? [{ label: 'Core Skills', skills: data.topSkills.split(',').map(s => s.trim()) }]
                : [],
            experience: data.previousRole ? [{
                id: 'exp-1',
                title: data.previousRole,
                company: data.previousCompany || 'Previous Company',
                location: '',
                startDate: '',
                endDate: 'Present',
                current: true,
                bullets: '',
            }] : [],
            education: [],
            certifications: [],
            projects: [],
        }

        setStep('complete')
        setTimeout(() => onComplete(draft), 1000)
    }

    return (
        <div className="wizard-overlay">
            <div className="wizard-modal">
                {/* Progress bar */}
                <div className="wizard-progress">
                    <div
                        className="wizard-progress-fill"
                        style={{
                            width: step === 'intro' ? '25%'
                                : step === 'basics' ? '50%'
                                    : step === 'industry' ? '75%'
                                        : '100%'
                        }}
                    />
                </div>

                {/* Step: Intro */}
                {step === 'intro' && (
                    <div className="wizard-step">
                        <div className="wizard-step-icon">
                            <Icon name="scroll" size="lg" />
                        </div>
                        <h2 className="wizard-title">Let's Build Your Resume</h2>
                        <p className="wizard-description">
                            Answer a few quick questions and we'll create a professional
                            resume tailored to your target role. Takes about 2 minutes.
                        </p>
                        <div className="wizard-features">
                            <div className="wizard-feature">
                                <Icon name="stars" size="sm" />
                                <span className="text-sm">AI-powered content suggestions</span>
                            </div>
                            <div className="wizard-feature">
                                <Icon name="key" size="sm" />
                                <span className="text-sm">ATS-optimized formatting</span>
                            </div>
                            <div className="wizard-feature">
                                <Icon name="lighthouse" size="sm" />
                                <span className="text-sm">Industry-specific templates</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step: Basics */}
                {step === 'basics' && (
                    <div className="wizard-step">
                        <h2 className="wizard-title">The Basics</h2>
                        <p className="wizard-description">
                            Tell us about yourself and your career goals.
                        </p>
                        <div className="wizard-form">
                            <div className="form-group">
                                <label className="form-label">Your Full Name</label>
                                <input
                                    type="text"
                                    value={data.fullName}
                                    onChange={(e) => updateData('fullName', e.target.value)}
                                    placeholder="Jane Smith"
                                    className="w-full"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Target Role</label>
                                <input
                                    type="text"
                                    value={data.targetRole}
                                    onChange={(e) => updateData('targetRole', e.target.value)}
                                    placeholder="e.g., Senior Product Manager, Software Engineer"
                                    className="w-full"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Top Skills (comma-separated)</label>
                                <input
                                    type="text"
                                    value={data.topSkills}
                                    onChange={(e) => updateData('topSkills', e.target.value)}
                                    placeholder="e.g., Python, Data Analysis, Project Management"
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step: Industry */}
                {step === 'industry' && (
                    <div className="wizard-step">
                        <h2 className="wizard-title">Your Background</h2>
                        <p className="wizard-description">
                            Help us tailor your resume to your industry.
                        </p>
                        <div className="wizard-form">
                            <div className="form-group">
                                <label className="form-label">Industry</label>
                                <div className="wizard-industry-grid">
                                    {INDUSTRIES.map((ind) => (
                                        <button
                                            key={ind.id}
                                            type="button"
                                            onClick={() => updateData('industry', ind.id)}
                                            className={`wizard-industry-btn ${data.industry === ind.id ? 'active' : ''}`}
                                        >
                                            <span className="wizard-industry-icon">{ind.icon}</span>
                                            <span className="text-xs">{ind.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Experience Level</label>
                                <div className="wizard-experience-options">
                                    {EXPERIENCE_LEVELS.map((exp) => (
                                        <button
                                            key={exp.id}
                                            type="button"
                                            onClick={() => updateData('yearsExperience', exp.value)}
                                            className={`wizard-experience-btn ${data.yearsExperience === exp.value ? 'active' : ''}`}
                                        >
                                            {exp.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step: Generating */}
                {step === 'generating' && (
                    <div className="wizard-step wizard-step--centered">
                        <div className="wizard-generating">
                            <div className="wizard-generating-spinner" />
                            <h2 className="wizard-title">Creating Your Resume</h2>
                            <p className="wizard-description">
                                Our AI is crafting personalized content for your {data.targetRole} resume...
                            </p>
                        </div>
                    </div>
                )}

                {/* Step: Complete */}
                {step === 'complete' && (
                    <div className="wizard-step wizard-step--centered">
                        <div className="wizard-complete">
                            <div className="wizard-complete-icon">✓</div>
                            <h2 className="wizard-title">Resume Created!</h2>
                            <p className="wizard-description">
                                Your resume is ready. You can now edit and customize each section.
                            </p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                {step !== 'generating' && step !== 'complete' && (
                    <div className="wizard-actions">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            onClick={handleNext}
                            disabled={!canProceed()}
                        >
                            {step === 'industry' ? 'Generate Resume' : 'Continue'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default NewResumeWizard
