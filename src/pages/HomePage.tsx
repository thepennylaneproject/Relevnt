// src/pages/HomePage.tsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Container } from '../components/shared/Container'

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
    <div className="page-wrapper page-wrapper--centered" style={{ background: 'var(--bg)' }}>
      <Container maxWidth="lg" padding="md">
        <div className="card-shell" style={{ maxWidth: 720, margin: '0 auto' }}>
          <div className="hero__badge">
            <div className="hero__badge-dot" />
            <span>Authentic intelligence for real people</span>
          </div>

          <h1 style={{ marginBottom: 16 }}>
            Job search tools that tell you the truth
            <span style={{ color: 'var(--color-accent)' }}>.</span>
          </h1>

          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: 520, marginBottom: 32, lineHeight: 1.6 }}>
            Relevnt reads job descriptions the way a recruiter would,
            compares them to your real experience, and helps you decide whether
            to apply, what to say, and how to update your story so it still
            feels like you.
          </p>

          <div className="page-two-column" style={{ marginTop: 0, gap: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p className="font-semibold">You bring the experience. Relevnt handles:</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-accent)', marginTop: 6, flexShrink: 0 }} />
                  <span className="text-sm">
                    <strong>Match clarity</strong> instead of guesswork on whether a role is worth your time.
                  </span>
                </li>
                <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-accent)', marginTop: 6, flexShrink: 0 }} />
                  <span className="text-sm">
                    <strong>Resume and answer drafts</strong> in a voice that actually sounds like you, not a corporate bot.
                  </span>
                </li>
                <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-accent)', marginTop: 6, flexShrink: 0 }} />
                  <span className="text-sm">
                    <strong>Skills gap insights</strong> plus learning suggestions so a “no” turns into your next “yes.”
                  </span>
                </li>
              </ul>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p className="font-semibold">What Relevnt will never do:</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-accent)', marginTop: 6, flexShrink: 0, opacity: 0.6 }} />
                  <span className="text-sm text-subtle">Invent experience you do not have.</span>
                </li>
                <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-accent)', marginTop: 6, flexShrink: 0, opacity: 0.6 }} />
                  <span className="text-sm text-subtle">Hide how a match score was calculated.</span>
                </li>
                <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-accent)', marginTop: 6, flexShrink: 0, opacity: 0.6 }} />
                  <span className="text-sm text-subtle">Pressure you into auto apply without clear guardrails.</span>
                </li>
              </ul>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 32 }}>
            <button type="button" className="primary-button" onClick={handlePrimary}>
              {user ? 'Go to dashboard' : 'Get started free'}
            </button>
            <button type="button" className="ghost-button" onClick={handleSecondary}>
              {user ? 'Browse jobs' : 'Log in to your account'}
            </button>
          </div>

          <div style={{ marginTop: 24, fontSize: 13, color: 'var(--text-tertiary)' }}>
            No spam. No fake urgency. Just tools that help you get past the bots and in front of real humans.
          </div>

          {user && (
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
              You are already signed in. We will send you to your dashboard or jobs when you continue.
            </div>
          )}
        </div>
      </Container>
    </div>
  )
}

export default HomePage
