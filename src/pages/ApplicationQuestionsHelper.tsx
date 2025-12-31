/**
 * ============================================================================
 * APPLICATION QUESTIONS HELPER (REFACTORED)
 * ============================================================================
 * 🎯 PURPOSE: Generate interview prep questions and talking points
 */

import { useState } from 'react';
import { usePrepareInterview } from '../hooks/usePrepareInterview';
import { Container } from '../components/shared/Container';

export default function ApplicationQuestionsHelper(): JSX.Element {
  const { prepare, loading, error } = usePrepareInterview();

  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [resumeContent, setResumeContent] = useState('');

  const [questions, setQuestions] = useState<string[]>([]);
  const [tips, setTips] = useState<string[]>([]);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);

  const [touched, setTouched] = useState(false);

  async function handleGenerate() {
    setTouched(true);
    if (!jobTitle.trim() || !company.trim() || !resumeContent.trim()) {
      return;
    }

    try {
      const result = await prepare(jobTitle, company, resumeContent);

      if (result && result.success && result.data) {
        setQuestions(result.data.questions || []);
        setTips(result.data.tips || []);

        const commonAnswers = result.data.commonAnswers || {};
        setFocusAreas(Object.keys(commonAnswers));
      }
    } catch (err) {
      console.error('Application helper error', err);
    }
  }

  const showValidation =
    touched &&
    (!jobTitle.trim() || !company.trim() || !resumeContent.trim());

  return (
    <div className="page-wrapper">
      <Container maxWidth="lg" padding="md">
        {/* HERO HEADER */}
        <header className="hero-shell">
          <div className="hero-header">
            <div className="hero-header-main">
              <h1>Application Questions Helper</h1>
              <p className="hero-subtitle">
                Generate practice questions and talking points based on your resume and the role you're applying for. Powered by your authentic voice.
              </p>
            </div>
          </div>
        </header>

        <div className="page-stack">
          {/* INPUT FORM */}
          <article className="surface-card">
            <div className="rl-field-grid">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <label className="rl-label">
                  Job Title
                  <input
                    className="rl-input"
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g., Senior Marketing Manager"
                  />
                </label>

                <label className="rl-label">
                  Company
                  <input
                    className="rl-input"
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g., Relevnt"
                  />
                </label>
              </div>

              <label className="rl-label">
                Resume Snapshot or Highlights
                <textarea
                  className="rl-textarea"
                  value={resumeContent}
                  onChange={(e) => setResumeContent(e.target.value)}
                  placeholder="Paste the most relevant parts of your resume or a summary here..."
                  rows={6}
                />
              </label>

              {/* VALIDATION ERROR */}
              {showValidation && (
                <div style={{ padding: '0.75rem', background: 'var(--color-bg-error)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-error)' }}>
                  <p style={{ fontSize: '13px', color: 'var(--color-error)' }}>
                    Please fill in job title, company, and resume snapshot before generating.
                  </p>
                </div>
              )}
            </div>

            <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="primary-button"
              >
                {loading ? 'Generating…' : 'Generate Questions & Prompts'}
              </button>

              {error && (
                <span style={{ fontSize: '13px', color: 'var(--color-error)' }}>
                  Error: Unable to generate questions. Please try again.
                </span>
              )}
            </div>
          </article>

          {/* RESULTS */}
          {(questions.length > 0 || tips.length > 0 || focusAreas.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* Suggested Questions */}
              <div style={{ display: 'grid', gap: 24 }}>
                <article className="surface-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Icon name="briefcase" size="sm" hideAccent />
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Suggested Questions</h2>
                  </div>

                  {questions.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Questions will appear here once generated. You can reuse them for written applications and interviews.
                    </p>
                  ) : (
                    <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text)', fontSize: '14px', lineHeight: '1.6' }}>
                      {questions.map((q, idx) => (
                        <li key={idx} style={{ marginBottom: '0.75rem' }}>
                          {q}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>

                {/* VOICE ENGINE NOTE */}
                <div style={{ padding: '16px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', display: 'flex', gap: 12 }}>
                  <div style={{ flexShrink: 0, color: 'var(--color-accent)' }}>
                    <Icon name="microphone" size="sm" hideAccent />
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    These responses are generated using your authentic voice profile to help you communicate in a way that feels natural to you.
                  </p>
                </div>
              </div>

              {/* Tips and Focus Areas */}
              <div style={{ display: 'grid', gap: 24, alignContent: 'start' }}>
                {/* Answering Tips */}
                {tips.length > 0 && (
                  <article className="surface-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Icon name="lighthouse" size="sm" hideAccent />
                      <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Answering Tips</h2>
                    </div>
                    <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text)', fontSize: '14px', lineHeight: '1.6' }}>
                      {tips.map((t, idx) => (
                        <li key={idx} style={{ marginBottom: '0.75rem' }}>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </article>
                )}

                {/* Focus Areas */}
                {focusAreas.length > 0 && (
                  <article className="surface-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Icon name="compass" size="sm" hideAccent />
                      <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Focus Areas</h2>
                    </div>
                    <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text)', fontSize: '14px', lineHeight: '1.6' }}>
                      {focusAreas.map((f, idx) => (
                        <li key={idx} style={{ marginBottom: '0.75rem' }}>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '1rem', fontStyle: 'italic' }}>
                      These themes are suggested areas you should emphasize or answer consistently.
                    </p>
                  </article>
                )}
              </div>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
