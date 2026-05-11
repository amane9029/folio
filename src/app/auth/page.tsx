"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/shared';
import { IconAlert, IconLoader } from '@/components/icons';
import { createClient } from '@insforge/sdk';

const insforge = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
});

export default function AuthPage(){
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [verifyMode, setVerifyMode] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [otp, setOtp] = useState('');

  // Handle OAuth callback (insforge_code in URL)
  useEffect(() => {
    const code = searchParams.get('insforge_code');
    if (code) {
      handleOAuthCallback();
    }
  }, [searchParams]);

  const handleOAuthCallback = async () => {
    setBusy(true);
    try {
      // The SDK handles the code exchange automatically via getCurrentUser
      const { data } = await insforge.auth.getCurrentUser();
      if (data?.user) {
        await loginSuccess(data.user);
      }
    } catch {
      setError('OAuth sign-in failed. Please try again.');
    }
    setBusy(false);
  };

  const loginSuccess = async (user: any) => {
    // Get access token - need to sign in again or use the token from the session
    const token = (insforge as any).getHttpClient?.()?.authToken;

    if (token) {
      document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
    }

    // Ensure profile exists (upsert)
    try {
      insforge.setAccessToken(token);
      const { data: existingProfile } = await insforge.database
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        // Create profile for new user
        await insforge.database
          .from('profiles')
          .insert([{ id: user.id, role: 'user' }]);
      }

      const role = existingProfile?.role || 'user';
      document.cookie = `role=${role}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;

      if (role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch {
      // If profile fetch fails, default to user role
      document.cookie = `role=user; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
      router.push('/dashboard');
    }
  };

  const submitSignIn = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setBusy(true);

    try {
      const { data, error: authError } = await insforge.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError || !data) {
        setError(authError?.message || 'Invalid credentials.');
        setBusy(false);
        return;
      }

      const token = data.accessToken;
      document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
      insforge.setAccessToken(token);

      // Fetch role from profiles
      const { data: profile } = await insforge.database
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      const role = profile?.role || 'user';
      document.cookie = `role=${role}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;

      if (role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Network error. Please try again.');
      setBusy(false);
    }
  };

  const submitSignUp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setBusy(true);

    try {
      const { data, error: authError } = await insforge.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim() || undefined,
      });

      if (authError || !data) {
        setError(authError?.message || 'Sign up failed.');
        setBusy(false);
        return;
      }

      if (data.requireEmailVerification) {
        // Show OTP verification form
        setVerifyEmail(email.trim().toLowerCase());
        setVerifyMode(true);
        setBusy(false);
        return;
      }

      if (data.accessToken) {
        const token = data.accessToken;
        document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
        insforge.setAccessToken(token);

        // Create profile
        if (data.user) {
          await insforge.database
            .from('profiles')
            .insert([{ id: data.user.id, role: 'user' }]);
        }

        document.cookie = `role=user; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
        router.push('/dashboard');
      }
    } catch {
      setError('Network error. Please try again.');
      setBusy(false);
    }
  };

  const submitVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setBusy(true);

    try {
      const { data, error: verifyError } = await insforge.auth.verifyEmail({
        email: verifyEmail,
        otp: otp.trim(),
      });

      if (verifyError || !data) {
        setError(verifyError?.message || 'Verification failed.');
        setBusy(false);
        return;
      }

      if (data.accessToken) {
        const token = data.accessToken;
        document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
        insforge.setAccessToken(token);

        // Create profile for verified user
        if (data.user) {
          await insforge.database
            .from('profiles')
            .insert([{ id: data.user.id, role: 'user' }]);
        }

        document.cookie = `role=user; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
        router.push('/dashboard');
      }
    } catch {
      setError('Network error. Please try again.');
      setBusy(false);
    }
  };

  const resendCode = async () => {
    try {
      await insforge.auth.resendVerificationEmail({ email: verifyEmail });
      setError('');
    } catch {}
  };

  const signInWithGoogle = async () => {
    setError('');
    setBusy(true);
    try {
      await insforge.auth.signInWithOAuth({
        provider: 'google',
        redirectTo: window.location.origin + '/auth',
      });
    } catch {
      setError('Google sign-in failed.');
      setBusy(false);
    }
  };

  // Email verification screen
  if (verifyMode) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-10" data-accent="user">
        <div className="w-full max-w-[420px]">
          <form onSubmit={submitVerify} className="bg-surface rounded-2xl shadow-card p-8 sm:p-10">
            <div className="text-center mb-8">
              <img src="/logo_with_text.svg" alt="Folio" className="h-24 mx-auto filter invert opacity-90" />
              <div className="mt-3 text-[14px] text-ink/80 font-medium">Verify your email</div>
              <div className="mt-1 text-[13px] text-ink/60">
                We sent a 6-digit code to <span className="font-medium text-ink">{verifyEmail}</span>
              </div>
            </div>

            <label className="block text-[12px] font-medium text-ink/80 uppercase tracking-wider mb-1.5">Verification Code</label>
            <Input
              type="text"
              value={otp}
              onChange={(e: any) => setOtp(e.target.value)}
              placeholder="123456"
              maxLength={6}
              autoFocus
              required
            />

            {error && (
              <div className="mt-4 text-[13px] text-crimson flex items-center gap-2">
                <IconAlert size={14}/> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy || otp.trim().length < 6}
              className="w-full mt-6 inline-flex items-center justify-center gap-2 h-12 px-5 rounded-lg font-bold text-[15px] bg-white text-black transition hover:bg-white/90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              {busy ? <><IconLoader size={16}/> Verifying…</> : 'Verify & Sign In'}
            </button>

            <div className="mt-4 text-center">
              <button type="button" onClick={resendCode} className="text-[13px] text-ink/60 hover:text-ink transition cursor-pointer">
                Didn't receive it? <span className="font-medium underline">Resend code</span>
              </button>
            </div>

            <div className="mt-3 text-center">
              <button type="button" onClick={() => { setVerifyMode(false); setOtp(''); setError(''); }} className="text-[13px] text-ink/55 hover:text-ink transition cursor-pointer">
                ← Back to sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Main auth screen (Sign In / Sign Up)
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-10" data-accent="user">
      <div className="w-full max-w-[420px]">
        <form
          onSubmit={mode === 'signin' ? submitSignIn : submitSignUp}
          className="bg-surface rounded-2xl shadow-card p-8 sm:p-10"
        >
          <div className="text-center mb-8">
            <img src="/logo_with_text.svg" alt="Folio" className="h-24 mx-auto filter invert opacity-90" />
            <div className="mt-3 text-[12px] uppercase tracking-[0.22em] text-ink/65">EPUB Library Manager</div>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-lg bg-bg overflow-hidden mb-6 border border-ink/15">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(''); }}
              className={`flex-1 h-10 text-[13px] font-medium transition cursor-pointer ${mode === 'signin' ? 'bg-white text-ink-invert' : 'text-ink/70 hover:text-ink'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 h-10 text-[13px] font-medium transition cursor-pointer ${mode === 'signup' ? 'bg-white text-ink-invert' : 'text-ink/70 hover:text-ink'}`}
            >
              Sign Up
            </button>
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={busy}
            className="w-full h-11 rounded-lg border border-ink/20 bg-surface hover:bg-secondary text-[14px] font-medium text-ink inline-flex items-center justify-center gap-3 transition cursor-pointer disabled:opacity-60 mb-5"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-ink/15"/>
            <span className="text-[11px] uppercase tracking-[0.16em] text-ink/50">or</span>
            <div className="flex-1 h-px bg-ink/15"/>
          </div>

          {/* Name field (sign up only) */}
          {mode === 'signup' && (
            <>
              <label className="block text-[12px] font-medium text-ink/80 uppercase tracking-wider mb-1.5">Name</label>
              <Input
                type="text"
                value={name}
                onChange={(e: any) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
              <div className="mt-4"/>
            </>
          )}

          <label className="block text-[12px] font-medium text-ink/80 uppercase tracking-wider mb-1.5">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label className="block text-[12px] font-medium text-ink/80 uppercase tracking-wider mb-1.5 mt-4">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required
          />

          {error && (
            <div className="mt-4 text-[13px] text-crimson flex items-center gap-2">
              <IconAlert size={14}/> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full mt-6 inline-flex items-center justify-center gap-2 h-12 px-5 rounded-lg font-bold text-[15px] bg-white text-black transition hover:bg-white/90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            {busy
              ? <><IconLoader size={16}/> {mode === 'signin' ? 'Signing in…' : 'Creating account…'}</>
              : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>

          {mode === 'signup' && (
            <div className="mt-4 text-[11px] text-ink/50 text-center leading-relaxed">
              By signing up you agree to our Terms of Service.
            </div>
          )}
        </form>

        <div className="mt-5 text-center text-[11px] text-ink/55 tracking-wider">
          © 2026 · FOLIO
        </div>
      </div>
    </div>
  );
}
