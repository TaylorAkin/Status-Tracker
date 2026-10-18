'use client';

import { useState } from 'react';
import { CATEGORIES, credit, flightName, routeMiles, type Category, type Entry, type EntryState } from '@/lib/engine';
import { fmt, stateLabel } from '@/lib/format';
import { deltaMethods } from '@/lib/tracker/methods';
import { ModalDialog } from '@/components/modal-dialog';
import { buttonClass, Hint, inputClass, labelClass } from '@/components/ui';
import * as actions from '../actions';
import { useAirports } from './use-airports';
import { useTracker } from './tracker-context';

type Form = {
  category: Category;
  date: string;
  state: EntryState;
  description: string;
  method: string;
  amount: string;
  rate: string;
  override: string;
  notes: string;
  route: string;
  roundtrip: boolean;
};

function blankForm(year: number, category: Category = 'Flights', method?: string, description = ''): Form {
  return {
    category,
    date: `${year}-01-01`,
    state: 'Planned',
    description,
    method: method ?? '',
    amount: '0',
    rate: '1',
    override: '',
    notes: '',
    route: '',
    roundtrip: false,
  };
}

const fromEntry = (e: Entry): Form => ({
  category: e.category,
  date: e.date,
  state: e.state,
  description: e.description,
  method: e.method,
  amount: String(e.amount),
  rate: String(e.rate),
  override: e.override === null ? '' : String(e.override),
  notes: e.notes,
  route: e.route ?? '',
  roundtrip: !!e.roundtrip,
});

export function EntryDialog() {
  const { entryDialog, closeEntry } = useTracker();
  return (
    <ModalDialog open={entryDialog.open} onClose={closeEntry}>
      <EntryForm />
    </ModalDialog>
  );
}

