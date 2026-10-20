import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-20">
      <p className="text-xs font-bold uppercase tracking-[2px] text-brand">StatusTrack</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Know exactly where your airline status stands.</h1>
      <p className="mt-4 max-w-xl text-lg text-muted">
        Track posted and projected MQDs from flights, card spend, and headstarts, and see what it takes to reach your next Medallion tier.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/sign-up" className="rounded-lg bg-foreground px-5 py-3 font-medium text-white hover:bg-foreground/90">
          Get started for free
        </Link>
        <Link href="/sign-in" className="rounded-lg border border-line bg-surface px-5 py-3 font-medium">
          Sign in
        </Link>
      </div>
      <p className="mt-16 text-xs text-muted">Not affiliated with Delta Air Lines or American Express. Estimates only.</p>
    </main>
  );
}
