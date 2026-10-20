'use client';

import { useState } from 'react';
import { credit, type Entry } from '@/lib/engine';
import { MONTH_NAMES, MONTH_SHORT, precise } from '@/lib/format';
import type { CardInfo, TrackerCardInfo } from '@/lib/tracker/types';
import { buttonClass, Hint, Panel, PanelHead, StatePill, Switch } from '@/components/ui';
import * as actions from '../actions';
import { InfoTip } from './help/info-tip';
import { useTracker } from './tracker-context';

export function MonthlySpendSection() {
  const { data, activeEntries, unit } = useTracker();
  const cards = data.trackerCards.map((tc) => ({ tc, card: data.cards.find((c) => c.key === tc.cardKey)! })).filter(({ card }) => card);
  const spend = activeEntries.filter((e) => e.category === 'Credit card spend' && e.state !== 'Cancelled');
  const actual = spend.filter((e) => e.state === 'Posted').reduce((s, e) => s + credit(e), 0);
  const forecast = spend.reduce((s, e) => s + credit(e), 0);

  return (
    <Panel data-help="monthly-spend">
      <PanelHead
        title={
          <>
            Monthly credit-card earnings
            <InfoTip id="monthly-spend" />
          </>
        }
        sub="Plan all twelve months for each card. Save edits together and mark each month credited when its MQDs post."
      />
      <p className="mb-5 rounded-lg border border-line px-4 py-3 text-xs text-muted">
        {data.tracker.statusYear} saved card earnings: {precise(actual)} actual / {precise(forecast)} total forecast {unit}.
      </p>
      {cards.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map(({ tc, card }) => (
            <SpendCard key={card.key} card={card} tc={tc} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted">
          Choose your Delta cards in Settings to plan monthly spend.
        </p>
      )}
      <Hint>
        Monthly entries feed the activity log, progress card, tiers, and chart. Eligible spend excludes returns and ineligible transactions. Enter the
        exact airline-posted credit to reconcile rounding.
      </Hint>
    </Panel>
  );
}

type Draft = { amount: string; exact: string };

function SpendCard({ card, tc }: { card: CardInfo; tc: TrackerCardInfo }) {
  const { data, unit, run, pending } = useTracker();
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const year = data.tracker.statusYear;
  const disabled = !tc.included;
  const monthEntry = (m: number): Entry | undefined =>
    data.entries.find(
      (e) => e.cardKey === card.key && e.category === 'Credit card spend' && e.date.startsWith(`${year}-${String(m).padStart(2, '0')}`),
    );
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const saved = months.map(monthEntry).filter((e): e is Entry => !!e && e.state !== 'Cancelled');
  const actual = saved.filter((e) => e.state === 'Posted').reduce((s, e) => s + credit(e), 0);
  const forecast = saved.reduce((s, e) => s + credit(e), 0);
  const postedCount = saved.filter((e) => e.state === 'Posted').length;
  const dirty = Object.keys(drafts).length;

  const valueFor = (m: number): Draft => {
    if (drafts[m]) return drafts[m];
    const e = monthEntry(m);
    return { amount: e ? String(e.amount) : '0', exact: e?.override == null ? '' : String(e.override) };
  };

  function save(monthsToSave: number[], postedOverride?: { month: number; posted: boolean }) {
    const rows: { month: number; amount: number; override: number | null; posted: boolean }[] = [];
    for (const m of monthsToSave) {
      const v = valueFor(m);
      const amount = Number(v.amount || 0);
      const override = v.exact === '' ? null : Number(v.exact);
      if (!Number.isFinite(amount) || amount < 0 || (override !== null && (!Number.isFinite(override) || override < 0))) {
        return void run(null, async () => {
          throw new Error(`Enter valid nonnegative amounts for ${MONTH_NAMES[m - 1]}.`);
        });
      }
      const posted = postedOverride?.month === m ? postedOverride.posted : monthEntry(m)?.state === 'Posted';
      rows.push({ month: m, amount, override, posted });
    }
    if (!rows.length) return;
    run(
      null,
      async () => {
        await actions.saveMonthlySpend({ cardKey: card.key, months: rows });
        setDrafts((d) => {
          const next = { ...d };
          for (const r of rows) delete next[r.month];
          return next;
        });
      },
      postedOverride ? 'Month credit status saved.' : 'Card monthly earnings saved.',
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(Object.keys(drafts).map(Number));
      }}
      className={`rounded-xl border border-[#e6c4cb] border-t-[3px] p-5 ${disabled ? 'bg-[#f6f7f6]' : 'bg-[linear-gradient(135deg,#fff_12%,#f4f3f2_62%,#edf1f7)]'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[13px] font-semibold leading-snug text-brand">{card.name}</h3>
        <StatePill state={postedCount ? 'Posted' : 'Planned'}>{disabled ? 'Not added' : `${postedCount}/12 credited`}</StatePill>
      </div>
      <p className="mt-1.5 text-xs text-muted">1 MQD per ${card.spendDivisor} in eligible spend</p>
      <div className="mt-3.5">
        <div className="grid grid-cols-[36px_minmax(0,1fr)_minmax(0,1fr)_50px] gap-2 pb-2 text-[10px] font-semibold text-muted">
          <span>{year}</span>
          <span>Spend ($)</span>
          <span>{unit}</span>
          <span className="text-center">Credited</span>
        </div>
        {months.map((m) => {
          const v = valueFor(m);
          const posted = monthEntry(m)?.state === 'Posted';
          const estimate = Number(v.amount || 0) / card.spendDivisor;
          const setDraft = (patch: Partial<Draft>) => setDrafts((d) => ({ ...d, [m]: { ...v, ...patch } }));
          return (
            <div
              key={m}
              className={`grid grid-cols-[36px_minmax(0,1fr)_minmax(0,1fr)_50px] items-center gap-2 border-b border-line/50 py-1 ${posted ? 'bg-white/25' : ''}`}
            >
              <span className={`text-xs font-semibold ${posted ? 'text-accent' : ''}`} title={MONTH_NAMES[m - 1]}>
                {MONTH_SHORT[m - 1]}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={v.amount}
                disabled={disabled}
                onChange={(e) => setDraft({ amount: e.target.value })}
                aria-label={`${card.name} ${MONTH_NAMES[m - 1]} eligible spend in dollars`}
                className="h-8 min-w-0 rounded-md border border-[#cdd7d4] bg-white/95 px-2 text-xs tabular-nums disabled:bg-[#f6f7f6]"
              />
              <input
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={v.exact}
                placeholder={precise(estimate)}
                disabled={disabled}
                onChange={(e) => setDraft({ exact: e.target.value })}
                aria-label={`${card.name} ${MONTH_NAMES[m - 1]} exact ${unit}; estimated ${precise(estimate)}`}
                className="h-8 min-w-0 rounded-md border border-[#cdd7d4] bg-white/95 px-2 text-xs tabular-nums placeholder:text-muted disabled:bg-[#f6f7f6]"
              />
              <span className="flex justify-center">
                <Switch
                  size="sm"
                  hideLabel
                  label={`${card.name} ${MONTH_NAMES[m - 1]} credited to account`}
                  checked={posted}
                  disabled={disabled || pending}
                  onChange={(on) => save([m], { month: m, posted: on })}
                />
              </span>
            </div>
          );
        })}
      </div>
      <div className="mb-2 mt-3 flex flex-wrap justify-between gap-3 text-[11px] text-muted">
        <span>
          Actual <strong className="tabular-nums text-brand">{precise(actual)}</strong>
        </span>
        <span>
          Forecast <strong className="tabular-nums text-brand">{precise(forecast)}</strong> {unit}
        </span>
      </div>
      <Hint>
        {disabled
          ? 'Excluded until you include this card.'
          : 'Blank MQD fields show the estimate. Enter an exact credit to override it; set spend to $0 to clear a month.'}
      </Hint>
      <div className="mt-3 flex items-center gap-3">
        <button type="submit" className={buttonClass.primary} disabled={disabled || !dirty || pending}>
          Save changes
        </button>
        <span className="text-xs text-muted">{dirty ? `${dirty} unsaved month${dirty === 1 ? '' : 's'}` : ''}</span>
      </div>
    </form>
  );
}
