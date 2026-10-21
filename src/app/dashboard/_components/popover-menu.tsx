'use client';

import { useId, type ReactNode } from 'react';
import { useAnchoredPopover } from './help/use-anchored-popover';

export const menuItemClass =
  'block w-full rounded-md px-2.5 py-2 text-left text-sm hover:bg-[#edf3f0] focus-visible:bg-[#edf3f0] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand';

/** A button that opens a small anchored menu. Choosing any button or link inside closes it. */
export function PopoverMenu({
  button,
  buttonClassName,
  label,
  heading,
  help,
  children,
}: {
  button: ReactNode;
  buttonClassName: string;
  label?: string;
  heading?: ReactNode;
  /** `data-help` id for tours. */
  help?: string;
  children: ReactNode;
}) {
  const menuId = useId();
  const { anchorRef, popoverRef } = useAnchoredPopover<HTMLButtonElement, HTMLDivElement>();

  return (
    <>
      <button ref={anchorRef} type="button" popoverTarget={menuId} className={buttonClassName} aria-label={label} data-help={help}>
        {button}
      </button>
      <div
        ref={popoverRef}
        id={menuId}
        popover="auto"
        className="fixed inset-auto m-0 w-60 rounded-xl border border-line bg-surface p-2 text-foreground shadow-lg"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button, a')) e.currentTarget.hidePopover();
        }}
      >
        {heading && <div className="px-2.5 pb-1.5 pt-1 text-xs text-muted">{heading}</div>}
        {children}
      </div>
    </>
  );
}
