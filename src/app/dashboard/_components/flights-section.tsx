'use client';

import { useState, useSyncExternalStore } from 'react';
import { credit, flightName, flightRouteCodes, groupTrips, totals, type Entry } from '@/lib/engine';
import { fmt, stateLabel } from '@/lib/format';
import { buttonClass, EmptyState, Hint, inlineSelectClass, Panel, PanelHead, Switch } from '@/components/ui';
import * as actions from '../actions';
import { InfoTip } from './help/info-tip';
import { useTracker } from './tracker-context';

const VIEWS = {
  active: { label: 'All active flights', test: (e: Entry) => e.state !== 'Cancelled' },
  potential: { label: 'Potential flights', test: (e: Entry) => e.state === 'Potential' },
  awaiting: { label: 'Awaiting credit', test: (e: Entry) => ['Potential', 'Planned', 'Pending'].includes(e.state) },
  posted: { label: 'Credited to account', test: (e: Entry) => e.state === 'Posted' },
} as const;

type Layout = 'trip' | 'leg';
const LAYOUT_KEY = 'flights-layout';

/** The By trip / By leg choice, remembered per browser. The server render and blocked storage fall back to By trip. */
const layoutStore = {
  listeners: new Set<() => void>(),
  subscribe(listener: () => void) {
    layoutStore.listeners.add(listener);
    return () => layoutStore.listeners.delete(listener);
  },
  get(): Layout {
    try {
      return localStorage.getItem(LAYOUT_KEY) === 'leg' ? 'leg' : 'trip';
    } catch {
      return 'trip';
    }
  },
  set(layout: Layout) {
    try {
      localStorage.setItem(LAYOUT_KEY, layout);
    } catch {}
    layoutStore.listeners.forEach((l) => l());
  },
};

