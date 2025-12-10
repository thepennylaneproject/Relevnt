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

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  const { signInWithEmail } = useAuth();

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
  // RENDER
  // ============================================================

  return (
    <PageBackground>
      <div className="auth-wrapper">
        <div className="auth-card">
          {/* Header */}
          <h1 className="auth-title">{copy.nav.login}</h1>
          <p className="auth-subtitle">Welcome back to Relevnt</p>

          {/* Generic error message */}
          {error && !error.field && (
            <div className="form-error" style={{ marginBottom: '20px' }}>
              {error.message}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                {copy.form.email}
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="input"
                disabled={loading}
              />
              {error?.field === 'email' && (
                <p className="form-error">{error.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                {copy.form.password}
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className="input"
                disabled={loading}
              />
              {error?.field === 'password' && (
                <p className="form-error">{error.message}</p>
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
                className="link"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn--lg"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Signing in...' : copy.nav.login}
            </button>
          </form>

          {/* Signup Link */}
          <div className="auth-footer">
            Don't have an account?
            <a onClick={() => navigate('/signup')} className="link">
              {copy.nav.signup}
            </a>
          </div>
        </div>
      </div>
    </PageBackground>
  );
}

export default LoginPage;
