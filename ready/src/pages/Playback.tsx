/**
 * Playback Page - Ready App
 * 
 * Performance trends and progress tracking.
 * Route: /playback
 */

import { Container } from '../components/shared/Container'
import { usePerformance } from '../hooks/usePerformance'
import { Icon } from '../components/ui/Icon'
import { Button } from '../components/ui/Button'
import { Link } from 'react-router-dom'
import { getRelevntUrl } from '../config/cross-product'

export default function Playback() {
    const { performance, loading } = usePerformance()

    if (loading) {
        return (
            <div className="page-wrapper">
                <Container maxWidth="lg" padding="md">
                    <div className="loading-state">Loading your progress...</div>
                </Container>
            </div>
        )
    }

    const hasData = performance && (
        performance.practice.totalSessions > 0 ||
        performance.skillGaps.totalGaps > 0 ||
        performance.assessments.assessmentsCompleted > 0
    )

    return (
        <div className="page-wrapper">
            <Container maxWidth="lg" padding="md">
                <header className="page-header">
                    <h1>Playback</h1>
                    <p className="page-subtitle">
                        See what's working and track your journey to interview readiness.
                    </p>
                </header>

                {!hasData ? (
                    <div className="empty-state surface-card">
                        <Icon name="stars" size="lg" />
                        <h2>Start Your Journey</h2>
                        <p>Complete some activities to see your progress here.</p>
                        <div className="empty-actions">
                            <Link to="/practice">
                                <Button type="button" variant="primary">Start Practicing</Button>
                            </Link>
                            <Link to="/skills-gap">
                                <Button type="button" variant="secondary">Analyze Skills</Button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="playback-content">
                        {/* Readiness Banner */}
                        <section className={`readiness-banner ${performance.readiness.isReady ? 'ready' : ''}`}>
                            <div className="readiness-score-large">
                                <span className="score">{performance.readiness.currentScore}</span>
                                <span className="label">Readiness Score</span>
                            </div>
                            <div className="readiness-message">
                                {performance.readiness.isReady ? (
                                    <>
                                        <h2>🎉 You're Interview Ready!</h2>
                                        <p>Your preparation has paid off. You have the skills and confidence to succeed.</p>
                                        <div style={{ marginTop: '1rem' }}>
                                            <a href={getRelevntUrl('/jobs')} target="_blank" rel="noopener noreferrer">
                                                <Button type="button" variant="primary">Apply for Roles on Relevnt →</Button>
                                            </a>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h2>Keep Building</h2>
                                        <p>You're making progress. Reach 75 to unlock "Interview Ready" status.</p>
                                        <div style={{ marginTop: '1rem' }}>
                                            <a href={getRelevntUrl('/applications')} target="_blank" rel="noopener noreferrer">
                                                <Button type="button" variant="secondary" size="sm">Track Applications on Relevnt</Button>
                                            </a>
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>

                        {/* Insights */}
                        {performance.insights.length > 0 && (
                            <section className="insights-section surface-card">
                                <h3 className="section-title">
                                    <Icon name="lighthouse" size="sm" />
                                    Insights
                                </h3>
                                <ul className="insights-list">
                                    {performance.insights.map((insight, i) => (
                                        <li key={i}>{insight}</li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* What's Working */}
                        {performance.whatsWorking.length > 0 && (
                            <section className="working-section surface-card">
                                <h3 className="section-title">
                                    <Icon name="check" size="sm" />
                                    What's Working
                                </h3>
                                <div className="working-grid">
                                    {performance.whatsWorking.map((item, i) => (
                                        <div key={i} className="working-item">
                                            <Icon name="check" size="sm" />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Detailed Metrics */}
                        <section className="metrics-section">
                            <h3 className="section-title">Progress Breakdown</h3>
                            
                            <div className="metrics-cards">
                                {/* Practice */}
                                <article className="metric-card surface-card">
                                    <div className="metric-header">
                                        <Icon name="compass" size="sm" />
                                        <h4>Interview Practice</h4>
                                    </div>
                                    <div className="metric-stats">
                                        <div className="stat">
                                            <span className="stat-value">{performance.practice.completedSessions}</span>
                                            <span className="stat-label">Sessions</span>
                                        </div>
                                        <div className="stat">
                                            <span className="stat-value">{performance.practice.averageScore}</span>
                                            <span className="stat-label">Avg Score</span>
                                        </div>
                                        {performance.practice.improvementPercent !== 0 && (
                                            <div className="stat">
                                                <span className={`stat-value ${performance.practice.improvementPercent > 0 ? 'positive' : 'negative'}`}>
                                                    {performance.practice.improvementPercent > 0 ? '+' : ''}{performance.practice.improvementPercent}%
                                                </span>
                                                <span className="stat-label">Trend</span>
                                            </div>
                                        )}
                                    </div>
                                    {performance.practice.scoresTrend.length > 0 && (
                                        <div className="score-trend">
                                            {performance.practice.scoresTrend.map((score, i) => (
                                                <div 
                                                    key={i}
                                                    className="trend-bar"
                                                    style={{ height: `${score * 10}%` }}
                                                    title={`Score: ${score}`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                    <Link to="/practice" className="metric-link">Continue Practicing →</Link>
                                </article>

                                {/* Skills */}
                                <article className="metric-card surface-card">
                                    <div className="metric-header">
                                        <Icon name="search" size="sm" />
                                        <h4>Skill Gaps</h4>
                                    </div>
                                    <div className="metric-stats">
                                        <div className="stat">
                                            <span className="stat-value">{performance.skillGaps.addressedGaps}/{performance.skillGaps.totalGaps}</span>
                                            <span className="stat-label">Addressed</span>
                                        </div>
                                        <div className="stat">
                                            <span className="stat-value">{performance.skillGaps.progressPercent}%</span>
                                            <span className="stat-label">Complete</span>
                                        </div>
                                    </div>
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill"
                                            style={{ width: `${performance.skillGaps.progressPercent}%` }}
                                        />
                                    </div>
                                    <Link to="/skills-gap" className="metric-link">View Skills →</Link>
                                </article>

                                {/* Assessments */}
                                <article className="metric-card surface-card">
                                    <div className="metric-header">
                                        <Icon name="stars" size="sm" />
                                        <h4>Profile Assessments</h4>
                                    </div>
                                    <div className="assessment-scores">
                                        <div className="assessment-item">
                                            <span className="assessment-label">LinkedIn</span>
                                            <span className="assessment-score">
                                                {performance.assessments.linkedinScore ?? '—'}
                                            </span>
                                        </div>
                                        <div className="assessment-item">
                                            <span className="assessment-label">Portfolio</span>
                                            <span className="assessment-score">
                                                {performance.assessments.portfolioScore ?? '—'}
                                            </span>
                                        </div>
                                    </div>
                                    <Link to="/mirror" className="metric-link">View Mirror →</Link>
                                </article>
                            </div>
                        </section>
                    </div>
                )}
            </Container>

            <style>{playbackStyles}</style>
        </div>
    )
}

const playbackStyles = `
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

.loading-state {
  text-align: center;
  padding: 4rem;
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.empty-state h2 {
  font-size: 1.25rem;
  font-weight: 700;
}

.empty-state p {
  color: var(--text-secondary);
  max-width: 400px;
}

.empty-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.playback-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Readiness Banner */
.readiness-banner {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  background: var(--surface);
  border: 2px solid var(--border-subtle);
  border-radius: var(--radius-xl);
}

.readiness-banner.ready {
  border-color: #A8D5BA;
  background: rgba(168, 213, 186, 0.05);
}

.readiness-score-large {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  background: var(--color-accent);
  color: var(--bg);
  border-radius: 50%;
  flex-shrink: 0;
}

.readiness-banner.ready .readiness-score-large {
  background: #A8D5BA;
}

.readiness-score-large .score {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1;
}

.readiness-score-large .label {
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.readiness-message h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.readiness-message p {
  color: var(--text-secondary);
}

/* Sections */
.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.insights-section,
.working-section {
  padding: 1.5rem;
}

.insights-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.insights-list li {
  padding: 0.75rem 1rem;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: 0.9375rem;
}

.working-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.working-item {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: rgba(168, 213, 186, 0.1);
  color: #A8D5BA;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
}

/* Metrics */
.metrics-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.metric-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.metric-header h4 {
  font-size: 0.875rem;
  font-weight: 700;
}

.metric-stats {
  display: flex;
  gap: 1.5rem;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-accent);
}

.stat-value.positive { color: #A8D5BA; }
.stat-value.negative { color: #E8A8A8; }

.stat-label {
  font-size: 0.625rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.score-trend {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 40px;
}

.trend-bar {
  flex: 1;
  min-width: 20px;
  background: var(--color-accent);
  border-radius: 2px 2px 0 0;
  transition: height 0.3s;
}

.progress-bar {
  height: 8px;
  background: var(--border-subtle);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-accent);
  transition: width 0.3s;
}

.assessment-scores {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.assessment-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: var(--surface);
  border-radius: var(--radius-sm);
}

.assessment-label {
  font-size: 0.875rem;
}

.assessment-score {
  font-weight: 700;
  color: var(--color-accent);
}

.metric-link {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-accent);
  text-decoration: none;
  margin-top: auto;
}

.metric-link:hover {
  text-decoration: underline;
}
`;
