/**
 * ============================================================================
 * PASSWORD RESET PAGE (FULLY REFACTORED)
 * ============================================================================
 * 🎯 PURPOSE: Two-step password reset flow
 * 
 * Step 1: Email verification (enter email)
 * Step 2: New password (after email verification)
 * 
 * Features:
 * - Email verification check
 * - Password strength validation
 * - Clear error messaging
 * - Success feedback
 * 
 * Brand Integration:
 * - Uses standard hero-shell (simplified for auth)
 * - surface-card for the main form
 * - Icon component for visual feedback
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '../components/shared/Container';
import { Icon } from '../components/ui/Icon';
import { supabase } from '../lib/supabase';

type ResetStep = 'email-entry' | 'password-reset' | 'success';

interface ResetError {
  field?: string;
  message: string;
}

export function PasswordResetPage(): JSX.Element {
  const navigate = useNavigate();
  const [, setSubmitted] = useState(false);

  // ============================================================
  // STATE
  // ============================================================

  const [step, setStep] = useState<ResetStep>('email-entry');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ResetError | null>(null);

  // ============================================================
  // CHECK FOR RECOVERY SESSION (from email link)
  // ============================================================

  useEffect(() => {
    const checkRecoverySession = async () => {
      // If user clicked recovery link in email, they'll have a recovery session
      const { data } = await supabase.auth.getSession();
      if (data.session?.user && data.session.user.recovery_sent_at) {
        // User has recovery session from email link
        setStep('password-reset');
      }
    };
    checkRecoverySession();
  }, []);

  // ============================================================
  // VALIDATION & SUBMISSION
  // ============================================================

  const validatePassword = (password: string): boolean => {
    if (password.length < 8) return false;
    if (!/[a-zA-Z]/.test(password)) return false;
    if (!/\d/.test(password)) return false;
    return true;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!email.trim()) {
      setError({ field: 'email', message: 'Email is required' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError({ field: 'email', message: 'Please enter a valid email' });
      return;
    }

    try {
      setLoading(true);
      // Send password reset email via Supabase
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/password-reset`,
      });

      if (resetError) throw resetError;

      setError(null);
      // Show confirmation message and keep on email-entry step
      // User will click link in email and get recovery session
      setError(null);
      setEmail('');
      setError({
        message: 'Check your email for a password reset link. Click the link to proceed.'
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send reset email';
      setError({ message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!validatePassword(newPassword)) {
      setError({
        field: 'password',
        message: 'Password must be at least 8 characters with a letter and number',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setError({
        field: 'confirmPassword',
        message: 'Passwords do not match',
      });
      return;
    }

    try {
      setLoading(true);
      // Update password using Supabase auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setError(null);
      setStep('success');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to reset password';
      setError({ message: errorMsg });
    } finally {
      setLoading(false);
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

            {/* Step 1: Email Entry */}
            {step === 'email-entry' && (
              <>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <Icon name="key" size="lg" className="color-primary" />
                  <h1 style={{ fontSize: 24, fontWeight: 700, margin: '16px 0 8px' }}>Reset Password</h1>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Enter your email address and we'll send you instructions to reset your password.
                  </p>
                </div>

                {error && !error.field && (
                  <div style={{ padding: '0.75rem', background: 'var(--color-bg-error)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-error)', marginBottom: 20 }}>
                    <p style={{ fontSize: '13px', color: 'var(--color-error)', margin: 0 }}>{error.message}</p>
                  </div>
                )}

                <form onSubmit={handleEmailSubmit} className="rl-field-grid">
                  <label className="rl-label">
                    Email Address
                    <input
                      className={`rl-input ${error?.field === 'email' ? 'error' : ''}`}
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error?.field === 'email') setError(null);
                      }}
                      disabled={loading}
                    />
                    {error?.field === 'email' && (
                      <span style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: 4, display: 'block' }}>
                        {error.message}
                      </span>
                    )}
                  </label>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={loading}
                    style={{ marginTop: 8 }}
                  >
                    {loading ? 'Sending email...' : 'Send Reset Email'}
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 24 }}>
                  <button
                    onClick={() => navigate('/login')}
                    className="ghost-button"
                    style={{ fontSize: 13 }}
                  >
                    Back to login
                  </button>
                </div>
              </>
            )}

            {/* Step 2: Password Reset */}
            {step === 'password-reset' && (
              <>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>Create New Password</h1>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                    Enter a new password for your account. Make it strong and secure.
                  </p>
                </div>

                {error && !error.field && (
                  <div style={{ padding: '0.75rem', background: 'var(--color-bg-error)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-error)', marginBottom: 20 }}>
                    <p style={{ fontSize: '13px', color: 'var(--color-error)', margin: 0 }}>{error.message}</p>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="rl-field-grid">
                  <div>
                    <label className="rl-label">
                      New Password
                      <input
                        className={`rl-input ${error?.field === 'password' ? 'error' : ''}`}
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (error?.field === 'password') setError(null);
                        }}
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

                  <label className="rl-label">
                    Confirm Password
                    <input
                      className={`rl-input ${error?.field === 'confirmPassword' ? 'error' : ''}`}
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error?.field === 'confirmPassword') setError(null);
                      }}
                      disabled={loading}
                    />
                    {error?.field === 'confirmPassword' && (
                      <span style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: 4, display: 'block' }}>{error.message}</span>
                    )}
                  </label>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={loading}
                    style={{ marginTop: 8 }}
                  >
                    {loading ? 'Resetting password...' : 'Reset Password'}
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 24 }}>
                  <button
                    onClick={() => navigate('/login')}
                    className="ghost-button"
                    style={{ fontSize: 13 }}
                  >
                    Back to login
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Success */}
            {step === 'success' && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ color: 'var(--color-success)', marginBottom: 16 }}>
                  <Icon name="check" size="xl" hideAccent />
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 16px', color: 'var(--text)' }}>
                  Password Reset!
                </h1>
                <p style={{ fontSize: 16, color: 'var(--color-success)', fontWeight: 500, marginBottom: 8 }}>
                  Your password has been successfully reset.
                </p>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  Redirecting to login in a moment...
                </p>
                <div style={{ marginTop: 32 }}>
                  <button
                    onClick={() => navigate('/login')}
                    className="primary-button"
                  >
                    Go to login now
                  </button>
                </div>
              </div>
            )}

          </article>
        </div>
      </Container>
    </div>
  );
}

export default PasswordResetPage;
