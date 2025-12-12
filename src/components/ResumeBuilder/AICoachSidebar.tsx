// src/components/ResumeBuilder/AICoachSidebar.tsx
// Chat-style AI coaching sidebar with educational, empowering tips

import React, { useState, useEffect, useRef } from 'react'
import { Icon, IconName } from '../ui/Icon'
import type { ResumeDraft } from '../../types/resume-builder.types'

// ============================================================================
// TYPES
// ============================================================================

type ActiveSection =
    | 'contact'
    | 'summary'
    | 'skills'
    | 'experience'
    | 'education'
    | 'certifications'
    | 'projects'

interface CoachMessage {
    id: string
    type: 'tip' | 'stat' | 'action' | 'question'
    content: string
    source?: string // Citation source for statistics
    icon: IconName
    actionButton?: {
        label: string
        onClick: () => void
    }
}

interface SectionCoaching {
    intro: string
    tips: CoachMessage[]
    emptyStateMessage?: string
}

interface Props {
    activeSection: ActiveSection
    draft: ResumeDraft
    onClose?: () => void
}

// ============================================================================
// COACHING CONTENT DATABASE
// Educational tips grounded in real statistics and best practices
// ============================================================================

const COACHING_CONTENT: Record<ActiveSection, SectionCoaching> = {
    contact: {
        intro: "Let's make sure recruiters can reach you easily.",
        tips: [
            {
                id: 'contact-1',
                type: 'stat',
                icon: 'compass',
                content: "75% of recruiters will skip your resume if contact info is missing or hard to find.",
                source: "CareerBuilder Survey, 2023"
            },
            {
                id: 'contact-2',
                type: 'tip',
                icon: 'stars',
                content: "Use a professional email address. Studies show emails like firstname.lastname@domain get 30% more responses than casual handles."
            },
            {
                id: 'contact-3',
                type: 'tip',
                icon: 'lighthouse',
                content: "Include your LinkedIn profile URL—but make sure it's customized (linkedin.com/in/yourname), not the default random string."
            },
            {
                id: 'contact-4',
                type: 'action',
                icon: 'key',
                content: "Location tip: City and State is enough. Full addresses can introduce bias and aren't needed for initial screening."
            }
        ]
    },
    summary: {
        intro: "Your summary is your 7-second pitch. Make it count.",
        tips: [
            {
                id: 'summary-1',
                type: 'stat',
                icon: 'stars',
                content: "Recruiters spend an average of 7.4 seconds on initial resume scan. Your summary is often ALL they read first.",
                source: "Ladders Eye-Tracking Study"
            },
            {
                id: 'summary-2',
                type: 'tip',
                icon: 'scroll',
                content: "Answer three questions: Who are you? What do you do best? What value do you create? Keep it to 2-4 lines."
            },
            {
                id: 'summary-3',
                type: 'tip',
                icon: 'briefcase',
                content: "Include your years of experience and 1-2 key achievements. This immediately establishes credibility."
            },
            {
                id: 'summary-4',
                type: 'action',
                icon: 'lighthouse',
                content: "Avoid first person (\"I am...\") in traditional resumes. Start with your title or descriptor: \"Results-driven Product Manager...\""
            }
        ],
        emptyStateMessage: "A strong summary increases interview callbacks by 36%. Let's craft one that tells your story."
    },
    skills: {
        intro: "Skills are what ATS systems scan first. Let's optimize.",
        tips: [
            {
                id: 'skills-1',
                type: 'stat',
                icon: 'key',
                content: "Over 75% of resumes are rejected by ATS before a human ever sees them. Proper keyword placement is critical.",
                source: "Jobscan Research, 2023"
            },
            {
                id: 'skills-2',
                type: 'tip',
                icon: 'stars',
                content: "Use exact phrases from job descriptions. If they say \"project management\", don't substitute \"managing projects\"—ATS often misses synonyms."
            },
            {
                id: 'skills-3',
                type: 'tip',
                icon: 'scroll',
                content: "Group skills into categories (Technical, Soft Skills, Tools) to improve scannability and show depth."
            },
            {
                id: 'skills-4',
                type: 'action',
                icon: 'compass',
                content: "Aim for 8-15 skills. Too few looks junior; too many looks unfocused. Quality over quantity."
            }
        ]
    },
    experience: {
        intro: "Experience is where you prove your value. Show, don't tell.",
        tips: [
            {
                id: 'exp-1',
                type: 'stat',
                icon: 'briefcase',
                content: "Resumes with quantified achievements are 40% more likely to get interviews than those without numbers.",
                source: "LinkedIn Hiring Insights"
            },
            {
                id: 'exp-2',
                type: 'tip',
                icon: 'stars',
                content: "Use the XYZ formula: \"Accomplished [X] as measured by [Y], by doing [Z].\" Example: \"Increased sales 25% by implementing new CRM workflow.\""
            },
            {
                id: 'exp-3',
                type: 'tip',
                icon: 'lighthouse',
                content: "Start every bullet with a strong action verb: Led, Built, Launched, Increased, Reduced, Designed, Automated, Negotiated."
            },
            {
                id: 'exp-4',
                type: 'action',
                icon: 'scroll',
                content: "Focus on impact, not duties. \"Managed a team\" is weak. \"Led 8-person team to deliver $2M project 2 weeks early\" shows results."
            },
            {
                id: 'exp-5',
                type: 'tip',
                icon: 'key',
                content: "3-5 bullet points per role is ideal. Your most recent position can have more; older roles need less detail."
            }
        ],
        emptyStateMessage: "Experience is the heart of your resume. Even internships and volunteer work count—it's about transferable skills."
    },
    education: {
        intro: "Education shows your foundation. Keep it simple and relevant.",
        tips: [
            {
                id: 'edu-1',
                type: 'tip',
                icon: 'book',
                content: "For 5+ years experience, education moves below experience. For new grads, keep it prominent with relevant coursework."
            },
            {
                id: 'edu-2',
                type: 'stat',
                icon: 'stars',
                content: "GPA is optional. Include it if 3.5+ or if the job specifically requests it. After 2-3 years of experience, it becomes irrelevant.",
                source: "NACE Employer Survey"
            },
            {
                id: 'edu-3',
                type: 'tip',
                icon: 'lighthouse',
                content: "Include relevant coursework, honors, or leadership roles if they strengthen your narrative for this specific job."
            }
        ]
    },
    certifications: {
        intro: "Certifications can set you apart—if they're relevant.",
        tips: [
            {
                id: 'cert-1',
                type: 'stat',
                icon: 'key',
                content: "Certified candidates earn 5-20% more than non-certified peers in technical fields.",
                source: "Indeed Salary Research"
            },
            {
                id: 'cert-2',
                type: 'tip',
                icon: 'stars',
                content: "Only include certifications relevant to your target role. Expired or unrelated certs dilute your focus."
            },
            {
                id: 'cert-3',
                type: 'tip',
                icon: 'scroll',
                content: "Include the issuing organization and date. If it's a recognized cert (AWS, PMP, CPA), it adds instant credibility."
            }
        ]
    },
    projects: {
        intro: "Projects show initiative and applied skills. Great for gaps or career pivots.",
        tips: [
            {
                id: 'proj-1',
                type: 'tip',
                icon: 'lighthouse',
                content: "Side projects are especially valuable for career changers—they prove you can do the work even without job titles."
            },
            {
                id: 'proj-2',
                type: 'tip',
                icon: 'stars',
                content: "Include links to live projects, GitHub repos, or portfolios. Tangible work beats descriptions."
            },
            {
                id: 'proj-3',
                type: 'action',
                icon: 'scroll',
                content: "Describe your role, the problem solved, technologies used, and impact or outcome. Keep it concise but complete."
            }
        ]
    }
}

