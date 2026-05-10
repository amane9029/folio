"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/shared';
import { IconAlert, IconLoader, IconShield } from '@/components/icons';
import { DEMO_ACCOUNTS } from '@/components/data';

export default function LoginPage(){
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setBusy(true);
    setTimeout(() => {
      const acct = DEMO_ACCOUNTS.find((a: any) => a.email === email.trim().toLowerCase() && a.password === password);
      if (!acct){
        setError('Those credentials don’t match an invited account.');
        setBusy(false);
        return;
      }
      document.cookie = `role=${acct.role}; path=/`;
      router.push(acct.role === 'admin' ? '/admin' : '/dashboard');
    }, 450);
  };

  const fillDemo = (which: string) => {
    const a = DEMO_ACCOUNTS.find((x: any) => x.role === which);
    if(a) {
      setEmail(a.email);
      setPassword(a.password);
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-10" data-accent="user">
      <div className="w-full max-w-[420px]">
        <form
          onSubmit={submit}
          className="bg-surface rounded-2xl shadow-card p-8 sm:p-10"
        >
          <div className="text-center mb-8">
            <div className="font-serif font-bold text-[36px] text-ink tracking-tight leading-none">Folio</div>
            <div className="mt-2 text-[12px] uppercase tracking-[0.22em] text-ink/65">EPUB Library Manager</div>
          </div>

          <label className="block text-[12px] font-medium text-ink/80 uppercase tracking-wider mb-1.5">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e: any) => setEmail(e.target.value)}
            placeholder="you@studio.fol"
            autoComplete="email"
            required
          />

          <label className="block text-[12px] font-medium text-ink/80 uppercase tracking-wider mb-1.5 mt-5">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
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
            style={{ backgroundColor: '#1a1a1a', color: '#fff' }}
            className="w-full mt-7 inline-flex items-center justify-center gap-2 h-12 px-5 rounded-lg font-medium text-[15px] transition hover:brightness-125 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? <><IconLoader size={16}/> Signing in…</> : 'Sign In'}
          </button>

          <div className="mt-6 pt-5 border-t border-ink/15">
            <p className="text-[11px] text-ink/55 leading-relaxed text-center">
              Folio is invite-only. Contact your library administrator to request an account.
            </p>
          </div>
        </form>

        <div className="mt-5 text-center text-[11px] text-ink/55 tracking-wider">
          © 2026 · INTERNAL TOOL
        </div>
      </div>
    </div>
  );
}
