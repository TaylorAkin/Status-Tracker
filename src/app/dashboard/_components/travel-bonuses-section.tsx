'use client';

import { credit } from '@/lib/engine';
import { fmt } from '@/lib/format';
import { RENTAL_METHOD, STAYS_METHOD } from '@/lib/tracker/methods';
import { buttonClass, Hint, Panel, PanelHead, StatePill, Switch } from '@/components/ui';
import { useTracker } from './tracker-context';

const TYPES = [
  { method: STAYS_METHOD, title: 'Delta Stays', add: 'stay', description: 'Delta Stays bonus MQDs' },
  { method: RENTAL_METHOD, title: 'Rental cars', add: 'rental', description: 'Rental car bonus MQDs' },
];

export function TravelBonusesSection() {
  const { data, unit, setState, openEntry } = useTracker();
  return (
    <Panel>
      <PanelHead title="Delta Stays & rental car bonus MQDs" sub="Track qualifying promotional MQDs from completed or planned stays and rentals." />
      <div className="grid gap-4 md:grid-cols-2">
        {TYPES.map((type) => {
          const rows = data.entries
            .filter((e) => e.category === 'Qualifying bonuses' && e.method === type.method)
            .sort((a, b) => a.date.localeCompare(b.date));
          const active = rows.filter((e) => e.state !== 'Cancelled');
          const posted = active.filter((e) => e.state === 'Posted').reduce((s, e) => s + credit(e), 0);
          const forecast = active.reduce((s, e) => s + credit(e), 0);
          return (
            <div
              key={type.method}
              className="rounded-xl border border-[#e6c4cb] border-t-[3px] bg-[linear-gradient(135deg,#fff_12%,#f4f3f2_62%,#edf1f7)] p-5"
            >
              <h3 className="text-sm font-semibold text-brand">{type.title}</h3>
              <div className="my-4 grid grid-cols-2 gap-3">
                <div>
                  <small className="text-[11px] text-muted">Actual {unit}</small>
                  <strong className="mt-1 block text-2xl text-brand">{fmt(posted)}</strong>
                </div>
                <div>
                  <small className="text-[11px] text-muted">Total forecast {unit}</small>
                  <strong className="mt-1 block text-2xl text-brand">{fmt(forecast)}</strong>
                </div>
              </div>
              <button
                className={buttonClass.primary}
                onClick={() =>
                  openEntry(undefined, {
                    category: 'Qualifying bonuses',
                    method: type.method,
                    description: type.description,
                    title: `Add ${type.title} bonus MQDs`,
                  })
                }
              >
                + Add {type.add}
              </button>
              {rows.length ? (
                rows.map((e) => (
                  <div key={e.id} className="mt-4 border-t border-[#dce0e3] pt-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <strong className="text-[13px]">{e.description}</strong>
                      <StatePill state={e.state} />
                    </div>
                    <Hint className="mt-1">
                      {e.date} · {fmt(credit(e))} {unit}
                    </Hint>
                    <div className="my-3">
                      <Switch
                        size="sm"
                        label="Credited to account"
                        checked={e.state === 'Posted'}
                        disabled={e.state === 'Cancelled'}
                        onChange={(on) => setState(e.id, on ? 'Posted' : 'Planned')}
                      />
                    </div>
                    <button className={buttonClass.link} onClick={() => openEntry(e.id)}>
                      Edit earning / details
                    </button>
                  </div>
                ))
              ) : (
                <Hint className="mt-4">No bonus MQDs entered yet.</Hint>
              )}
            </div>
          );
        })}
      </div>
      <Hint>
        Enter the bonus MQDs from your offer or account. Use the qualifying activity date, keep expected earnings projected, and mark them credited
        when they post.
      </Hint>
    </Panel>
  );
}
