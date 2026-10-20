'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isSignUp = mode === 'sign-up';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email'));
    const password = String(form.get('password'));
    setPending(true);
    setError(null);
    const { error } = isSignUp
      ? await authClient.signUp.email({ email, password, name: String(form.get('name')) })
      : await authClient.signIn.email({ email, password });
    setPending(false);
    if (error) return setError(error.message ?? 'Something went wrong. Try again.');
    router.push('/dashboard');
    router.refresh();
  }

  const field =
    'w-full rounded-xl border border-muted/75 bg-surface px-3.5 py-3 text-base outline-none focus:border-sky-deep focus:ring-3 focus:ring-sky-deep/25';

  return (
    <form onSubmit={onSubmit} className="w-full max-w-[400px] space-y-4 rounded-3xl bg-surface p-6 shadow-[0_24px_60px_rgba(10,30,70,.28)] sm:p-9">
      <div className="pb-1">
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-navy">{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
        <p className="mt-1.5 text-[15px] text-muted">
          {isSignUp ? 'Free to use. No airline login required.' : 'Sign in to see where your status stands.'}
        </p>
      </div>
      {isSignUp && (
        <label className="block space-y-1.5 text-sm font-medium">
          <span>Name</span>
          <input name="name" required autoComplete="name" className={field} />
        </label>
      )}
      <label className="block space-y-1.5 text-sm font-medium">
        <span>Email</span>
        <input name="email" type="email" required autoComplete="email" className={field} />
      </label>
      <label className="block space-y-1.5 text-sm font-medium">
        <span>Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          className={field}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-accent">
          {error}
        </p>
      )}
      <button
        disabled={pending}
        className="mt-2 w-full rounded-full bg-navy px-5 py-3.5 text-base font-semibold text-white hover:bg-navy/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:opacity-50"
      >
        {pending ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
      </button>
      <p className="text-center text-sm text-muted">
        {isSignUp ? 'Already have an account? ' : 'New here? '}
        <Link href={isSignUp ? '/sign-in' : '/sign-up'} className="font-semibold text-sky-ink underline underline-offset-2 hover:text-navy">
          {isSignUp ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </form>
  );
}
