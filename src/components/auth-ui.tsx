"use client";

import Link from 'next/link';
import type { ButtonHTMLAttributes, FormEvent, InputHTMLAttributes, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/shared';
import {
  IconArrow,
  IconClock,
  IconShield,
} from '@/components/icons';
import { insforge } from '@/lib/insforge';
import { syncAppSessionFromInsForge } from '@/lib/client-auth';
import { getErrorMessage } from '@/lib/errors';

function LogoMark() {
  return (
    <div className="flex items-center gap-3">
      <img src="/main_logo.svg" alt="Folio" className="h-8 w-8 filter invert opacity-95" />
      <span className="font-serif text-[24px] font-semibold tracking-tight text-white">Folio</span>
    </div>
  );
}

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_28%)]" />
      <main className="relative z-10 min-h-screen px-6 py-6 sm:px-8 sm:py-8">
        <section className="min-h-[calc(100vh-3rem)] border border-white/8 bg-[#0a0a0a]/96 overflow-hidden backdrop-blur-xl rounded-[28px] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div className="h-14 border-b border-white/6 bg-white/[0.02] px-4 sm:px-6 flex items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57] border border-[#e0443e]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e] border border-[#dea123]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840] border border-[#1ea632]" />
            </div>
            <LogoMark />
          </div>

          <div className="relative min-h-[calc(100vh-3.5rem-3rem)] p-6 sm:p-8 md:p-10 flex items-center justify-center">
            <div className="pointer-events-none absolute top-[-35%] right-[-10%] h-[70%] w-[45%] rounded-full bg-white/[0.03] blur-[90px]" />
            <div className="w-full max-w-[430px] rounded-[24px] bg-gradient-to-b from-white/[0.08] to-transparent p-[1px]">
              <div className="rounded-[23px] border border-white/6 bg-[#111] px-6 py-7 sm:px-7 sm:py-8 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                {eyebrow && (
                  <div className="mb-3 text-[11px] uppercase tracking-[0.18em] text-white/45">
                    {eyebrow}
                  </div>
                )}
                <h1 className="font-serif text-[28px] sm:text-[34px] leading-[1.04] font-semibold tracking-tight text-white">
                  {title}
                </h1>
                <p className="mt-3 text-[14px] leading-relaxed text-white/52">{description}</p>

                <div className="mt-6">{children}</div>
                {footer ? <div className="mt-5">{footer}</div> : null}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export function AuthField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  hint,
  right,
  inputMode,
  maxLength,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  hint?: ReactNode;
  right?: ReactNode;
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-[12px] uppercase tracking-[0.16em] text-white/48">{label}</div>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          className="h-12 w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 pr-12 text-[15px] text-white placeholder:text-white/28 outline-none transition focus:border-white/20 focus:bg-white/[0.05]"
        />
        {right ? <div className="absolute inset-y-0 right-0 flex items-center pr-3">{right}</div> : null}
      </div>
      {hint ? <div className="mt-2 text-[13px]">{hint}</div> : null}
    </label>
  );
}

export function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <AuthField
      label={label}
      type={visible ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      right={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.06] hover:text-white transition"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    />
  );
}

export function ErrorCard({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-red-400/18 bg-red-400/8 px-4 py-3 text-[14px] text-red-200">
      {message}
    </div>
  );
}

export function SuccessCard({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-emerald-400/16 bg-emerald-400/8 px-4 py-3 text-[14px] text-emerald-200">
      {message}
    </div>
  );
}

export function AuthPrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = '', children, ...rest } = props;
  return (
    <Button
      size="lg"
      className={`h-12 w-full rounded-2xl bg-white text-[#050505] text-[15px] font-semibold shadow-[0_0_18px_rgba(255,255,255,0.12)] hover:brightness-95 disabled:opacity-45 ${className}`}
      {...rest}
    >
      {children}
    </Button>
  );
}

export function AuthSecondaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = '', children, ...rest } = props;
  return (
    <button
      className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-[15px] font-medium text-white/86 transition hover:bg-white/[0.06] disabled:opacity-45 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function GoogleButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <AuthSecondaryButton type="button" onClick={onClick} disabled={disabled}>
      <GoogleIcon />
      {label}
    </AuthSecondaryButton>
  );
}

