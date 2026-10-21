import { tierProgress } from './tiers';
import type { Category, Entry, ProgramCode, Tier, Totals } from './types';

export function credit(e: Pick<Entry, 'override' | 'amount' | 'rate'>): number {
  return e.override !== null ? e.override : e.amount * e.rate;
}

const sumCredit = (rows: Entry[]) => rows.reduce((sum, e) => sum + credit(e), 0);

/** Totals for one program, optionally limited to a category. Cancelled entries never count. */
export function totals(entries: Entry[], program: ProgramCode, category?: Category): Totals {
  const rows = entries.filter((e) => e.program === program && (!category || e.category === category) && e.state !== 'Cancelled');
  const posted = sumCredit(rows.filter((e) => e.state === 'Posted'));
  const pending = sumCredit(rows.filter((e) => e.state === 'Pending'));
  const planned = sumCredit(rows.filter((e) => e.state === 'Planned'));
  const potential = sumCredit(rows.filter((e) => e.state === 'Potential'));
  return { posted, pending, planned, potential, forecast: posted + pending + planned + potential };
}

/** Months remaining in the status year as of `asOf` (the current month counts as remaining). */
export function monthsLeft(asOf: string, statusYear: number): number {
  const date = new Date(asOf + 'T12:00:00');
  if (date.getFullYear() < statusYear) return 12;
  if (date.getFullYear() > statusYear) return 0;
  return 12 - date.getMonth();
}

export interface GoalSummary {
  totals: Totals;
  target: number;
  /** Still needed beyond the full forecast. */
  forecastGap: number;
  /** Still needed beyond posted credit. */
  actualGap: number;
  monthsLeft: number;
  /** Monthly pace needed from posted credit; null when the earning window is over. */
  monthlyPace: number | null;
  postedPercent: number;
  forecastPercent: number;
}

export function goalSummary(entries: Entry[], program: ProgramCode, target: number, asOf: string, statusYear: number): GoalSummary {
  const t = totals(entries, program);
  const months = monthsLeft(asOf, statusYear);
  const actualGap = Math.max(0, target - t.posted);
  return {
    totals: t,
    target,
    forecastGap: Math.max(0, target - t.forecast),
    actualGap,
    monthsLeft: months,
    monthlyPace: months ? actualGap / months : null,
    postedPercent: (t.posted / target) * 100,
    forecastPercent: (t.forecast / target) * 100,
  };
}

/**
 * Where the year lands, keeping what's committed (posted, pending, planned) apart from Potential trips.
 * `short` is the gap left by committed MQDs; `tier` is the highest tier they reach.
 */
export type GoalOutlook =
  | { kind: 'empty' }
  | { kind: 'reached' }
  | { kind: 'planned'; toPost: number }
  | { kind: 'short'; tier: Tier | undefined; short: number; potential: number };

/** `tiers` must be sorted by ascending threshold. */
export function goalOutlook(t: Totals, target: number, tiers: Tier[]): GoalOutlook {
  if (t.forecast === 0) return { kind: 'empty' };
  if (t.posted >= target) return { kind: 'reached' };
  const committed = t.posted + t.pending + t.planned;
  if (committed >= target) return { kind: 'planned', toPost: target - t.posted };
  return { kind: 'short', tier: tierProgress(tiers, t.posted, committed).forecast, short: target - committed, potential: t.potential };
}
