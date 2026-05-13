"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { IconArrow } from '@/components/icons';
import { ErrorCard } from '@/components/auth-ui';
import { insforge } from '@/lib/insforge';
import { getErrorMessage } from '@/lib/errors';

function LogoMark() {
  return (
    <div className="flex items-center gap-3">
      <img src="/main_logo.svg" alt="Folio" className="h-8 w-8 filter invert opacity-95" />
      <span className="font-serif text-[24px] font-semibold tracking-tight text-white">Folio</span>
    </div>
  );
}

export function OAuthCallbackFullPage({
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
          window.location.replace(payload?.role === 'admin' ? '/admin' : '/dashboard');
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

          <div className="relative min-h-[calc(100vh-3.5rem-3rem)] p-8 sm:p-10 md:p-12 flex items-center justify-center">
            <div className="pointer-events-none absolute top-[-35%] right-[-10%] h-[70%] w-[45%] rounded-full bg-white/[0.03] blur-[90px]" />
            <div className="w-full max-w-[560px] text-center">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                Google Sign-In
              </div>
              <h1 className="mt-4 font-serif text-[32px] sm:text-[40px] leading-[1.04] font-semibold tracking-tight text-white">
                We couldn&apos;t finish your session.
              </h1>
              <div className="mt-6">
                <ErrorCard message={error} />
              </div>
              <div className="mt-6 flex justify-center">
                <Link
                  href={mode === 'register' ? '/register' : '/login'}
                  className="inline-flex items-center gap-2 text-[14px] text-white/70 hover:text-white"
                >
                  <IconArrow size={14} />
                  Return to {mode === 'register' ? 'register' : 'login'}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
