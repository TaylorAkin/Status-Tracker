'use client';

import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { buttonClass } from './ui';

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await authClient.signOut();
        router.push('/sign-in');
        router.refresh();
      }}
      className={buttonClass.secondary}
    >
      Sign out
    </button>
  );
}
