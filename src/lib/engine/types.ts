export const PROGRAMS = ['DL', 'AS'] as const;
export type ProgramCode = (typeof PROGRAMS)[number];

export const CATEGORIES = ['Flights', 'Credit card spend', 'Qualifying bonuses'] as const;
export type Category = (typeof CATEGORIES)[number];

/** "Planned" is displayed as "Projected" in the UI, matching the original tracker. */
export const ENTRY_STATES = ['Posted', 'Pending', 'Planned', 'Potential', 'Cancelled'] as const;
export type EntryState = (typeof ENTRY_STATES)[number];

export interface Entry {
  id: string;
  program: ProgramCode;
  category: Category;
  state: EntryState;
  /** ISO date (YYYY-MM-DD) within the status year. */
  date: string;
  description: string;
  method: string;
  amount: number;
  rate: number;
  /** Exact airline-posted credit; overrides amount × rate when set. */
  override: number | null;
  notes: string;
  route?: string;
  roundtrip?: boolean;
  cardKey?: string;
}

export interface Tier {
  name: string;
  threshold: number;
}

export interface Totals {
  posted: number;
  pending: number;
  /** Planned + Potential. */
  planned: number;
  forecast: number;
}