function useAuthBootstrap() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        await syncAppSessionFromInsForge().catch(() => null);
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        const data = await response.json().catch(() => null);

        if (!cancelled && response.ok && data?.user) {
          router.replace(data.role === 'admin' ? '/admin' : '/dashboard');
        }
      } catch {
        // Signed out.
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [router]);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function AuthHomePage() {
  useAuthBootstrap();

  return (
    <AuthShell
      eyebrow="Access Folio"
      title="Choose how you’d like to continue."
      description="Use the same dashboard styling and session flow as the rest of Folio, with dedicated entry points for signing in or creating your library."
      footer={
        <div className="flex items-center gap-2 text-[12px] text-white/38">
          <IconShield size={14} />
          Session-protected routes stay locked until sign-in completes.
        </div>
      }
    >
      <div className="space-y-3">
        <Link
          href="/login"
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-white px-4 text-[15px] font-semibold text-[#050505] shadow-[0_0_18px_rgba(255,255,255,0.12)] transition hover:brightness-95"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-[15px] font-medium text-white/86 transition hover:bg-white/[0.06]"
        >
          Register
        </Link>
      </div>
    </AuthShell>
  );
}

export function LoginPage() {
  useAuthBootstrap();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setLoading(false);
      setError(data?.error || 'Failed to sign in.');
      return;
    }

    router.replace('/dashboard');
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);

    const { error: oauthError } = await insforge.auth.signInWithOAuth({
      provider: 'google',
      redirectTo: `${window.location.origin}/auth/callback?mode=login`,
    });

    if (oauthError) {
      setLoading(false);
      setError(oauthError.message || 'Failed to continue with Google.');
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome Back"
      title="Sign in to your library."
      description="Use your verified Folio account to continue, or jump in with Google if you registered that way."
      footer={
        <div className="text-[14px] text-white/42">
          Need an account? <Link href="/register" className="text-white hover:underline">Register</Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="name@example.com"
          autoComplete="email"
        />
        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          autoComplete="current-password"
        />
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-[13px] text-white/52 hover:text-white transition">
            Forgot password?
          </Link>
        </div>
        <ErrorCard message={error} />
        <AuthPrimaryButton type="submit" disabled={loading || !email || !password}>
          {loading ? 'Signing in...' : 'Login'}
        </AuthPrimaryButton>
      </form>

      <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-white/28">
        <span className="h-px flex-1 bg-white/8" />
        Or continue with
        <span className="h-px flex-1 bg-white/8" />
      </div>

      <GoogleButton label="Sign in with Google" onClick={handleGoogle} disabled={loading} />
    </AuthShell>
  );
}

export function RegisterPage() {
  useAuthBootstrap();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailValid = isValidEmail(email);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const validationText = confirmPassword
    ? passwordsMatch
      ? <span className="text-emerald-300">Passwords match</span>
      : <span className="text-red-300">Passwords do not match</span>
    : null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setLoading(false);
      setError(data?.error || 'Failed to register.');
      return;
    }

    router.push(`/verify?email=${encodeURIComponent(email)}`);
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);

    const { error: oauthError } = await insforge.auth.signInWithOAuth({
      provider: 'google',
      redirectTo: `${window.location.origin}/auth/callback?mode=register`,
    });

    if (oauthError) {
      setLoading(false);
      setError(oauthError.message || 'Failed to continue with Google.');
    }
  };

  return (
    <AuthShell
      eyebrow="Create Account"
      title="Start your Folio library."
      description="Register with email and password, then verify the 6-digit code we send before entering the dashboard."
      footer={
        <div className="text-[14px] text-white/42">
          Already registered? <Link href="/login" className="text-white hover:underline">Login</Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="name@example.com"
          autoComplete="email"
        />
        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Create a password"
          autoComplete="new-password"
        />
        <PasswordField
          label="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Re-enter your password"
          autoComplete="new-password"
        />
        {validationText ? <div className="text-[13px]">{validationText}</div> : null}
        <ErrorCard message={error} />
        <AuthPrimaryButton
          type="submit"
          disabled={loading || !emailValid || !passwordsMatch}
        >
          {loading ? 'Registering...' : 'Register'}
        </AuthPrimaryButton>
      </form>

      <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-white/28">
        <span className="h-px flex-1 bg-white/8" />
        Or continue with
        <span className="h-px flex-1 bg-white/8" />
      </div>

      <GoogleButton label="Continue with Google" onClick={handleGoogle} disabled={loading} />
    </AuthShell>
  );
}

