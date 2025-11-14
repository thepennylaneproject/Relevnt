/**
 * ============================================================================
 * RESUMES PAGE (REFACTORED)
 * ============================================================================
 * 🎯 PURPOSE: Resume management hub with AI analysis tools
 * 
 * This page demonstrates:
 * - Tier system gating (FeatureGate component)
 * - Three integrated hooks (extract, analyze, optimize)
 * - API integration patterns
 * - Empty states with illustrations
 * - Loading and error states
 * 
 * Features:
 * - Resume upload (Starter+)
 * - Extract resume data (Starter+, 1x/month free)
 * - Analyze resume ATS score (Pro+)
 * - Get optimization suggestions (Pro+)
 * - View all resumes
 * 
 * 🎓 LEARNING NOTE: This page shows how tier gating works in practice.
 * Users see upgrade prompts for locked features, creating a natural
 * upgrade funnel.
 * ============================================================================
 */

import { useState, CSSProperties } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/useTheme';
import { copy, hasFeatureAccess, getRequiredTier } from '../config';
import { PageBackground } from '../components/shared/PageBackground';
import { PageHeader } from '../components/shared/PageHeader';
import { FeatureGate } from '../components/features/FeatureGate';

/**
 * ResumesPage component
 */
export function ResumesPage(): JSX.Element {
  const { user, loading: authLoading } = useAuth();
  const { mode } = useTheme();

  // Track which tab is active (upload, extract, analyze, optimize)
  const [activeTab, setActiveTab] = useState<
    'list' | 'upload' | 'extract' | 'analyze' | 'optimize'
  >('list');

  // Mock data for demo - in real app, fetch from Supabase
  const [resumes] = useState([
    {
      id: '1',
      title: 'Senior Frontend Developer',
      createdAt: '2025-11-10',
      atsScore: 82,
    },
  ]); 

  const theme = {
    colors: {
      primary: mode === 'Dark' ? '#3b82f6' : '#2563eb',      // Blue
      border: mode === 'Dark' ? '#374151' : '#e5e7eb',       // Gray
      surface: mode === 'Dark' ? '#1f2937' : '#f9fafb',      // Surface background
      background: mode === 'Dark' ? '#111827' : '#ffffff',   // Item background
      textSecondary: mode === 'Dark' ? '#9ca3af' : '#6b7280', // Secondary text
      text: mode === 'Dark' ? '#f3f4f6' : '#1f2937',          // Primary text
    }
  };  // ============================================================
  // HELPER FUNCTION: Check if user can access feature
  // ============================================================

  const canExtract = hasFeatureAccess('resume-extract', user?.tier || 'starter');
  const canAnalyze = hasFeatureAccess('resume-analyze', user?.tier || 'starter');
  const canOptimize = hasFeatureAccess(
    'resume-optimize',
    user?.tier || 'starter'
  );

  // ============================================================
  // STYLES
  // ============================================================

  const mainStyles: CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '4rem 2rem',
  };

  const tabsStyles: CSSProperties = {
    display: 'flex',
    gap: '1rem',
    marginTop: '2rem',
    borderBottom: `2px solid ${theme.colors.border}`,
    overflow: 'auto',
  };

  const tabButtonStyles = (isActive: boolean): CSSProperties => ({
    padding: '1rem 1.5rem',
    background: 'transparent',
    border: 'none',
    borderBottom: isActive ? `3px solid ${theme.colors.primary}` : 'none',
    color: isActive ? theme.colors.primary : theme.colors.textSecondary,
    fontSize: '1rem',
    fontWeight: isActive ? 600 : 400,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  });

  const contentStyles: CSSProperties = {
    marginTop: '2rem',
    padding: '2rem',
    background: theme.colors.surface,
    borderRadius: '12px',
    border: `1px solid ${theme.colors.border}`,
  };


  if (authLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        Please log in
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <PageBackground version="v2">
      <main style={mainStyles}>
        {/* Page Header */}
        <PageHeader
          title={copy.nav.resumes}
          subtitle="Manage and optimize your professional documents"
          illustrationVersion="v2"
        />

        {/* Navigation Tabs */}
        <div style={tabsStyles}>
          <button
            style={tabButtonStyles(activeTab === 'list')}
            onClick={() => setActiveTab('list')}
          >
            📋 My Resumes
          </button>
          <button
            style={tabButtonStyles(activeTab === 'upload')}
            onClick={() => setActiveTab('upload')}
          >
            📤 Upload
          </button>
          <button
            style={tabButtonStyles(activeTab === 'extract')}
            onClick={() => setActiveTab('extract')}
            disabled={!canExtract}
          >
            🔄 Extract Data {!canExtract && '(Pro)'}
          </button>
          <button
            style={tabButtonStyles(activeTab === 'analyze')}
            onClick={() => setActiveTab('analyze')}
            disabled={!canAnalyze}
          >
            📊 Analyze {!canAnalyze && '(Pro)'}
          </button>
          <button
            style={tabButtonStyles(activeTab === 'optimize')}
            onClick={() => setActiveTab('optimize')}
            disabled={!canOptimize}
          >
            ✨ Optimize {!canOptimize && '(Pro)'}
          </button>
        </div>

        {/* Content Area */}
        <div style={contentStyles}>
          {/* Tab: My Resumes List */}
          {activeTab === 'list' && (
            <ResumesListTab resumes={resumes} theme={theme} />
          )}

          {/* Tab: Upload Resume */}
          {activeTab === 'upload' && <ResumeUploadTab theme={theme} />}

          {/* Tab: Extract Resume Data (Gated - Pro+) */}
          {activeTab === 'extract' && (
            <FeatureGate
              feature="resume-extract"
              requiredTier={getRequiredTier('resume-extract')}
              userTier={user.tier || 'starter'}
            >
              <ResumeExtractTab theme={theme} />
            </FeatureGate>
          )}

          {/* Tab: Analyze Resume (Gated - Pro+) */}
          {activeTab === 'analyze' && (
            <FeatureGate
              feature="resume-analyze"
              requiredTier={getRequiredTier('resume-analyze')}
              userTier={user.tier || 'starter'}
            >
              <ResumeAnalyzeTab theme={theme} />
            </FeatureGate>
          )}

          {/* Tab: Optimize Resume (Gated - Pro+) */}
          {activeTab === 'optimize' && (
            <FeatureGate
              feature="resume-optimize"
              requiredTier={getRequiredTier('resume-optimize')}
              userTier={user.tier || 'starter'}
            >
              <ResumeOptimizeTab theme={theme} />
            </FeatureGate>
          )}
        </div>

        {/* User Tier Info */}
        <div
          style={{
            marginTop: '2rem',
            padding: '1.5rem',
            background: `${theme.colors.primary}20`,
            borderRadius: '8px',
            color: theme.colors.text,
          }}
        >
          <p>
            Current tier: <strong>{user.tier || 'starter'}</strong> |
            Extract: {canExtract ? '✓' : '✗'} |
            Analyze: {canAnalyze ? '✓' : '✗'} |
            Optimize: {canOptimize ? '✓' : '✗'}
          </p>
        </div>
      </main>
    </PageBackground>
  );
}

