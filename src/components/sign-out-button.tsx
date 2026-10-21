'use client';

import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { buttonClass } from './ui';

export function SignOutButton({ className = buttonClass.secondary }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await authClient.signOut();
        router.push('/sign-in');
        router.refresh();
      }}
      className={className}
    >
      Sign out
    </button>
  );
}
