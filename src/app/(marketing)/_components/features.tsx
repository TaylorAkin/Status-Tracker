import type { ReactNode } from 'react';

const icon = (children: ReactNode) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const FEATURES = [
  {
    title: 'Flights',
    body: 'Fare to MQDs, with Potential, Booked, and Credited states and a route map of your year.',
    icon: icon(
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />,
    ),
  },
  {
    title: 'Card spend',
    body: "A 12-month spend grid for Delta Amex cards, at each card's MQD rate.",
    icon: icon(
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </>,
    ),
  },
  {
    title: 'Headstarts & bonuses',
    body: 'Card Headstarts, Delta Stays, and rental bonuses counted the moment they post.',
    icon: icon(<path d="M4 22V4a1 1 0 0 1 1-1h11l-2 4 2 4H5" />),
  },
  {
    title: 'Forecast & pace',
    body: 'See your monthly pace, gap to goal, and test earning mixes before you book.',
    icon: icon(
      <>
        <path d="M3 3v18h18" />
        <path d="m7 15 4-4 3 3 5-6" />
      </>,
    ),
  },
];

export function Features() {
  return (
    <section id="features" aria-labelledby="features-heading" className="mx-auto w-full max-w-[1120px] scroll-mt-6 px-4 pt-24 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[2px] text-sky-ink">Every MQD, in one place</p>
      <h2 id="features-heading" className="mt-2.5 max-w-[640px] text-[clamp(28px,3.6vw,40px)] font-semibold leading-[1.1] tracking-[-1.2px]">
        All the ways you earn, added up for you.
      </h2>
      <p className="mt-3 max-w-[600px] text-[17px] leading-relaxed text-muted">
        Enter what you&apos;ve flown, booked, and spent. Stratus Status keeps posted, pending, and projected MQDs apart so you always know what&apos;s
        real and what&apos;s planned.
      </p>
      <div className="mt-9 grid gap-4 min-[640px]:grid-cols-2 min-[900px]:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl border border-line bg-surface p-[22px]">
            <div className="grid size-10 place-items-center rounded-[11px] bg-[linear-gradient(160deg,#3aaefb,#1f86e8)] text-white">{f.icon}</div>
            <h3 className="mb-1.5 mt-4 text-[17px] font-semibold">{f.title}</h3>
            <p className="text-sm leading-normal text-muted">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
