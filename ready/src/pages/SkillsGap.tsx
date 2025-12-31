/**
 * Skills Gap Page - Ready App
 * 
 * Analyze skills gap and track progress on addressing gaps.
 * Route: /skills-gap
 */

import { useState, useEffect } from 'react';
import { useAnalyzeSkillsGap } from '../hooks/useAnalyzeSkillsGap';
import { Container } from '../components/shared/Container';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';

interface SkillGap {
  skill: string;
  priority: 'high' | 'medium' | 'low';
  addressed: boolean;
  notes?: string;
}

interface SkillGapAnalysis {
  id: string;
  user_id: string;
  target_role?: string;
  missing_skills: string[];
  recommendations: string[];
  skill_gaps: SkillGap[];
  created_at: string;
  updated_at: string;
}

export default function SkillsGap() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { analyze, loading, error } = useAnalyzeSkillsGap();

  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  
  const [analysis, setAnalysis] = useState<SkillGapAnalysis | null>(null);
  const [previousAnalyses, setPreviousAnalyses] = useState<SkillGapAnalysis[]>([]);

  useEffect(() => {
    if (user) {
      fetchPreviousAnalyses();
    }
  }, [user]);

  const fetchPreviousAnalyses = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error: fetchError } = await supabase
        .from('skill_gap_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (fetchError) throw fetchError;
      setPreviousAnalyses(data as any[] || []);
      
      // Load most recent analysis
      if (data && data.length > 0) {
        setAnalysis(data[0] as any);
      }
    } catch (err) {
      console.error('Failed to fetch analyses:', err);
    }
  };

  async function handleAnalyze() {
    if (!user?.id) return;
    
    const result = await analyze(resumeText, targetRole);
    if (result?.success && result.data) {
      // Transform to skill gaps with tracking
      const skillGaps: SkillGap[] = (result.data.missingSkills || []).map((skill: string, i: number) => ({
        skill,
        priority: i < 3 ? 'high' : i < 6 ? 'medium' : 'low',
        addressed: false
      }));

      // Save to database
      try {
        const { data: savedAnalysis, error: saveError } = await supabase
          .from('skill_gap_analyses')
          .insert({
            user_id: user.id,
            target_role: targetRole,
            missing_skills: result.data.missingSkills || [],
            recommendations: result.data.recommendations || [],
            skill_gaps: skillGaps
          })
          .select()
          .single();

        if (saveError) throw saveError;
        
        setAnalysis(savedAnalysis as any);
        showToast('Analysis saved!', 'success');
        fetchPreviousAnalyses();
      } catch (err) {
        console.error('Failed to save analysis:', err);
        // Still show results even if save fails
        setAnalysis({
          id: 'temp',
          user_id: user.id,
          target_role: targetRole,
          missing_skills: result.data.missingSkills || [],
          recommendations: result.data.recommendations || [],
          skill_gaps: skillGaps,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
  }

  const toggleSkillAddressed = async (skillIndex: number) => {
    if (!analysis || analysis.id === 'temp') return;

    const updatedSkillGaps = [...analysis.skill_gaps];
    updatedSkillGaps[skillIndex].addressed = !updatedSkillGaps[skillIndex].addressed;

    try {
      const { error: updateError } = await supabase
        .from('skill_gap_analyses')
        .update({ 
          skill_gaps: updatedSkillGaps,
          updated_at: new Date().toISOString()
        })
        .eq('id', analysis.id);

      if (updateError) throw updateError;
      
      setAnalysis({ ...analysis, skill_gaps: updatedSkillGaps });
    } catch (err) {
      console.error('Failed to update skill status:', err);
    }
  };

  const progressPercentage = analysis?.skill_gaps 
    ? Math.round((analysis.skill_gaps.filter(g => g.addressed).length / analysis.skill_gaps.length) * 100)
    : 0;

  return (
    <div className="page-wrapper">
      <Container maxWidth="lg" padding="md">
        <header className="page-header">
          <h1>Skills Gap Analyzer</h1>
          <p className="page-subtitle">
            Understand what's standing between you and your target role. Track your progress as you build new skills.
          </p>
        </header>

        <div className="page-stack">
          <article className="surface-card">
            <div className="form-grid">
              <div className="input-group">
                <label>Target Role</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Senior Product Manager"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                <div className="input-group">
                  <label>Your Experience / Resume</label>
                  <textarea
                    className="form-textarea"
                    rows={8}
                    placeholder="Paste your resume or describe your experience..."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <Button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={loading || !resumeText.trim()}
                  variant="primary"
                >
                  {loading ? 'Analyzing…' : 'Analyze Skills Gap'}
                </Button>

                {error && (
                  <p className="error-text">Something went wrong. Please try again.</p>
                )}
              </div>
            </div>
          </article>

          {analysis && analysis.skill_gaps.length > 0 && (
            <div className="skills-analysis-results">
              {/* Progress Tracker */}
              <article className="surface-card progress-card">
                <div className="progress-header">
                  <h2>Your Progress</h2>
                  <span className="progress-percentage">{progressPercentage}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="progress-text">
                  {analysis.skill_gaps.filter(g => g.addressed).length} of {analysis.skill_gaps.length} skills addressed
                </p>
              </article>

              {/* Skills Grid */}
              <article className="surface-card">
                <div className="section-header">
                  <Icon name="search" size="sm" />
                  <h2>Skills to Develop</h2>
                </div>
                <div className="skills-gap-grid">
                  {analysis.skill_gaps.map((gap, i) => (
                    <div 
                      key={i} 
                      className={`skill-gap-item priority--${gap.priority} ${gap.addressed ? 'addressed' : ''}`}
                      onClick={() => toggleSkillAddressed(i)}
                    >
                      <div className="skill-gap-check">
                        {gap.addressed ? '✓' : '○'}
                      </div>
                      <div className="skill-gap-content">
                        <span className="skill-name">{gap.skill}</span>
                        <span className={`priority-badge priority--${gap.priority}`}>
                          {gap.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              {/* Recommendations */}
              <article className="surface-card">
                <div className="section-header">
                  <Icon name="lighthouse" size="sm" />
                  <h2>Recommendations</h2>
                </div>
                <ul className="recommendations-list">
                  {analysis.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </article>
            </div>
          )}
        </div>
      </Container>

      <style>{skillsGapStyles}</style>
    </div>
  );
}

const skillsGapStyles = `
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

.page-stack {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-group label {
  display: block;
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text);
  font-size: 1rem;
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
}

.error-text {
  color: var(--color-error);
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.skills-analysis-results {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Progress Card */
.progress-card {
  padding: 1.5rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.progress-header h2 {
  font-size: 1rem;
  font-weight: 600;
}

.progress-percentage {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-accent);
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
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}

/* Section Header */
.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.section-header h2 {
  font-size: 1rem;
  font-weight: 600;
}

/* Skills Grid */
.skills-gap-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.skill-gap-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.skill-gap-item:hover {
  border-color: var(--color-accent);
}

.skill-gap-item.addressed {
  opacity: 0.6;
  text-decoration: line-through;
}

.skill-gap-item.priority--high {
  border-left: 3px solid #E8A8A8;
}

.skill-gap-item.priority--medium {
  border-left: 3px solid var(--color-accent);
}

.skill-gap-item.priority--low {
  border-left: 3px solid var(--border-subtle);
}

.skill-gap-check {
  font-size: 1.25rem;
  color: var(--color-accent);
}

.skill-gap-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.skill-name {
  font-weight: 500;
}

.priority-badge {
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.priority-badge.priority--high { color: #E8A8A8; }
.priority-badge.priority--medium { color: var(--color-accent); }
.priority-badge.priority--low { color: var(--text-secondary); }

/* Recommendations */
.recommendations-list {
  padding-left: 1.25rem;
  margin: 0;
  color: var(--text);
  font-size: 0.9375rem;
  line-height: 1.6;
}

.recommendations-list li {
  margin-bottom: 0.5rem;
}
`;
