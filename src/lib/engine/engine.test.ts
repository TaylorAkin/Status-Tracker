import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { KGM_ENTRIES } from './__fixtures__/kgm-backup';
import {
  breakdownTotals,
  chartScalePercent,
  chartSeries,
  credit,
  earningMix,
  flightName,
  flightRouteCodes,
  goalSummary,
  monthsLeft,
  routeMiles,
  tierMarkState,
  tierProgress,
  totals,
  type Airports,
  type Entry,
  type Tier,
} from './index';

// Values the original app displays are rounded with Math.round (its `fmt`).
const fmt = (v: number) => Math.round(v);

const DL_TIERS: Tier[] = [
  { name: 'Silver', threshold: 5000 },
  { name: 'Gold', threshold: 10000 },
  { name: 'Platinum', threshold: 15000 },
  { name: 'Diamond', threshold: 28000 },
];
const AS_TIERS: Tier[] = [
  { name: 'Silver', threshold: 20000 },
  { name: 'Gold', threshold: 40000 },
  { name: 'Platinum', threshold: 80000 },
  { name: 'Titanium', threshold: 135000 },
];
const AS_OF = '2026-10-09';

describe('credit', () => {
  it('uses the override when present, otherwise amount × rate', () => {
    expect(credit({ override: null, amount: 1272.12, rate: 0.1 })).toBeCloseTo(127.212);
    expect(credit({ override: 0, amount: 999, rate: 1 })).toBe(0);
    expect(credit({ override: 2500, amount: 1, rate: 1 })).toBe(2500);
  });
});

describe('parity with the original dashboard (Delta)', () => {
  const s = goalSummary(KGM_ENTRIES, 'DL', 15000, AS_OF, 2027);

  it('matches the summary card', () => {
    expect(fmt(s.totals.posted)).toBe(11224);
    expect(fmt(s.totals.forecast)).toBe(11224);
    expect(s.totals.pending).toBe(0);
    expect(s.totals.planned).toBe(0);
    expect(fmt(s.actualGap)).toBe(3776);
    expect(fmt(s.forecastGap)).toBe(3776);
    expect(s.monthsLeft).toBe(12);
    expect(fmt(s.monthlyPace!)).toBe(315);
    expect(Math.round(s.postedPercent)).toBe(75);
  });

  it('matches the tier ladder', () => {
    const p = tierProgress(DL_TIERS, s.totals.posted, s.totals.forecast);
    expect(p.actual?.name).toBe('Gold');
    expect(p.forecast?.name).toBe('Gold');
    expect(p.next?.name).toBe('Platinum');
    expect(DL_TIERS.map((t) => tierMarkState(t, s.totals.posted, s.totals.forecast))).toEqual(['earned', 'earned', 'none', 'none']);
  });

  it('matches section totals', () => {
    expect(totals(KGM_ENTRIES, 'DL', 'Flights').posted).toBe(387);
    expect(totals(KGM_ENTRIES, 'DL', 'Credit card spend').posted).toBeCloseTo(350.95, 2);
    expect(breakdownTotals(KGM_ENTRIES, 'DL', 'Hotels & Rental Car').posted).toBe(486);
    expect(breakdownTotals(KGM_ENTRIES, 'DL', 'Qualifying bonuses').posted).toBe(10000);
  });

  it('builds a cumulative chart series', () => {
    const series = chartSeries(KGM_ENTRIES, 'DL');
    expect(series).toHaveLength(13);
    expect(series[0]).toEqual({ actual: 0, forecast: 0 });
    expect(fmt(series[1].actual)).toBe(387 + 299 + 351);
    expect(fmt(series[12].actual)).toBe(11224);
    expect(chartScalePercent(series, 15000)).toBe(100);
  });

  it('splits the remaining gap in the earning mix', () => {
    const m = earningMix({ entries: KGM_ENTRIES, program: 'DL', target: 15000, flightShare: 50, cardDivisor: 10 });
    expect(m.extraFlights).toBeCloseTo(1888.02, 2);
    expect(m.extraCards).toBeCloseTo(1888.02, 2);
    expect(m.cardSpend).toBeCloseTo(18880.24, 1);
    expect(fmt(m.flights + m.cards + m.bonuses)).toBe(15000);
  });
});