export function VerifyPage({ email = '' }: { email?: string }) {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => setCooldown((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setLoading(false);
      setError(data?.error || 'Failed to verify code.');
      return;
    }

    router.replace('/dashboard');
  };

  const handleResend = async () => {
    setError(null);
    setSuccess(null);
    const response = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setError(data?.error || 'Failed to resend code.');
      return;
    }

    setCooldown(60);
    setSuccess('A fresh 6-digit code is on its way.');
  };

  return (
    <AuthShell
      eyebrow="Verify Email"
      title="Enter your 6-digit code."
      description={email ? `We sent a code to ${email}. It stays valid for 10 minutes and locks after 5 failed attempts.` : 'Enter the verification code from your inbox.'}
      footer={
        <div className="flex items-center gap-2 text-[12px] text-white/40">
          <IconClock size={14} />
          Resend available after the 60-second cooldown.
        </div>
      }
    >
      <form onSubmit={handleVerify} className="space-y-4">
        <AuthField
          label="Verification Code"
          value={otp}
          onChange={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          inputMode="numeric"
          maxLength={6}
          hint={<span className="text-white/42">Enter all 6 digits without spaces.</span>}
        />
        <ErrorCard message={error} />
        <SuccessCard message={success} />
        <AuthPrimaryButton type="submit" disabled={loading || otp.length !== 6 || !email}>
          {loading ? 'Verifying...' : 'Verify'}
        </AuthPrimaryButton>
      </form>

      <div className="mt-4 flex items-center justify-between gap-4 text-[13px]">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || !email}
          className="text-white/55 transition hover:text-white disabled:text-white/24"
        >
          Resend code
        </button>
        <span className="text-white/35">{cooldown > 0 ? `${cooldown}s` : 'Ready'}</span>
      </div>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'verify' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordReady = password.length > 0 && password === confirmPassword;
  const passwordsText = confirmPassword
    ? passwordReady
      ? <span className="text-emerald-300">Passwords match</span>
      : <span className="text-red-300">Passwords do not match</span>
    : null;

  const heading = useMemo(() => {
    if (step === 'verify') {
      return 'Confirm the reset code.';
    }
    if (step === 'reset') {
      return 'Create a new password.';
    }
    return 'Recover your account.';
  }, [step]);

  const description = useMemo(() => {
    if (step === 'verify') {
      return `We sent a 6-digit password reset code to ${email}.`;
    }
    if (step === 'reset') {
      return 'Choose a new password for your Folio account.';
    }
    return 'Enter your email and we’ll send a reset code if the account exists.';
  }, [email, step]);

  const requestCode = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const response = await fetch('/api/auth/forgot-password/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setLoading(false);
      setError(data?.error || 'Failed to send reset code.');
      return;
    }

    setLoading(false);
    setStep('verify');
    setSuccess('Reset code sent. Check your inbox.');
  };

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const response = await fetch('/api/auth/forgot-password/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setLoading(false);
      setError(data?.error || 'Failed to verify reset code.');
      return;
    }

    setLoading(false);
    setToken(data.token);
    setStep('reset');
  };

  const resetPassword = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch('/api/auth/forgot-password/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token, password }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setLoading(false);
      setError(data?.error || 'Failed to reset password.');
      return;
    }

    router.replace('/login');
  };

  return (
    <AuthShell
      eyebrow="Forgot Password"
      title={heading}
      description={description}
    >
      {step === 'request' ? (
        <form onSubmit={requestCode} className="space-y-4">
          <AuthField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="name@example.com"
            autoComplete="email"
          />
          <ErrorCard message={error} />
          <SuccessCard message={success} />
          <AuthPrimaryButton type="submit" disabled={loading || !isValidEmail(email)}>
            {loading ? 'Sending...' : 'Send OTP'}
          </AuthPrimaryButton>
        </form>
      ) : null}

      {step === 'verify' ? (
        <form onSubmit={verifyCode} className="space-y-4">
          <AuthField
            label="Reset Code"
            value={code}
            onChange={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            inputMode="numeric"
            maxLength={6}
          />
          <ErrorCard message={error} />
          <SuccessCard message={success} />
          <AuthPrimaryButton type="submit" disabled={loading || code.length !== 6}>
            {loading ? 'Checking...' : 'Verify OTP'}
          </AuthPrimaryButton>
        </form>
      ) : null}

      {step === 'reset' ? (
        <form onSubmit={resetPassword} className="space-y-4">
          <PasswordField
            label="New Password"
            value={password}
            onChange={setPassword}
            placeholder="Create a new password"
            autoComplete="new-password"
          />
          <PasswordField
            label="Confirm Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirm your new password"
            autoComplete="new-password"
          />
          {passwordsText ? <div className="text-[13px]">{passwordsText}</div> : null}
          <ErrorCard message={error} />
          <AuthPrimaryButton type="submit" disabled={loading || !passwordReady || !token}>
            {loading ? 'Saving...' : 'Update Password'}
          </AuthPrimaryButton>
        </form>
      ) : null}
    </AuthShell>
  );
}

