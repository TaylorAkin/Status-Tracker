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

/** "Delta SkyMiles® Reserve American Express Card" → "Delta SkyMiles® Reserve". */
export function shortCardName(name: string): string {
  return name.replace(/ (Business )?American Express Card$/, (_, b) => (b ? ' Business' : '')).trim();
}
