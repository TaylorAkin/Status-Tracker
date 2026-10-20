'use client';

import { useState } from 'react';
import { credit, type EntryState } from '@/lib/engine';
import { fmt, stateLabel } from '@/lib/format';
import { buttonClass, inlineSelectClass, Panel, PanelHead, StatePill } from '@/components/ui';
import * as actions from '../actions';
import { InfoTip } from './help/info-tip';
import { useTracker } from './tracker-context';

export function Ledger() {
  const { data, run, openEntry } = useTracker();
  const [state, setState] = useState<EntryState | ''>('');
  const rows = data.entries.filter((e) => !state || e.state === state).sort((a, b) => a.date.localeCompare(b.date));
  const inactiveCards = new Set(data.trackerCards.filter((c) => !c.included).map((c) => c.cardKey));

  return (
    <Panel data-help="ledger">
      <PanelHead
        title={
          <>
            Earning activity
            <InfoTip id="ledger.states" />
          </>
        }
        sub="Every flight, monthly card spend, and qualifying bonus in one log."
      >
        <select
          value={state}
          onChange={(e) => setState(e.target.value as EntryState | '')}
          aria-label="Filter by state"
          className={inlineSelectClass}
        >
          <option value="">All states</option>
          {(['Planned', 'Potential', 'Pending', 'Posted'] as const).map((s) => (
            <option key={s} value={s}>
              {stateLabel(s)}
            </option>
          ))}
        </select>
        <button className={buttonClass.dark} onClick={() => openEntry()}>
          + Add earning
        </button>
      </PanelHead>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
              {['Date', 'Activity', 'Category', 'State', 'MQDs', ''].map((h) => (
                <th key={h} className="px-2 py-3 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((e) => (
                <tr key={e.id} className="border-b border-line bg-white/50 hover:bg-[#f1f5f4]">
                  <td className="whitespace-nowrap px-2 py-3.5 align-top">{e.date.slice(5)}</td>
                  <td className="min-w-[200px] px-2 py-3.5">
                    {e.description}
                    {e.notes && <div className="mt-1 text-xs leading-relaxed text-muted">{e.notes}</div>}
                  </td>
                  <td className="whitespace-nowrap px-2 py-3.5">{e.category}</td>
                  <td className="px-2 py-3.5">
                    <StatePill state={e.cardKey && inactiveCards.has(e.cardKey) ? 'Cancelled' : e.state}>
                      {e.cardKey && inactiveCards.has(e.cardKey) ? 'Card excluded' : undefined}
                    </StatePill>
                  </td>
                  <td className="whitespace-nowrap px-2 py-3.5 tabular-nums">
                    {fmt(credit(e))}
                    {e.override === null && (
                      <small className="ml-1 text-muted" title="Calculated estimate">
                        ≈
                      </small>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2 py-3.5 text-right">
                    <button className="rounded-md border border-line px-2 py-1 text-xs hover:bg-[#edf3f0]" onClick={() => openEntry(e.id)}>
                      Edit
                    </button>{' '}
                    <button
                      className="rounded-md border border-line px-2 py-1 text-xs hover:bg-[#edf3f0]"
                      aria-label={`Delete ${e.description}`}
                      onClick={() => {
                        if (confirm('Delete this earning entry?'))
                          run({ type: 'delete', id: e.id }, () => actions.deleteEntry(e.id), 'Entry deleted.');
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  <strong className="text-foreground">No earning entries yet.</strong>
                  <br />
                  Add planned flights, card spend, and Headstarts. Your forecast will take shape here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <a href="/dashboard/export" className={buttonClass.secondary} download>
          Export backup
        </a>
      </div>
    </Panel>
  );
}
