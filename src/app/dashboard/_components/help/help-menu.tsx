'use client';

import { useId } from 'react';
import { buttonClass } from '@/components/ui';
import { TOUR_KEYS } from '@/lib/tracker/types';
import { HELP_MENU, TOURS } from './help-content';
import { useTour } from './tour';
import { useAnchoredPopover } from './use-anchored-popover';

/** Header button listing the guided tours, so any of them can be replayed. */
export function HelpMenu({ className = buttonClass.secondary }: { className?: string }) {
  const { start } = useTour();
  const menuId = useId();
  const headingId = useId();
  const { anchorRef, popoverRef } = useAnchoredPopover<HTMLButtonElement, HTMLDivElement>();

  return (
    <>
      <button ref={anchorRef} type="button" popoverTarget={menuId} className={className} data-help="help-menu">
        {HELP_MENU.button}
      </button>
      <div
        ref={popoverRef}
        id={menuId}
        popover="auto"
        role="group"
        aria-labelledby={headingId}
        className="fixed inset-auto m-0 w-60 rounded-xl border border-line bg-surface p-2 text-foreground shadow-lg"
      >
        <p id={headingId} className="px-2.5 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-[2px] text-muted">
          {HELP_MENU.heading}
        </p>
        {TOUR_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className="block w-full rounded-md px-2.5 py-2 text-left text-sm hover:bg-[#edf3f0] focus-visible:bg-[#edf3f0] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
            onClick={() => {
              popoverRef.current?.hidePopover();
              start(key);
            }}
          >
            {TOURS[key].title}
          </button>
        ))}
      </div>
    </>
  );
}
