/**
 * CoachingHub - Ready App
 * 
 * Central hub for coaching tools: Rejection Debrief and Negotiation Coach.
 * Route: /coaching
 */

import { useState } from 'react'
import { Container } from '../components/shared/Container'
import { RejectionCoaching } from '../components/coaching/RejectionCoaching'
import { NegotiationCoach } from '../components/coaching/NegotiationCoach'
import { Icon } from '../components/ui/Icon'

type CoachingTab = 'rejection' | 'negotiation'

export default function CoachingHub() {
    const [activeTab, setActiveTab] = useState<CoachingTab>('negotiation')

    return (
        <div className="page-wrapper">
            <Container maxWidth="lg" padding="md">
                <header className="page-header">
                    <h1>Coaching Hub</h1>
                    <p className="page-subtitle">
                        Get AI-powered coaching for critical career moments. Navigate rejections and negotiate with confidence.
                    </p>
                </header>

                {/* Tab Switcher */}
                <div className="tabs-container">
                    <button
                        className={`tab-button ${activeTab === 'negotiation' ? 'active' : ''}`}
                        onClick={() => setActiveTab('negotiation')}
                    >
                        <Icon name="lighthouse" size="sm" />
                        <span>Negotiation Coach</span>
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'rejection' ? 'active' : ''}`}
                        onClick={() => setActiveTab('rejection')}
                    >
                        <Icon name="alert-triangle" size="sm" />
                        <span>Rejection Debrief</span>
                    </button>
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                    {activeTab === 'negotiation' && (
                        <NegotiationCoach />
                    )}
                    {activeTab === 'rejection' && (
                        <RejectionCoaching />
                    )}
                </div>
            </Container>

            <style>{coachingHubStyles}</style>
        </div>
    )
}

const coachingHubStyles = `
.page-header {
  margin-bottom: 2rem;
  text-align: center;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

.tabs-container {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  padding: 0.25rem;
  background: var(--surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
}

.tab-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-button:hover {
  color: var(--text);
  background: var(--surface-elevated);
}

.tab-button.active {
  background: var(--color-accent);
  color: var(--bg);
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
