import Link from 'next/link';
import { HeroScene } from './hero-scene';
import { SAMPLE } from './sample-data';

const PILL =
  'rounded-full px-5 py-3.5 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 sm:px-[30px] sm:py-[17px] sm:text-[17px]';

// Design 1a: a full-height sky with the headline at the top and the buttons over the clouds. Text sits on --sky-deep,
// which fades into the artwork's sky; the gauge and plane fill the space between. On phones the buttons move up under
// the subhead, and the hero may grow past the screen so the gauge never shrinks below a readable size.
export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate flex min-h-[max(640px,calc(100svh-5rem))] flex-col overflow-hidden bg-sky text-white sm:h-[calc(100svh-5rem)] sm:max-h-[920px] sm:min-h-[640px]"
    >
      <HeroScene progress={Math.round(SAMPLE.summary.postedPercent)} className="order-4 -mt-16 max-sm:min-h-[264px]" />

      <div className="relative z-10 order-1 bg-sky-deep px-4 shadow-[0_-1px_0_var(--sky-deep),0_1px_0_var(--sky-deep)] pt-2 text-center sm:px-6 sm:pt-4">
        <h1 id="hero-heading" className="mx-auto max-w-[960px] text-[clamp(38px,5.4vw,68px)] font-bold leading-none tracking-[-0.035em] text-balance">
          Know exactly where your airline status stands.
        </h1>
        <p className="mx-auto mt-5 max-w-[640px] text-[clamp(17px,1.6vw,20px)] leading-normal text-pretty">
          Track posted and projected MQDs from flights, card spend, and Headstarts, and see what it takes to reach your next Medallion tier.
        </p>
      </div>

      <div className="relative z-10 order-3 h-24 sky-fade sm:h-28" aria-hidden="true" />

      <div className="relative z-30 order-2 flex flex-wrap justify-center gap-3 bg-sky-deep px-4 pt-7 max-sm:shadow-[0_1px_0_var(--sky-deep)] sm:order-5 sm:bg-transparent sm:pt-0">
        <Link href="/sign-up" className={`${PILL} bg-navy text-white focus-visible:outline-white sm:focus-visible:outline-navy`}>
          Get started for free
        </Link>
        <Link href="/sign-in" className={`${PILL} bg-white text-navy ring-1 ring-navy/12 focus-visible:outline-white sm:focus-visible:outline-navy`}>
          Sign in
        </Link>
      </div>
      <p className="relative z-30 order-6 px-4 pt-[22px] text-center text-[13px] text-[#3d4d66]">
        Not affiliated with Delta Air Lines or American Express. Estimates only.
      </p>
      {/* The hero fills the screen, so say there's more below it. */}
      <a
        href="#preview"
        className="relative z-30 order-7 mx-auto mb-3 mt-3 flex flex-col items-center rounded-md px-2 text-[13px] font-semibold text-navy focus-visible:outline-2 focus-visible:outline-navy sm:mb-5 sm:mt-5"
      >
        See it in action
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="motion-safe:animate-bounce"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </a>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-linear-to-b from-transparent to-background" aria-hidden="true" />
    </section>
  );
}