describe('parity with the original dashboard (Alaska, engine is program-agnostic)', () => {
  const s = goalSummary(KGM_ENTRIES, 'AS', 135000, AS_OF, 2027);

  it('matches the summary card', () => {
    expect(fmt(s.totals.posted)).toBe(25873);
    expect(fmt(s.totals.planned + s.totals.potential)).toBe(48618);
    expect(fmt(s.totals.forecast)).toBe(74491);
    expect(fmt(s.actualGap)).toBe(109127);
    expect(fmt(s.forecastGap)).toBe(60509);
    expect(fmt(s.monthlyPace!)).toBe(9094);
    expect(Math.round(s.forecastPercent)).toBe(55);
  });

  it('matches flight totals and tiers', () => {
    const f = totals(KGM_ENTRIES, 'AS', 'Flights');
    expect(f.posted).toBe(11777);
    expect(f.forecast).toBe(25395);
    const p = tierProgress(AS_TIERS, s.totals.posted, s.totals.forecast);
    expect([p.actual?.name, p.forecast?.name, p.next?.name]).toEqual(['Silver', 'Gold', 'Gold']);
    expect(fmt(p.next!.threshold - s.totals.posted)).toBe(14127);
  });
});

describe('cancelled entries', () => {
  it('are excluded from every total and the chart', () => {
    const cancelled: Entry = { ...KGM_ENTRIES[0], id: 'x', state: 'Cancelled', amount: 99999 };
    const entries = [...KGM_ENTRIES, cancelled];
    expect(totals(entries, 'DL')).toEqual(totals(KGM_ENTRIES, 'DL'));
    expect(chartSeries(entries, 'DL')).toEqual(chartSeries(KGM_ENTRIES, 'DL'));
  });
});

describe('totals by state', () => {
  it('reports Planned and Potential separately; forecast sums all four', () => {
    const base = { ...KGM_ENTRIES[0], program: 'DL' as const, category: 'Flights' as const, override: null, rate: 1 };
    const entries: Entry[] = [
      { ...base, id: 'a', state: 'Posted', amount: 100 },
      { ...base, id: 'b', state: 'Pending', amount: 20 },
      { ...base, id: 'c', state: 'Planned', amount: 3 },
      { ...base, id: 'd', state: 'Potential', amount: 4000 },
    ];
    expect(totals(entries, 'DL')).toEqual({ posted: 100, pending: 20, planned: 3, potential: 4000, forecast: 4123 });
  });
});

describe('monthsLeft', () => {
  it('counts the current month as remaining', () => {
    expect(monthsLeft('2026-12-31', 2027)).toBe(12);
    expect(monthsLeft('2027-01-15', 2027)).toBe(12);
    expect(monthsLeft('2027-10-17', 2027)).toBe(3);
    expect(monthsLeft('2027-12-01', 2027)).toBe(1);
    expect(monthsLeft('2028-01-01', 2027)).toBe(0);
  });
});

describe('routes', () => {
  const airports: Airports = JSON.parse(readFileSync(join(process.cwd(), 'public/data/airports.json'), 'utf8'));

  it.each([
    ['STL-SEA', 1705],
    ['SEA-DCA', 2323],
    ['DCA-LAX', 2306],
    ['LAX-LHR', 5443],
    ['LHR-IAD', 3667],
    ['DCA-SAN-SJD', 3074],
    ['PHX-SAN-LAS', 563],
    ['SEA-HNL', 2677],
  ])('%s is %i great-circle miles, as in the original', (route, miles) => {
    expect(routeMiles(airports, route).miles).toBe(miles);
  });

  it('doubles round trips and accepts mixed separators', () => {
    expect(routeMiles(airports, 'stl → sea', true).miles).toBe(3410);
  });

  it('rejects bad input', () => {
    expect(() => routeMiles(airports, 'DCA')).toThrow(/2–20/);
    expect(() => routeMiles(airports, 'DCA-ZZZ')).toThrow(/Unknown airport code: ZZZ/);
    expect(() => routeMiles(airports, 'DCA-DCA')).toThrow(/different/);
  });

  it('reads codes from the route or the description', () => {
    expect(flightRouteCodes({ route: 'dca-san-sjd', description: '' })).toEqual(['DCA', 'SAN', 'SJD']);
    expect(flightRouteCodes({ route: '', description: 'DCA → SEA trip' })).toEqual(['DCA', 'SEA']);
    expect(flightName({ route: '', description: 'Annual bonus' })).toBe('Annual bonus');
    expect(flightName({ route: 'ATL-DCA', description: 'x' })).toBe('ATL → DCA');
  });
});
