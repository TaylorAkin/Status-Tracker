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

/** Everything the dashboard needs, serializable from server to client. */
export interface DashboardData {
  tracker: { id: string; statusYear: number; target: number; asOf: string };
  program: { code: 'DL'; name: string; unitLabel: string };
  tiers: Tier[];
  cards: CardInfo[];
  trackerCards: TrackerCardInfo[];
  entries: Entry[];
}

export type CardHolding = 'held' | 'potential' | 'none';
