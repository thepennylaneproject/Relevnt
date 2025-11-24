// src/pages/HomePage.tsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useRelevntColors } from '../hooks'
import { useAuth } from '../contexts/AuthContext'
import { Container } from '../components/shared/Container'

const HomePage: React.FC = () => {
  const colors = useRelevntColors()
  const { user } = useAuth()
  const navigate = useNavigate()

  const wrapper: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  }

  const card: React.CSSProperties = {
    maxWidth: 720,
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: '32px 32px 28px',
    boxShadow: '0 22px 45px rgba(15, 18, 20, 0.14)',
    border: `1px solid ${colors.borderLight}`,
  }

  const badgeRow: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 10px',
    borderRadius: 999,
    backgroundColor: colors.surfaceHover,
    border: `1px solid ${colors.borderLight}`,
    fontSize: 11,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: colors.textSecondary,
    marginBottom: 16,
  }

  const badgeDot: React.CSSProperties = {
    width: 9,
    height: 9,
    borderRadius: '999px',
    backgroundColor: colors.accent,
  }

  const title: React.CSSProperties = {
    fontSize: 30,
    lineHeight: 1.2,
    letterSpacing: '0.02em',
    marginBottom: 12,
    color: colors.text,
  }

  const subtitle: React.CSSProperties = {
    fontSize: 15,
    lineHeight: 1.6,
    color: colors.textSecondary,
    maxWidth: 520,
    marginBottom: 24,
  }

  const strong: React.CSSProperties = {
    color: colors.text,
    fontWeight: 600,
  }

  const grid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.6fr)',
    gap: 24,
  }

  const column: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    fontSize: 13,
    color: colors.textSecondary,
  }

  const list: React.CSSProperties = {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  }

  const listItem: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
  }

  const bulletDot: React.CSSProperties = {
    width: 7,
    height: 7,
    borderRadius: '999px',
    marginTop: 5,
    backgroundColor: colors.accent,
    opacity: 0.7,
  }

  const ctaRow: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 24,
  }

  const primaryButton: React.CSSProperties = {
    padding: '10px 18px',
    borderRadius: 999,
    border: 'none',
    backgroundColor: colors.primary,
    color: colors.text,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  }

  const secondaryButton: React.CSSProperties = {
    padding: '9px 16px',
    borderRadius: 999,
    border: `1px solid ${colors.borderLight}`,
    backgroundColor: colors.surfaceHover,
    color: colors.textSecondary,
    fontSize: 13,
    cursor: 'pointer',
  }

  const footnote: React.CSSProperties = {
    marginTop: 12,
    fontSize: 11,
    color: colors.mutedText,
  }

  const signedInHint: React.CSSProperties = {
    marginTop: 4,
    fontSize: 11,
    color: colors.textSecondary,
  }

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
    <div style={wrapper}>
      <Container maxWidth="lg" padding="md">
        <div style={card}>
          <div style={badgeRow}>
            <div style={badgeDot} />
            <span>Authentic intelligence for real people</span>
          </div>

          <h1 style={title}>
            Job search tools that tell you the truth
            <span style={{ color: colors.accent }}>.</span>
          </h1>

          <p style={subtitle}>
            Relevnt reads job descriptions the way a recruiter would,
            compares them to your real experience, and helps you decide whether
            to apply, what to say, and how to update your story so it still
            feels like you.
          </p>

          <div style={grid}>
            <div style={column}>
              <p style={strong}>You bring the experience. Relevnt handles:</p>
              <ul style={list}>
                <li style={listItem}>
                  <div style={bulletDot} />
                  <span>
                    <strong>Match clarity</strong> instead of guesswork on whether a role is worth your time.
                  </span>
                </li>
                <li style={listItem}>
                  <div style={bulletDot} />
                  <span>
                    <strong>Resume and answer drafts</strong> in a voice that actually sounds like you, not a corporate bot.
                  </span>
                </li>
                <li style={listItem}>
                  <div style={bulletDot} />
                  <span>
                    <strong>Skills gap insights</strong> plus learning suggestions so a “no” turns into your next “yes.”
                  </span>
                </li>
              </ul>
            </div>

            <div style={column}>
              <p style={strong}>What Relevnt will never do:</p>
              <ul style={list}>
                <li style={listItem}>
                  <div style={bulletDot} />
                  <span>Invent experience you do not have.</span>
                </li>
                <li style={listItem}>
                  <div style={bulletDot} />
                  <span>Hide how a match score was calculated.</span>
                </li>
                <li style={listItem}>
                  <div style={bulletDot} />
                  <span>Pressure you into auto apply without clear guardrails.</span>
                </li>
              </ul>
            </div>
          </div>

          <div style={ctaRow}>
            <button type="button" style={primaryButton} onClick={handlePrimary}>
              {user ? 'Go to dashboard' : 'Get started free'}
            </button>
            <button type="button" style={secondaryButton} onClick={handleSecondary}>
              {user ? 'Browse jobs' : 'Log in to your account'}
            </button>
          </div>

          <div style={footnote}>
            No spam. No fake urgency. Just tools that help you get past the bots and in front of real humans.
          </div>

          {user && (
            <div style={signedInHint}>
              You are already signed in. We will send you to your dashboard or jobs when you continue.
            </div>
          )}
        </div>
      </Container>
    </div>
  )
}

export default HomePage
