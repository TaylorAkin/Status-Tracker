'use client';

import { goalSummary, progressScale, tierMarkState, tierProgress, type GoalSummary, type Tier } from '@/lib/engine';
import { fmt, percent } from '@/lib/format';
import { POTENTIAL_FILL, STATE_COLORS, StateSwatch } from '@/components/ui';
import { InfoTip } from './help/info-tip';
import { useTracker } from './tracker-context';

/** Bar and legend order: what's in your account first, then what's still to come. */
const STATES = ['Posted', 'Pending', 'Planned', 'Potential'] as const;

export function StatusCard() {
  const { data, activeEntries, unit } = useTracker();
  const { tracker, tiers } = data;
  const s = goalSummary(activeEntries, 'DL', tracker.target, tracker.asOf, tracker.statusYear);
  const t = s.totals;
  const goal = tiers.find((tier) => tier.threshold === tracker.target);
  const goalName = goal ? goal.name : `your ${fmt(tracker.target)} ${unit} goal`;
  const values = { Posted: t.posted, Pending: t.pending, Planned: t.planned, Potential: t.potential };

  return (
    <article data-help="summary" className="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_4px_20px_#172c3305]">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[linear-gradient(120deg,#002750,#003366_55%,#1b4f86)] px-5 py-3.5 text-white sm:px-6">
        <h2 className="text-lg font-semibold tracking-tight">
          {tracker.statusYear} Medallion status
          <InfoTip id="summary.goal" />
        </h2>
        <span className="rounded-full border border-white/50 bg-white/15 px-3 py-1 text-[11px] font-semibold">
          Goal: {goal ? `${goal.name} · ` : ''}
          {fmt(tracker.target)} {unit}
        </span>
      </div>

      <div className="px-5 pb-5 pt-4 sm:px-6">
        <div data-help="summary.gap" className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <p className="max-w-xl text-[17px] leading-snug">
            <Verdict s={s} tiers={tiers} goalName={goalName} unit={unit} />
          </p>
          <PacePill s={s} unit={unit} />
        </div>

        <StatusBar tiers={tiers} values={values} target={tracker.target} goalName={goal?.name} unit={unit} />

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          {STATES.map((state) => (
            <div key={state}>
              <dt className="flex items-center gap-1.5 text-xs text-muted">
                <StateSwatch state={state} />
                {state}
                {state === 'Posted' && <InfoTip id="summary.posted" />}
              </dt>
              <dd className="mt-0.5 text-[22px] font-semibold tabular-nums text-brand">{fmt(values[state])}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
          Forecast <strong className="text-foreground">{fmt(t.forecast)}</strong> {unit} ({percent(s.forecastPercent)} of goal) = all four
          states.
          <InfoTip id="summary.forecast" /> Earning window: Jan 1 – Dec 31, {tracker.statusYear}.
        </p>
      </div>
    </article>
  );
}

/** One sentence: where the forecast lands and what's left to reach the goal. */
function Verdict({ s, tiers, goalName, unit }: { s: GoalSummary; tiers: Tier[]; goalName: string; unit: string }) {
  const t = s.totals;
  const reached = tierProgress(tiers, t.posted, t.forecast);
  if (t.forecast === 0) return <>Add your flights and cards to see where your year lands.</>;
  if (s.actualGap === 0)
    return (
      <>
        You&apos;ve reached <strong className="font-semibold">{goalName}</strong>. Everything that counts has posted.
      </>
    );
  if (s.forecastGap === 0)
    return (
      <>
        Your plans reach <strong className="font-semibold">{goalName}</strong>.{' '}
        <span className="text-muted">
          {fmt(s.actualGap)} {unit} still need to post.
        </span>
      </>
    );
  return (
    <>
      {reached.forecast ? (
        <>
          On track for <strong className="font-semibold">{reached.forecast.name}</strong>.{' '}
        </>
      ) : (
        <>Not on track for a tier yet. </>
      )}
      <span className="text-accent">
        {fmt(s.forecastGap)} {unit} short
      </span>{' '}
      of {goalName}.
    </>
  );
}

function PacePill({ s, unit }: { s: GoalSummary; unit: string }) {
  const text =
    s.monthlyPace === null
      ? 'Earning window complete'
      : s.actualGap === 0
        ? 'Goal posted'
        : `${fmt(s.monthlyPace)} ${unit} / month to post · ${s.monthsLeft} months left`;
  return (
    <span className="inline-flex items-center rounded-full bg-[#f9eef1] px-3 py-1 text-xs font-medium text-accent">
      {text}
      <InfoTip id="summary.pace" />
    </span>
  );
}

function StatusBar({
  tiers,
  values,
  target,
  goalName,
  unit,
}: {
  tiers: Tier[];
  values: Record<(typeof STATES)[number], number>;
  target: number;
  goalName?: string;
  unit: string;
}) {
  const scale = progressScale(tiers, target);
  const pct = (v: number) => `${Math.min(100, (v / scale) * 100)}%`;
  const posted = values.Posted;
  const forecast = STATES.reduce((sum, state) => sum + values[state], 0);
  const marks = goalName || tiers.some((t) => t.threshold === target) ? tiers : [...tiers, { name: 'Goal', threshold: target }];

  return (
    <div data-help="summary.bar" className="mt-5">
      <div
        className="relative h-4 rounded-full bg-[#e9eeec]"
        role="img"
        aria-label={`${STATES.map((state) => `${state} ${fmt(values[state])}`).join(', ')} ${unit}, on a scale to ${fmt(scale)}`}
      >
        <div className="absolute inset-0 flex overflow-hidden rounded-full">
          {STATES.map((state) => (
            <span
              key={state}
              style={{ width: pct(values[state]), background: state === 'Potential' ? POTENTIAL_FILL : STATE_COLORS[state] }}
              title={`${state}: ${fmt(values[state])} ${unit}`}
            />
          ))}
        </div>
        {marks.map((tier) => {
          const isGoal = tier.threshold === target;
          return (
            <span
              key={tier.name}
              aria-hidden
              className={`absolute -top-1 -bottom-1 w-0 border-l-2 ${isGoal ? 'border-accent' : 'border-[#65777d]/60'}`}
              style={{ left: pct(tier.threshold) }}
            />
          );
        })}
      </div>
      <div data-help="summary.tiers" className="relative mt-1.5 h-8 text-[11px] leading-tight">
        {marks.map((tier) => {
          const state = tierMarkState(tier, posted, forecast);
          const isGoal = tier.threshold === target;
          const isEnd = tier.threshold >= scale;
          return (
            <span
              key={tier.name}
              className={`absolute whitespace-nowrap ${isEnd ? '-translate-x-full text-right' : '-translate-x-1/2 text-center'}`}
              style={{ left: pct(tier.threshold) }}
            >
              <strong className={`block font-semibold ${isGoal ? 'text-accent' : state === 'earned' ? 'text-brand' : 'text-foreground'}`}>
                {state === 'earned' ? '✓ ' : ''}
                {tier.name}
              </strong>
              <small className="block text-muted">{fmt(tier.threshold)}</small>
            </span>
          );
        })}
      </div>
      <p className="sr-only">
        {marks
          .map((tier) => {
            const state = tierMarkState(tier, posted, forecast);
            return `${tier.name}: ${state === 'earned' ? 'reached by posted' : state === 'projected' ? 'reached by forecast' : 'not reached'}`;
          })
          .join('; ')}
      </p>
    </div>
  );
}
