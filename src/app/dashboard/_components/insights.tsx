'use client';

import { useState } from 'react';
import { earningMix } from '@/lib/engine';
import { fmt } from '@/lib/format';
import { labelClass, Panel, PanelHead, selectClass } from '@/components/ui';
import { InfoTip } from './help/info-tip';
import { useTracker } from './tracker-context';

const SEGMENT_COLORS = { flights: '#426f94', cards: '#b5122b', bonuses: '#a3adb5' };

export function EarningMix() {
  const { data, activeEntries, unit } = useTracker();
  const [flightShare, setFlightShare] = useState(50);
  const [cardDivisor, setCardDivisor] = useState(10);
  const m = earningMix({ entries: activeEntries, program: 'DL', target: data.tracker.target, flightShare, cardDivisor });
  const total = m.flights + m.cards + m.bonuses;
  const segments = [
    ['Flights', m.flights, SEGMENT_COLORS.flights],
    ['Card spend', m.cards, SEGMENT_COLORS.cards],
    ['Bonuses & Headstarts', m.bonuses, SEGMENT_COLORS.bonuses],
  ] as const;

  return (
    <Panel data-help="mix">
      <PanelHead
        title={
          <>
            How to close the gap
            <InfoTip id="mix" />
          </>
        }
        sub="Split what your forecast leaves between flights and card spend. Nothing here is saved."
      />
      <div className="grid items-start gap-6">
        <div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                ['Forecast', m.base.forecast],
                ['Posted', m.base.posted],
                ['Remaining', m.gap],
                ['Goal', m.target],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <small className="block text-[11px] text-muted">{label}</small>
                <strong className="mt-0.5 block font-mono text-lg tabular-nums">{fmt(value)}</strong>
              </div>
            ))}
          </div>
          <p className="mb-3 mt-2 text-[10px] text-muted">{unit} · Forecast includes posted earnings</p>
          <div
            className="flex h-[13px] overflow-hidden rounded-lg bg-[#e8eeeb]"
            role="img"
            aria-label={segments.map(([l, v]) => `${l} ${fmt(v)} ${unit}`).join(', ')}
          >
            {segments.map(([label, value, color]) => (
              <span
                key={label}
                style={{ width: `${total ? (value / total) * 100 : 0}%`, background: color }}
                title={`${label}: ${fmt(value)} ${unit}`}
              />
            ))}
          </div>
          <div className="mb-5 mt-3 grid grid-cols-3 gap-2.5">
            {segments.map(([label, value, color]) => (
              <div key={label}>
                <small className="block text-[10px] leading-snug text-muted">
                  <i className="mr-1 inline-block size-[7px] rounded-full" style={{ background: color }} />
                  {label}
                </small>
                <strong className="my-1 block font-mono text-[19px] tabular-nums">{fmt(value)}</strong>
              </div>
            ))}
          </div>
          {m.gap === 0 ? (
            <p className="text-[13px] text-[#0a6e56]">Your existing forecast already reaches the goal.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3.5 rounded-lg bg-[#f6f7f6] p-3.5 text-[11px] text-muted">
              <div>
                Additional flight earnings
                <strong className="my-1 block text-sm text-foreground">
                  <span className="font-mono">{fmt(m.extraFlights)}</span> {unit}
                </strong>
                ≈ ${fmt(m.extraFlights)} in eligible Delta fares
              </div>
              <div>
                Additional card earnings
                <strong className="my-1 block text-sm text-foreground">
                  <span className="font-mono">{fmt(m.extraCards)}</span> {unit}
                </strong>
                <span className="font-mono">${fmt(m.cardSpend)}</span> eligible spend
              </div>
            </div>
          )}
        </div>
        <div>
          <label htmlFor="mix-slider" className={labelClass}>
            Flight share of the remaining gap
          </label>
          <input
            id="mix-slider"
            type="range"
            min={0}
            max={100}
            value={flightShare}
            disabled={m.gap === 0}
            onChange={(e) => setFlightShare(Number(e.target.value))}
            aria-valuetext={`${flightShare}% flights, ${100 - flightShare}% card spend`}
            className="h-6 w-full cursor-pointer accent-accent"
          />
          <p className="mb-4 mt-1 text-xs text-muted">
            Flights <span className="font-mono">{flightShare}%</span> · Card spend <span className="font-mono">{100 - flightShare}%</span>
          </p>
          <label htmlFor="mix-card" className={labelClass}>
            Card rate for additional spend
          </label>
          <select id="mix-card" value={cardDivisor} onChange={(e) => setCardDivisor(Number(e.target.value))} className={selectClass}>
            <option value={10}>Delta Reserve cards · 1 MQD / $10</option>
            <option value={20}>Delta Platinum cards · 1 MQD / $20</option>
          </select>
        </div>
      </div>
    </Panel>
  );
}
