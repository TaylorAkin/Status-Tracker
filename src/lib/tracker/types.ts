// drizzle-kit loads this file through schema.ts and can't resolve `@/`, so its imports from `@/` must stay type-only.
import type { Entry, Tier } from '@/lib/engine';

export interface CardInfo {
  key: string;
  name: string;
  /** Eligible dollars per unit of credit. */
  spendDivisor: number;
  headstartAmount: number | null;
}

export interface TrackerCardInfo {
  cardKey: string;
  potential: boolean;
  included: boolean;
}

/** Guided tours on the dashboard. Shared by the database schema, the server action, and the help content. */
export const TOUR_KEYS = ['adding-data', 'reading-dashboard', 'planning-ahead'] as const;
export type TourKey = (typeof TOUR_KEYS)[number];

/** Done saves `completed`; Skip, Esc, and the banner's "No thanks" save `dismissed`. */
export const TOUR_STATUSES = ['completed', 'dismissed'] as const;
export type TourStatus = (typeof TOUR_STATUSES)[number];

/** The user's status for each tour they've finished or dismissed. A missing key means never seen. */
export type TourProgress = Partial<Record<TourKey, TourStatus>>;

/** Everything the dashboard needs, serializable from server to client. */
export interface DashboardData {
  tracker: { id: string; statusYear: number; target: number; asOf: string };
  program: { code: 'DL'; name: string; unitLabel: string };
  tiers: Tier[];
  cards: CardInfo[];
  trackerCards: TrackerCardInfo[];
  entries: Entry[];
  tours: TourProgress;
}

export type CardHolding = 'held' | 'potential' | 'none';
