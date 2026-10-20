import Image from 'next/image';
import Link from 'next/link';
import logo from '@/assets/logo.webp';

/** Icon + wordmark. `light` sits on the sky; `dark` on the page background. */
export function Logo({ tone }: { tone: 'light' | 'dark' }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2.5 whitespace-nowrap text-base font-semibold tracking-tight sm:text-lg ${tone === 'light' ? 'text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white' : 'text-foreground'}`}
    >
      <Image src={logo} alt="" width={34} height={34} className="rounded-[9px] shadow-[0_2px_8px_rgba(0,40,90,.25)]" />
      Stratus Status
    </Link>
  );
}
