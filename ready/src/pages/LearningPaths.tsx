/**
 * Learning Paths Page - Ready App
 * 
 * Get personalized learning recommendations based on skill gaps.
 * Route: /learn
 */

import { useState, useEffect } from 'react';
import { Container } from '../components/shared/Container';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';

interface LearningResource {
  id: string;
  title: string;
  provider: string;
  url?: string;
  duration?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  skill_tags: string[];
  is_free: boolean;
  completed?: boolean;
}

interface LearningRecommendation {
  id: string;
  user_id: string;
  skill_gaps: string[];
  resources: LearningResource[];
  created_at: string;
}

export default function LearningPaths() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<LearningRecommendation | null>(null);
  const [skillGaps, setSkillGaps] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchSkillGapsAndRecommendations();
    }
  }, [user]);

  const fetchSkillGapsAndRecommendations = async () => {
    if (!user?.id) return;
    
    try {
      // Get most recent skill gap analysis
      const { data: analysis } = await supabase
        .from('skill_gap_analyses')
        .select('missing_skills')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (analysis?.missing_skills) {
        setSkillGaps(analysis.missing_skills);
      }

      // Get existing recommendations
      const { data: existingRecs } = await supabase
        .from('learning_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingRecs) {
        setRecommendations(existingRecs as any);
      }
    } catch (err) {
      console.warn('No existing data found');
    }
  };

  const handleGetRecommendations = async () => {
    if (!user?.id || skillGaps.length === 0) {
      showToast('Complete a skills gap analysis first', 'error');
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/.netlify/functions/learning_recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ skillGaps })
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const result = await response.json();
      
      // Save to database
      const { data: savedRec, error: saveError } = await supabase
        .from('learning_recommendations')
        .insert({
          user_id: user.id,
          skill_gaps: skillGaps,
          resources: result.data.resources || []
        })
        .select()
        .single();

      if (saveError) throw saveError;
      
      setRecommendations(savedRec as any);
      showToast('Learning path created!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to get recommendations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleResourceComplete = async (resourceId: string) => {
    if (!recommendations) return;

    const updatedResources = recommendations.resources.map(r => 
      r.id === resourceId ? { ...r, completed: !r.completed } : r
    );

    try {
      const { error } = await supabase
        .from('learning_recommendations')
        .update({ resources: updatedResources })
        .eq('id', recommendations.id);

      if (error) throw error;
      
      setRecommendations({ ...recommendations, resources: updatedResources });
    } catch (err) {
      console.error('Failed to update resource:', err);
    }
  };

  const completedCount = recommendations?.resources.filter(r => r.completed).length || 0;
  const totalCount = recommendations?.resources.length || 0;

  return (
    <div className="page-wrapper">
      <Container maxWidth="lg" padding="md">
        <header className="page-header">
          <h1>Learning Paths</h1>
          <p className="page-subtitle">
            Get personalized course recommendations based on your skill gaps. Track your progress as you learn.
          </p>
        </header>

        <div className="page-stack">
          {/* Skill Gaps Summary */}
          <article className="surface-card">
            <div className="section-header">
              <Icon name="search" size="sm" />
              <h2>Your Skill Gaps</h2>
            </div>
            
            {skillGaps.length > 0 ? (
              <>
                <div className="skill-chips">
                  {skillGaps.slice(0, 8).map((skill, i) => (
                    <span key={i} className="chip">{skill}</span>
                  ))}
                  {skillGaps.length > 8 && (
                    <span className="chip chip--muted">+{skillGaps.length - 8} more</span>
                  )}
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <Button
                    type="button"
                    onClick={handleGetRecommendations}
                    disabled={loading}
                    variant="primary"
                  >
                    {loading ? 'Finding Resources...' : 'Get Learning Recommendations'}
                  </Button>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>Complete a skills gap analysis first to get personalized learning recommendations.</p>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => window.location.href = '/skills-gap'}
                >
                  Analyze Skills Gap
                </Button>
              </div>
            )}
          </article>

          {/* Learning Resources */}
          {recommendations && recommendations.resources.length > 0 && (
            <>
              {/* Progress */}
              <article className="surface-card progress-card">
                <div className="progress-header">
                  <h2>Learning Progress</h2>
                  <span className="progress-percentage">
                    {Math.round((completedCount / totalCount) * 100)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(completedCount / totalCount) * 100}%` }}
                  />
                </div>
                <p className="progress-text">
                  {completedCount} of {totalCount} resources completed
                </p>
              </article>

              {/* Resources Grid */}
              <article className="surface-card">
                <div className="section-header">
                  <Icon name="book" size="sm" />
                  <h2>Recommended Resources</h2>
                </div>
                <div className="resources-grid">
                  {recommendations.resources.map((resource) => (
                    <div 
                      key={resource.id} 
                      className={`resource-card ${resource.completed ? 'completed' : ''}`}
                    >
                      <div className="resource-header">
                        <button 
                          className="resource-check"
                          onClick={() => toggleResourceComplete(resource.id)}
                        >
                          {resource.completed ? '✓' : '○'}
                        </button>
                        <div className="resource-meta">
                          <span className="resource-provider">{resource.provider}</span>
                          {resource.is_free && <span className="free-badge">FREE</span>}
                        </div>
                      </div>
                      <h3 className="resource-title">{resource.title}</h3>
                      <div className="resource-details">
                        {resource.duration && <span>{resource.duration}</span>}
                        <span className={`difficulty difficulty--${resource.difficulty}`}>
                          {resource.difficulty}
                        </span>
                      </div>
                      <div className="resource-skills">
                        {resource.skill_tags.slice(0, 3).map((skill, i) => (
                          <span key={i} className="skill-tag">{skill}</span>
                        ))}
                      </div>
                      {resource.url && (
                        <a 
                          href={resource.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="resource-link"
                        >
                          Start Learning →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            </>
          )}
        </div>
      </Container>

      <style>{learningPathsStyles}</style>
    </div>
  );
}

const learningPathsStyles = `
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

.skill-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  padding: 0.25rem 0.75rem;
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 1rem;
  font-size: 0.8125rem;
}

.chip--muted {
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.empty-state p {
  margin-bottom: 1rem;
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

/* Resources Grid */
.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.resource-card {
  padding: 1.25rem;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.resource-card:hover {
  border-color: var(--color-accent);
}

.resource-card.completed {
  opacity: 0.6;
}

.resource-card.completed .resource-title {
  text-decoration: line-through;
}

.resource-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.resource-check {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: var(--color-accent);
  cursor: pointer;
  padding: 0;
}

.resource-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.resource-provider {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.free-badge {
  font-size: 0.625rem;
  font-weight: 700;
  background: #A8D5BA;
  color: #1a1a1a;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}

.resource-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.resource-details {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.difficulty {
  font-weight: 600;
}

.difficulty--beginner { color: #A8D5BA; }
.difficulty--intermediate { color: var(--color-accent); }
.difficulty--advanced { color: #E8A8A8; }

.resource-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-bottom: 0.75rem;
}

.skill-tag {
  font-size: 0.6875rem;
  padding: 0.125rem 0.5rem;
  background: rgba(212, 165, 116, 0.1);
  color: var(--color-accent);
  border-radius: 0.25rem;
}

.resource-link {
  display: inline-block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-accent);
  text-decoration: none;
  transition: opacity 0.2s;
}

.resource-link:hover {
  opacity: 0.8;
}
`;
