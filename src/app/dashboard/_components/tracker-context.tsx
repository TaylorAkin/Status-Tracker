'use client';

import { createContext, use, useCallback, useMemo, useOptimistic, useRef, useState, useTransition, type ReactNode } from 'react';
import type { Entry, EntryState } from '@/lib/engine';
import type { DashboardData, TourKey, TourStatus } from '@/lib/tracker/types';
import * as actions from '../actions';

type Op =
  | { type: 'upsert'; entry: Entry }
  | { type: 'addMany'; entries: Entry[] }
  | { type: 'delete'; id: string }
  | { type: 'deleteTrip'; tripId: string }
  | { type: 'patch'; id: string; patch: Partial<Entry> }
  | { type: 'settings'; target: number; asOf: string }
  | { type: 'cardIncluded'; cardKey: string; included: boolean }
  | { type: 'tour'; key: TourKey; status: TourStatus };

function reducer(state: DashboardData, op: Op): DashboardData {
  switch (op.type) {
    case 'upsert': {
      const exists = state.entries.some((e) => e.id === op.entry.id);
      return {
        ...state,
        entries: exists ? state.entries.map((e) => (e.id === op.entry.id ? op.entry : e)) : [...state.entries, op.entry],
      };
    }
    case 'addMany':
      return { ...state, entries: [...state.entries, ...op.entries] };
    case 'delete':
      return { ...state, entries: state.entries.filter((e) => e.id !== op.id) };
    case 'deleteTrip':
      return { ...state, entries: state.entries.filter((e) => e.tripId !== op.tripId) };
    case 'patch':
      return { ...state, entries: state.entries.map((e) => (e.id === op.id ? { ...e, ...op.patch } : e)) };
    case 'settings':
      return { ...state, tracker: { ...state.tracker, target: op.target, asOf: op.asOf } };
    case 'cardIncluded':
      return {
        ...state,
        trackerCards: state.trackerCards.map((c) => (c.cardKey === op.cardKey ? { ...c, included: op.included } : c)),
      };
    case 'tour':
      return { ...state, tours: { ...state.tours, [op.key]: op.status } };
  }
}

/** The tabs of the Sources panel. */
export type SourceTab = 'flights' | 'cards' | 'bonuses';

export interface EntryPreset {
  category?: Entry['category'];
  method?: string;
  description?: string;
  title?: string;
}

interface TrackerContextValue {
  data: DashboardData;
  /** Entries that count toward totals: excludes earnings from potential cards the user hasn't included. */
  activeEntries: Entry[];
  unit: string;
  pending: boolean;
  /** Applies an optimistic update, then runs the server action; reverts and toasts on failure. */
  run: (op: Op | null, action: () => Promise<unknown>, success?: string) => void;
  setState: (id: string, state: EntryState, success?: string) => void;
  setDate: (id: string, date: string) => void;
  /** Saves a tour's status; the dashboard reflects it immediately. */
  markTour: (key: TourKey, status: TourStatus) => void;
  toast: (message: string) => void;
  openEntry: (id?: string, preset?: EntryPreset) => void;
  entryDialog: { open: boolean; id?: string; preset?: EntryPreset };
  closeEntry: () => void;
  /** The multi-leg "Add flight" dialog. */
  tripOpen: boolean;
  setTripOpen: (open: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  sourceTab: SourceTab;
  setSourceTab: (tab: SourceTab) => void;
  /** Selects a Sources tab and scrolls the panel into view. */
  showSource: (tab: SourceTab) => void;
}

const TrackerContext = createContext<TrackerContextValue | null>(null);

export function useTracker() {
  const ctx = use(TrackerContext);
  if (!ctx) throw new Error('useTracker must be used within TrackerProvider');
  return ctx;
}

export function TrackerProvider({ initial, children }: { initial: DashboardData; children: ReactNode }) {
  const [data, apply] = useOptimistic(initial, reducer);
  const [pending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [entryDialog, setEntryDialog] = useState<TrackerContextValue['entryDialog']>({ open: false });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tripOpen, setTripOpen] = useState(false);
  const [sourceTab, setSourceTab] = useState<SourceTab>('flights');

  const toast = useCallback((message: string) => {
    setToastMessage(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const run = useCallback<TrackerContextValue['run']>(
    (op, action, success) => {
      startTransition(async () => {
        if (op) apply(op);
        try {
          await action();
          if (success) toast(success);
        } catch (e) {
          toast(e instanceof Error ? e.message : 'Something went wrong. Try again.');
        }
      });
    },
    [apply, toast],
  );

  const value = useMemo<TrackerContextValue>(() => {
    const active = new Set(data.trackerCards.filter((c) => c.included).map((c) => c.cardKey));
    return {
      data,
      activeEntries: data.entries.filter((e) => !e.cardKey || active.has(e.cardKey)),
      unit: data.program.unitLabel,
      pending,
      run,
      setState: (id, state, success) => run({ type: 'patch', id, patch: { state } }, () => actions.setEntryState(id, state), success),
      setDate: (id, date) => run({ type: 'patch', id, patch: { date } }, () => actions.setEntryDate(id, date)),
      markTour: (key, status) => run({ type: 'tour', key, status }, () => actions.markTour(key, status)),
      toast,
      openEntry: (id, preset) => setEntryDialog({ open: true, id, preset }),
      entryDialog,
      closeEntry: () => setEntryDialog({ open: false }),
      tripOpen,
      setTripOpen,
      settingsOpen,
      setSettingsOpen,
      sourceTab,
      setSourceTab,
      showSource: (tab) => {
        setSourceTab(tab);
        requestAnimationFrame(() => document.getElementById('sources')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      },
    };
  }, [data, pending, run, toast, entryDialog, tripOpen, settingsOpen, sourceTab]);

  return (
    <TrackerContext value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-foreground px-5 py-3 text-sm text-white shadow-lg transition ${toastMessage ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      >
        {toastMessage}
      </div>
    </TrackerContext>
  );
}
