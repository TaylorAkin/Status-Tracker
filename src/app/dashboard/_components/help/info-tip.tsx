'use client';

import { useId } from 'react';
import { TIPS, type TipId } from './help-content';
import { useAnchoredPopover } from './use-anchored-popover';

/**
 * A "?" button that toggles a short explanation. The browser closes it on Esc, an outside click, or when
 * another tip opens. Everything is phrasing content, so it can sit inside headings, paragraphs, and legends.
 */
export function InfoTip({ id }: { id: TipId }) {
  const tip = TIPS[id];
  const popoverId = useId();
  const { anchorRef, popoverRef } = useAnchoredPopover<HTMLButtonElement, HTMLSpanElement>();

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        popoverTarget={popoverId}
        aria-label={`About ${tip.title}`}
        className="relative ml-1.5 inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border border-current align-middle text-[11px] font-bold normal-case leading-none tracking-normal before:absolute before:-inset-1.5 hover:bg-current/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
      >
        <span aria-hidden>?</span>
      </button>
      <span
        ref={popoverRef}
        id={popoverId}
        popover="auto"
        className="fixed inset-auto m-0 w-72 whitespace-normal max-w-[calc(100vw-16px)] rounded-lg border border-line bg-surface p-3 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-foreground shadow-lg"
      >
        <strong className="mb-1 block text-[13px] font-semibold">{tip.title}</strong>
        {tip.body}
      </span>
    </>
  );
}
