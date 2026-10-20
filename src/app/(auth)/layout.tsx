import Image from 'next/image';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import skyClouds from '@/assets/sky-clouds.webp';
import { Logo } from '@/components/logo';
import { getCurrentUser } from '@/lib/dal';

async function RedirectIfSignedIn() {
  if (await getCurrentUser()) redirect('/dashboard');
  return null;
}

// The front page's sky: the logo on --sky-deep fading into the artwork's sky, with the hero's cloud bank along the bottom
// (wider than the screen so it stays deep on phones). The card sits above the clouds.
export default function AuthLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="relative isolate flex min-h-svh flex-1 flex-col overflow-hidden bg-sky">
      <header className="relative z-10 bg-sky-deep shadow-[0_1px_0_var(--sky-deep)]">
        <div className="mx-auto w-full max-w-[1120px] px-4 py-5 sm:px-6">
          <Logo tone="light" />
        </div>
        <div className="absolute inset-x-0 top-full h-28 bg-linear-to-b from-sky-deep to-transparent" aria-hidden="true" />
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-24 pt-10 sm:pb-32">
        <Suspense>
          <RedirectIfSignedIn />
        </Suspense>
        {children}
      </main>
      <div className="pointer-events-none absolute bottom-[-7vw] left-1/2 z-0 w-[max(142vw,1100px)] -translate-x-1/2" aria-hidden="true">
        <Image src={skyClouds} alt="" sizes="max(142vw, 1100px)" loading="eager" placeholder="blur" className="block h-auto w-full mask-t-from-60%" />
      </div>
    </div>
  );
}
