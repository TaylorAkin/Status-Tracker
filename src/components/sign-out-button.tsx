'use client';

import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await authClient.signOut();
        router.push('/sign-in');
        router.refresh();
      }}
      className="rounded-lg border border-line bg-surface px-4 py-2 text-sm hover:bg-background"
    >
      Sign out
    </button>
  );
}