export function FlightsSection() {
  const { data, activeEntries, unit, setTripOpen } = useTracker();
  const [view, setView] = useState<keyof typeof VIEWS>('active');
  const layout = useSyncExternalStore(layoutStore.subscribe, layoutStore.get, () => 'trip' as const);
  const flights = data.entries.filter((e) => e.category === 'Flights');
  const rows = flights.filter(VIEWS[view].test).sort((a, b) => a.date.localeCompare(b.date) || a.description.localeCompare(b.description));
  const t = totals(activeEntries, 'DL', 'Flights');
  const awaiting = flights.filter((e) => VIEWS.awaiting.test(e)).length;

  return (
    <Panel data-help="flights">
      <PanelHead
        title={
          <>
            Planned flights &amp; account credit
            <InfoTip id="flights.states" />
          </>
        }
        sub="Mark each flight booked when you buy it, and credited when its MQDs hit your account."
      >
        <label className="flex items-center gap-2 text-xs font-semibold">
          Show flights
          <select value={view} onChange={(e) => setView(e.target.value as keyof typeof VIEWS)} className={`${inlineSelectClass} font-normal`}>
            {Object.entries(VIEWS).map(([key, v]) => (
              <option key={key} value={key}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <div role="group" aria-label="Group flights" className="inline-flex rounded-lg border border-line p-0.5 text-xs">
          {(['trip', 'leg'] as const).map((l) => (
            <button
              key={l}
              aria-pressed={layout === l}
              onClick={() => layoutStore.set(l)}
              className={`rounded-md px-2.5 py-1.5 ${layout === l ? 'bg-foreground text-white' : 'hover:bg-[#edf3f0]'}`}
            >
              {l === 'trip' ? 'By trip' : 'By leg'}
            </button>
          ))}
        </div>
        <button className={buttonClass.dark} onClick={() => setTripOpen(true)}>
          + Add flight
        </button>
      </PanelHead>

      <p className="mb-4 rounded-lg border border-line bg-[#f9eef1]/50 px-4 py-3 text-xs leading-relaxed">
        Posted <strong className="text-brand">{fmt(t.posted)}</strong> · Forecast <strong className="text-brand">{fmt(t.forecast)}</strong> {unit} ·{' '}
        {awaiting} awaiting credit
      </p>

      <div className="grid gap-x-4 gap-y-2 md:grid-cols-2">
        {rows.length ? (
          layout === 'leg' ? (
            rows.map((e) => <FlightCard key={e.id} entry={e} />)
          ) : (
            groupTrips(rows).map((g) =>
              g.tripId ? <TripCard key={g.tripId} tripId={g.tripId} legs={g.legs} /> : <FlightCard key={g.legs[0].id} entry={g.legs[0]} />,
            )
          )
        ) : (
          <EmptyState className="col-span-full">
            {flights.length ? 'No flights match this view.' : 'No flights entered yet. Add your planned trips to start tracking their MQDs.'}
          </EmptyState>
        )}
      </div>
      <Hint>
        Potential flights stay in the forecast. Booked moves a flight to Planned; Credited moves its MQDs to Posted. Use Edit to reconcile the exact
        credit and activity date.
      </Hint>
    </Panel>
  );
}

/** "DCA → ATL → LAX → DCA", breaking with " · " where one leg doesn't start where the last one landed. */
function tripPath(legs: Entry[]): string {
  const parts: string[][] = [];
  for (const e of legs) {
    const codes = flightRouteCodes(e);
    if (codes.length < 2) continue;
    const last = parts.at(-1);
    if (last && last.at(-1) === codes[0]) last.push(...codes.slice(1));
    else parts.push([...codes]);
  }
  return parts.map((p) => p.join(' → ')).join(' · ');
}

function TripCard({ tripId, legs }: { tripId: string; legs: Entry[] }) {
  const { unit, run } = useTracker();
  const [open, setOpen] = useState(false);
  const path = tripPath(legs);
  const name = legs[0].description;
  const dates = [...new Set(legs.map((e) => e.date))].sort();
  const states = [...new Set(legs.map((e) => stateLabel(e.state)))];
  const total = legs.reduce((sum, e) => sum + credit(e), 0);
  const estimated = legs.some((e) => e.override === null);

  return (
    <div className={open ? 'col-span-full' : ''}>
      <article className="flex flex-wrap items-center gap-3 rounded-lg border border-[#e6c4cb] border-l-[3px] border-l-brand bg-[linear-gradient(135deg,#fff_12%,#f4f3f2_62%,#edf1f7)] px-3.5 py-2.5 sm:flex-nowrap">
        <button
          className="min-w-0 flex-1 basis-[calc(100%-90px)] text-left sm:basis-auto"
          aria-expanded={open}
          aria-label={`${open ? 'Hide' : 'Show'} legs of ${name}`}
          onClick={() => setOpen(!open)}
        >
          <strong className="block text-[17px] leading-snug">
            <span aria-hidden className={`mr-1.5 inline-block text-xs text-muted transition ${open ? 'rotate-90' : ''}`}>
              ▶
            </span>
            {path || name}
          </strong>
          {path && name !== path && <p className="mt-0.5 text-[13px] leading-snug text-brand">{name}</p>}
          <p className="mt-0.5 text-[11px] text-muted">
            {dates.length > 1 ? `${dates[0]} – ${dates.at(-1)}` : dates[0]} · {legs.length} {legs.length === 1 ? 'leg' : 'legs'} ·{' '}
            {states.join(' / ')}
          </p>
        </button>
        <div className="shrink-0 text-right">
          <strong className="block text-[15px] text-brand">{fmt(total)}</strong>
          <small className="block text-[10px] text-muted">
            {unit}
            {estimated ? ' · est.' : ''}
          </small>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-1.5">
          <button className={buttonClass.link} onClick={() => setOpen(!open)}>
            {open ? 'Hide legs' : 'Show legs'}
          </button>
          <button
            className="text-xs text-muted underline hover:text-accent"
            aria-label={`Delete trip ${name}`}
            onClick={() => {
              if (confirm(`Delete all ${legs.length} legs of ${name}? This cannot be undone.`))
                run({ type: 'deleteTrip', tripId }, () => actions.deleteTrip(tripId), 'Trip deleted.');
            }}
          >
            Delete trip
          </button>
        </div>
      </article>
      {open && (
        <div className="mt-2 grid gap-x-4 gap-y-2 border-l-2 border-line pl-3 md:grid-cols-2">
          {legs.map((e) => (
            <FlightCard key={e.id} entry={e} />
          ))}
        </div>
      )}
    </div>
  );
}

function FlightCard({ entry: e }: { entry: Entry }) {
  const { unit, setState, openEntry, run } = useTracker();
  const name = flightName(e);
  const booked = ['Planned', 'Pending', 'Posted'].includes(e.state);
  const posted = e.state === 'Posted';
  const cancelled = e.state === 'Cancelled';

  return (
    <article className="flex flex-wrap items-center gap-3 rounded-lg border border-[#e6c4cb] border-l-[3px] border-l-accent bg-[linear-gradient(135deg,#fff_12%,#f4f3f2_62%,#edf1f7)] px-3.5 py-2.5 sm:flex-nowrap">
      <div className="min-w-0 flex-1 basis-[calc(100%-90px)] sm:basis-auto">
        <strong className="block text-[17px] leading-snug">{name}</strong>
        {e.description && e.description !== name && <p className="mt-0.5 text-[13px] leading-snug text-brand">{e.description}</p>}
        <p className="mt-0.5 text-[11px] text-muted">
          {e.date}
          {e.roundtrip ? ' · Round trip' : ''} · {stateLabel(e.state)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <strong className="block text-[15px] text-brand">{fmt(credit(e))}</strong>
        <small className="block text-[10px] text-muted">
          {unit}
          {e.override === null ? ' · est.' : ''}
        </small>
      </div>
      <div className="flex shrink-0 flex-col gap-1.5">
        <Switch
          size="sm"
          label="Booked"
          checked={booked}
          disabled={posted || cancelled}
          onChange={(on) => setState(e.id, on ? 'Planned' : 'Potential', on ? 'Flight booked and moved to Planned.' : 'Flight moved to Potential.')}
        />
        <Switch
          size="sm"
          label="Credited"
          checked={posted}
          disabled={cancelled}
          onChange={(on) => setState(e.id, on ? 'Posted' : 'Planned', on ? 'Flight moved to Posted.' : 'Flight returned to forecast.')}
        />
      </div>
      <div className="flex shrink-0 flex-col items-start gap-1.5">
        <button className={buttonClass.link} onClick={() => openEntry(e.id)} aria-label={`Edit ${name}`}>
          Edit
        </button>
        <button
          className="text-xs text-muted underline hover:text-accent"
          aria-label={`Delete ${name}`}
          onClick={() => {
            if (confirm(`Delete ${name}? This cannot be undone.`))
              run({ type: 'delete', id: e.id }, () => actions.deleteEntry(e.id), 'Flight deleted.');
          }}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
