"use client";

import Link from 'next/link';
import type { ButtonHTMLAttributes, FormEvent, InputHTMLAttributes, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  topAction,
  compact = false,
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  topAction?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_28%)]" />
      <main className="relative z-10 min-h-screen">
        <section className="min-h-screen bg-[#0a0a0a]/96 overflow-hidden backdrop-blur-xl">
          {!compact ? (
            <div className="h-14 border-b border-white/6 bg-white/[0.02] px-4 sm:px-6 flex items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57] border border-[#e0443e]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e] border border-[#dea123]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840] border border-[#1ea632]" />
              </div>
              <LogoMark />
            </div>
          ) : null}

          <div className={`relative flex items-center justify-center ${compact ? 'min-h-screen px-4 py-8 sm:px-6' : 'min-h-[calc(100vh-3.5rem)] p-6 sm:p-8 md:p-10'}`}>
            <div className="pointer-events-none absolute top-[-35%] right-[-10%] h-[70%] w-[45%] rounded-full bg-white/[0.03] blur-[90px]" />
            <div className={`w-full rounded-[24px] bg-gradient-to-b from-white/[0.08] to-transparent p-[1px] ${compact ? 'max-w-[390px]' : 'max-w-[430px]'}`}>
              <div className={`rounded-[23px] border border-white/6 bg-[#111] shadow-[0_20px_50px_rgba(0,0,0,0.35)] ${compact ? 'px-5 py-6 sm:px-5 sm:py-6' : 'px-6 py-7 sm:px-7 sm:py-8'}`}>
                {compact ? (
                  <div className="mb-5 flex items-center justify-center">
                    <div className="text-center">
                      <div className="font-serif text-[30px] font-semibold tracking-tight text-white sm:text-[34px]">Folio</div>
                      <div className="mt-1.5 text-[9px] uppercase tracking-[0.28em] text-white/38 sm:text-[10px]">
                        EPUB Library Manager
                      </div>
                    </div>
                  </div>
                ) : null}
                {topAction ? <div className={compact ? 'mb-5' : 'mb-5'}>{topAction}</div> : null}
                {eyebrow && (
                  <div className={`text-[11px] uppercase tracking-[0.18em] text-white/45 ${compact ? 'mb-2' : 'mb-3'}`}>
                    {eyebrow}
                  </div>
                )}
                {title ? (
                  <h1 className={`font-serif leading-[1.04] font-semibold tracking-tight text-white ${compact ? 'text-[18px] sm:text-[20px]' : 'text-[28px] sm:text-[34px]'}`}>
                    {title}
                  </h1>
                ) : null}
                {description ? (
                  <p className={`leading-relaxed text-white/52 ${compact ? 'mt-2.5 text-[12.5px]' : 'mt-3 text-[14px]'}`}>{description}</p>
                ) : null}

                <div className={compact ? 'mt-5' : 'mt-6'}>{children}</div>
                {footer ? <div className={compact ? 'mt-5' : 'mt-5'}>{footer}</div> : null}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function MainWebsiteLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-medium text-white/62 transition hover:bg-white/[0.06] hover:text-white"
    >
      <span className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white/[0.05]">
        <IconArrow size={11} className="rotate-180" />
      </span>
      Back to main website
    </Link>
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
      <div className="mb-2.5 text-[12px] uppercase tracking-[0.2em] text-white/48">{label}</div>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          className="h-[46px] w-full rounded-[16px] border border-white/8 bg-[#0f0f0f] px-4 pr-10 text-[14px] text-white placeholder:text-white/26 outline-none transition focus:border-white/18 focus:bg-[#151515]"
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
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white/28 hover:bg-white/[0.05] hover:text-white/48 transition"
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
    <button
      className={`h-12 w-full rounded-xl border border-white/28 bg-gradient-to-r from-[#dcdcdc] via-[#f3f3f3] to-[#cfcfcf] text-[17px] font-semibold text-[#050505] shadow-[0_8px_22px_rgba(255,255,255,0.18)] transition hover:brightness-105 disabled:opacity-60 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function AuthSecondaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = '', children, ...rest } = props;
  return (
    <button
      className={`inline-flex h-[46px] w-full items-center justify-center gap-2 rounded-[14px] border border-white/10 bg-white/[0.03] px-4 text-[14px] font-medium text-white/86 transition hover:bg-white/[0.06] disabled:opacity-45 ${className}`}
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

function shouldContinueToVerification(errorMessage: string) {
  const value = errorMessage.toLowerCase();
  if (value.includes('account already exists')) {
    return false;
  }
  if (value.includes('continue with google')) {
    return false;
  }
  if (value.includes('invalid')) {
    return false;
  }

  return (
    value.includes('failed to register account') ||
    value.includes('failed to send verification code') ||
    value.includes('please wait') ||
    value.includes('verification')
  );
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
  const [showPassword, setShowPassword] = useState(false);
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

    router.replace(data?.role === 'admin' ? '/admin' : '/dashboard');
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
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_76%,rgba(255,255,255,0.08),transparent_36%),radial-gradient(circle_at_80%_14%,rgba(255,255,255,0.06),transparent_40%),linear-gradient(120deg,#0e0e0e_0%,#070707_50%,#030303_100%)]" />
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-8">
        <section className="relative w-full max-w-[1040px] overflow-hidden rounded-[28px] border border-white/10 bg-black/55 backdrop-blur-xl shadow-[0_24px_90px_rgba(0,0,0,0.7)]">
          <div className="grid min-h-[580px] md:grid-cols-[1.08fr_0.92fr]">
            <div className="relative hidden overflow-hidden md:block">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_84%,rgba(255,255,255,0.08),transparent_42%),radial-gradient(circle_at_56%_70%,rgba(255,255,255,0.07),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />
              <div className="folio-book-float absolute left-[6%] bottom-[6%] h-[78%] w-[88%]">
                <div className="folio-book-aura absolute inset-x-[8%] top-[6%] h-[46%] rounded-[22px] bg-[radial-gradient(circle_at_50%_60%,rgba(255,255,255,0.24),rgba(255,255,255,0.04)_58%,transparent_75%)]" />
                <div className="absolute inset-x-[10%] bottom-[10%] h-[54%]">
                  <div className="absolute left-[49.8%] top-[2%] h-[88%] w-[1px] bg-white/35" />
                  <div className="folio-book-page-left absolute left-[2%] top-[8%] h-[82%] w-[47%] rounded-[18px] border border-white/24 bg-white/[0.08] shadow-[0_14px_34px_rgba(8,12,24,0.45)]" />
                  <div className="folio-book-page-right absolute right-[2%] top-[8%] h-[82%] w-[47%] rounded-[18px] border border-white/24 bg-white/[0.08] shadow-[0_14px_34px_rgba(8,12,24,0.45)]" />
                  <div className="folio-page-turn-1 absolute left-[49.8%] top-[7%] h-[84%] w-[35%] origin-left rounded-[14px] border border-white/24 bg-[linear-gradient(100deg,rgba(255,255,255,0.26),rgba(255,255,255,0.08))] shadow-[0_14px_30px_rgba(0,0,0,0.45)]">
                    <div className="absolute inset-y-[8%] left-[6%] w-[1px] bg-white/35" />
                  </div>
                  <div className="folio-page-turn-2 absolute left-[49.8%] top-[7%] h-[84%] w-[35%] origin-left rounded-[14px] border border-white/24 bg-[linear-gradient(105deg,rgba(255,255,255,0.24),rgba(255,255,255,0.07))] shadow-[0_14px_30px_rgba(0,0,0,0.42)]">
                    <div className="absolute inset-y-[8%] left-[6%] w-[1px] bg-white/30" />
                  </div>
                  <div className="folio-page-turn-3 absolute left-[49.8%] top-[7%] h-[84%] w-[35%] origin-left rounded-[14px] border border-white/24 bg-[linear-gradient(104deg,rgba(255,255,255,0.28),rgba(255,255,255,0.08))] shadow-[0_14px_30px_rgba(0,0,0,0.42)]">
                    <div className="absolute inset-y-[8%] left-[6%] w-[1px] bg-white/30" />
                  </div>
                  <div className="absolute inset-x-[14%] bottom-[4%] h-[22%] rounded-[14px] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.18),transparent_72%)]" />
                </div>
                <div className="folio-book-spark-1 absolute left-[20%] top-[36%] h-1.5 w-1.5 rounded-full bg-white/55" />
                <div className="folio-book-spark-2 absolute left-[68%] top-[31%] h-1.5 w-1.5 rounded-full bg-white/45" />
                <div className="folio-book-spark-3 absolute left-[52%] top-[24%] h-1 w-1 rounded-full bg-white/40" />
              </div>
              <div className="absolute inset-x-0 bottom-[4%] text-center text-[12px] uppercase tracking-[0.22em] text-white/45">
                Curate. Read. Organize.
              </div>
            </div>

            <div className="flex items-center justify-center p-5 sm:p-8">
              <div className="w-full max-w-[420px] rounded-[24px] border border-white/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] px-5 py-6 shadow-[0_18px_56px_rgba(0,0,0,0.72)] backdrop-blur-xl sm:px-6 sm:py-7">
                <div className="mb-4 flex justify-start">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-[12px] text-white/50 transition hover:text-white/80"
                  >
                    <IconArrow size={12} className="rotate-180" />
                    Home
                  </Link>
                </div>
                <div className="mb-1 flex items-center justify-center gap-3">
                  <img src="/main_logo.svg" alt="Folio" className="h-8 w-8 filter invert opacity-95" />
                  <h1 className="font-serif text-[58px] leading-[0.9] tracking-tight text-white">
                    Folio
                  </h1>
                </div>
                <p className="mt-2 text-center text-[12px] uppercase tracking-[0.16em] text-white/62">
                  EPUB LIBRARY MANAGER
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <label className="block">
                    <div className="mb-1.5 text-[14px] font-medium leading-none text-white/90">Email</div>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="olivia.parker@example.com"
                      autoComplete="email"
                        className="h-11 w-full rounded-xl border border-white/20 bg-[#0f0f0f]/90 px-4 text-[15px] text-white placeholder:text-white/35 outline-none transition focus:border-white/35 focus:bg-[#141414]"
                    />
                  </label>

                  <label className="block">
                    <div className="mb-1.5 text-[14px] font-medium leading-none text-white/90">Password</div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Password"
                        autoComplete="current-password"
                        className="h-11 w-full rounded-xl border border-white/20 bg-[#0f0f0f]/90 px-4 pr-11 text-[15px] text-white placeholder:text-white/35 outline-none transition focus:border-white/35 focus:bg-[#141414]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-white/50 transition hover:text-white/82"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </label>

                  <div className="-mt-0.5 flex justify-end">
                    <Link href="/forgot-password" className="text-[13px] text-white/72 transition hover:text-white">
                      Forgot password?
                    </Link>
                  </div>

                  <ErrorCard message={error} />

                  <button
                    type="submit"
                    disabled={loading || !email || !password}
                    className="h-12 w-full rounded-xl border border-white/28 bg-gradient-to-r from-[#dcdcdc] via-[#f3f3f3] to-[#cfcfcf] text-[17px] font-semibold text-[#050505] shadow-[0_8px_22px_rgba(255,255,255,0.18)] transition hover:brightness-105 disabled:opacity-45"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>

                <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-white/56">
                  <span className="h-px flex-1 bg-white/18" />
                  OR CONTINUE WITH
                  <span className="h-px flex-1 bg-white/18" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={loading}
                  className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-white/20 bg-white/[0.02] px-4 text-[15px] font-medium text-white/92 transition hover:bg-white/[0.07] disabled:opacity-45"
                >
                  <GoogleIcon />
                  Sign in with Google
                </button>

                <div className="mt-5 text-[14px] text-white/50">
                  New to Folio?{' '}
                  <Link href="/register" className="text-white/92 transition hover:text-white">
                    Register
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export function RegisterPage() {
  useAuthBootstrap();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      const message = data?.error || 'Failed to register.';
      if (shouldContinueToVerification(message)) {
        router.push(`/verify?email=${encodeURIComponent(email)}`);
        return;
      }

      setLoading(false);
      setError(message);
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
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_76%,rgba(255,255,255,0.08),transparent_36%),radial-gradient(circle_at_80%_14%,rgba(255,255,255,0.06),transparent_40%),linear-gradient(120deg,#0e0e0e_0%,#070707_50%,#030303_100%)]" />
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-8">
        <section className="relative w-full max-w-[1040px] overflow-hidden rounded-[28px] border border-white/10 bg-black/55 backdrop-blur-xl shadow-[0_24px_90px_rgba(0,0,0,0.7)]">
          <div className="grid min-h-[580px] md:grid-cols-[1.08fr_0.92fr]">
            <div className="relative hidden overflow-hidden md:block">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_84%,rgba(255,255,255,0.08),transparent_42%),radial-gradient(circle_at_56%_70%,rgba(255,255,255,0.07),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />
              <div className="folio-book-float absolute left-[6%] bottom-[6%] h-[78%] w-[88%]">
                <div className="folio-book-aura absolute inset-x-[8%] top-[6%] h-[46%] rounded-[22px] bg-[radial-gradient(circle_at_50%_60%,rgba(255,255,255,0.24),rgba(255,255,255,0.04)_58%,transparent_75%)]" />
                <div className="absolute inset-x-[10%] bottom-[10%] h-[54%]">
                  <div className="absolute left-[49.8%] top-[2%] h-[88%] w-[1px] bg-white/35" />
                  <div className="folio-book-page-left absolute left-[2%] top-[8%] h-[82%] w-[47%] rounded-[18px] border border-white/24 bg-white/[0.08] shadow-[0_14px_34px_rgba(8,12,24,0.45)]" />
                  <div className="folio-book-page-right absolute right-[2%] top-[8%] h-[82%] w-[47%] rounded-[18px] border border-white/24 bg-white/[0.08] shadow-[0_14px_34px_rgba(8,12,24,0.45)]" />
                  <div className="folio-page-turn-1 absolute left-[49.8%] top-[7%] h-[84%] w-[35%] origin-left rounded-[14px] border border-white/24 bg-[linear-gradient(100deg,rgba(255,255,255,0.26),rgba(255,255,255,0.08))] shadow-[0_14px_30px_rgba(0,0,0,0.45)]">
                    <div className="absolute inset-y-[8%] left-[6%] w-[1px] bg-white/35" />
                  </div>
                  <div className="folio-page-turn-2 absolute left-[49.8%] top-[7%] h-[84%] w-[35%] origin-left rounded-[14px] border border-white/24 bg-[linear-gradient(105deg,rgba(255,255,255,0.24),rgba(255,255,255,0.07))] shadow-[0_14px_30px_rgba(0,0,0,0.42)]">
                    <div className="absolute inset-y-[8%] left-[6%] w-[1px] bg-white/30" />
                  </div>
                  <div className="folio-page-turn-3 absolute left-[49.8%] top-[7%] h-[84%] w-[35%] origin-left rounded-[14px] border border-white/24 bg-[linear-gradient(104deg,rgba(255,255,255,0.28),rgba(255,255,255,0.08))] shadow-[0_14px_30px_rgba(0,0,0,0.42)]">
                    <div className="absolute inset-y-[8%] left-[6%] w-[1px] bg-white/30" />
                  </div>
                  <div className="absolute inset-x-[14%] bottom-[4%] h-[22%] rounded-[14px] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.18),transparent_72%)]" />
                </div>
                <div className="folio-book-spark-1 absolute left-[20%] top-[36%] h-1.5 w-1.5 rounded-full bg-white/55" />
                <div className="folio-book-spark-2 absolute left-[68%] top-[31%] h-1.5 w-1.5 rounded-full bg-white/45" />
                <div className="folio-book-spark-3 absolute left-[52%] top-[24%] h-1 w-1 rounded-full bg-white/40" />
              </div>
              <div className="absolute inset-x-0 bottom-[4%] text-center text-[12px] uppercase tracking-[0.22em] text-white/45">
                Curate. Read. Organize.
              </div>
            </div>

            <div className="flex items-center justify-center p-5 sm:p-8">
              <div className="w-full max-w-[420px] rounded-[24px] border border-white/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] px-5 py-6 shadow-[0_18px_56px_rgba(0,0,0,0.72)] backdrop-blur-xl sm:px-6 sm:py-7">
                <div className="mb-4 flex justify-start">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-[12px] text-white/50 transition hover:text-white/80"
                  >
                    <IconArrow size={12} className="rotate-180" />
                    Home
                  </Link>
                </div>
                <div className="mb-1 flex items-center justify-center gap-3">
                  <img src="/main_logo.svg" alt="Folio" className="h-8 w-8 filter invert opacity-95" />
                  <h1 className="font-serif text-[58px] leading-[0.9] tracking-tight text-white">
                    Folio
                  </h1>
                </div>
                <p className="mt-2 text-center text-[12px] uppercase tracking-[0.16em] text-white/62">
                  EPUB LIBRARY MANAGER
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <label className="block">
                    <div className="mb-1.5 text-[14px] font-medium leading-none text-white/90">Email</div>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="olivia.parker@example.com"
                      autoComplete="email"
                      className="h-11 w-full rounded-xl border border-white/20 bg-[#0f0f0f]/90 px-4 text-[15px] text-white placeholder:text-white/35 outline-none transition focus:border-white/35 focus:bg-[#141414]"
                    />
                  </label>

                  <label className="block">
                    <div className="mb-1.5 text-[14px] font-medium leading-none text-white/90">Password</div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Create a password"
                        autoComplete="new-password"
                        className="h-11 w-full rounded-xl border border-white/20 bg-[#0f0f0f]/90 px-4 pr-11 text-[15px] text-white placeholder:text-white/35 outline-none transition focus:border-white/35 focus:bg-[#141414]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-white/50 transition hover:text-white/82"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </label>

                  <label className="block">
                    <div className="mb-1.5 text-[14px] font-medium leading-none text-white/90">Confirm Password</div>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Re-enter your password"
                        autoComplete="new-password"
                        className="h-11 w-full rounded-xl border border-white/20 bg-[#0f0f0f]/90 px-4 pr-11 text-[15px] text-white placeholder:text-white/35 outline-none transition focus:border-white/35 focus:bg-[#141414]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((value) => !value)}
                        className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-white/50 transition hover:text-white/82"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </label>

                  {validationText ? <div className="text-[13px]">{validationText}</div> : null}
                  <ErrorCard message={error} />

                  <button
                    type="submit"
                    disabled={loading || !emailValid || !passwordsMatch}
                    className="h-12 w-full rounded-xl border border-white/28 bg-gradient-to-r from-[#dcdcdc] via-[#f3f3f3] to-[#cfcfcf] text-[17px] font-semibold text-[#050505] shadow-[0_8px_22px_rgba(255,255,255,0.18)] transition hover:brightness-105 disabled:opacity-45"
                  >
                    {loading ? 'Registering...' : 'Register'}
                  </button>
                </form>

                <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-white/56">
                  <span className="h-px flex-1 bg-white/18" />
                  OR CONTINUE WITH
                  <span className="h-px flex-1 bg-white/18" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={loading}
                  className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-white/20 bg-white/[0.02] px-4 text-[15px] font-medium text-white/92 transition hover:bg-white/[0.07] disabled:opacity-45"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>

                <div className="mt-5 text-[14px] text-white/50">
                  Already registered?{' '}
                  <Link href="/login" className="text-white/92 transition hover:text-white">
                    Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
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

    router.replace(data?.role === 'admin' ? '/admin' : '/dashboard');
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
            placeholder="olivia.parker@example.com"
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

export function OAuthCallbackPage({
  mode = 'login',
}: {
  mode?: 'login' | 'register';
}) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const finishOAuth = async () => {
      try {
        const { data: currentUser, error: currentUserError } = await insforge.auth.getCurrentUser();
        if (currentUserError || !currentUser?.user) {
          throw new Error('Unable to load your Google profile.');
        }

        const { data, error: refreshError } = await insforge.auth.refreshSession();
        if (refreshError || !data?.accessToken) {
          throw new Error(refreshError?.message || 'Unable to refresh your Google session.');
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
          window.location.replace('/dashboard');
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
  }, [mode]);

  if (!error) {
    return (
      <div className="min-h-screen bg-[#050505]" aria-busy="true" aria-live="polite">
        <span className="sr-only">Signing you in with Google and redirecting to the dashboard.</span>
      </div>
    );
  }

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
