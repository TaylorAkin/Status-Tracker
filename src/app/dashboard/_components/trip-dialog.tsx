'use client';

import { useState } from 'react';
import { credit, flightName, reverseRoute, routeMiles, tripLegs, type Entry, type EntryState, type TicketInput, type TripLeg } from '@/lib/engine';
import { fmt, stateLabel } from '@/lib/format';
import { deltaMethods } from '@/lib/tracker/methods';
import { ModalDialog } from '@/components/modal-dialog';
import { buttonClass, Hint, inputClass, labelClass, selectClass } from '@/components/ui';
import * as actions from '../actions';
import { useAirports } from './use-airports';
import { useTracker } from './tracker-context';

type Form = {
  name: string;
  state: EntryState;
  outRoute: string;
  outDate: string;
  outFare: string;
  hasReturn: boolean;
  retRoute: string;
  /** False until the return route is typed in; until then it mirrors the outbound route. */
  retEdited: boolean;
  retDate: string;
  retFare: string;
  notes: string;
};

// Potential is here so a trip you're only considering can be added directly; Booked moves it to Planned later.
const STATES: EntryState[] = ['Potential', 'Planned', 'Pending', 'Posted'];
const TICKETS = ['Outbound', 'Return'];

export function TripDialog() {
  const { tripOpen, setTripOpen } = useTracker();
  return (
    <ModalDialog open={tripOpen} onClose={() => setTripOpen(false)}>
      <TripForm />
    </ModalDialog>
  );
}

