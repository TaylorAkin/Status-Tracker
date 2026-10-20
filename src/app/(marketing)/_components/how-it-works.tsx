const STEPS = [
  { title: 'Pick your goal tier', body: "Silver, Gold, Platinum, or Diamond for the status year you're chasing." },
  { title: 'Add flights and cards', body: "Tell us the Delta cards you hold and the trips you've taken or booked." },
  { title: 'Watch the gap close', body: "Your dashboard shows what's posted, what's coming, and what's still needed." },
];

export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-heading" className="mx-auto w-full max-w-[1120px] scroll-mt-6 px-4 pt-24 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[2px] text-sky-ink">Set up in minutes</p>
      <h2 id="how-heading" className="mt-2.5 max-w-[640px] text-[clamp(28px,3.6vw,40px)] font-semibold leading-[1.1] tracking-[-1.2px]">
        Three steps to a clear answer.
      </h2>
      <ol
        role="list"
        className="relative mt-9 grid gap-7 sm:grid-cols-3 sm:gap-0 sm:before:absolute sm:before:left-[18px] sm:before:right-1/3 sm:before:top-[18px] sm:before:border-t-2 sm:before:border-dashed sm:before:border-[#b9c8d3]"
      >
        {STEPS.map((step, i) => (
          <li key={step.title} className="sm:pr-6">
            <span className="relative z-10 grid size-9 place-items-center rounded-full bg-navy text-[15px] font-semibold text-white">{i + 1}</span>
            <h3 className="mb-1.5 mt-4 text-lg font-semibold">{step.title}</h3>
            <p className="max-w-[300px] text-[15px] leading-normal text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
