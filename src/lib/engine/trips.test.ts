import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { groupTrips, reverseRoute, splitFare, totals, tripLegs, type Airports, type Entry } from './index';

const airports: Airports = JSON.parse(readFileSync(join(process.cwd(), 'public/data/airports.json'), 'utf8'));

const leg = (id: string, patch: Partial<Entry>): Entry => ({
  id,
  program: 'DL',
  category: 'Flights',
  state: 'Planned',
  date: '2027-03-01',
  description: 'Trip',
  method: 'fare',
  amount: 100,
  rate: 1,
  override: null,
  notes: '',
  ...patch,
});

describe('trips', () => {
  it('splits a fare by distance and the shares add up exactly', () => {
    expect(splitFare([100, 300], 400)).toEqual([100, 300]);
    const shares = splitFare([547, 1946, 333], 999.99);
    expect(shares.reduce((a, b) => a + b, 0)).toBeCloseTo(999.99, 10);
    expect(shares.every((s) => Math.round(s * 100) === s * 100)).toBe(true);
    expect(splitFare([500], 250)).toEqual([250]);
  });

  it('reverses a route', () => {
    expect(reverseRoute('dca-atl → lax')).toBe('LAX-ATL-DCA');
  });

  it('builds one leg per airport pair, with each ticket priced separately', () => {
    const legs = tripLegs(airports, [
      { route: 'DCA-ATL-LAX', date: '2027-03-01', fare: 600 },
      { route: 'LAX-DCA', date: '2027-03-08', fare: 350 },
    ]);
    expect(legs.map((l) => [l.from, l.to, l.ticket, l.leg, l.date])).toEqual([
      ['DCA', 'ATL', 0, 0, '2027-03-01'],
      ['ATL', 'LAX', 0, 1, '2027-03-01'],
      ['LAX', 'DCA', 1, 0, '2027-03-08'],
    ]);
    expect(legs[0].fare + legs[1].fare).toBeCloseTo(600, 10);
    expect(legs[0].fare).toBeLessThan(legs[1].fare); // DCA-ATL is shorter than ATL-LAX
    expect(legs[2].fare).toBe(350);
    expect(() => tripLegs(airports, [{ route: 'DCA-ZZZ', date: '2027-03-01', fare: 1 }])).toThrow(/ZZZ/);
  });

  it('groups trip legs in flight order and leaves other flights standalone', () => {
    const groups = groupTrips([
      leg('a', { tripId: 't', ticket: 1, leg: 0 }),
      leg('b', {}),
      leg('c', { tripId: 't', ticket: 0, leg: 1 }),
      leg('d', { tripId: 't', ticket: 0, leg: 0 }),
    ]);
    expect(groups.map((g) => g.legs.map((l) => l.id))).toEqual([['d', 'c', 'a'], ['b']]);
  });

  it('drops a cancelled leg from the trip total', () => {
    const legs = [leg('a', { tripId: 't', amount: 200 }), leg('b', { tripId: 't', amount: 300, state: 'Cancelled' })];
    expect(totals(legs, 'DL').forecast).toBe(200);
  });
});
