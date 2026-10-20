'use client';

import { useState } from 'react';
import { credit, flightName, totals, type Entry } from '@/lib/engine';
import { fmt, stateLabel } from '@/lib/format';
import { buttonClass, Hint, inlineSelectClass, Panel, PanelHead, Switch } from '@/components/ui';
import * as actions from '../actions';
import { useTracker } from './tracker-context';

const VIEWS = {
  active: { label: 'All active flights', test: (e: Entry) => e.state !== 'Cancelled' },
  potential: { label: 'Potential flights', test: (e: Entry) => e.state === 'Potential' },
  awaiting: { label: 'Awaiting credit', test: (e: Entry) => ['Potential', 'Planned', 'Pending'].includes(e.state) },
  posted: { label: 'Credited to account', test: (e: Entry) => e.state === 'Posted' },
} as const;

export function FlightsSection() {
  const { data, activeEntries, unit, openEntry } = useTracker();
  const [view, setView] = useState<keyof typeof VIEWS>('active');
  const flights = data.entries.filter((e) => e.category === 'Flights');
  const rows = flights.filter(VIEWS[view].test).sort((a, b) => a.date.localeCompare(b.date) || a.description.localeCompare(b.description));
  const t = totals(activeEntries, 'DL', 'Flights');
  const awaiting = flights.filter((e) => VIEWS.awaiting.test(e)).length;

  return (
    <Panel>
      <PanelHead title="Planned flights & account credit" sub="Mark each flight booked when you buy it, and credited when its MQDs hit your account.">
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
        <button className={buttonClass.dark} onClick={() => openEntry(undefined, { category: 'Flights', method: 'fare', title: 'Add flight' })}>
          + Add flight
        </button>
      </PanelHead>

      <p className="mb-4 rounded-lg border border-line bg-[#f9eef1]/50 px-4 py-3 text-xs leading-relaxed">
        Actual <strong className="text-brand">{fmt(t.posted)}</strong> · Forecast <strong className="text-brand">{fmt(t.forecast)}</strong> {unit} ·{' '}
        {awaiting} awaiting credit
      </p>

      <div className="grid gap-x-4 gap-y-2 md:grid-cols-2">
        {rows.length ? (
          rows.map((e) => <FlightCard key={e.id} entry={e} />)
        ) : (
          <div className="col-span-full rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted">
            {flights.length ? 'No flights match this view.' : 'No flights entered yet. Add your planned trips to start tracking their MQDs.'}
          </div>
        )}
      </div>
      <Hint>
        Potential flights stay in the forecast. Booked moves a flight to Projected; Credited moves its MQDs to actual. Use Edit to reconcile the exact
        credit and activity date.
      </Hint>
    </Panel>
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
          onChange={(on) => setState(e.id, on ? 'Planned' : 'Potential', on ? 'Flight booked and moved to projected.' : 'Flight marked potential.')}
        />
        <Switch
          size="sm"
          label="Credited"
          checked={posted}
          disabled={cancelled}
          onChange={(on) => setState(e.id, on ? 'Posted' : 'Planned', on ? 'Flight moved to actual MQDs.' : 'Flight returned to forecast.')}
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
