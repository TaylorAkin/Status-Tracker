import { describe, expect, it } from 'vitest';
import type { Entry } from '@/lib/engine';
import { attentionItems, setupSteps } from './attention';
import type { TrackerCardInfo } from './types';

const base: Entry = {
  id: '',
  program: 'DL',
  category: 'Flights',
  state: 'Planned',
  date: '2027-01-01',
  description: '',
  method: 'fare',
  amount: 100,
  rate: 1,
  override: null,
  notes: '',
};
const entry = (id: string, patch: Partial<Entry>): Entry => ({ ...base, id, description: id, ...patch });
const spend = (cardKey: string, month: number, state: Entry['state'] = 'Planned') =>
  entry(`${cardKey}-${month}`, {
    category: 'Credit card spend',
    method: `card:${cardKey}`,
    cardKey,
    state,
    date: `2027-${String(month).padStart(2, '0')}-28`,
  });
const held: TrackerCardInfo = { cardKey: 'R', potential: false, included: true };

describe('attentionItems', () => {
  it('lists past flights that have not posted, one item per trip', () => {
    const entries = [
      entry('a1', { date: '2027-03-01', tripId: 't', leg: 0 }),
      entry('a2', { date: '2027-03-01', tripId: 't', leg: 1, state: 'Pending' }),
      entry('b', { date: '2027-03-05', state: 'Posted' }),
      entry('c', { date: '2027-07-01' }),
      entry('d', { date: '2027-02-01', state: 'Cancelled' }),
    ];
    const items = attentionItems({ entries, trackerCards: [], statusYear: 2027, today: '2027-06-15' });
    expect(items).toEqual([{ kind: 'uncredited', date: '2027-03-01', entries: [entries[0], entries[1]] }]);
  });

  it('flags a past Potential flight as not booked', () => {
    const e = entry('p', { date: '2027-04-01', state: 'Potential' });
    expect(attentionItems({ entries: [e], trackerCards: [], statusYear: 2027, today: '2027-06-15' })).toEqual([
      { kind: 'unbooked', date: '2027-04-01', entries: [e] },
    ]);
  });

  it('lists past bonuses and Headstarts that have not posted', () => {
    const hs = entry('hs', { category: 'Qualifying bonuses', method: 'headstart', cardKey: 'R', date: '2027-02-01' });
    const items = attentionItems({
      entries: [hs, spend('R', 1, 'Posted'), spend('R', 2, 'Posted'), spend('R', 3, 'Posted'), spend('R', 4, 'Posted'), spend('R', 5, 'Posted')],
      trackerCards: [held],
      statusYear: 2027,
      today: '2027-06-15',
    });
    expect(items).toEqual([{ kind: 'uncredited', date: '2027-02-01', entries: [hs] }]);
  });

  it('groups card months that ended without spend or without posting', () => {
    const entries = [spend('R', 1, 'Posted'), spend('R', 2), spend('R', 4), spend('R', 6)];
    const items = attentionItems({ entries, trackerCards: [held], statusYear: 2027, today: '2027-06-15' });
    expect(items).toEqual([
      { kind: 'spendUncredited', date: '2027-02-28', cardKey: 'R', months: [2, 4] },
      { kind: 'spendMissing', date: '2027-03-31', cardKey: 'R', months: [3, 5] },
    ]);
  });

  it('ignores cards that are not included, and the months still running', () => {
    const considering: TrackerCardInfo = { cardKey: 'P', potential: true, included: false };
    const hs = entry('hs', { category: 'Qualifying bonuses', method: 'headstart', cardKey: 'P', date: '2027-02-01' });
    expect(attentionItems({ entries: [hs], trackerCards: [considering], statusYear: 2027, today: '2027-06-15' })).toEqual([]);
    expect(attentionItems({ entries: [], trackerCards: [held], statusYear: 2027, today: '2027-01-20' })).toEqual([]);
  });

  it('finds nothing before the status year starts, and every month after it ends', () => {
    const entries = [entry('a', { date: '2027-03-01' })];
    expect(attentionItems({ entries, trackerCards: [held], statusYear: 2027, today: '2026-10-21' })).toEqual([]);
    const after = attentionItems({ entries: [], trackerCards: [held], statusYear: 2027, today: '2028-01-02' });
    expect(after).toEqual([{ kind: 'spendMissing', date: '2027-01-31', cardKey: 'R', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }]);
  });
});

describe('setupSteps', () => {
  it('tracks cards, a first flight, and card spend', () => {
    expect(setupSteps({ entries: [], trackerCards: [] })).toEqual({ cards: false, flight: false, spend: false });
    expect(setupSteps({ entries: [entry('f', {}), spend('R', 1)], trackerCards: [held] })).toEqual({ cards: true, flight: true, spend: true });
  });
});
