'use client';

import { createContext, use, useCallback, useEffect, useEffectEvent, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { buttonClass } from '@/components/ui';
import type { TourKey, TourStatus } from '@/lib/tracker/types';
import { useTracker } from '../tracker-context';
import { HELP_MENU_SELECTOR, TOUR_LABELS, TOURS, type TourStep } from './help-content';
import { helpPrompt } from './help-prompt';
import { place } from './position';

/** How long a step waits for the entry dialog and its field before the tour gives up. */
const WAIT_MS = 1000;
/** Space between the highlighted element and the edge of the cutout. */
const PAD = 6;
/** Same preset as the flights panel's "+ Add flight" button. */
const ENTRY_PRESET = { category: 'Flights', method: 'fare', title: 'Add flight' } as const;

type Run = { key: TourKey; index: number; dir: 1 | -1 };

interface TourContextValue {
  start: (key: TourKey) => void;
  active: TourKey | null;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour() {
  const ctx = use(TourContext);
  if (!ctx) throw new Error('useTour must be used within TourProvider');
  return ctx;
}

const findTarget = (step: TourStep) => document.querySelector<HTMLElement>(`[data-help="${step.target}"]`);
const inModalDialog = (el: HTMLElement | null) => !!el?.closest('dialog')?.matches(':modal');

export function TourProvider({ children }: { children: ReactNode }) {
  const { data, openEntry, closeEntry, markTour } = useTracker();
  // A new, empty account starts "Adding your data" straight away. Lazy state runs once (StrictMode can't
  // start it twice) and matches the server render.
  const [run, setRun] = useState<Run | null>(() =>
    helpPrompt({ tours: data.tours, entries: data.entries }) === 'start-adding-data' ? { key: 'adding-data', index: 0, dir: 1 } : null,
  );
  const dialogRef = useRef<HTMLDialogElement>(null);
  const holeRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const targetRef = useRef<HTMLElement | null>(null);
  /** True while the entry dialog is open because this tour opened it. */
  const openedEntry = useRef(false);
  /** True from a step change until that step is presented; Back and Next do nothing meanwhile. */
  const waiting = useRef(run !== null);
  /** True once this run has ended, so a second click on Skip or Done can't save twice. */
  const ending = useRef(false);
  const titleId = useId();
  const bodyId = useId();

  /** Closes the tour without saving anything. Closes the entry dialog too if the tour opened it. */
  function leave() {
    if (openedEntry.current) closeEntry();
    openedEntry.current = false;
    waiting.current = false;
    targetRef.current = null;
    dialogRef.current?.removeAttribute('data-waiting');
    dialogRef.current?.close();
    setRun(null);
    // Closing the tour (and any entry dialog it opened) can leave focus on <body>; after Done the entry dialog keeps focus, so this skips it.
    requestAnimationFrame(() => {
      if (document.activeElement === document.body) document.querySelector<HTMLElement>(HELP_MENU_SELECTOR)?.focus();
    });
  }

  function end(status: TourStatus) {
    if (!run || ending.current) return;
    ending.current = true;
    markTour(run.key, status);
    // Done leaves the entry dialog open so the user can add a real entry; Skip and Esc close it.
    if (status === 'completed') openedEntry.current = false;
    leave();
  }

  function go(dir: 1 | -1) {
    if (!run || waiting.current) return;
    if (dir === 1 && run.index === TOURS[run.key].steps.length - 1) return end('completed');
    // Ignore further clicks until the next step is presented, so a double click can't skip past the dialog steps.
    waiting.current = true;
    setRun({ ...run, index: run.index + dir, dir });
  }

  const enterStep = useEffectEvent((current: Run) => {
    const steps = TOURS[current.key].steps;
    const step = steps[current.index];
    const firstEntryStep = steps.findIndex((s) => s.before === 'openEntry');
    const deadline = performance.now() + WAIT_MS;
    let frame = 0;

    // The step's target isn't on the page: move on in the same direction.
    const pass = () => {
      const index = current.index + current.dir;
      if (index >= steps.length) end('completed');
      else if (index < 0) leave();
      else setRun({ ...current, index });
    };

    const present = (el: HTMLElement) => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      waiting.current = false;
      dialog.removeAttribute('data-waiting');
      targetRef.current = el;
      // A target inside the entry dialog: show the tour again so it's the topmost modal and takes input.
      if (dialog.open && el.closest('dialog')) dialog.close();
      if (!dialog.open) dialog.showModal();
      if (cardRef.current) reveal(el, cardRef.current);
      measure(el, holeRef.current, cardRef.current);
      if (backRef.current) backRef.current.disabled = !steps.slice(0, current.index).some((s) => findTarget(s));
      primaryRef.current?.focus({ preventScroll: true });
    };

    const attempt = () => {
      const el = findTarget(step);
      if (el && (!step.before || inModalDialog(el))) return present(el);
      if (!step.before) return pass();
      if (performance.now() > deadline) return leave();
      frame = requestAnimationFrame(attempt);
    };

    frame = requestAnimationFrame(() => {
      // Going back out of the dialog part of the tour: close the dialog the tour opened.
      if (firstEntryStep !== -1 && current.index < firstEntryStep && openedEntry.current) {
        openedEntry.current = false;
        closeEntry();
      }
      if (step.before === 'openEntry' && !inModalDialog(findTarget(step))) {
        waiting.current = true;
        dialogRef.current?.setAttribute('data-waiting', '');
        openEntry(undefined, ENTRY_PRESET);
        openedEntry.current = true;
      }
      attempt();
    });
    return () => cancelAnimationFrame(frame);
  });

  useEffect(() => {
    if (!run) return;
    return enterStep(run);
  }, [run]);

  useEffect(() => {
    if (!run) return;
    const update = () => measure(targetRef.current, holeRef.current, cardRef.current);
    window.addEventListener('resize', update);
    // Capture phase, so scrolling inside the entry dialog also re-measures.
    document.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      document.removeEventListener('scroll', update, true);
    };
  }, [run]);

  const start = useCallback((key: TourKey) => {
    openedEntry.current = false;
    waiting.current = true;
    ending.current = false;
    setRun({ key, index: 0, dir: 1 });
  }, []);
  const active = run?.key ?? null;
  const value = useMemo(() => ({ start, active }), [start, active]);

  const steps = run ? TOURS[run.key].steps : [];
  const step = run ? steps[run.index] : undefined;

  return (
    <TourContext value={value}>
      {children}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        onCancel={() => end('dismissed')}
        className="fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden border-0 bg-transparent p-0 text-foreground backdrop:bg-transparent data-[waiting]:invisible"
      >
        {run && step && (
          <>
            <div ref={holeRef} aria-hidden className="pointer-events-none fixed rounded-xl shadow-[0_0_0_9999px_#152a358c] outline-2 outline-white" />
            <div ref={cardRef} className="fixed inset-x-4 bottom-4 rounded-2xl border border-line bg-surface p-5 shadow-xl sm:inset-auto sm:w-80">
              <div aria-live="polite" aria-atomic="true">
                <p className="text-[11px] font-bold uppercase tracking-[2px] text-accent">
                  {TOURS[run.key].title} · {run.index + 1} of {steps.length}
                </p>
                <h2 id={titleId} className="mt-1.5 text-base font-semibold">
                  {step.title}
                </h2>
                <p id={bodyId} className="mt-1.5 text-sm leading-relaxed text-muted">
                  {step.body}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button type="button" className={buttonClass.link} onClick={() => end('dismissed')}>
                  {TOUR_LABELS.skip}
                </button>
                <button ref={backRef} type="button" className={`${buttonClass.secondary} ml-auto`} onClick={() => go(-1)}>
                  {TOUR_LABELS.back}
                </button>
                <button ref={primaryRef} type="button" className={buttonClass.dark} onClick={() => go(1)}>
                  {run.index === steps.length - 1 ? TOUR_LABELS.done : TOUR_LABELS.next}
                </button>
              </div>
            </div>
          </>
        )}
      </dialog>
    </TourContext>
  );
}

