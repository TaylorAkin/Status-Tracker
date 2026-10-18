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

  const field = 'w-full rounded-lg border border-line bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand/40';

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-surface p-7">
      <h1 className="text-2xl font-semibold tracking-tight">{isSignUp ? 'Create your account' : 'Sign in'}</h1>
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
        className="w-full rounded-lg bg-foreground px-4 py-2.5 font-medium text-white hover:bg-foreground/90 disabled:opacity-50"
      >
        {pending ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
      </button>
      <p className="text-center text-sm text-muted">
        {isSignUp ? 'Already have an account? ' : 'New here? '}
        <Link href={isSignUp ? '/sign-in' : '/sign-up'} className="font-medium text-brand underline">
          {isSignUp ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </form>
  );
}
