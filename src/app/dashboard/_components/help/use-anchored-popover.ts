'use client';

import { useEffect, useRef, useState } from 'react';
import { place } from './position';

/**
 * Keeps a popover="auto" element next to the button that toggles it (via popovertarget), and keeps it there
 * while the page or a dialog scrolls.
 */
export function useAnchoredPopover<A extends HTMLElement, P extends HTMLElement>() {
  const anchorRef = useRef<A>(null);
  const popoverRef = useRef<P>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const popover = popoverRef.current;
    if (!popover) return;
    const beforeToggle = (e: Event) => {
      if ((e as ToggleEvent).newState === 'open') popover.style.visibility = 'hidden';
    };
    const toggle = (e: Event) => {
      const isOpen = (e as ToggleEvent).newState === 'open';
      if (isOpen) {
        position(anchorRef.current, popover);
        popover.style.visibility = '';
      }
      setOpen(isOpen);
    };
    popover.addEventListener('beforetoggle', beforeToggle);
    popover.addEventListener('toggle', toggle);
    // A click before hydration may already have opened it.
    if (popover.matches(':popover-open')) position(anchorRef.current, popover);
    return () => {
      popover.removeEventListener('beforetoggle', beforeToggle);
      popover.removeEventListener('toggle', toggle);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const anchor = anchorRef.current;
      const popover = popoverRef.current;
      if (!anchor || !popover) return;
      const r = anchor.getBoundingClientRect();
      const { clientWidth, clientHeight } = document.documentElement;
      // The button has scrolled out of view: close the tip rather than leave it pinned.
      if (r.bottom < 0 || r.top > clientHeight || r.right < 0 || r.left > clientWidth) popover.hidePopover();
      else position(anchor, popover);
    };
    window.addEventListener('resize', update);
    // Capture phase, so scrolling inside a dialog (which doesn't bubble to window) also moves the popover.
    document.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      document.removeEventListener('scroll', update, true);
    };
  }, [open]);

  return { anchorRef, popoverRef };
}

function position(anchor: HTMLElement | null, popover: HTMLElement | null) {
  if (!anchor || !popover) return;
  const p = place(anchor.getBoundingClientRect(), popover.getBoundingClientRect(), {
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
  });
  popover.style.top = `${p.top}px`;
  popover.style.left = `${p.left}px`;
}
