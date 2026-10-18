import { credit } from './totals';
import type { Category, Entry, ProgramCode } from './types';

export type BreakdownLabel = Category | 'Hotels & Rental Car';

export const TRAVEL_BONUS_METHODS = ['staysBonus', 'rentalBonus'];

const isTravelBonus = (e: Entry) =>
  e.program === 'DL' && e.category === 'Qualifying bonuses' && TRAVEL_BONUS_METHODS.includes(e.method);

/** "Where earnings come from": Delta hotel/rental bonuses are split out of Qualifying bonuses. */
export function breakdownTotals(entries: Entry[], program: ProgramCode, label: BreakdownLabel) {
  const rows = entries.filter(
    (e) =>
      e.program === program &&
      e.state !== 'Cancelled' &&
      (label === 'Hotels & Rental Car'
        ? isTravelBonus(e)
        : e.category === label && (label !== 'Qualifying bonuses' || !isTravelBonus(e))),
  );
  return {
    posted: rows.filter((e) => e.state === 'Posted').reduce((sum, e) => sum + credit(e), 0),
    forecast: rows.reduce((sum, e) => sum + credit(e), 0),
  };
}

export function breakdownLabels(program: ProgramCode): BreakdownLabel[] {
  return ['Flights', 'Credit card spend', 'Qualifying bonuses', ...(program === 'DL' ? (['Hotels & Rental Car'] as const) : [])];
}