function TripForm() {
  const { data, unit, setTripOpen, run } = useTracker();
  const year = data.tracker.statusYear;
  const { airports } = useAirports();
  const [form, setForm] = useState<Form>({
    name: '',
    state: 'Planned',
    outRoute: '',
    outDate: `${year}-01-01`,
    outFare: '0',
    hasReturn: false,
    retRoute: '',
    retEdited: false,
    retDate: `${year}-01-01`,
    retFare: '0',
    notes: '',
  });
  const [review, setReview] = useState<TripLeg[] | null>(null);
  const [error, setError] = useState('');
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const close = () => setTripOpen(false);
  const fare = deltaMethods('Flights', data.cards).find((m) => m.key === 'fare')!;
  const retRoute = form.retEdited ? form.retRoute : reverseRoute(form.outRoute);
  const description = form.name.trim() || flightName({ route: form.outRoute, description: '' });

  function next(ev: React.FormEvent) {
    ev.preventDefault();
    if (!airports) return setError('Airport lookup is still loading. Try again in a moment.');
    const tickets: TicketInput[] = [{ route: form.outRoute, date: form.outDate, fare: Number(form.outFare || 0) }];
    if (form.hasReturn) {
      if (form.retDate < form.outDate) return setError('The return date must be on or after the outbound date.');
      tickets.push({ route: retRoute, date: form.retDate, fare: Number(form.retFare || 0) });
    }
    for (const [i, t] of tickets.entries()) {
      try {
        routeMiles(airports, t.route);
      } catch (e) {
        return setError(`${TICKETS[i]}: ${(e as Error).message}`);
      }
    }
    setError('');
    setReview(tripLegs(airports, tickets));
  }

  function save() {
    if (!review) return;
    const tripId = crypto.randomUUID();
    const legs = review.map((l) => ({
      ticket: l.ticket,
      leg: l.leg,
      entry: {
        id: crypto.randomUUID(),
        category: 'Flights' as const,
        state: form.state,
        date: l.date,
        description,
        method: fare.key,
        amount: l.fare,
        rate: fare.rate,
        override: null,
        notes: form.notes,
        route: `${l.from}-${l.to}`,
      },
    }));
    const optimistic: Entry[] = legs.map(({ entry, ticket, leg }) => ({ ...entry, program: 'DL', tripId, ticket, leg }));
    run(
      { type: 'addMany', entries: optimistic },
      () => actions.saveTrip({ tripId, legs }),
      legs.length > 1 ? `Trip saved as ${legs.length} legs.` : 'Flight saved.',
    );
    close();
  }

  if (review) {
    const total = review.reduce((sum, l) => sum + credit({ override: null, amount: l.fare, rate: fare.rate }), 0);
    return (
      <div>
        <h2 className="text-xl font-semibold">Review trip</h2>
        <p className="mt-1 text-sm text-muted">
          {description} · {stateLabel(form.state)}
        </p>
        {TICKETS.map((label, ticket) => {
          const legs = review.filter((l) => l.ticket === ticket);
          if (!legs.length) return null;
          return (
            <section key={label} className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                {label} · {legs[0].date}
              </h3>
              <ul className="mt-2 grid gap-2">
                {legs.map((l) => (
                  <li
                    key={l.leg}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[#e6c4cb] border-l-[3px] border-l-accent bg-[linear-gradient(135deg,#fff_12%,#f4f3f2_62%,#edf1f7)] px-3.5 py-2.5"
                  >
                    <div>
                      <strong className="block text-[17px] leading-snug">
                        {l.from} → {l.to}
                      </strong>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {fmt(l.miles)} mi · ${l.fare.toFixed(2)} of fare
                      </p>
                    </div>
                    <div className="text-right">
                      <strong className="block text-[15px] text-brand">{fmt(credit({ override: null, amount: l.fare, rate: fare.rate }))}</strong>
                      <small className="block text-[10px] text-muted">{unit} · est.</small>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        <p className="mt-5 rounded-lg bg-[#e9f3f0] p-3.5 text-sm">
          {review.length} {review.length === 1 ? 'leg' : 'legs'} · {fmt(total)} {unit} · {stateLabel(form.state)}
        </p>
        <Hint>Each leg is saved as its own flight, so you can edit, re-date, or cancel one leg later without touching the rest of the trip.</Hint>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          <button type="button" className={`${buttonClass.secondary} mr-auto`} onClick={() => setReview(null)}>
            Back
          </button>
          <button type="button" className={buttonClass.secondary} onClick={close}>
            Cancel
          </button>
          <button type="button" className={buttonClass.dark} onClick={save}>
            Save trip
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={next}>
      <h2 className="text-xl font-semibold">Add flight</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="t-name" className={labelClass}>
            Trip name (optional)
          </label>
          <input
            id="t-name"
            className={inputClass}
            maxLength={200}
            placeholder="e.g. Sales kickoff (route is used if blank)"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="t-state" className={labelClass}>
            Earning state
          </label>
          <select id="t-state" className={selectClass} value={form.state} onChange={(e) => set({ state: e.target.value as EntryState })}>
            {STATES.map((s) => (
              <option key={s} value={s}>
                {stateLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <div className="hidden sm:block" />
        <Ticket
          label="Outbound"
          id="out"
          year={year}
          route={form.outRoute}
          date={form.outDate}
          fare={form.outFare}
          fareLabel={fare.amountLabel}
          onChange={(p) => set({ outRoute: p.route ?? form.outRoute, outDate: p.date ?? form.outDate, outFare: p.fare ?? form.outFare })}
        />
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={form.hasReturn}
            onChange={(e) => set({ hasReturn: e.target.checked, retDate: form.retDate < form.outDate ? form.outDate : form.retDate })}
          />{' '}
          Return flight on a separate ticket
        </label>
        {form.hasReturn && (
          <Ticket
            label="Return"
            id="ret"
            year={year}
            minDate={form.outDate}
            route={retRoute}
            date={form.retDate}
            fare={form.retFare}
            fareLabel={fare.amountLabel}
            onChange={(p) =>
              set({
                ...(p.route !== undefined ? { retRoute: p.route, retEdited: true } : {}),
                retDate: p.date ?? form.retDate,
                retFare: p.fare ?? form.retFare,
              })
            }
          />
        )}
        <Hint className="-mt-2 sm:col-span-2">
          Enter each connection, like DCA-ATL-LAX. A ticket&apos;s fare is split across its legs by distance; adjust any leg&apos;s exact {unit}{' '}
          later. {fare.hint}
        </Hint>
        <div className="sm:col-span-2">
          <label htmlFor="t-notes" className={labelClass}>
            Notes / evidence
          </label>
          <input
            id="t-notes"
            className={inputClass}
            maxLength={600}
            placeholder="Fare class, ticket number, or receipt reference"
            value={form.notes}
            onChange={(e) => set({ notes: e.target.value })}
          />
        </div>
      </div>
      {error && <p className="mt-4 text-sm text-accent">{error}</p>}
      <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
        <button type="button" className={buttonClass.secondary} onClick={close}>
          Cancel
        </button>
        <button type="submit" className={buttonClass.dark}>
          Review legs
        </button>
      </div>
    </form>
  );
}

function Ticket(props: {
  label: string;
  id: string;
  year: number;
  minDate?: string;
  route: string;
  date: string;
  fare: string;
  fareLabel: string;
  onChange: (patch: { route?: string; date?: string; fare?: string }) => void;
}) {
  const { label, id, year, route, date, fare, fareLabel, onChange } = props;
  return (
    <fieldset className="grid gap-4 rounded-lg border border-line p-4 sm:col-span-2 sm:grid-cols-2">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">{label}</legend>
      <div className="sm:col-span-2">
        <label htmlFor={`${id}-route`} className={labelClass}>
          Airport route · IATA codes
        </label>
        <input
          id={`${id}-route`}
          required
          className={`${inputClass} uppercase`}
          maxLength={200}
          autoComplete="off"
          placeholder="DCA-ATL or DCA-ATL-LAX"
          value={route}
          onChange={(e) => onChange({ route: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor={`${id}-date`} className={labelClass}>
          Flight date
        </label>
        <input
          id={`${id}-date`}
          type="date"
          required
          min={props.minDate ?? `${year}-01-01`}
          max={`${year}-12-31`}
          className={inputClass}
          value={date}
          onChange={(e) => onChange({ date: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor={`${id}-fare`} className={labelClass}>
          {fareLabel}
        </label>
        <input
          id={`${id}-fare`}
          type="number"
          min="0"
          step="any"
          className={inputClass}
          value={fare}
          onChange={(e) => onChange({ fare: e.target.value })}
        />
      </div>
    </fieldset>
  );
}
