import Link from 'next/link';
import { Logo } from './logo';

export function SiteHeader() {
  return (
    <header className="bg-sky-deep text-white">
      <nav className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-4 px-4 py-5 sm:px-6" aria-label="Main">
        <Logo tone="light" />
        <div className="flex items-center gap-4 whitespace-nowrap text-[15px] font-medium text-white sm:gap-5">
          <a href="#features" className="hidden sm:inline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            Features
          </a>
          <a href="#how" className="hidden sm:inline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            How it works
          </a>
          <Link href="/sign-in" className="max-[359px]:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-full bg-white px-3.5 py-2 font-semibold text-navy sm:px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}
