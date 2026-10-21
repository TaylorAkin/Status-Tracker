import { groupTrips, type Entry } from '@/lib/engine';
import type { TrackerCardInfo } from './types';

/**
 * Something past its date that the user should reconcile. `date` orders the list: the activity date,
 * or the last day of the earliest month in a card's group.
 */
export type AttentionItem =
  | { kind: 'uncredited' | 'unbooked'; date: string; entries: Entry[] }
  | { kind: 'spendMissing' | 'spendUncredited'; date: string; cardKey: string; months: number[] };

interface AttentionInput {
  entries: Entry[];
  trackerCards: TrackerCardInfo[];
  statusYear: number;
  /** ISO date (YYYY-MM-DD). */
  today: string;
}

const monthEnd = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, '0')}-${String(new Date(Date.UTC(year, month, 0)).getUTCDate()).padStart(2, '0')}`;

/** Past activity that hasn't posted, past Potential flights, and card months that ended without spend or without posting. */
export function attentionItems({ entries, trackerCards, statusYear, today }: AttentionInput): AttentionItem[] {
  const included = new Set(trackerCards.filter((c) => c.included).map((c) => c.cardKey));
  const counts = (e: Entry) => e.state !== 'Cancelled' && (!e.cardKey || included.has(e.cardKey));
  const past = (e: Entry) => e.date < today;
  const items: AttentionItem[] = [];

  const activity = entries.filter((e) => e.category !== 'Credit card spend' && counts(e) && past(e));
  for (const kind of ['uncredited', 'unbooked'] as const) {
    const rows = activity
      .filter((e) => (kind === 'unbooked' ? e.state === 'Potential' : e.state === 'Planned' || e.state === 'Pending'))
      .sort((a, b) => a.date.localeCompare(b.date));
    for (const g of groupTrips(rows)) items.push({ kind, date: g.legs[0].date, entries: g.legs });
  }

  // Months whose last day is before today.
  const ended = Array.from({ length: 12 }, (_, i) => i + 1).filter((m) => monthEnd(statusYear, m) < today);
  for (const cardKey of included) {
    const spend = entries.filter((e) => e.cardKey === cardKey && e.category === 'Credit card spend' && e.state !== 'Cancelled');
    const monthOf = (m: number) => spend.find((e) => e.date.startsWith(`${statusYear}-${String(m).padStart(2, '0')}`));
    const missing = ended.filter((m) => !monthOf(m));
    const uncredited = ended.filter((m) => monthOf(m) && monthOf(m)!.state !== 'Posted');
    if (uncredited.length) items.push({ kind: 'spendUncredited', date: monthEnd(statusYear, uncredited[0]), cardKey, months: uncredited });
    if (missing.length) items.push({ kind: 'spendMissing', date: monthEnd(statusYear, missing[0]), cardKey, months: missing });
  }

  return items.sort((a, b) => a.date.localeCompare(b.date));
}

/** First-run checklist: which of the setup steps are done. */
export function setupSteps({ entries, trackerCards }: Pick<AttentionInput, 'entries' | 'trackerCards'>) {
  return {
    cards: trackerCards.length > 0,
    flight: entries.some((e) => e.category === 'Flights'),
    spend: entries.some((e) => e.category === 'Credit card spend'),
  };
}