function EntryForm() {
  const { data, unit, entryDialog, closeEntry, run } = useTracker();
  const year = data.tracker.statusYear;
  const editing = entryDialog.id ? data.entries.find((e) => e.id === entryDialog.id) : undefined;
  const [form, setForm] = useState<Form>(() => {
    const p = entryDialog.preset;
    return editing ? fromEntry(editing) : blankForm(year, p?.category, p?.method, p?.description);
  });
  const { airports } = useAirports();

  const methods = deltaMethods(form.category, data.cards);
  const method = methods.find((m) => m.key === form.method) ?? methods[0];
  const isFlight = form.category === 'Flights';
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const estimate = credit({
    override: form.override === '' ? null : Number(form.override),
    amount: Number(form.amount || 0),
    rate: method.key === 'custom' ? Number(form.rate || 0) : method.rate,
  });

  let routeInfo = 'Optional. Enter airport codes like DCA-ATL or DCA-ATL-LAX to place the flight on your map.';
  let routeError = '';
  if (isFlight && form.route.trim()) {
    if (!airports) routeInfo = 'Loading airport lookup…';
    else {
      try {
        const r = routeMiles(airports, form.route, form.roundtrip);
        routeInfo =
          r.legs.map((l) => `${l.from} → ${l.to}: ${fmt(l.miles)} mi`).join(' · ') +
          (form.roundtrip ? ' · round trip × 2' : '') +
          ` = ${fmt(r.miles)} miles flown`;
      } catch (e) {
        routeError = (e as Error).message;
      }
    }
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (routeError) return;
    const id = editing?.id ?? crypto.randomUUID();
    const input = {
      id,
      category: form.category,
      state: form.state,
      date: form.date,
      description: form.description.trim() || (isFlight && form.route ? flightName({ route: form.route, description: '' }) : ''),
      method: method.key,
      amount: Number(form.amount || 0),
      rate: method.key === 'custom' ? Number(form.rate || 0) : method.rate,
      override: form.override === '' ? null : Number(form.override),
      notes: form.notes,
      route: isFlight ? form.route.trim().toUpperCase() || null : null,
      roundtrip: isFlight && form.roundtrip,
      cardKey: method.cardKey ?? editing?.cardKey ?? null,
    };
    if (!input.description) return;
    const optimistic: Entry = { ...input, program: 'DL', route: input.route ?? undefined, cardKey: input.cardKey ?? undefined };
    run({ type: 'upsert', entry: optimistic }, () => actions.saveEntry(input), 'Earning saved.');
    closeEntry();
  }

  return (
    <form onSubmit={submit}>
      <h2 className="text-xl font-semibold">{editing ? 'Edit earning' : (entryDialog.preset?.title ?? 'Add earning')}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="f-category" className={labelClass}>
            Category
          </label>
          <select
            id="f-category"
            className={inputClass}
            value={form.category}
            onChange={(e) => {
              const category = e.target.value as Category;
              set({
                category,
                method: deltaMethods(category, data.cards)[0].key,
                override: '',
                state: form.state === 'Potential' && category !== 'Flights' ? 'Planned' : form.state,
              });
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-date" className={labelClass}>
            Qualifying activity date
          </label>
          <input
            id="f-date"
            type="date"
            required
            min={`${year}-01-01`}
            max={`${year}-12-31`}
            className={inputClass}
            value={form.date}
            onChange={(e) => set({ date: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="f-state" className={labelClass}>
            Earning state
          </label>
          <select id="f-state" className={inputClass} value={form.state} onChange={(e) => set({ state: e.target.value as EntryState })}>
            {(['Planned', 'Potential', 'Pending', 'Posted', 'Cancelled'] as const)
              .filter((s) => s !== 'Potential' || isFlight)
              .map((s) => (
                <option key={s} value={s}>
                  {stateLabel(s)}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-method" className={labelClass}>
            Calculation method
          </label>
          <select id="f-method" className={inputClass} value={method.key} onChange={(e) => set({ method: e.target.value })}>
            {methods.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <Hint className="-mt-2 sm:col-span-2">{method.hint}</Hint>
        <div className="sm:col-span-2">
          <label htmlFor="f-description" className={labelClass}>
            Description
          </label>
          <input
            id="f-description"
            className={inputClass}
            maxLength={200}
            required={!isFlight || !form.route.trim()}
            placeholder={isFlight ? 'e.g. Sales kickoff trip (route is used if blank)' : 'e.g. January card spend, Delta Stays bonus'}
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
          />
        </div>
        {isFlight && (
          <div className="sm:col-span-2">
            <label htmlFor="f-route" className={labelClass}>
              Airport route · IATA codes
            </label>
            <input
              id="f-route"
              className={`${inputClass} uppercase ${routeError ? 'border-accent' : ''}`}
              maxLength={200}
              autoComplete="off"
              placeholder="DCA-ATL or DCA-ATL-LAX"
              value={form.route}
              onChange={(e) => set({ route: e.target.value })}
              aria-invalid={!!routeError}
            />
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.roundtrip} onChange={(e) => set({ roundtrip: e.target.checked })} /> Round trip: same route in
              reverse
            </label>
            <Hint className={routeError ? 'text-accent' : ''}>{routeError || routeInfo}</Hint>
          </div>
        )}
        <div>
          <label htmlFor="f-amount" className={labelClass}>
            {method.amountLabel}
          </label>
          <input
            id="f-amount"
            type="number"
            min="0"
            step="any"
            className={inputClass}
            value={form.amount}
            onChange={(e) => set({ amount: e.target.value })}
          />
        </div>
        {method.key === 'custom' && (
          <div>
            <label htmlFor="f-rate" className={labelClass}>
              {unit} per dollar
            </label>
            <input
              id="f-rate"
              type="number"
              min="0"
              step="any"
              className={inputClass}
              value={form.rate}
              onChange={(e) => set({ rate: e.target.value })}
            />
          </div>
        )}
        <div className="sm:col-span-2">
          <label htmlFor="f-override" className={labelClass}>
            Posted / exact {unit} (optional)
          </label>
          <input
            id="f-override"
            type="number"
            min="0"
            step="any"
            className={inputClass}
            placeholder="Overrides the calculation when entered"
            value={form.override}
            onChange={(e) => set({ override: e.target.value })}
          />
          <Hint>For Posted entries, enter the credit shown by Delta. A calculated posted entry remains an estimate.</Hint>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="f-notes" className={labelClass}>
            Notes / evidence
          </label>
          <input
            id="f-notes"
            className={inputClass}
            maxLength={600}
            placeholder="Fare class, ticket number, offer terms, or receipt reference"
            value={form.notes}
            onChange={(e) => set({ notes: e.target.value })}
          />
        </div>
      </div>
      <p className="mt-4 rounded-lg bg-[#e9f3f0] p-3.5 text-sm">
        {fmt(estimate)} {unit} · {stateLabel(form.state)}
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className={buttonClass.secondary} onClick={closeEntry}>
          Cancel
        </button>
        <button type="submit" className={buttonClass.dark}>
          Save earning
        </button>
      </div>
    </form>
  );
}
