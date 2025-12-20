/**
 * ============================================================================
 * SETTINGS PAGE
 * ============================================================================
 * 🎯 PURPOSE: User preferences and account settings
 *
 * Sections:
 * - Profile information
 * - Voice settings (links to VoiceProfilePage)
 * - Job search preferences
 * - Account settings
 * ============================================================================
 */

import { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PageBackground } from '../components/shared/PageBackground';
import { PageHeader } from '../components/shared/PageHeader';
import { useRelevntColors } from '../hooks/useRelevntColors';
import { TIERS } from '../config/tiers';

export function SettingsPage(): JSX.Element {
  const { user } = useAuth();
  const colors = useRelevntColors();
  const isDark = colors.background === '#1A1A1A';

  const userTier = (user?.user_metadata?.tier as string) || 'starter';
  const tierInfo = TIERS[userTier as keyof typeof TIERS] || TIERS.starter;

  // ============================================================
  // STYLES
  // ============================================================

  const containerStyles: CSSProperties = {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '40px 20px',
  };

  const sectionStyles: CSSProperties = {
    backgroundColor: colors.surface,
    borderRadius: '12px',
    padding: '32px',
    marginBottom: '24px',
    border: `1px solid ${colors.border}`,
  };

  const sectionTitleStyles: CSSProperties = {
    fontSize: '20px',
    fontWeight: 600,
    color: colors.text,
    marginBottom: '16px',
  };

  const labelStyles: CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: colors.textSecondary,
    marginBottom: '4px',
    display: 'block',
  };

  const valueStyles: CSSProperties = {
    fontSize: '16px',
    color: colors.text,
    marginBottom: '16px',
  };

  const linkButtonStyles: CSSProperties = {
    display: 'inline-block',
    padding: '10px 20px',
    backgroundColor: colors.accent,
    color: '#000',
    textDecoration: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    border: 'none',
    cursor: 'pointer',
  };

  const tierBadgeStyles: CSSProperties = {
    display: 'inline-block',
    padding: '8px 16px',
    backgroundColor: isDark ? 'rgba(212, 165, 116, 0.15)' : 'rgba(212, 165, 116, 0.2)',
    color: colors.accent,
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '16px',
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (!user) {
    return (
      <PageBackground>
        <div style={containerStyles}>
          <h2>Please log in to access settings</h2>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground>
      <div style={containerStyles}>
        {/* PAGE HEADER */}
        <PageHeader
          title="Settings"
          subtitle="Manage your account and preferences"
          textPosition="left"
        />

        {/* PROFILE SECTION */}
        <div style={sectionStyles}>
          <h2 style={sectionTitleStyles}>Profile</h2>

          <label style={labelStyles}>Email</label>
          <div style={valueStyles}>{user.email}</div>

          <label style={labelStyles}>Account Tier</label>
          <div style={tierBadgeStyles}>
            ✨ {tierInfo.name}
          </div>

          <div style={{ marginTop: '16px', fontSize: '14px', color: colors.textSecondary }}>
            {tierInfo.description}
          </div>
        </div>

        {/* VOICE SETTINGS SECTION */}
        <div style={sectionStyles}>
          <h2 style={sectionTitleStyles}>Voice Settings</h2>
          <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '16px' }}>
            Configure your AI writing voice for authentic, personalized application materials.
          </p>

          <Link to="/settings/voice" style={linkButtonStyles}>
            Configure Voice Settings →
          </Link>
        </div>

        {/* JOB PREFERENCES SECTION */}
        <div style={sectionStyles}>
          <h2 style={sectionTitleStyles}>Job Search Preferences</h2>
          <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '16px' }}>
            Set your job search criteria, preferred locations, and career goals.
          </p>

          {/* TODO: Connect to useCareerProfile when available */}
          <div style={{
            padding: '16px',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            borderRadius: '8px',
            fontSize: '14px',
            color: colors.textSecondary
          }}>
            🚧 Career profile preferences coming soon
          </div>
        </div>

        {/* AUTO-APPLY SETTINGS */}
        <div style={sectionStyles}>
          <h2 style={sectionTitleStyles}>Auto-Apply Settings</h2>
          <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '16px' }}>
            Configure automated job application preferences and criteria.
          </p>

          <Link to="/auto-apply" style={linkButtonStyles}>
            Manage Auto-Apply →
          </Link>
        </div>

        {/* ACCOUNT ACTIONS */}
        <div style={sectionStyles}>
          <h2 style={sectionTitleStyles}>Account</h2>

          <button
            style={{
              ...linkButtonStyles,
              backgroundColor: 'transparent',
              border: `1px solid ${colors.error}`,
              color: colors.error,
              marginRight: '12px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.error;
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.error;
            }}
          >
            Delete Account
          </button>

          <Link
            to="/password-reset"
            style={{
              ...linkButtonStyles,
              backgroundColor: 'transparent',
              border: `1px solid ${colors.border}`,
              color: colors.text,
            }}
          >
            Change Password
          </Link>
        </div>
      </div>
    </PageBackground>
  );
}

export default SettingsPage;
