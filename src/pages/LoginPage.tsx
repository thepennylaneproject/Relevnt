/**
 * ============================================================================
 * LOGIN PAGE (FULLY REFACTORED - PHASE 6.2)
 * ============================================================================
 * 🎯 PURPOSE: User authentication login form
 * 
 * Features:
 * - Email/password login form
 * - Error handling with user feedback
 * - Loading state during submission
 * - "Forgot password" link
 * - Signup CTA for new users
 * - Brand styling (minimal, focused)
 * 
 * Brand Integration:
 * - PageBackground wrapper (subtle)
 * - All copy from i18n
 * - Theme-aware colors
 * - Brand accent colors for buttons
 * 
 * 🎓 LEARNING NOTE: This page demonstrates minimal, focused design.
 * Login pages should reduce friction - no distractions, just clarity.
 * ============================================================================
 */

import { useState, CSSProperties, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/useTheme';
import { copy } from '../config/i18n.config';
import { PageBackground } from '../components/shared/PageBackground';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginError {
  field?: string;
  message: string;
}

/**
 * LoginPage Component
 */
export function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const { mode } = useTheme();
  const { signInWithEmail } = useAuth();

  const isDark = mode === 'Dark';

  // ============================================================
  // STATE
  // ============================================================

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // ============================================================
  // THEME COLORS
  // ============================================================

  const themeColors = useMemo(() => ({
    bg: isDark ? '#0f0f0f' : '#ffffff',
    surface: isDark ? '#1a1a1a' : '#f9fafb',
    text: isDark ? '#f5f5f5' : '#1a1a1a',
    textSecondary: isDark ? '#b0b0b0' : '#666666',
    border: isDark ? '#333333' : '#e5e7eb',
    primary: '#4E808D',
    accent: '#D4A574',
    error: '#ef4444',
    success: '#10b981',
  }), [isDark]);

  // ============================================================
  // VALIDATION & SUBMISSION
  // ============================================================

  const validateForm = (): boolean => {
    // Email validation
    if (!formData.email.trim()) {
      setError({ field: 'email', message: 'Email is required' });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError({ field: 'email', message: 'Please enter a valid email' });
      return false;
    }

    // Password validation
    if (!formData.password) {
      setError({ field: 'password', message: 'Password is required' });
      return false;
    }

    if (formData.password.length < 6) {
      setError({ field: 'password', message: 'Password must be at least 6 characters' });
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!validateForm()) return;

    try {
      setLoading(true);
      await signInWithEmail(formData.email, formData.password);
      // Navigation happens automatically via auth context
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError({ message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (submitted && error?.field === field) {
      setError(null); // Clear error for this field on change
    }
  };

  // ============================================================
  // STYLES
  // ============================================================

  const containerStyles: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
  };

  const cardStyles: CSSProperties = {
    backgroundColor: themeColors.surface,
    borderRadius: '12px',
    padding: '48px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.08)',
  };

  const titleStyles: CSSProperties = {
    fontSize: '28px',
    fontWeight: 700,
    color: themeColors.text,
    marginBottom: '8px',
    textAlign: 'center',
  };

  const subtitleStyles: CSSProperties = {
    fontSize: '14px',
    color: themeColors.textSecondary,
    marginBottom: '32px',
    textAlign: 'center',
  };

  const formGroupStyles: CSSProperties = {
    marginBottom: '20px',
  };

  const labelStyles: CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: themeColors.text,
    marginBottom: '8px',
  };

  const inputStyles: CSSProperties = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: `1px solid ${themeColors.border}`,
    backgroundColor: isDark ? '#0f0f0f' : '#ffffff',
    color: themeColors.text,
    fontSize: '14px',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  };

  const inputErrorStyles: CSSProperties = {
    ...inputStyles,
    borderColor: themeColors.error,
    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.05)',
  };

  const errorTextStyles: CSSProperties = {
    fontSize: '13px',
    color: themeColors.error,
    marginTop: '6px',
  };

  const buttonStyles: CSSProperties = {
    width: '100%',
    padding: '12px',
    backgroundColor: themeColors.accent,
    color: '#000000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    opacity: loading ? 0.7 : 1,
    boxShadow: '0 4px 12px rgba(212, 165, 116, 0.25)',
    marginTop: '24px',
  };

  const linkStyles: CSSProperties = {
    color: themeColors.primary,
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  };

  const footerStyles: CSSProperties = {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '14px',
    color: themeColors.textSecondary,
  };

  const signupLinkStyles: CSSProperties = {
    ...linkStyles,
    marginLeft: '4px',
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <PageBackground version="v2">
      <div style={containerStyles}>
        <div style={cardStyles}>
          {/* Header */}
          <h1 style={titleStyles}>{copy.nav.login}</h1>
          <p style={subtitleStyles}>Welcome back to Relevnt</p>

          {/* Generic error message */}
          {error && !error.field && (
            <div
              style={{
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                borderLeft: `3px solid ${themeColors.error}`,
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '20px',
              }}
            >
              <p style={{ ...errorTextStyles, margin: 0 }}>{error.message}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div style={formGroupStyles}>
              <label htmlFor="email" style={labelStyles}>
                {copy.form.email}
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                style={error?.field === 'email' ? inputErrorStyles : inputStyles}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = themeColors.primary)
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = error?.field === 'email' ? themeColors.error : themeColors.border)
                }
                disabled={loading}
              />
              {error?.field === 'email' && (
                <p style={errorTextStyles}>{error.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div style={formGroupStyles}>
              <label htmlFor="password" style={labelStyles}>
                {copy.form.password}
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                style={error?.field === 'password' ? inputErrorStyles : inputStyles}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = themeColors.primary)
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = error?.field === 'password' ? themeColors.error : themeColors.border)
                }
                disabled={loading}
              />
              {error?.field === 'password' && (
                <p style={errorTextStyles}>{error.message}</p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div style={{ textAlign: 'right', marginBottom: '24px' }}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/password-reset');
                }}
                style={linkStyles}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              style={buttonStyles}
              disabled={loading}
              onMouseEnter={(e) =>
                !loading && (e.currentTarget.style.transform = 'translateY(-2px)')
              }
              onMouseLeave={(e) =>
                !loading && (e.currentTarget.style.transform = 'translateY(0)')
              }
            >
              {loading ? 'Signing in...' : copy.nav.login}
            </button>
          </form>

          {/* Signup Link */}
          <div style={footerStyles}>
            Don't have an account?
            <a
              onClick={() => navigate('/signup')}
              style={signupLinkStyles}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {copy.nav.signup}
            </a>
          </div>
        </div>
      </div>
    </PageBackground>
  );
}

export default LoginPage;