/** Scrolls the target into view. Below 640px it keeps the target clear of the docked card, top-aligned when it can't fit. */
function reveal(target: HTMLElement, card: HTMLElement) {
  const viewport = document.documentElement.clientHeight;
  const covered = matchMedia('(min-width: 640px)').matches ? 0 : viewport - card.getBoundingClientRect().top;
  const fits = target.getBoundingClientRect().height + PAD * 2 + 16 <= viewport - covered;
  target.style.scrollMarginTop = `${PAD + 8}px`;
  target.style.scrollMarginBottom = `${covered + PAD + 8}px`;
  target.scrollIntoView({
    block: fits ? 'center' : 'start',
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  });
  target.style.scrollMarginTop = target.style.scrollMarginBottom = '';
}

/** Draws the cutout around the target and places the card next to it. Below 640px, CSS docks the card to the bottom. */
function measure(target: HTMLElement | null, hole: HTMLElement | null, card: HTMLElement | null) {
  if (!target || !hole || !card) return;
  const r = target.getBoundingClientRect();
  const cut = { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
  Object.assign(hole.style, { top: `${cut.top}px`, left: `${cut.left}px`, width: `${cut.width}px`, height: `${cut.height}px` });
  if (!matchMedia('(min-width: 640px)').matches) {
    card.style.top = card.style.left = '';
    return;
  }
  const { clientWidth, clientHeight } = document.documentElement;
  const p = place(cut, card.getBoundingClientRect(), { width: clientWidth, height: clientHeight }, 12);
  card.style.top = `${p.top}px`;
  card.style.left = `${p.left}px`;
}
