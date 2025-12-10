import { useState } from 'react';
import { useAnalyzeSkillsGap } from '../hooks/useAnalyzeSkillsGap';
import { Container } from '../components/shared/Container';
import { Icon } from '../components/ui/Icon';

export default function SkillsGapPage() {
  const { analyze, loading, error } = useAnalyzeSkillsGap();

  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  async function handleAnalyze() {
    const result = await analyze(resumeText, jobDescription);
    if (result?.success && result.data) {
      setMissingSkills(result.data.missingSkills || []);
      setRecommendations(result.data.recommendations || []);
    }
  }

  return (
    <div className="page-wrapper">
      <Container maxWidth="lg" padding="md">
        <header className="hero-shell">
          <div className="hero-header">
            <div className="hero-header-main">
              <div className="hero__badge">
                <Icon name="search" size="sm" hideAccent />
                <span>Skills Analysis</span>
              </div>
              <h1>Skills Gap Analyzer</h1>
            </div>
          </div>
        </header>

        <div className="page-stack">
          <article className="surface-card">
            <div className="rl-field-grid">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <label className="rl-label">
                  Your Resume
                  <textarea
                    className="rl-textarea"
                    rows={8}
                    placeholder="Paste your resume here..."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                  />
                </label>
                <label className="rl-label">
                  Job Description
                  <textarea
                    className="rl-textarea"
                    rows={8}
                    placeholder="Paste the job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                </label>
              </div>

              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="primary-button"
                >
                  {loading ? 'Analyzing…' : 'Analyze Skills Gap'}
                </button>

                {error && (
                  <p style={{ fontSize: '13px', color: 'var(--color-error)' }}>Something went wrong.</p>
                )}
              </div>
            </div>
          </article>

          {missingSkills.length > 0 && (
            <div style={{ display: 'grid', gap: 24 }}>
              <article className="surface-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Icon name="alert-triangle" size="sm" hideAccent />
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Missing Skills</h2>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {missingSkills.map((skill, i) => (
                    <span
                      key={i}
                      className="chip"
                      style={{ fontSize: '13px' }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </article>

              <article className="surface-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Icon name="lighthouse" size="sm" hideAccent />
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Recommendations</h2>
                </div>
                <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text)', fontSize: '14px', lineHeight: '1.6' }}>
                  {recommendations.map((rec, i) => (
                    <li key={i} style={{ marginBottom: '0.5rem' }}>{rec}</li>
                  ))}
                </ul>
              </article>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}