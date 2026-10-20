'use client';

import { buttonClass } from '@/components/ui';
import { useTracker } from '../tracker-context';
import { HELP_MENU_SELECTOR, READING_BANNER } from './help-content';
import { helpPrompt } from './help-prompt';
import { useTour } from './tour';

/** Offers "Reading the dashboard" once the account has enough data to explain. Hidden for good once dismissed. */
export function ReadingBanner() {
  const { data, markTour } = useTracker();
  const { start, active } = useTour();
  if (active || helpPrompt({ tours: data.tours, entries: data.entries }) !== 'offer-reading') return null;

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm">
      <p>
        <strong>{READING_BANNER.title}</strong> <span className="text-muted">{READING_BANNER.body}</span>
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className={buttonClass.secondary}
          onClick={() => {
            markTour('reading-dashboard', 'dismissed');
            document.querySelector<HTMLElement>(HELP_MENU_SELECTOR)?.focus();
          }}
        >
          {READING_BANNER.dismiss}
        </button>
        <button type="button" className={buttonClass.dark} onClick={() => start('reading-dashboard')}>
          {READING_BANNER.accept}
        </button>
      </div>
    </div>
  );
}
