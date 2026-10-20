'use client';

import { useState } from 'react';
import { fmt, shortCardName } from '@/lib/format';
import type { CardHolding } from '@/lib/tracker/types';
import { ModalDialog } from '@/components/modal-dialog';
import { buttonClass, Hint, inputClass, labelClass, selectClass } from '@/components/ui';
import * as actions from '../actions';
import { InfoTip } from './help/info-tip';
import { useTracker } from './tracker-context';

const HOLDING_LABELS: Record<CardHolding, string> = { held: 'I have it', potential: 'Considering', none: "Don't have" };

export function SettingsDialog() {
  const { settingsOpen, setSettingsOpen } = useTracker();
  return (
    <ModalDialog open={settingsOpen} onClose={() => setSettingsOpen(false)}>
      <SettingsForm />
    </ModalDialog>
  );
}

function SettingsForm() {
  const { data, unit, setSettingsOpen, run } = useTracker();
  const [target, setTarget] = useState(String(data.tracker.target));
  const [asOf, setAsOf] = useState(data.tracker.asOf);
  const holdingOf = (key: string): CardHolding => {
    const tc = data.trackerCards.find((c) => c.cardKey === key);
    return tc ? (tc.potential ? 'potential' : 'held') : 'none';
  };
  const [holdings, setHoldings] = useState<Record<string, CardHolding>>(() => Object.fromEntries(data.cards.map((c) => [c.key, holdingOf(c.key)])));

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const t = Number(target);
    if (!Number.isInteger(t) || t < 1) return;
    const changed = data.cards.filter((c) => holdings[c.key] !== holdingOf(c.key));
    const removing = changed.filter((c) => holdings[c.key] === 'none' && data.entries.some((e) => e.cardKey === c.key));
    if (
      removing.length &&
      !confirm(`Removing ${removing.map((c) => shortCardName(c.name)).join(', ')} deletes its Headstart and monthly spend entries. Continue?`)
    )
      return;

    run(
      { type: 'settings', target: t, asOf },
      async () => {
        await actions.updateSettings({ target: t, asOf });
        if (changed.length) await actions.setCardHoldings(changed.map((c) => ({ cardKey: c.key, holding: holdings[c.key] })));
      },
      'Settings saved.',
    );
    setSettingsOpen(false);
  }

  return (
    <form onSubmit={submit}>
      <h2 className="text-xl font-semibold">Goal, cards & planning date</h2>
      <p className="mt-1 text-sm text-muted">Targets stay editable as Delta confirms future rules.</p>

      <div className="mt-5 grid items-end gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="s-tier" className={labelClass}>
            Goal tier
          </label>
          <select
            id="s-tier"
            className={selectClass}
            value={data.tiers.some((t) => String(t.threshold) === target) ? target : 'custom'}
            onChange={(e) => e.target.value !== 'custom' && setTarget(e.target.value)}
          >
            {data.tiers.map((t) => (
              <option key={t.name} value={t.threshold}>
                {t.name} · {fmt(t.threshold)} {unit}
              </option>
            ))}
            <option value="custom">Custom target</option>
          </select>
        </div>
        <div>
          <label htmlFor="s-target" className={labelClass}>
            Target {unit}
          </label>
          <input
            id="s-target"
            type="number"
            min="1"
            step="1"
            required
            className={inputClass}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <div className="mb-1.5 flex h-4 items-center">
            <label htmlFor="s-asof" className="text-xs font-semibold">
              As-of date for remaining monthly pace
            </label>
            <InfoTip id="settings.asof" />
          </div>
          <input id="s-asof" type="date" required className={inputClass} value={asOf} onChange={(e) => setAsOf(e.target.value)} />
        </div>
      </div>

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold">
          Your Delta cards
          <InfoTip id="settings.cards" />
        </legend>
        <Hint className="mt-1">
          Cards you have add their MQD Headstart and a monthly spend planner. Cards you&apos;re considering stay out of your totals until you include
          them.
        </Hint>
        <div className="mt-3 divide-y divide-line rounded-lg border border-line">
          {data.cards.map((c) => (
            <div key={c.key} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium">{shortCardName(c.name)}</p>
                <p className="text-[11px] text-muted">
                  1 {unit.replace(/s$/, '')} / ${c.spendDivisor}
                  {c.headstartAmount ? ` · ${fmt(c.headstartAmount)} ${unit} Headstart` : ''}
                </p>
              </div>
              <div
                role="radiogroup"
                aria-label={shortCardName(c.name)}
                className="flex divide-x divide-line overflow-hidden rounded-md border border-line text-xs"
              >
                {(Object.keys(HOLDING_LABELS) as CardHolding[]).map((h) => (
                  <label
                    key={h}
                    className={`cursor-pointer px-3 py-2 transition-colors ${holdings[c.key] === h ? 'bg-brand font-medium text-white' : 'bg-white text-foreground hover:bg-[#edf3f0]'}`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      name={`card-${c.key}`}
                      checked={holdings[c.key] === h}
                      onChange={() => setHoldings((s) => ({ ...s, [c.key]: h }))}
                    />
                    {HOLDING_LABELS[h]}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <Hint className="mt-4">
        {data.tracker.statusYear} earnings start at zero. Prior-year MQDs and redeemable miles are not an opening status balance.
      </Hint>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className={buttonClass.secondary} onClick={() => setSettingsOpen(false)}>
          Cancel
        </button>
        <button className={buttonClass.dark}>Save settings</button>
      </div>
    </form>
  );
}