// ============================================================================
// COMPONENT
// ============================================================================

export const AICoachSidebar: React.FC<Props> = ({ activeSection, draft, onClose }) => {
    const [messages, setMessages] = useState<CoachMessage[]>([])
    const [displayedCount, setDisplayedCount] = useState(0)
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Draggable state
    const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 100 })
    const [isDragging, setIsDragging] = useState(false)
    const dragStartRef = useRef({ x: 0, y: 0 })
    const initialPosRef = useRef({ x: 0, y: 0 })

    const coaching = COACHING_CONTENT[activeSection]

    // Simulate chat-style message reveal
    useEffect(() => {
        setMessages(coaching.tips)
        setDisplayedCount(0)
        setIsTyping(true)

        // Reveal messages one by one with delay
        const timer = setInterval(() => {
            setDisplayedCount(prev => {
                if (prev >= coaching.tips.length) {
                    clearInterval(timer)
                    setIsTyping(false)
                    return prev
                }
                return prev + 1
            })
        }, 800)

        return () => clearInterval(timer)
    }, [activeSection, coaching.tips])

    // Auto-scroll to bottom as new messages appear
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [displayedCount])

    // Handle Dragging
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true)
        dragStartRef.current = { x: e.clientX, y: e.clientY }
        initialPosRef.current = { ...position }
    }

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return
            const dx = e.clientX - dragStartRef.current.x
            const dy = e.clientY - dragStartRef.current.y

            // Constrain to window
            const newX = Math.max(0, Math.min(window.innerWidth - 380, initialPosRef.current.x + dx))
            const newY = Math.max(0, Math.min(window.innerHeight - 100, initialPosRef.current.y + dy))

            setPosition({ x: newX, y: newY })
        }

        const handleMouseUp = () => {
            setIsDragging(false)
        }

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging])

    // Keep it in bounds if window resizes
    useEffect(() => {
        const handleResize = () => {
            setPosition(prev => ({
                x: Math.min(prev.x, window.innerWidth - 380),
                y: Math.min(prev.y, window.innerHeight - 100)
            }))
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const getMessageTypeStyle = (type: CoachMessage['type']) => {
        switch (type) {
            case 'stat':
                return 'coach-message--stat'
            case 'action':
                return 'coach-message--action'
            case 'question':
                return 'coach-message--question'
            default:
                return ''
        }
    }

    return (
        <div
            className={`resume-coach-widget ${isDragging ? 'is-dragging' : ''}`}
            style={{
                left: position.x,
                top: position.y
            }}
        >
            <div
                className="ai-coach-header"
                onMouseDown={handleMouseDown}
                title="Drag to move"
            >
                <div className="ai-coach-header-main">
                    <div className="ai-coach-avatar">
                        <Icon name="stars" size="sm" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">Resume Coach</h3>
                        <p className="text-xs muted">Empowering your job search</p>
                    </div>
                </div>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="ghost-button button-sm"
                        onMouseDown={(e) => e.stopPropagation()} // Prevent dragging when clicking close
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className="ai-coach-messages">
                {/* Intro message */}
                <div className="coach-message coach-message--intro">
                    <div className="coach-message-content">
                        <p>{coaching.intro}</p>
                    </div>
                </div>

                {/* Tips revealed one by one */}
                {messages.slice(0, displayedCount).map((message, index) => (
                    <div
                        key={message.id}
                        className={`coach-message ${getMessageTypeStyle(message.type)}`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        <div className="coach-message-icon">
                            <Icon name={message.icon} size="sm" />
                        </div>
                        <div className="coach-message-content">
                            <p>{message.content}</p>
                            {message.source && (
                                <span className="coach-message-source text-xs muted">
                                    — {message.source}
                                </span>
                            )}
                        </div>
                    </div>
                ))}

                {/* Typing indicator */}
                {isTyping && displayedCount < messages.length && (
                    <div className="coach-typing">
                        <span className="coach-typing-dot" />
                        <span className="coach-typing-dot" />
                        <span className="coach-typing-dot" />
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="ai-coach-footer">
                <p className="text-xs muted">
                    💡 These tips are based on hiring research and ATS best practices
                </p>
            </div>
        </div>
    )
}

export default AICoachSidebar
