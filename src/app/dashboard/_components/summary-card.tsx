'use client';

import { goalSummary, progressScale, tierMarkState, tierProgress, type Tier } from '@/lib/engine';
import { fmt, percent } from '@/lib/format';
import { InfoTip } from './help/info-tip';
import { useTracker } from './tracker-context';

const TIER_STYLES: Record<string, string> = {
  Silver: 'bg-[linear-gradient(135deg,#f3f5f7,#cbd2d8)] border-[#9aa7b2] text-[#34414c]',
  Gold: 'bg-[linear-gradient(135deg,#fff4cc,#e3c16b)] border-[#b59a4e] text-[#5c471c]',
  Platinum: 'bg-[linear-gradient(135deg,#f1f0ee,#c5c7ca)] border-[#969da4] text-[#30343a]',
  Diamond: 'bg-[linear-gradient(135deg,#426c88,#19354d)] border-[#83adc4] text-white',
};

export function goalTier(tiers: Tier[], target: number) {
  return tiers.find((t) => t.threshold === target);
}

export function SummaryCard() {
  const { data, activeEntries, unit } = useTracker();
  const { tracker, tiers } = data;
  const s = goalSummary(activeEntries, 'DL', tracker.target, tracker.asOf, tracker.statusYear);
  const t = s.totals;
  const goal = goalTier(tiers, tracker.target);
  const progress = tierProgress(tiers, t.posted, t.forecast);

  return (
    <article data-help="summary" className="relative flex flex-col overflow-hidden rounded-2xl border border-[#e6c4cb] bg-surface">
      <div className="h-[5px] bg-accent" />
      <div className="relative bg-[linear-gradient(120deg,#002750,#003366_55%,#1b4f86)] px-6 py-5 text-white">
        <p className="text-[11px] font-bold uppercase tracking-[2px] text-white/70">Delta SkyMiles · {tracker.statusYear}</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Medallion Status
            <InfoTip id="summary.goal" />
          </h2>
          <span className="rounded-full border border-white/50 bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
            {goal ? `${goal.name} Medallion goal` : `Goal ${fmt(tracker.target)} ${unit}`}
          </span>
        </div>
      </div>

      <div className="flex-1 bg-[radial-gradient(ellipse_at_100%_0%,rgba(58,78,119,.07),transparent_64%),linear-gradient(135deg,#fff_12%,#f4f3f2_62%,#edf1f7)] px-6 pb-6">
        <p className="mt-5 text-[43px] font-semibold tracking-[-2px] text-brand">
          {fmt(t.posted)} <small className="text-[15px] font-normal tracking-normal text-muted">/ {fmt(tracker.target)}</small>
        </p>
        <p className="text-xs text-muted">
          Posted {unit} · {percent(s.postedPercent)} of goal
          <InfoTip id="summary.posted" />
        </p>

        <StatusBar tiers={tiers} posted={t.posted} forecast={t.forecast} target={tracker.target} goalName={goal?.name} />

        <div className="flex justify-between gap-3 text-xs text-muted">
          <span>Actual {fmt(t.posted)}</span>
          <span>
            Total forecast {fmt(t.forecast)} ({percent(s.forecastPercent)})
            <InfoTip id="summary.forecast" />
          </span>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            // Same order as an entry's lifecycle: Projected → Pending → Posted.
            ['Projected', t.planned],
            ['Pending', t.pending],
            ['Posted', t.posted],
          ].map(([label, value]) => (
            <div key={label}>
              <small className="text-xs text-muted">{label}</small>
              <strong className="my-1 block text-[22px] text-brand">{fmt(value as number)}</strong>
            </div>
          ))}
        </div>

        <div data-help="summary.gap" className="mt-5 rounded-lg border-l-[3px] border-accent bg-[#f9eef1] p-3 text-[13px]">
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ['Forecast gap', s.forecastGap, 'Still needed beyond your full forecast'],
                ['Actual gap', s.actualGap, 'Still needed beyond posted MQDs'],
              ] as const
            ).map(([label, value, hint]) => (
              <div key={label}>
                <small className="text-xs text-muted">{label}</small>
                {label === 'Forecast gap' && <InfoTip id="summary.gap" />}
                <strong className="my-0.5 block text-[22px] text-accent">{value === 0 ? '✓ 0' : fmt(value)}</strong>
                <small className="block text-[11px] leading-snug text-muted">{value === 0 ? 'Goal covered' : hint}</small>
              </div>
            ))}
          </div>
          <p className="mt-2.5 border-t border-[#e6c4cb] pt-2 text-muted">
            {s.monthlyPace === null
              ? 'Earning window complete.'
              : s.actualGap === 0
                ? 'Posted MQDs already reach your goal.'
                : `${fmt(s.monthlyPace)} ${unit} / month needed from posted, across ${s.monthsLeft} remaining months.`}
            <InfoTip id="summary.pace" />
          </p>
        </div>

        <section className="mt-5 border-t border-[#e6c4cb] pt-4" aria-label="Status tier progress">
          <div className="mb-3.5 flex justify-between gap-3 text-xs">
            <div>
              Earned from posted credit
              <InfoTip id="summary.tiers" />
              <strong className="mt-0.5 block text-[15px] text-brand">{progress.actual?.name ?? 'No tier reached yet'}</strong>
            </div>
            <div className="text-right text-muted">
              Projected from total forecast
              <strong className="mt-0.5 block text-[15px] text-brand">{progress.forecast?.name ?? 'No tier projected yet'}</strong>
            </div>
          </div>
          <div data-help="summary.tiers" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {tiers.map((tier) => {
              const state = tierMarkState(tier, t.posted, t.forecast);
              return (
                <div
                  key={tier.name}
                  className={`rounded-lg border px-1.5 py-2.5 text-center ${
                    state === 'earned'
                      ? `${TIER_STYLES[tier.name] ?? ''} shadow-sm`
                      : state === 'projected'
                        ? 'border-dashed border-brand bg-[#f3f7fa]'
                        : 'border-line bg-[#f6f7f6]'
                  }`}
                >
                  <strong className="block text-xs">{tier.name}</strong>
                  <small className="my-1 block text-[11px] opacity-80">{fmt(tier.threshold)}</small>
                  <span className={`block text-[10px] ${state === 'earned' ? 'font-bold' : state === 'projected' ? 'text-brand' : 'text-muted'}`}>
                    {state === 'earned' ? '✓ Earned' : state === 'projected' ? 'Projected' : 'Not reached'}
                  </span>
                  {tier.name === goal?.name && (
                    <span className="mt-1.5 block text-[9px] font-bold uppercase tracking-wider text-accent">Your goal</span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            {progress.next ? (
              <>
                Next tier: <strong className="text-foreground">{progress.next.name}</strong> ·{' '}
                <strong className="text-foreground">{fmt(progress.next.threshold - t.posted)}</strong> {unit} from posted earnings.{' '}
                {t.forecast >= progress.next.threshold
                  ? 'Already covered by your forecast.'
                  : `${fmt(progress.next.threshold - t.forecast)} still needed beyond your forecast.`}
              </>
            ) : (
              'All tracked status tiers reached.'
            )}
            <br />
            Tier indicators reflect {tracker.statusYear} tracked earnings, not any status you already hold.
          </p>
        </section>
      </div>
    </article>
  );
}

function StatusBar({
  tiers,
  posted,
  forecast,
  target,
  goalName,
}: {
  tiers: Tier[];
  posted: number;
  forecast: number;
  target: number;
  goalName?: string;
}) {
  const scale = progressScale(tiers, target);
  const pct = (v: number) => `${Math.min(100, (v / scale) * 100)}%`;
  return (
    <>
      <div data-help="summary.bar" className="relative mb-3 mt-5 pb-11" aria-label="Progress across status tiers">
        <div className="relative h-3 overflow-hidden rounded-full bg-[#e9eeec]">
          <span className="absolute inset-y-0 left-0 rounded-full bg-brand opacity-30" style={{ width: pct(forecast) }} />
          <span className="absolute inset-y-0 left-0 rounded-full bg-brand" style={{ width: pct(posted) }} />
        </div>
        {tiers.map((tier) => {
          const state = tierMarkState(tier, posted, forecast);
          const isEnd = tier.threshold === scale;
          return (
            <div
              key={tier.name}
              className="absolute -top-[3px] w-0"
              style={{ left: pct(tier.threshold) }}
              title={`${tier.name}: ${fmt(tier.threshold)}`}
            >
              <span
                className={`absolute -left-0.5 h-[18px] w-1 rounded-sm border shadow-sm ${
                  state === 'earned' ? 'border-white bg-accent' : state === 'projected' ? 'border-accent bg-[#f9eef1]' : 'border-[#65777d] bg-white'
                }`}
              />
              <span
                className={`absolute top-6 whitespace-nowrap text-[10px] leading-snug ${isEnd ? '-translate-x-full text-right' : '-translate-x-1/2 text-center'}`}
              >
                <strong className={`block ${state === 'earned' ? 'text-accent' : tier.name === goalName ? 'text-brand' : ''}`}>
                  {tier.name}
                  {tier.name === goalName ? ' ★' : ''}
                </strong>
                <small className="block text-muted">{fmt(tier.threshold)}</small>
              </span>
            </div>
          );
        })}
      </div>
      <p className="mb-2 text-[10px] text-muted">
        {scale > target ? `Tier scale extends to ${fmt(scale)} · ` : ''}
        {goalName ? `★ marks your ${goalName} goal` : ''}
      </p>
    </>
  );
}
