/**
 * ============================================================================
 * APPLICATION QUESTIONS HELPER (REFACTORED - PHASE 6.2)
 * ============================================================================
 * 🎯 PURPOSE: Generate interview prep questions and talking points
 *
 * Features:
 * - AI-generated practice questions based on job + resume
 * - Answering tips and strategies
 * - Focus areas to highlight
 * - Voice engine integration for authentic responses
 *
 * Backend Integration:
 * - usePrepareInterview hook (uses voice engine via useAITask)
 *
 * Theme Integration:
 * - useRelevntColors for centralized color system
 * - PageBackground wrapper
 * - PageHeader component
 * ============================================================================
 */

import { useState, CSSProperties } from 'react';
import { usePrepareInterview } from '../hooks/usePrepareInterview';
import { useRelevntColors } from '../hooks';
import { PageBackground } from '../components/shared/PageBackground';
import { PageHeader } from '../components/shared/PageHeader';

export default function ApplicationQuestionsHelper(): JSX.Element {
  const colors = useRelevntColors();
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

  // ============================================================
  // STYLES
  // ============================================================

  const containerStyles: CSSProperties = {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '60px 20px',
    color: colors.text,
  };

  const inputStyles: CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '14px',
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    background: colors.background,
    color: colors.text,
  };

  const textareaStyles: CSSProperties = {
    ...inputStyles,
    minHeight: '120px',
    resize: 'vertical' as const,
  };

  const labelStyles: CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: colors.text,
    marginBottom: '0.5rem',
  };

  const buttonStyles: CSSProperties = {
    padding: '0.75rem 1.5rem',
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
    background: loading ? colors.textSecondary : colors.primary,
    border: 'none',
    borderRadius: '8px',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
  };

  const gridStyles: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  };

  const resultCardStyles: CSSProperties = {
    padding: '1.5rem',
    background: colors.surface,
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
  };

  const sectionTitleStyles: CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: colors.text,
    marginBottom: '1rem',
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <PageBackground>
      <div style={containerStyles}>
        {/* PAGE HEADER */}
        <PageHeader
          title="Application Questions Helper"
          subtitle="Generate practice questions and talking points based on your resume and the role you're applying for. Powered by your authentic voice."
          
          textPosition="left"
        />

        {/* INPUT FORM */}
        <div style={{ ...gridStyles, marginTop: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={labelStyles}>Job Title</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                style={inputStyles}
                placeholder="e.g., Senior Marketing Manager"
              />
            </div>

            <div>
              <label style={labelStyles}>Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                style={inputStyles}
                placeholder="e.g., Relevnt"
              />
            </div>
          </div>

          <div>
            <label style={labelStyles}>Resume Snapshot or Highlights</label>
            <textarea
              value={resumeContent}
              onChange={(e) => setResumeContent(e.target.value)}
              style={textareaStyles}
              placeholder="Paste the most relevant parts of your resume or a summary here..."
            />
          </div>
        </div>

        {/* VALIDATION ERROR */}
        {showValidation && (
          <div style={{ padding: '0.75rem', background: colors.error + '20', borderRadius: '8px', marginBottom: '1rem' }}>
            <p style={{ fontSize: '12px', color: colors.error }}>
              Please fill in job title, company, and resume snapshot before generating.
            </p>
          </div>
        )}

        {/* GENERATE BUTTON */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            style={buttonStyles}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = colors.primaryHover;
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = colors.primary;
              }
            }}
          >
            {loading ? 'Generating…' : 'Generate Questions & Prompts'}
          </button>

          {error && (
            <span style={{ fontSize: '12px', color: colors.error }}>
              Error: Unable to generate questions. Please try again.
            </span>
          )}
        </div>

        {/* RESULTS */}
        <div style={gridStyles}>
          {/* Suggested Questions */}
          <div style={resultCardStyles}>
            <h2 style={sectionTitleStyles}>Suggested Questions</h2>
            {questions.length === 0 ? (
              <p style={{ fontSize: '12px', color: colors.textSecondary }}>
                Questions will appear here once generated. You can reuse them for written applications and interviews.
              </p>
            ) : (
              <ul style={{ paddingLeft: '1.25rem', margin: 0, color: colors.text, fontSize: '12px', lineHeight: '1.6' }}>
                {questions.map((q, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem' }}>
                    {q}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Tips and Focus Areas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Answering Tips */}
            {tips.length > 0 && (
              <div style={resultCardStyles}>
                <h2 style={sectionTitleStyles}>Answering Tips</h2>
                <ul style={{ paddingLeft: '1.25rem', margin: 0, color: colors.text, fontSize: '12px', lineHeight: '1.6' }}>
                  {tips.map((t, idx) => (
                    <li key={idx} style={{ marginBottom: '0.5rem' }}>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Focus Areas */}
            {focusAreas.length > 0 && (
              <div style={resultCardStyles}>
                <h2 style={sectionTitleStyles}>Focus Areas to Highlight</h2>
                <ul style={{ paddingLeft: '1.25rem', margin: 0, color: colors.text, fontSize: '12px', lineHeight: '1.6' }}>
                  {focusAreas.map((f, idx) => (
                    <li key={idx} style={{ marginBottom: '0.5rem' }}>
                      {f}
                    </li>
                  ))}
                </ul>
                <p style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '0.75rem' }}>
                  These themes are suggested areas you should emphasize or answer consistently.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* VOICE ENGINE NOTE */}
        {(questions.length > 0 || tips.length > 0) && (
          <div style={{ padding: '1rem', background: colors.surface, borderRadius: '8px', border: `1px solid ${colors.border}`, marginTop: '1.5rem' }}>
            <p style={{ fontSize: '12px', color: colors.textSecondary }}>
              💡 These responses are generated using your authentic voice profile to help you communicate in a way that feels natural to you.
            </p>
          </div>
        )}
      </div>
    </PageBackground>
  );
}