export function OAuthCallbackPage({ mode = 'login' }: { mode?: 'login' | 'register' }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const finishOAuth = async () => {
      try {
        const { data: currentUser, error: currentUserError } = await insforge.auth.getCurrentUser();
        if (currentUserError || !currentUser.user) {
          throw new Error('Unable to load your Google profile.');
        }

        const { data, error: refreshError } = await insforge.auth.refreshSession();
        if (refreshError || !data?.accessToken) {
          throw new Error('Unable to refresh your Google session.');
        }

        const response = await fetch('/api/auth/oauth/finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: data.accessToken,
            mode,
            name:
              currentUser.user.profile?.name ||
              currentUser.user.metadata?.name ||
              currentUser.user.email?.split('@')[0] ||
              null,
          }),
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          await insforge.auth.signOut().catch(() => null);
          throw new Error(payload?.error || 'Failed to finish Google authentication.');
        }

        if (!cancelled) {
          router.replace('/dashboard');
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Failed to finish Google authentication.'));
        }
      }
    };

    finishOAuth();

    return () => {
      cancelled = true;
    };
  }, [mode, router]);

  return (
    <AuthShell
      eyebrow="Google Sign-In"
      title="Finishing your session."
      description="We’re syncing your Google account with Folio and restoring the same session model the dashboard already uses."
    >
      {error ? <ErrorCard message={error} /> : null}
      {!error ? (
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 text-[14px] text-white/62">
          Redirecting you to the dashboard...
        </div>
      ) : null}
      {error ? (
        <div className="mt-4">
          <Link
            href={mode === 'register' ? '/register' : '/login'}
            className="inline-flex items-center gap-2 text-[14px] text-white/70 hover:text-white"
          >
            <IconArrow size={14} />
            Return to {mode === 'register' ? 'register' : 'login'}
          </Link>
        </div>
      ) : null}
    </AuthShell>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 3 18 18" />
      <path d="M10.6 10.7a3 3 0 0 0 4.1 4.1" />
      <path d="M9.9 5.2A11 11 0 0 1 12 5c6.5 0 10 7 10 7a18.8 18.8 0 0 1-3.2 4.3" />
      <path d="M6.7 6.8C3.8 8.7 2 12 2 12a19.2 19.2 0 0 0 6.1 5.6" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.77-.07-1.53-.2-2.25H12v4.27h5.92a5.05 5.05 0 0 1-2.2 3.31v2.75h3.56c2.08-1.91 3.28-4.72 3.28-8.08Z" fill="#4285F4" />
      <path d="M12 23c2.96 0 5.45-.98 7.27-2.66l-3.56-2.75c-.99.66-2.24 1.05-3.71 1.05-2.86 0-5.29-1.93-6.16-4.52H2.18v2.84A11 11 0 0 0 12 23Z" fill="#34A853" />
      <path d="M5.84 14.12A6.6 6.6 0 0 1 5.5 12c0-.73.12-1.44.34-2.12V7.04H2.18A11 11 0 0 0 1 12c0 1.77.42 3.44 1.18 4.96l2.86-2.84.8-.6Z" fill="#FBBC05" />
      <path d="M12 5.36c1.61 0 3.06.55 4.2 1.63l3.14-3.14C17.45 2.1 14.97 1 12 1A11 11 0 0 0 2.18 7.04l3.66 2.84C6.71 7.29 9.14 5.36 12 5.36Z" fill="#EA4335" />
    </svg>
  );
}
