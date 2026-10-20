import type { Entry } from '@/lib/engine';
import type { TourProgress } from '@/lib/tracker/types';

export type HelpPrompt = 'start-adding-data' | 'offer-reading' | null;

/** Entries an account needs before the chart and breakdown have something to explain. */
export const READING_OFFER_MIN_ENTRIES = 3;

/**
 * What the dashboard offers on load. A new, empty account starts "Adding your data". An account with some
 * data is offered "Reading the dashboard" instead, so existing users never land in the first-visit tour.
 */
export function helpPrompt({ tours, entries }: { tours: TourProgress; entries: Entry[] }): HelpPrompt {
  const count = entries.filter((e) => e.state !== 'Cancelled').length;
  if (!tours['adding-data'] && count === 0) return 'start-adding-data';
  if (!tours['reading-dashboard'] && count >= READING_OFFER_MIN_ENTRIES) return 'offer-reading';
  return null;
}
