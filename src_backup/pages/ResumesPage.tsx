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
import { copy, hasFeatureAccess, getRequiredTier } from '../config';
import { PageBackground } from '../components/shared/PageBackground';
import { PageHeader } from '../components/shared/PageHeader';
import { FeatureGate } from '../components/features/FeatureGate';
import { useRelevntColors } from '../hooks';
import { useResumes, useExtractResume, useAnalyzeResume, useOptimizeResume } from '../hooks';

/**
 * ResumesPage component
 */
export function ResumesPage(): JSX.Element {
  const { user, loading: authLoading } = useAuth();
  const colors = useRelevntColors();

  // Track which tab is active (upload, extract, analyze, optimize)
  const [activeTab, setActiveTab] = useState<
    'list' | 'upload' | 'extract' | 'analyze' | 'optimize'
  >('list');

  // ============================================================
  // BACKEND DATA HOOKS
  // ============================================================

  const { resumes, loading: resumesLoading } = useResumes(user!);

  // ============================================================
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
    borderBottom: `2px solid ${colors.border}`,
    overflow: 'auto',
  };

  const tabButtonStyles = (isActive: boolean): CSSProperties => ({
    padding: '1rem 1.5rem',
    background: 'transparent',
    border: 'none',
    borderBottom: isActive ? `3px solid ${colors.primary}` : 'none',
    color: isActive ? colors.primary : colors.textSecondary,
    fontSize: '1rem',
    fontWeight: isActive ? 600 : 400,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  });

  const contentStyles: CSSProperties = {
    marginTop: '2rem',
    padding: '2rem',
    background: colors.surface,
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
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
    <PageBackground>
      <main style={mainStyles}>
        {/* Page Header */}
        <PageHeader
          title={copy.nav.resumes}
          subtitle="Manage and optimize your professional documents"
          
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
            <ResumesListTab resumes={resumes} colors={colors} loading={resumesLoading} />
          )}

          {/* Tab: Upload Resume */}
          {activeTab === 'upload' && <ResumeUploadTab colors={colors} />}

          {/* Tab: Extract Resume Data (Gated - Pro+) */}
          {activeTab === 'extract' && (
            <FeatureGate
              feature="resume-extract"
              requiredTier={getRequiredTier('resume-extract')}
              userTier={user.tier || 'starter'}
            >
              <ResumeExtractTab colors={colors} />
            </FeatureGate>
          )}

          {/* Tab: Analyze Resume (Gated - Pro+) */}
          {activeTab === 'analyze' && (
            <FeatureGate
              feature="resume-analyze"
              requiredTier={getRequiredTier('resume-analyze')}
              userTier={user.tier || 'starter'}
            >
              <ResumeAnalyzeTab colors={colors} />
            </FeatureGate>
          )}

          {/* Tab: Optimize Resume (Gated - Pro+) */}
          {activeTab === 'optimize' && (
            <FeatureGate
              feature="resume-optimize"
              requiredTier={getRequiredTier('resume-optimize')}
              userTier={user.tier || 'starter'}
            >
              <ResumeOptimizeTab colors={colors} />
            </FeatureGate>
          )}
        </div>

        {/* User Tier Info */}
        <div
          style={{
            marginTop: '2rem',
            padding: '1.5rem',
            background: `${colors.primary}20`,
            borderRadius: '8px',
            color: colors.text,
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

import type { RelevntColors } from '../hooks/useRelevntColors';
import type { Resume } from '../hooks/useResumes';

interface TabProps {
  colors: RelevntColors;
}

/**
 * List existing resumes
 */
function ResumesListTab({ resumes, colors, loading }: TabProps & { resumes: Resume[]; loading: boolean }) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: colors.textSecondary }}>Loading resumes...</p>
      </div>
    );
  }
  return (
    <div>
      <h3 style={{ marginBottom: '1.5rem', color: colors.text }}>
        Your Resumes
      </h3>
      {resumes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: colors.textSecondary }}>
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
                background: colors.background,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: colors.text }}>
                  {resume.title}
                </h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: colors.textSecondary }}>
                  Created: {resume.created_at}
                </p>
              </div>
              {resume.ats_score && (
                <div
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: colors.primary,
                  }}
                >
                  {resume.ats_score}%
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
function ResumeUploadTab({ colors }: TabProps) {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div>
      <h3 style={{ marginBottom: '1rem', color: colors.text }}>
        Upload Resume
      </h3>
      <div
        style={{
          border: `2px dashed ${colors.border}`,
          borderRadius: '8px',
          padding: '3rem 2rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.style.background = colors.surface;
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
          <p style={{ fontSize: '1.2rem', fontWeight: 500, color: colors.text }}>
            📄 {copy.form.resumeFile}
          </p>
          <p style={{ fontSize: '0.9rem', color: colors.textSecondary }}>
            PDF, DOCX, or DOC (max 10MB)
          </p>
          {file && (
            <p style={{ marginTop: '1rem', color: colors.primary }}>
              ✓ {file.name}
            </p>
          )}
        </label>
      </div>
      <button
        style={{
          marginTop: '1.5rem',
          padding: '1rem 2rem',
          background: colors.primary,
          color: colors.text,
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
 * Extract resume data using real useExtractResume hook
 */
function ResumeExtractTab({ colors }: TabProps) {
  const { extract, loading, error } = useExtractResume();
  const [resumeText, setResumeText] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleExtract = async () => {
    if (!resumeText.trim()) {
      alert('Please paste your resume text first');
      return;
    }

    const data = await extract(resumeText);
    if (data) {
      setResult(data);
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: '1rem', color: colors.text }}>
        Extract Resume Data
      </h3>
      <p style={{ color: colors.textSecondary, marginBottom: '1.5rem' }}>
        Automatically extract structured data from your resume
      </p>
      <button
        onClick={handleExtract}
        disabled={loading}
        style={{
          padding: '1rem 2rem',
          background: colors.primary,
          color: colors.text,
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
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: colors.background, borderRadius: '8px' }}>
          <h4 style={{ color: colors.text, marginTop: 0 }}>Extracted Data:</h4>
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
 * Analyze resume ATS using real useAnalyzeResume hook
 */
function ResumeAnalyzeTab({ colors }: TabProps) {
  const { analyze, loading, error } = useAnalyzeResume();
  const [resumeText, setResumeText] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      alert('Please paste your resume text first');
      return;
    }

    const data = await analyze(resumeText);
    if (data) {
      setResult(data);
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: '1rem', color: colors.text }}>
        Analyze for ATS
      </h3>
      <p style={{ color: colors.textSecondary, marginBottom: '1.5rem' }}>
        Get instant feedback on how Applicant Tracking Systems will read your resume
      </p>
      <button
        onClick={handleAnalyze}
        disabled={loading}
        style={{
          padding: '1rem 2rem',
          background: colors.primary,
          color: colors.text,
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
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: colors.background, borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '3rem', fontWeight: 700, color: colors.primary }}>
              {result.atsScore}%
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: colors.text }}>
                ATS Score
              </p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: colors.textSecondary }}>
                Overall Assessment: {result.assessment}
              </p>
            </div>
          </div>
          <div>
            <h4 style={{ color: colors.text, marginBottom: '0.5rem' }}>Strengths:</h4>
            <ul style={{ margin: '0 0 1rem 0', color: colors.textSecondary }}>
              {result.strengths.map((s: string) => (
                <li key={s}>✓ {s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ color: colors.text, marginBottom: '0.5rem' }}>Areas to Improve:</h4>
            <ul style={{ margin: 0, color: colors.textSecondary }}>
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
 * Optimize resume using real useOptimizeResume hook with voice engine
 */
function ResumeOptimizeTab({ colors }: TabProps) {
  const { optimize, loading, error } = useOptimizeResume();
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleOptimize = async () => {
    if (!resumeText.trim()) {
      alert('Please paste your resume text first');
      return;
    }

    const data = await optimize(resumeText, jobDescription || undefined);
    if (data) {
      setResult(data);
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: '1rem', color: colors.text }}>
        Get Optimization Suggestions
      </h3>
      <p style={{ color: colors.textSecondary, marginBottom: '1.5rem' }}>
        AI-powered recommendations to improve your ATS score and impact
      </p>
      <button
        onClick={handleOptimize}
        disabled={loading}
        style={{
          padding: '1rem 2rem',
          background: colors.primary,
          color: colors.text,
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
                background: colors.background,
                borderRadius: '8px',
                borderLeft: `4px solid ${suggestion.impact === 'high'
                    ? colors.primary
                    : colors.accent
                  }`,
              }}
            >
              <h4 style={{ margin: '0 0 0.5rem 0', color: colors.text }}>
                {suggestion.type}
                {suggestion.impact === 'high' && ' ⭐ High Impact'}
              </h4>
              <p style={{ margin: '0.5rem 0', color: colors.textSecondary }}>
                <strong>Current:</strong> {suggestion.current}
              </p>
              <p style={{ margin: '0.5rem 0', color: colors.primary }}>
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
