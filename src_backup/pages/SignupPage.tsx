/**
 * ============================================================================
 * SIGNUP PAGE (FULLY REFACTORED - PHASE 6.2)
 * ============================================================================
 * 🎯 PURPOSE: New user registration with automatic .edu promo detection
 * 
 * Features:
 * - Email/password signup form
 * - Automatic .EDU promo detection
 * - Password strength validation
 * - Terms acceptance
 * - Error handling
 * - Loading state
 * - Login CTA for existing users
 * 
 * Brand Integration:
 * - PageBackground wrapper (welcoming)
 * - All copy from i18n
 * - Theme-aware colors
 * - Brand accent colors
 * - Auto .EDU banner if applicable
 * 
 * 🎓 LEARNING NOTE: This page demonstrates smart onboarding.
 * Auto-detecting .edu emails and triggering the promo is a conversion win.
 * Keep the form short - only essentials for signup.
 * ============================================================================
 */

import { useState, CSSProperties, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { copy } from '../config/i18n.config';
import { PageBackground } from '../components/shared/PageBackground';
import { useRelevntColors } from '../hooks';

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface SignupError {
  field?: string;
  message: string;
}

/**
 * SignupPage Component
 */
export function SignupPage(): JSX.Element {
  const navigate = useNavigate();
  const { signUpWithEmail } = useAuth();
  const colors = useRelevntColors();

  const isDark = colors.background === '#1A1A1A';

  // ============================================================
  // STATE
  // ============================================================

  const [formData, setFormData] = useState<SignupFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SignupError | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // .EDU promo detection
  const [isEduEmail, setIsEduEmail] = useState(false);

  useEffect(() => {
    // Check if email is .edu domain
    const isEdu = formData.email.toLowerCase().endsWith('.edu');
    setIsEduEmail(isEdu);
  }, [formData.email]);

  // ============================================================
  // VALIDATION & SUBMISSION
  // ============================================================

  const validatePassword = (password: string): boolean => {
    // At least 8 characters
    if (password.length < 8) return false;
    // At least one letter
    if (!/[a-zA-Z]/.test(password)) return false;
    // At least one number
    if (!/\d/.test(password)) return false;
    return true;
  };

  const validateForm = (): boolean => {
    // First name
    if (!formData.firstName.trim()) {
      setError({ field: 'firstName', message: 'First name is required' });
      return false;
    }

    // Last name
    if (!formData.lastName.trim()) {
      setError({ field: 'lastName', message: 'Last name is required' });
      return false;
    }

    // Email
    if (!formData.email.trim()) {
      setError({ field: 'email', message: 'Email is required' });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError({ field: 'email', message: 'Please enter a valid email' });
      return false;
    }

    // Password strength
    if (!validatePassword(formData.password)) {
      setError({
        field: 'password',
        message: 'Password must be at least 8 characters with a letter and number',
      });
      return false;
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      setError({
        field: 'confirmPassword',
        message: 'Passwords do not match',
      });
      return false;
    }

    // Terms acceptance
    if (!formData.agreeToTerms) {
      setError({
        field: 'agreeToTerms',
        message: 'You must agree to the terms to continue',
      });
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
      await signUpWithEmail(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        tier: isEduEmail ? 'pro' : 'starter', // Auto-tier .edu users
      });
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed';
      setError({ message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof SignupFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (submitted && error?.field === field) {
      setError(null);
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
    backgroundColor: colors.surface,
    borderRadius: '12px',
    padding: '48px',
    width: '100%',
    maxWidth: '450px',
    boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.08)',
  };

  const titleStyles: CSSProperties = {
    fontSize: '28px',
    fontWeight: 700,
    color: colors.text,
    marginBottom: '8px',
    textAlign: 'center',
  };

  const subtitleStyles: CSSProperties = {
    fontSize: '14px',
    color: colors.textSecondary,
    marginBottom: '24px',
    textAlign: 'center',
  };

  const formGroupStyles: CSSProperties = {
    marginBottom: '16px',
  };

  const labelStyles: CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: colors.text,
    marginBottom: '8px',
  };

  const inputStyles: CSSProperties = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    backgroundColor: isDark ? '#0f0f0f' : '#ffffff',
    color: colors.text,
    fontSize: '14px',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  };

  const inputErrorStyles: CSSProperties = {
    ...inputStyles,
    borderColor: colors.error,
  };

  const errorTextStyles: CSSProperties = {
    fontSize: '13px',
    color: colors.error,
    marginTop: '6px',
  };

  const checkboxContainerStyles: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    marginBottom: '20px',
  };

  const checkboxStyles: CSSProperties = {
    width: '18px',
    height: '18px',
    marginTop: '2px',
    cursor: 'pointer',
    accentColor: colors.accent,
  };

  const checkboxLabelStyles: CSSProperties = {
    fontSize: '13px',
    color: colors.textSecondary,
    lineHeight: 1.5,
  };

  const buttonStyles: CSSProperties = {
    width: '100%',
    padding: '12px',
    backgroundColor: colors.accent,
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

  const footerStyles: CSSProperties = {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '14px',
    color: colors.textSecondary,
  };

  const loginLinkStyles: CSSProperties = {
    color: colors.primary,
    textDecoration: 'none',
    cursor: 'pointer',
    fontWeight: 500,
    marginLeft: '4px',
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <PageBackground>
      <div style={containerStyles}>
        <div style={cardStyles}>
          {/* .EDU Promo Banner */}
          {isEduEmail && (
            <div
              style={{
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                borderLeft: `3px solid ${colors.success}`,
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '20px',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '13px',
                  color: colors.success,
                  fontWeight: 500,
                }}
              >
                ✨ {copy.eduPromo.banner}
              </p>
            </div>
          )}

          {/* Header */}
          <h1 style={titleStyles}>{copy.nav.signup}</h1>
          <p style={subtitleStyles}>
            {isEduEmail
              ? 'Complete your profile - 6 months of Pro included!'
              : 'Join Relevnt to start your career journey'}
          </p>

          {/* Generic error message */}
          {error && !error.field && (
            <div
              style={{
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                borderLeft: `3px solid ${colors.error}`,
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '20px',
              }}
            >
              <p style={{ ...errorTextStyles, margin: 0 }}>{error.message}</p>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit}>
            {/* First Name */}
            <div style={formGroupStyles}>
              <label htmlFor="firstName" style={labelStyles}>
                {copy.form.firstName}
              </label>
              <input
                id="firstName"
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                style={error?.field === 'firstName' ? inputErrorStyles : inputStyles}
                disabled={loading}
              />
              {error?.field === 'firstName' && (
                <p style={errorTextStyles}>{error.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div style={formGroupStyles}>
              <label htmlFor="lastName" style={labelStyles}>
                {copy.form.lastName}
              </label>
              <input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                style={error?.field === 'lastName' ? inputErrorStyles : inputStyles}
                disabled={loading}
              />
              {error?.field === 'lastName' && (
                <p style={errorTextStyles}>{error.message}</p>
              )}
            </div>

            {/* Email */}
            <div style={formGroupStyles}>
              <label htmlFor="email" style={labelStyles}>
                {copy.form.email}
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.edu"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                style={error?.field === 'email' ? inputErrorStyles : inputStyles}
                disabled={loading}
              />
              {error?.field === 'email' && (
                <p style={errorTextStyles}>{error.message}</p>
              )}
            </div>

            {/* Password */}
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
                disabled={loading}
              />
              {error?.field === 'password' && (
                <p style={errorTextStyles}>{error.message}</p>
              )}
              <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '6px' }}>
                At least 8 characters with a letter and number
              </p>
            </div>

            {/* Confirm Password */}
            <div style={formGroupStyles}>
              <label htmlFor="confirmPassword" style={labelStyles}>
                {copy.form.confirmPassword}
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                style={error?.field === 'confirmPassword' ? inputErrorStyles : inputStyles}
                disabled={loading}
              />
              {error?.field === 'confirmPassword' && (
                <p style={errorTextStyles}>{error.message}</p>
              )}
            </div>

            {/* Terms Acceptance */}
            <div style={checkboxContainerStyles}>
              <input
                id="agreeToTerms"
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={(e) => handleChange('agreeToTerms', e.target.checked)}
                style={checkboxStyles}
                disabled={loading}
              />
              <label htmlFor="agreeToTerms" style={checkboxLabelStyles}>
                I agree to Relevnt's Terms of Service and Privacy Policy
              </label>
            </div>
            {error?.field === 'agreeToTerms' && (
              <p style={{ ...errorTextStyles, marginBottom: '16px' }}>{error.message}</p>
            )}

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
              {loading ? 'Creating account...' : copy.onboarding.ctaStart}
            </button>
          </form>

          {/* Login Link */}
          <div style={footerStyles}>
            Already have an account?
            <a
              onClick={() => navigate('/login')}
              style={loginLinkStyles}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {copy.nav.login}
            </a>
          </div>
        </div>
      </div>
    </PageBackground>
  );
}

export default SignupPage;
