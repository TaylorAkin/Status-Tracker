import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/dal';

async function RedirectIfSignedIn() {
  if (await getCurrentUser()) redirect('/dashboard');
  return null;
}

export default function AuthLayout({ children }: LayoutProps<'/'>) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      {children}
    </main>
  );
}
