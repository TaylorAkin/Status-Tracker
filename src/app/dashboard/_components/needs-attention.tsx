'use client';

import { useState, useSyncExternalStore } from 'react';
import { credit, tripPath } from '@/lib/engine';
import { fmt, MONTH_SHORT, shortCardName } from '@/lib/format';
import { attentionItems, setupSteps, type AttentionItem } from '@/lib/tracker/attention';
import { buttonClass, Panel } from '@/components/ui';
import { useTracker } from './tracker-context';

const SETUP_KEY = 'setup-dismissed';
const SHOWN = 5;

const noop = () => () => {};
/** Today in the browser's time zone. Null on the server, so "past" is only judged on the client. */
function useToday(): string | null {
  return useSyncExternalStore(
    noop,
    () => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },
    () => null,
  );
}

/** "I'll do this later" on the setup checklist, remembered per browser. */
const setupStore = {
  listeners: new Set<() => void>(),
  subscribe(listener: () => void) {
    setupStore.listeners.add(listener);
    return () => setupStore.listeners.delete(listener);
  },
  get() {
    try {
      return localStorage.getItem(SETUP_KEY) === '1';
    } catch {
      return false;
    }
  },
  dismiss() {
    try {
      localStorage.setItem(SETUP_KEY, '1');
    } catch {}
    setupStore.listeners.forEach((l) => l());
  },
};

/** The setup checklist for a new tracker, then a list of past activity to reconcile. Renders nothing when there's neither. */
export function NeedsAttention() {
  const { data } = useTracker();
  const today = useToday();
  const setupDismissed = useSyncExternalStore(setupStore.subscribe, setupStore.get, () => true);
  const steps = setupSteps(data);
  const showSetup = !setupDismissed && !(steps.cards && steps.flight);
  const items = today ? attentionItems({ entries: data.entries, trackerCards: data.trackerCards, statusYear: data.tracker.statusYear, today }) : [];

  if (!showSetup && !items.length) return null;
  return (
    <div className="flex flex-col gap-5">
      {showSetup && <SetupChecklist steps={steps} />}
      {items.length > 0 && <AttentionList items={items} />}
    </div>
  );
}

function SetupChecklist({ steps }: { steps: ReturnType<typeof setupSteps> }) {
  const { setSettingsOpen, setTripOpen, showSource } = useTracker();
  const rows = [
    { done: steps.cards, title: 'Choose your goal and Delta cards', action: 'Open settings', run: () => setSettingsOpen(true) },
    { done: steps.flight, title: 'Add a flight you’ve taken or booked', action: 'Add flight', run: () => setTripOpen(true) },
    { done: steps.spend, title: 'Plan monthly card spend', action: 'Plan spend', run: () => showSource('cards') },
  ];
  return (
    <Panel aria-labelledby="setup-title" data-help="setup">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="setup-title" className="text-lg font-semibold tracking-tight">
          Get your tracker set up
        </h2>
        <span className="text-xs text-muted">
          {rows.filter((r) => r.done).length} of {rows.length} done
        </span>
      </div>
      <ol className="divide-y divide-line border-y border-line">
        {rows.map((r, i) => (
          <li key={r.title} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
            <span className={`flex items-center gap-3 ${r.done ? 'text-muted line-through' : ''}`}>
              <span
                aria-hidden
                className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${r.done ? 'bg-[#e4f3ea] text-[#0a6e56]' : 'border border-line'}`}
              >
                {r.done ? '✓' : i + 1}
              </span>
              {r.title}
              {r.done && <span className="sr-only">(done)</span>}
            </span>
            {!r.done && (
              <button className={`${buttonClass.secondary} h-8 px-3 text-xs`} onClick={r.run}>
                {r.action}
              </button>
            )}
          </li>
        ))}
      </ol>
      <button className={`${buttonClass.link} mt-3`} onClick={setupStore.dismiss}>
        I’ll do this later
      </button>
    </Panel>
  );
}

function AttentionList({ items }: { items: AttentionItem[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, SHOWN);
  return (
    <Panel aria-labelledby="attention-title" data-help="attention" className="border-[#ecd9a8] bg-[#fffaf0]">
      <h2 id="attention-title" className="mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight">
        Needs attention
        <span className="rounded-full bg-[#f4ebd8] px-2 py-0.5 text-xs font-semibold text-[#796039]">{items.length}</span>
      </h2>
      <ul className="divide-y divide-[#ecd9a8] border-y border-[#ecd9a8]">
        {shown.map((item) => (
          <AttentionRow key={item.kind + ('entries' in item ? item.entries[0].id : item.cardKey)} item={item} />
        ))}
      </ul>
      {items.length > SHOWN && (
        <button className={`${buttonClass.link} mt-3`} onClick={() => setAll(!all)}>
          {all ? 'Show fewer' : `Show all ${items.length}`}
        </button>
      )}
    </Panel>
  );
}

const monthList = (months: number[]) => months.map((m) => MONTH_SHORT[m - 1]).join(', ');

function AttentionRow({ item }: { item: AttentionItem }) {
  const { data, unit, setState, openEntry, showSource } = useTracker();
  const small = `${buttonClass.secondary} h-8 px-3 text-xs`;

  if ('cardKey' in item) {
    const card = data.cards.find((c) => c.key === item.cardKey);
    const name = card ? shortCardName(card.name) : 'Card';
    return (
      <li className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
        <span>
          <strong className="font-semibold">{name}</strong>:{' '}
          {item.kind === 'spendMissing' ? `no spend entered for ${monthList(item.months)}` : `${monthList(item.months)} spend hasn’t posted`}
        </span>
        <button className={small} onClick={() => showSource('cards')}>
          {item.kind === 'spendMissing' ? 'Enter spend' : 'Review months'}
        </button>
      </li>
    );
  }

  const first = item.entries[0];
  const flight = first.category === 'Flights';
  const name = (flight && tripPath(item.entries)) || first.description;
  const total = item.entries.reduce((sum, e) => sum + credit(e), 0);
  const ids = item.entries.map((e) => e.id);
  const setAll = (state: 'Posted' | 'Planned', success: string) =>
    ids.forEach((id, i) => setState(id, state, i === ids.length - 1 ? success : undefined));

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
      <span className="min-w-0">
        <strong className="font-semibold">{name}</strong>{' '}
        <span className="text-muted">
          · {first.date} · {fmt(total)} {unit}
        </span>
        <span className="block text-xs text-muted">
          {item.kind === 'unbooked'
            ? 'This date has passed and it’s still Potential. Book it, or edit or delete it.'
            : flight
              ? `Flown, but not marked Posted. Mark it Posted once Delta credits ${item.entries.length > 1 ? 'the trip' : 'it'}.`
              : 'Expected by this date, but not marked Posted yet.'}
        </span>
      </span>
      <span className="flex shrink-0 gap-2">
        {item.kind === 'unbooked' ? (
          <button className={small} onClick={() => setAll('Planned', 'Moved to Planned.')}>
            Mark booked
          </button>
        ) : (
          <button className={small} onClick={() => setAll('Posted', 'Moved to Posted.')}>
            Mark posted
          </button>
        )}
        {ids.length === 1 ? (
          <button className={small} onClick={() => openEntry(first.id)}>
            Edit
          </button>
        ) : (
          <button className={small} onClick={() => showSource('flights')}>
            View trip
          </button>
        )}
      </span>
    </li>
  );
}
