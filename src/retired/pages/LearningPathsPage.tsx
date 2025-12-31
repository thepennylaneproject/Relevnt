import { useState } from 'react';
import { useAnalyzeSkillsGap } from '../hooks/useAnalyzeSkillsGap';
import { Container } from '../components/shared/Container';
import { Icon } from '../components/ui/Icon';
// TODO(buttons): Retired screen still uses legacy button classes; migrate if reactivated.

export default function LearningPathsPage() {
  const { analyze, loading } = useAnalyzeSkillsGap();

  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const [recommendedCourses, setRecommendedCourses] = useState<string[]>([]);

  async function handleRecommend() {
    const result = await analyze(resumeText, jobDescription);

    if (result?.success && result.data) {
      const skills = result.data.missingSkills || [];

      const fakeCatalog = [
        {
          name: 'Coursera: Foundations of Project Management (FREE)',
          matches: ['project management', 'stakeholders', 'communication'],
        },
        {
          name: 'edX: Introduction to Data Analytics (FREE)',
          matches: ['analytics', 'data analysis', 'sql'],
        },
        {
          name: 'Google Career Certificates: IT Support',
          matches: ['it', 'troubleshooting', 'technical support'],
        },
        {
          name: 'Harvard Online — CS50 (FREE)',
          matches: ['python', 'programming', 'software'],
        },
      ];

      const courses = fakeCatalog.filter((course) =>
        course.matches.some((skill) =>
          skills.join(' ').toLowerCase().includes(skill.toLowerCase())
        )
      );

      setRecommendedCourses(courses.map((c) => c.name));
    }
  }

  return (
    <div className="page-wrapper">
      <Container maxWidth="lg" padding="md">
        <header className="hero-shell">
          <div className="hero-header">
            <div className="hero-header-main">
              <div className="hero__badge">
                <Icon name="book" size="sm" hideAccent />
                <span>Learning Center</span>
              </div>
              <h1>Recommended Learning Paths</h1>
              <p className="hero-subtitle">
                Paste your resume and a job description. Relevnt identifies skill gaps and recommends free or accessible courses to help you level up.
              </p>
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

              <div style={{ marginTop: 16 }}>
                <button
                  onClick={handleRecommend}
                  disabled={loading}
                  className="primary-button"
                >
                  {loading ? 'Analyzing…' : 'Get Learning Path Recommendations'}
                </button>
              </div>
            </div>
          </article>

          {recommendedCourses.length > 0 && (
            <article className="surface-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Icon name="lighthouse" size="sm" hideAccent />
                <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Recommended Courses</h2>
              </div>
              <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text)', fontSize: '14px', lineHeight: '1.6' }}>
                {recommendedCourses.map((course, i) => (
                  <li key={i} style={{ marginBottom: '0.5rem' }}>{course}</li>
                ))}
              </ul>
            </article>
          )}
        </div>
      </Container>
    </div>
  );
}
