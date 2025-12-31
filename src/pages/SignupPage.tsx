/**
 * ============================================================================
 * SIGNUP PAGE (FULLY REFACTORED)
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
 * - Uses standard hero-shell (simplified for auth)
 * - surface-card for the main form
 * - Icon component for visual feedback
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { copy } from '../config/i18n.config';
import { Container } from '../components/shared/Container';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';

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
  const { showToast } = useToast();

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
      setError(null);
      await signUpWithEmail(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        tier: isEduEmail ? 'pro' : 'starter', // Auto-tier .edu users
      });
      showToast('Account created! Welcome to Relevnt.', 'success');
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed';
      setError({ message: errorMessage });
      showToast(errorMessage, 'error');
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
  // RENDER
  // ============================================================

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Container maxWidth="md" padding="md">
        <div style={{ maxWidth: 480, margin: '0 auto', width: '100%' }}>
          <article className="surface-card">
            {/* .EDU Promo Banner */}
            {isEduEmail && (
              <div style={{
                background: 'var(--color-bg-success)',
                borderLeft: '3px solid var(--color-success)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '20px'
              }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    color: 'var(--color-success)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Icon name="stars" size="sm" hideAccent />
                  {copy.eduPromo.banner}
                </p>
              </div>
            )}

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>{copy.nav.signup}</h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                {isEduEmail
                  ? 'Complete your profile - 6 months of Pro included!'
                  : 'Join Relevnt to start your career journey'}
              </p>
            </div>

            {/* Generic error message */}
            {error && !error.field && (
              <div style={{ padding: '0.75rem', background: 'var(--color-bg-error)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-error)', marginBottom: 20 }}>
                <p style={{ fontSize: '13px', color: 'var(--color-error)', margin: 0 }}>{error.message}</p>
              </div>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="rl-field-grid">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* First Name */}
                <label className="rl-label">
                  {copy.form.firstName}
                  <input
                    className={`rl-input ${error?.field === 'firstName' ? 'error' : ''}`}
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    disabled={loading}
                  />
                  {error?.field === 'firstName' && (
                    <span style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: 4, display: 'block' }}>{error.message}</span>
                  )}
                </label>

                {/* Last Name */}
                <label className="rl-label">
                  {copy.form.lastName}
                  <input
                    className={`rl-input ${error?.field === 'lastName' ? 'error' : ''}`}
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    disabled={loading}
                  />
                  {error?.field === 'lastName' && (
                    <span style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: 4, display: 'block' }}>{error.message}</span>
                  )}
                </label>
              </div>

              {/* Email */}
              <label className="rl-label">
                {copy.form.email}
                <input
                  className={`rl-input ${error?.field === 'email' ? 'error' : ''}`}
                  type="email"
                  placeholder="you@example.edu"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={loading}
                />
                {error?.field === 'email' && (
                  <span style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: 4, display: 'block' }}>{error.message}</span>
                )}
              </label>

              {/* Password */}
              <div>
                <label className="rl-label">
                  {copy.form.password}
                  <input
                    className={`rl-input ${error?.field === 'password' ? 'error' : ''}`}
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    disabled={loading}
                  />
                </label>
                {error?.field === 'password' && (
                  <span style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: 4, display: 'block' }}>{error.message}</span>
                )}
                <p className="helper-text" style={{ marginTop: 4 }}>
                  At least 8 characters with a letter and number
                </p>
              </div>

              {/* Confirm Password */}
              <label className="rl-label">
                {copy.form.confirmPassword}
                <input
                  className={`rl-input ${error?.field === 'confirmPassword' ? 'error' : ''}`}
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  disabled={loading}
                />
                {error?.field === 'confirmPassword' && (
                  <span style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: 4, display: 'block' }}>{error.message}</span>
                )}
              </label>

              {/* Terms Acceptance */}
              <div style={{ marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={(e) => handleChange('agreeToTerms', e.target.checked)}
                    style={{ width: 16, height: 16, marginTop: 2, accentColor: 'var(--color-accent)' }}
                    disabled={loading}
                  />
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    I agree to Relevnt's Terms of Service and Privacy Policy
                  </span>
                </label>
                {error?.field === 'agreeToTerms' && (
                  <div style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: 4, paddingLeft: 26 }}>{error.message}</div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                style={{ marginTop: 16 }}
              >
                {loading ? 'Creating account...' : copy.onboarding.ctaStart}
              </Button>
            </form>

            {/* Login Link */}
            <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
              Already have an account?
              <button
                onClick={() => navigate('/login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginLeft: 4,
                  textDecoration: 'none',
                  padding: 0,
                  fontSize: 'inherit'
                }}
              >
                {copy.nav.login}
              </button>
            </div>
          </article>
        </div>
      </Container>
    </div>
  );
}

export default SignupPage;
