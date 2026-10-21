import React, { useState, useEffect } from 'react';
import {
  X,
  LogIn,
  UserPlus,
  LogOut,
  ShieldAlert,
  CheckCircle2,
  KeyRound,
  Mail,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import {
  validateSignupOtpToken,
  classifySupabaseAuthError,
} from '../engine/typingEngine';
import type { User } from '@supabase/supabase-js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  user: User | null;
  onUserAuthenticated?: (user: User | null) => void;
  localUsername: string;
  onSetLocalUsername: (name: string) => void;
}

type AuthStep = 'credentials' | 'verify-signup-otp';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  theme,
  user,
  onUserAuthenticated,
  localUsername,
  onSetLocalUsername,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [step, setStep] = useState<AuthStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [usernameInput, setUsernameInput] = useState(localUsername || '');
  const [statusMsg, setStatusMsg] = useState<{
    type: 'error' | 'success' | 'info';
    text: string;
    unconfirmedEmail?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [resendCooldownSec, setResendCooldownSec] = useState(0);

  // Countdown timer for Resend OTP rate-limit protection
  useEffect(() => {
    if (resendCooldownSec <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldownSec((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldownSec]);

  // Clear transient secrets (password & OTP) whenever the modal closes
  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setOtpCode('');
      setLoading(false);
      setResendingOtp(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const getSanitizedUsername = (fallbackEmail: string): string => {
    const cleaned = usernameInput.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);
    if (cleaned.length >= 2) return cleaned;
    const fromEmail = fallbackEmail
      .split('@')[0]
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 24);
    return fromEmail.length >= 2 ? fromEmail : 'Typist';
  };

  /**
   * Handles Sign In (email + password) and Sign Up (email + password -> 6-digit OTP verification).
   */
  const handleSupabaseAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = email.trim();
    if (!cleanEmail || !password.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter both your email address and password.' });
      return;
    }

    if (!supabase) {
      setStatusMsg({
        type: 'error',
        text: 'Supabase Auth is not configured in this environment. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to enable cloud accounts.',
      });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    try {
      if (mode === 'signup') {
        const cleanUser = getSanitizedUsername(cleanEmail);
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { username: cleanUser },
          },
        });

        if (error) {
          const classified = classifySupabaseAuthError(error);
          setStatusMsg({ type: 'error', text: classified.userMessage });
          return;
        }

        // Detect obfuscated existing account response from Supabase
        if (
          data.user &&
          Array.isArray(data.user.identities) &&
          data.user.identities.length === 0
        ) {
          setStatusMsg({
            type: 'error',
            text: 'An account with this email is already registered. Please sign in with your password instead.',
          });
          return;
        }

        onSetLocalUsername(cleanUser);
        // Never keep password in memory once signup succeeds
        setPassword('');
        setOtpCode('');
        setStep('verify-signup-otp');
        setResendCooldownSec(60);
        setStatusMsg({
          type: 'info',
          text: `We sent a 6-digit verification code to ${cleanEmail}. Enter the code below to verify your email and complete signup.`,
        });
      } else {
        // Normal Login Flow: email + password only (no OTP required on every login)
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          const classified = classifySupabaseAuthError(error);
          setStatusMsg({
            type: 'error',
            text: classified.userMessage,
            unconfirmedEmail: classified.kind === 'unconfirmed_email',
          });
          return;
        }

        // Guard against any unconfirmed account session
        const signedInUser = data.session?.user ?? data.user;
        const isConfirmed = Boolean(
          signedInUser?.email_confirmed_at || signedInUser?.confirmed_at
        );

        if (!data.session || !signedInUser || !isConfirmed) {
          await supabase.auth.signOut();
          setPassword('');
          setOtpCode('');
          setStep('verify-signup-otp');
          setStatusMsg({
            type: 'error',
            text: 'Email verification is still required before you can sign in. Please enter the 6-digit code sent to your email or resend a new code.',
            unconfirmedEmail: true,
          });
          return;
        }

        setPassword('');
        onUserAuthenticated?.(signedInUser);
        setStatusMsg({ type: 'success', text: 'Signed in successfully.' });
        setTimeout(onClose, 500);
      }
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Authentication request failed.',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verifies the 6-digit signup OTP code using `supabase.auth.verifyOtp({ email, token, type: 'signup' })`.
   */
  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setStatusMsg({
        type: 'error',
        text: 'Please provide the email address you used to sign up.',
      });
      return;
    }

    const validation = validateSignupOtpToken(otpCode);
    if (!validation.valid) {
      setStatusMsg({
        type: 'error',
        text: validation.error ?? 'Verification code must contain exactly 6 digits.',
      });
      return;
    }

    if (!supabase) {
      setStatusMsg({
        type: 'error',
        text: 'Supabase Auth is not configured in this environment.',
      });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    try {
      const token = validation.token;
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token,
        type: 'signup',
      });

      if (error) {
        const classified = classifySupabaseAuthError(error);
        setStatusMsg({
          type: 'error',
          text: classified.userMessage,
        });
        return;
      }

      const verifiedUser = data.session?.user ?? data.user ?? null;
      if (!data.session || !verifiedUser) {
        setStatusMsg({
          type: 'error',
          text: 'Verification succeeded, but no active session was returned. Please sign in with your email and password.',
        });
        setOtpCode('');
        setStep('credentials');
        setMode('signin');
        return;
      }

      // Ensure the user's public profile record is created/updated with their chosen username
      const cleanUser =
        (verifiedUser.user_metadata?.username as string | undefined) ||
        getSanitizedUsername(cleanEmail);

      try {
        await supabase.from('profiles').upsert(
          {
            id: verifiedUser.id,
            username: cleanUser,
          },
          { onConflict: 'id' }
        );
      } catch {
        // Non-blocking if profiles table migration has not been run yet
      }

      onSetLocalUsername(cleanUser);
      onUserAuthenticated?.(verifiedUser);
      setOtpCode('');
      setPassword('');
      setStatusMsg({
        type: 'success',
        text: 'Email verified! Your account is now active and signed in.',
      });
      setTimeout(() => {
        setStep('credentials');
        onClose();
      }, 650);
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to verify 6-digit code.',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resends the 6-digit signup verification code using `supabase.auth.resend({ type: 'signup', email })`.
   */
  const handleResendSignupOtp = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setStatusMsg({
        type: 'error',
        text: 'Please enter your email address first so we know where to resend the code.',
      });
      return;
    }

    if (resendCooldownSec > 0 || resendingOtp) {
      return;
    }

    if (!supabase) {
      setStatusMsg({
        type: 'error',
        text: 'Supabase Auth is not configured in this environment.',
      });
      return;
    }

    setResendingOtp(true);
    setStatusMsg(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
      });

      if (error) {
        const classified = classifySupabaseAuthError(error);
        if (classified.kind === 'rate_limit') {
          setResendCooldownSec(60);
        }
        setStatusMsg({
          type: 'error',
          text: classified.userMessage,
        });
        return;
      }

      setResendCooldownSec(60);
      setStatusMsg({
        type: 'success',
        text: `A new 6-digit verification code has been sent to ${cleanEmail}.`,
      });
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not resend verification code.',
      });
    } finally {
      setResendingOtp(false);
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    onUserAuthenticated?.(null);
    setStep('credentials');
    setStatusMsg({ type: 'success', text: 'Signed out.' });
  };

  const handleSaveLocalProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = usernameInput.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);
    if (cleaned.length < 2) {
      setStatusMsg({
        type: 'error',
        text: 'Display name must be between 2 and 24 alphanumeric characters.',
      });
      return;
    }
    onSetLocalUsername(cleaned);
    setStatusMsg({
      type: 'success',
      text: `Display name "${cleaned}" saved for local history and leaderboard runs.`,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
    >
      <div
        className={`w-full max-w-md rounded-2xl border p-6 shadow-xl max-h-[92vh] overflow-y-auto ${
          isDark
            ? 'bg-[#1d1c19] border-[#33322c] text-[#e6e4dd]'
            : 'bg-white border-[#dcd9ce] text-[#1c1b18]'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="auth-modal-title" className="text-lg font-bold tracking-tight">
            {user
              ? 'Account Profile'
              : step === 'verify-signup-otp'
              ? 'Verify Your Email (6-Digit Code)'
              : 'Typist Profile & Authentication'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[#8c8a82] hover:text-amber-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {statusMsg && (
          <div
            role="alert"
            data-testid="auth-status-banner"
            className={`mb-4 p-3 rounded-xl border text-xs space-y-2 ${
              statusMsg.type === 'success'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                : statusMsg.type === 'info'
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                : 'border-red-500/40 bg-red-500/10 text-red-400'
            }`}
          >
            <div className="flex items-start gap-2">
              {statusMsg.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{statusMsg.text}</span>
            </div>

            {/* Actionable prompt when an unconfirmed user attempts to log in */}
            {statusMsg.unconfirmedEmail && step === 'credentials' && (
              <div className="pt-1 pl-6 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  data-testid="open-otp-from-login-btn"
                  onClick={() => {
                    setPassword('');
                    setOtpCode('');
                    setStep('verify-signup-otp');
                    setStatusMsg({
                      type: 'info',
                      text: `Enter the 6-digit signup verification code sent to ${email.trim()}, or click "Resend Code" to receive a fresh code.`,
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 text-[#181816] font-semibold text-xs hover:bg-amber-400 transition-colors"
                >
                  Enter 6-Digit Verification Code
                </button>
              </div>
            )}
          </div>
        )}

        {/* Signed-in Supabase User State */}
        {user ? (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                isDark ? 'bg-[#161513] border-[#292824]' : 'bg-[#f7f6f2] border-[#e2e0d8]'
              }`}
            >
              <div className="text-[#8c8a82]">Signed in as</div>
              <div className="font-mono font-semibold text-sm">
                {user.user_metadata?.username || user.email}
              </div>
              <div className="text-[11px] text-emerald-400">
                Supabase Auth active · Email verified · RLS protected history enabled
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : step === 'verify-signup-otp' ? (
          /* Dedicated 6-Digit Email OTP Verification View (After Signup) */
          <form onSubmit={handleVerifySignupOtp} className="space-y-4" data-testid="otp-verify-form">
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                isDark
                  ? 'bg-[#161513] border-[#292824] text-[#b8b6ad]'
                  : 'bg-[#f7f6f2] border-[#e2e0d8] text-[#45433d]'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-amber-500">
                <Mail className="w-4 h-4 shrink-0" />
                <span>Check your email for a 6-digit verification code</span>
              </div>
              <p className="leading-relaxed">
                We sent a 6-digit confirmation code to{' '}
                <strong className={isDark ? 'text-[#e6e4dd]' : 'text-[#1c1b18]'}>
                  {email.trim() || 'your email address'}
                </strong>
                . Enter the 6 digits below to verify your email and finish creating your account.
              </p>
            </div>

            <div>
              <label htmlFor="auth-otp-email" className="block text-xs font-medium mb-1">
                Account Email Address
              </label>
              <input
                id="auth-otp-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  isDark
                    ? 'bg-[#141412] border-[#2c2b26] text-[#e6e4dd]'
                    : 'bg-[#f7f6f2] border-[#d5d2c8] text-[#1c1b18]'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="auth-signup-otp" className="block text-xs font-medium">
                  6-Digit Verification Code
                </label>
                <span className="text-[11px] font-mono text-[#8c8a82]">
                  {otpCode.trim().length}/6 digits
                </span>
              </div>
              <input
                id="auth-signup-otp"
                data-testid="signup-otp-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\s+/g, '');
                  setOtpCode(cleaned);
                }}
                placeholder="123456"
                className={`w-full px-4 py-2.5 text-center text-xl font-mono tracking-[0.35em] font-bold rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 tabular-nums ${
                  isDark
                    ? 'bg-[#141412] border-[#2c2b26] text-amber-400 placeholder-[#4a4842]'
                    : 'bg-[#f7f6f2] border-[#d5d2c8] text-amber-700 placeholder-[#b8b5ab]'
                }`}
              />
              <p className="text-[11px] text-[#8c8a82] mt-1">
                Must contain exactly 6 numeric digits (0–9). Never shared or stored in localStorage.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              data-testid="verify-otp-submit-btn"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 text-[#181816] font-semibold text-xs hover:bg-amber-400 transition-colors disabled:opacity-60"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Verifying 6-Digit Code...' : 'Verify 6-Digit Code & Continue'}</span>
            </button>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#292824]/40 text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setOtpCode('');
                  setStatusMsg(null);
                }}
                className="inline-flex items-center gap-1 text-[#8c8a82] hover:text-amber-500 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to {mode === 'signup' ? 'Sign Up' : 'Sign In'}</span>
              </button>

              <button
                type="button"
                data-testid="resend-otp-btn"
                onClick={handleResendSignupOtp}
                disabled={resendingOtp || resendCooldownSec > 0}
                className={`inline-flex items-center gap-1.5 font-medium transition-colors ${
                  resendingOtp || resendCooldownSec > 0
                    ? 'text-[#6e6d68] cursor-not-allowed'
                    : 'text-amber-500 hover:text-amber-400'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resendingOtp ? 'animate-spin' : ''}`} />
                <span>
                  {resendingOtp
                    ? 'Sending Code...'
                    : resendCooldownSec > 0
                    ? `Resend Code (${resendCooldownSec}s)`
                    : 'Resend Code'}
                </span>
              </button>
            </div>
          </form>
        ) : (
          /* Sign In & Sign Up Credentials Form */
          <div className="space-y-5">
            {!isSupabaseConfigured && (
              <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-amber-400">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Supabase Cloud Auth Not Configured in .env</span>
                </div>
                <p className="text-[#b8b6ad] leading-relaxed">
                  Add <code className="font-mono">VITE_SUPABASE_URL</code> and{' '}
                  <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> to connect live Supabase Auth & 6-digit signup OTP emails. You can also set your local display name below.
                </p>
              </div>
            )}

            <form onSubmit={handleSupabaseAuth} className="space-y-4">
              <div
                role="tablist"
                aria-label="Authentication mode"
                className={`flex items-center gap-2 p-1 rounded-lg border ${
                  isDark ? 'bg-black/20 border-[#2c2b26]' : 'bg-[#f2f0e8] border-[#dcd9ce]'
                }`}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'signin'}
                  data-testid="auth-tab-signin"
                  onClick={() => {
                    setMode('signin');
                    setStatusMsg(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    mode === 'signin' ? 'bg-amber-500 text-[#181816]' : 'text-[#8c8a82]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'signup'}
                  data-testid="auth-tab-signup"
                  onClick={() => {
                    setMode('signup');
                    setStatusMsg(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    mode === 'signup' ? 'bg-amber-500 text-[#181816]' : 'text-[#8c8a82]'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {mode === 'signup' && (
                <div>
                  <label htmlFor="auth-username" className="block text-xs font-medium mb-1">
                    Public Leaderboard Username
                  </label>
                  <input
                    id="auth-username"
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="e.g. swift_typist"
                    className={`w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDark
                        ? 'bg-[#141412] border-[#2c2b26] text-[#e6e4dd]'
                        : 'bg-[#f7f6f2] border-[#d5d2c8] text-[#1c1b18]'
                    }`}
                  />
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className="block text-xs font-medium mb-1">
                  Email Address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isDark
                      ? 'bg-[#141412] border-[#2c2b26] text-[#e6e4dd]'
                      : 'bg-[#f7f6f2] border-[#d5d2c8] text-[#1c1b18]'
                  }`}
                />
              </div>

              <div>
                <label htmlFor="auth-password" className="block text-xs font-medium mb-1">
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isDark
                      ? 'bg-[#141412] border-[#2c2b26] text-[#e6e4dd]'
                      : 'bg-[#f7f6f2] border-[#d5d2c8] text-[#1c1b18]'
                  }`}
                />
              </div>

              {mode === 'signup' && (
                <p className="text-[11px] text-[#8c8a82] leading-relaxed">
                  After submitting, Supabase will send a <strong>6-digit verification code</strong> to your email to confirm your new account.
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                data-testid="auth-submit-btn"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 text-[#181816] font-semibold text-xs hover:bg-amber-400 transition-colors disabled:opacity-60"
              >
                {mode === 'signin' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>{loading ? 'Signing In...' : 'Sign In with Password'}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>
                      {loading ? 'Sending 6-Digit Code...' : 'Create Account & Send 6-Digit Code'}
                    </span>
                  </>
                )}
              </button>

              {mode === 'signup' && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    data-testid="already-have-otp-btn"
                    onClick={() => {
                      setPassword('');
                      setOtpCode('');
                      setStep('verify-signup-otp');
                      setStatusMsg(null);
                    }}
                    className="text-xs text-amber-500 hover:underline font-medium"
                  >
                    Already have a 6-digit signup code? Enter it here
                  </button>
                </div>
              )}
            </form>

            {/* Guest / Local Display Name Profile (Always available for offline/guest mode) */}
            <div className="pt-4 border-t border-[#292824]/50">
              <form onSubmit={handleSaveLocalProfile} className="space-y-2.5">
                <label htmlFor="local-display-name" className="block text-xs font-medium text-[#8c8a82]">
                  Guest / Local Display Name (saved on this device)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="local-display-name"
                    type="text"
                    maxLength={24}
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="e.g. KeycraftGuest"
                    className={`flex-1 px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isDark
                        ? 'bg-[#141412] border-[#2c2b26] text-[#e6e4dd]'
                        : 'bg-[#f7f6f2] border-[#d5d2c8] text-[#1c1b18]'
                    }`}
                  />
                  <button
                    type="submit"
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                      isDark
                        ? 'border-[#33322c] bg-[#24231f] text-[#e6e4dd] hover:border-amber-500/50'
                        : 'border-[#d5d2c8] bg-[#f7f6f2] text-[#1c1b18] hover:border-amber-600/50'
                    }`}
                  >
                    Save Name
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
