import { progressScale } from '@/lib/engine';
import { fmt, percent } from '@/lib/format';
import { SAMPLE, sampleFlights } from './sample-data';

const CHIP: Record<ReturnType<typeof sampleFlights>[number]['status'], string> = {
  Credited: 'bg-[#e4f3ea] text-[#0a6e56]',
  Booked: 'bg-[#e7f0fa] text-brand',
  Potential: 'border border-dashed border-[#b9c2c6] bg-[#f6f7f6] text-muted',
};

// Mini chart: x is Jan 1 → Dec 31 across 300px, y is 0 → 12,000 MQDs (110px → 10px).
const y = (mqd: number) => +(110 - mqd / 120).toFixed(1);
const POSTED_PATH: [number, number][] = [
  [0, 0],
  [5, 5000], // Headstarts
  [25, 5760],
  [50, SAMPLE.summary.totals.posted], // March 1
];

export function ProductPreview() {
  const s = SAMPLE.summary;
  const t = s.totals;
  const scale = progressScale(SAMPLE.tiers, SAMPLE.target);
  const pct = (v: number) => `${Math.min(100, (v / scale) * 100)}%`;
  const [lastX, lastMqd] = POSTED_PATH[POSTED_PATH.length - 1];

  return (
    <figure id="preview" className="mx-auto w-full max-w-[1120px] scroll-mt-6 px-4 pt-10 sm:px-6 sm:pt-14">
      <div className="grid gap-5 min-[900px]:grid-cols-[1.15fr_.85fr]">
        <div className="overflow-hidden rounded-[18px] border border-line bg-surface shadow-[0_24px_60px_rgba(16,40,80,.16)]">
          <div className="border-t-[5px] border-accent bg-[linear-gradient(120deg,#002750,#003366_55%,#1b4f86)] px-[22px] py-[18px] text-white">
            <p className="text-[11px] font-bold uppercase tracking-[2px] text-white/70">Delta SkyMiles · {SAMPLE.year}</p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[22px] font-semibold">Medallion Status</p>
              <span className="rounded-full border border-white/50 bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                {SAMPLE.goalName} Medallion goal
              </span>
            </div>
          </div>
          <div className="px-[22px] pb-[22px] pt-[18px]">
            <p className="text-[42px] font-semibold tracking-[-2px] text-brand">
              {fmt(t.posted)} <small className="text-[15px] font-normal tracking-normal text-muted">/ {fmt(SAMPLE.target)}</small>
            </p>
            <p className="text-xs text-muted">Posted MQDs · {percent(s.postedPercent)} of goal</p>

            <div className="relative mb-2 mt-[26px] h-3 rounded-full bg-[#e8ecee]">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[repeating-linear-gradient(45deg,#9fb7cf_0_6px,#b8cadb_6px_12px)]"
                style={{ width: pct(t.forecast) }}
              />
              <div className="absolute inset-y-0 left-0 rounded-full bg-brand" style={{ width: pct(t.posted) }} />
              {SAMPLE.tiers.map((tier, i) => {
                const last = i === SAMPLE.tiers.length - 1;
                return (
                  <span
                    key={tier.name}
                    className={`absolute -top-[18px] text-[10px] text-muted ${last ? '-translate-x-full' : '-translate-x-1/2'}`}
                    style={{ left: pct(tier.threshold) }}
                  >
                    {tier.name === 'Platinum' ? 'Plat' : tier.name}
                  </span>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {(
                [
                  ['Projected', t.planned],
                  ['Pending', t.pending],
                  ['Posted', t.posted],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <small className="text-xs text-muted">{label}</small>
                  <strong className="block text-[22px] text-brand">{fmt(value)}</strong>
                </div>
              ))}
            </div>

            <p className="mt-4 rounded-lg border-l-[3px] border-accent bg-[#f9eef1] px-3 py-2.5 text-[13px] text-muted">
              <b className="text-accent">{fmt(s.actualGap)} MQDs</b> to {SAMPLE.goalName} from posted
              {s.forecastGap === 0 ? ' — already covered by your forecast.' : '.'} {fmt(s.monthlyPace ?? 0)} MQDs / month across {s.monthsLeft}{' '}
              remaining months.
            </p>
          </div>
        </div>

        <div className="grid gap-5">
          <div className="rounded-[18px] border border-line bg-surface px-5 py-[18px] shadow-[0_24px_60px_rgba(16,40,80,.16)]">
            <p className="mb-3 text-[13px] font-semibold">Your flights</p>
            <ul>
              {sampleFlights().map((f) => (
                <li key={f.id} className="flex items-center justify-between border-t border-[#eef1f0] py-[9px] text-[13px] first:border-t-0">
                  <span>
                    {f.name} · {f.date}
                  </span>
                  <span className={`rounded-full px-2 py-[3px] text-[10px] font-bold uppercase tracking-[.6px] ${CHIP[f.status]}`}>{f.status}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[18px] border border-line bg-surface px-5 py-[18px] shadow-[0_24px_60px_rgba(16,40,80,.16)]">
            <p className="mb-3 text-[13px] font-semibold">Posted vs forecast</p>
            <div className="relative">
              <svg viewBox="0 0 300 120" preserveAspectRatio="none" className="block h-[120px] w-full" aria-hidden="true">
                <line vectorEffect="non-scaling-stroke" x1="0" y1={y(SAMPLE.target)} x2="300" y2={y(SAMPLE.target)} stroke="#e6c4cb" />
                <line vectorEffect="non-scaling-stroke" x1="0" y1="110" x2="300" y2={y(SAMPLE.target)} stroke="#c9d3d8" strokeDasharray="4 4" />
                <path
                  vectorEffect="non-scaling-stroke"
                  d={`M${lastX} ${y(lastMqd)} L300 ${y(s.totals.forecast)}`}
                  fill="none"
                  stroke="#9fb7cf"
                  strokeWidth="2.5"
                  strokeDasharray="6 5"
                />
                <path
                  vectorEffect="non-scaling-stroke"
                  d={POSTED_PATH.map(([x, v], i) => `${i ? 'L' : 'M'}${x} ${y(v)}`).join(' ')}
                  fill="none"
                  className="stroke-brand"
                  strokeWidth="3"
                />
              </svg>
              <span
                aria-hidden="true"
                className="absolute size-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand"
                style={{ left: `${(lastX / 300) * 100}%`, top: `${(y(lastMqd) / 120) * 100}%` }}
              />
              <span
                aria-hidden="true"
                className="absolute left-1 -translate-y-full text-[10px] text-accent"
                style={{ top: `${(y(SAMPLE.target) / 120) * 100}%` }}
              >
                {SAMPLE.goalName}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-muted">Solid = posted · dashed = forecast · grey = even pace</p>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted">Example dashboard with sample data</figcaption>
    </figure>
  );
}
