import { Suspense } from 'react';
import { SignOutButton } from '@/components/sign-out-button';
import { requireUser } from '@/lib/dal';

export const metadata = { title: 'Dashboard · StatusTrack' };

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-9 sm:px-7">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[2px] text-brand">2027 Status Year</p>
          <Suspense fallback={<div className="mt-2 h-14 w-64 animate-pulse rounded-lg bg-line" />}>
            <Greeting />
          </Suspense>
        </div>
        <SignOutButton />
      </header>
      <p className="mt-8 rounded-xl border border-line bg-surface p-6 text-muted">Your Delta tracker will appear here.</p>
    </main>
  );
}

async function Greeting() {
  const user = await requireUser();
  return (
    <>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Welcome, {user.name}</h1>
      <p className="text-muted">Signed in as {user.email}</p>
    </>
  );
}