// ============================================================================
// TAB COMPONENTS
// ============================================================================

interface TabProps {
  theme: any;
  resumes?: any[];
}

/**
 * List existing resumes
 */
function ResumesListTab({ resumes, theme }: TabProps & { resumes: any[] }) {
  return (
    <div>
      <h3 style={{ marginBottom: '1.5rem', color: theme.colors.text }}>
        Your Resumes
      </h3>
      {resumes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: theme.colors.textSecondary }}>
            {copy.emptyState.noResumes}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {resumes.map((resume) => (
            <div
              key={resume.id}
              style={{
                padding: '1.5rem',
                background: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: theme.colors.text }}>
                  {resume.title}
                </h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: theme.colors.textSecondary }}>
                  Created: {resume.createdAt}
                </p>
              </div>
              {resume.atsScore && (
                <div
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: theme.colors.primary,
                  }}
                >
                  {resume.atsScore}%
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Upload new resume
 */
function ResumeUploadTab({ theme }: TabProps) {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div>
      <h3 style={{ marginBottom: '1rem', color: theme.colors.text }}>
        Upload Resume
      </h3>
      <div
        style={{
          border: `2px dashed ${theme.colors.border}`,
          borderRadius: '8px',
          padding: '3rem 2rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.style.background = theme.colors.surface;
        }}
        onDragLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <input
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ display: 'none' }}
          id="resume-input"
        />
        <label htmlFor="resume-input" style={{ cursor: 'pointer' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: 500, color: theme.colors.text }}>
            📄 {copy.form.resumeFile}
          </p>
          <p style={{ fontSize: '0.9rem', color: theme.colors.textSecondary }}>
            PDF, DOCX, or DOC (max 10MB)
          </p>
          {file && (
            <p style={{ marginTop: '1rem', color: theme.colors.primary }}>
              ✓ {file.name}
            </p>
          )}
        </label>
      </div>
      <button
        style={{
          marginTop: '1.5rem',
          padding: '1rem 2rem',
          background: theme.colors.primary,
          color: theme.colors.accentText,
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: 600,
        }}
      >
        Upload Resume
      </button>
    </div>
  );
}

/**
 * Extract resume data (useExtractResume hook example)
 */
