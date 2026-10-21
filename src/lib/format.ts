import type { EntryState } from '@/lib/engine';

/** Whole-number display, as in the original tracker. */
export const fmt = (v: number) => Math.round(v).toLocaleString('en-US');
/** Up to two decimals, for card-spend credit. */
export const precise = (v: number) => Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 });
export const percent = (v: number) => `${Math.round(v)}%`;

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MONTH_SHORT = MONTH_NAMES.map((m) => m.slice(0, 3));

export function stateLabel(state: EntryState): string {
  return state;
}

/** One-line definition of each state, used by tooltips, state pills, and help. */
export const STATE_HELP: Record<EntryState, string> = {
  Posted: 'In your SkyMiles account. Delta has credited these MQDs, and only posted MQDs count toward status today.',
  Pending: 'Done, waiting on Delta. You’ve flown or earned it, but it hasn’t posted to your account yet.',
  Planned: 'Booked or scheduled: trips you’ve paid for, card spend you expect, and Headstarts not yet credited.',
  Potential: 'Trips you’re considering but haven’t booked. They count in the forecast so you can see what they’d add.',
  Cancelled: 'Doesn’t count anywhere.',
};

/** The forecast, defined in the same words as the states. */
export const FORECAST_HELP = 'Posted + Pending + Planned + Potential: where your year lands if everything happens.';

/** "Delta SkyMiles® Reserve American Express Card" → "Delta SkyMiles® Reserve". */
export function shortCardName(name: string): string {
  return name.replace(/ (Business )?American Express Card$/, (_, b) => (b ? ' Business' : '')).trim();
}
