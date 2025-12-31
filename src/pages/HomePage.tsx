// src/pages/HomePage.tsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Container } from '../components/shared/Container'
import { FeatureIcon } from '../components/ui/FeatureIcon'
import { Button } from '../components/ui/Button'

// Cloudinary hero image URLs with f_auto for automatic WebP delivery
const HERO_BG_LIGHT = 'https://res.cloudinary.com/sarah-sahl/image/upload/f_auto,q_auto/v1766284025/Starter_Hero_Light_16x9_v04_psu2by.jpg'

const HomePage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handlePrimary = () => {
    if (user) {
      navigate('/dashboard')
    } else {
      navigate('/signup')
    }
  }

  const handleSecondary = () => {
    if (user) {
      navigate('/jobs')
    } else {
      navigate('/login')
    }
  }

  return (
    <div
      className="page-wrapper page-wrapper--centered"
      style={{
        background: 'var(--color-bg)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Hero background image - subtle, faded */}
      <div
        className="hero-background"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${HERO_BG_LIGHT})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.06,
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" padding="md">
        <div className="card-shell" style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          {/* Headline */}
          <h1 style={{ marginBottom: 16 }}>
            Job search tools that tell you the truth
            <span style={{ color: 'var(--color-accent)' }}>.</span>
          </h1>

          <p style={{ fontSize: '1.05rem', color: 'var(--color-ink-secondary)', maxWidth: 560, marginBottom: 40, lineHeight: 1.6 }}>
            Relevnt reads job descriptions the way a recruiter would,
            compares them to your real experience, and helps you decide whether
            to apply, what to say, and how to update your story so it still
            feels like you.
          </p>

          {/* Feature Grid with Icons */}
          <div className="home-features" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 24,
            marginBottom: 40
          }}>
            {/* Feature 1: Match Clarity */}
            <div className="feature-card" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <FeatureIcon name="high-matches" size={48} title="Match Clarity" />
              <div>
                <strong style={{ display: 'block', marginBottom: 4 }}>Match clarity</strong>
                <span className="text-sm" style={{ color: 'var(--color-ink-secondary)' }}>
                  No guesswork on whether a role is worth your time.
                </span>
              </div>
            </div>

            {/* Feature 2: Resume Drafts */}
            <div className="feature-card" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <FeatureIcon name="profile-filetext" size={48} title="Resume Drafts" />
              <div>
                <strong style={{ display: 'block', marginBottom: 4 }}>Resume drafts</strong>
                <span className="text-sm" style={{ color: 'var(--color-ink-secondary)' }}>
                  In a voice that sounds like you, not a corporate bot.
                </span>
              </div>
            </div>

            {/* Feature 3: Skills Gap */}
            <div className="feature-card" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <FeatureIcon name="ai-tools-wrench" size={48} title="Skills Gap Insights" />
              <div>
                <strong style={{ display: 'block', marginBottom: 4 }}>Skills gap insights</strong>
                <span className="text-sm" style={{ color: 'var(--color-ink-secondary)' }}>
                  Turn a "no" into your next "yes" with learning suggestions.
                </span>
              </div>
            </div>

            {/* Feature 4: Interview Prep */}
            <div className="feature-card" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <FeatureIcon name="interviews" size={48} title="Interview Prep" />
              <div>
                <strong style={{ display: 'block', marginBottom: 4 }}>Interview prep</strong>
                <span className="text-sm" style={{ color: 'var(--color-ink-secondary)' }}>
                  Practice with context from the actual job description.
                </span>
              </div>
            </div>
          </div>

          {/* What we won't do - smaller, more subtle */}
          <div style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-graphite-faint)',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 32
          }}>
            <p className="text-sm font-semibold" style={{ marginBottom: 8, color: 'var(--color-ink-tertiary)' }}>
              What Relevnt will never do:
            </p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px 24px',
              fontSize: '0.85rem',
              color: 'var(--color-ink-tertiary)'
            }}>
              <li>• Invent experience you don't have</li>
              <li>• Hide how a match score was calculated</li>
              <li>• Pressure you into auto-apply</li>
            </ul>
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Button type="button" variant="primary" onClick={handlePrimary}>
              {user ? 'Go to dashboard' : 'Get started free'}
            </Button>
            <Button type="button" variant="ghost" onClick={handleSecondary}>
              {user ? 'Browse jobs' : 'Log in to your account'}
            </Button>
          </div>

          <div style={{ marginTop: 24, fontSize: 13, color: 'var(--color-ink-tertiary)' }}>
            No spam. No fake urgency. Just tools that help you get past the bots and in front of real humans.
          </div>

          {user && (
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--color-ink-secondary)' }}>
              You are already signed in. We will send you to your dashboard or jobs when you continue.
            </div>
          )}
        </div>
      </Container>
    </div>
  )
}

export default HomePage