function ResumeExtractTab({ theme }: TabProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleExtract = async () => {
    setLoading(true);
    try {
      // 🎓 HOOK EXAMPLE: This would call useExtractResume in real app
      // const { extract } = useExtractResume()
      // const result = await extract(resumeText)

      // Mock response for now
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setResult({
        name: 'Jane Doe',
        email: 'jane@example.com',
        experience: '8 years',
        skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: '1rem', color: theme.colors.text }}>
        Extract Resume Data
      </h3>
      <p style={{ color: theme.colors.textSecondary, marginBottom: '1.5rem' }}>
        Automatically extract structured data from your resume
      </p>
      <button
        onClick={handleExtract}
        disabled={loading}
        style={{
          padding: '1rem 2rem',
          background: theme.colors.primary,
          color: theme.colors.accentText,
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '1rem',
          fontWeight: 600,
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? '⏳ Extracting...' : '🔄 Extract Data'}
      </button>

      {result && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: theme.colors.background, borderRadius: '8px' }}>
          <h4 style={{ color: theme.colors.text, marginTop: 0 }}>Extracted Data:</h4>
          <p><strong>Name:</strong> {result.name}</p>
          <p><strong>Email:</strong> {result.email}</p>
          <p><strong>Experience:</strong> {result.experience}</p>
          <p><strong>Skills:</strong> {result.skills.join(', ')}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Analyze resume ATS (useAnalyzeResume hook example)
 */
function ResumeAnalyzeTab({ theme }: TabProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      // 🎓 HOOK EXAMPLE: This would call useAnalyzeResume in real app
      // const { analyze } = useAnalyzeResume()
      // const result = await analyze(resumeText)

      await new Promise((resolve) => setTimeout(resolve, 1000));
      setResult({
        atsScore: 82,
        assessment: 'Good',
        strengths: ['Clear formatting', 'Relevant skills', 'Good use of keywords'],
        weaknesses: ['Missing quantifiable achievements', 'Could add more metrics'],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: '1rem', color: theme.colors.text }}>
        Analyze for ATS
      </h3>
      <p style={{ color: theme.colors.textSecondary, marginBottom: '1.5rem' }}>
        Get instant feedback on how Applicant Tracking Systems will read your resume
      </p>
      <button
        onClick={handleAnalyze}
        disabled={loading}
        style={{
          padding: '1rem 2rem',
          background: theme.colors.primary,
          color: theme.colors.accentText,
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '1rem',
          fontWeight: 600,
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? '⏳ Analyzing...' : '📊 Analyze'}
      </button>

      {result && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: theme.colors.background, borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '3rem', fontWeight: 700, color: theme.colors.primary }}>
              {result.atsScore}%
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: theme.colors.text }}>
                ATS Score
              </p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: theme.colors.textSecondary }}>
                Overall Assessment: {result.assessment}
              </p>
            </div>
          </div>
          <div>
            <h4 style={{ color: theme.colors.text, marginBottom: '0.5rem' }}>Strengths:</h4>
            <ul style={{ margin: '0 0 1rem 0', color: theme.colors.textSecondary }}>
              {result.strengths.map((s: string) => (
                <li key={s}>✓ {s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ color: theme.colors.text, marginBottom: '0.5rem' }}>Areas to Improve:</h4>
            <ul style={{ margin: 0, color: theme.colors.textSecondary }}>
              {result.weaknesses.map((w: string) => (
                <li key={w}>→ {w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Optimize resume (useOptimizeResume hook example)
 */
function ResumeOptimizeTab({ theme }: TabProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleOptimize = async () => {
    setLoading(true);
    try {
      // 🎓 HOOK EXAMPLE: This would call useOptimizeResume in real app
      // const { optimize } = useOptimizeResume()
      // const result = await optimize(resumeText)

      await new Promise((resolve) => setTimeout(resolve, 1000));
      setResult({
        suggestions: [
          {
            type: 'Keywords',
            current: 'Worked on frontend development',
            suggested:
              'Led React development for 3+ web applications, improving performance by 40%',
            impact: 'high',
          },
          {
            type: 'Metrics',
            current: 'Managed projects',
            suggested: 'Managed 8+ concurrent projects with $2M+ budget',
            impact: 'high',
          },
          {
            type: 'Format',
            current: 'Multiple job titles listed',
            suggested:
              'Group by responsibility or achievement type for clarity',
            impact: 'medium',
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: '1rem', color: theme.colors.text }}>
        Get Optimization Suggestions
      </h3>
      <p style={{ color: theme.colors.textSecondary, marginBottom: '1.5rem' }}>
        AI-powered recommendations to improve your ATS score and impact
      </p>
      <button
        onClick={handleOptimize}
        disabled={loading}
        style={{
          padding: '1rem 2rem',
          background: theme.colors.primary,
          color: theme.colors.accentText,
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '1rem',
          fontWeight: 600,
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? '✨ Optimizing...' : '✨ Get Suggestions'}
      </button>

      {result && (
        <div style={{ marginTop: '2rem', display: 'grid', gap: '1rem' }}>
          {result.suggestions.map((suggestion: any, idx: number) => (
            <div
              key={idx}
              style={{
                padding: '1.5rem',
                background: theme.colors.background,
                borderRadius: '8px',
                borderLeft: `4px solid ${suggestion.impact === 'high'
                    ? theme.colors.primary
                    : theme.colors.accent
                  }`,
              }}
            >
              <h4 style={{ margin: '0 0 0.5rem 0', color: theme.colors.text }}>
                {suggestion.type}
                {suggestion.impact === 'high' && ' ⭐ High Impact'}
              </h4>
              <p style={{ margin: '0.5rem 0', color: theme.colors.textSecondary }}>
                <strong>Current:</strong> {suggestion.current}
              </p>
              <p style={{ margin: '0.5rem 0', color: theme.colors.primary }}>
                <strong>Suggested:</strong> {suggestion.suggested}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ResumesPage;
