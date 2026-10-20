import { describe, expect, it } from 'vitest';
import type { Entry, EntryState } from '@/lib/engine';
import { helpPrompt } from './help-prompt';

const entry = (state: EntryState = 'Planned'): Entry => ({
  id: crypto.randomUUID(),
  program: 'DL',
  category: 'Flights',
  state,
  date: '2027-03-01',
  description: 'ATL-LAX',
  method: 'fare',
  amount: 400,
  rate: 1,
  override: null,
  notes: '',
});
const entries = (n: number) => Array.from({ length: n }, () => entry());

describe('helpPrompt', () => {
  it('starts "Adding your data" for a new, empty account', () => {
    expect(helpPrompt({ tours: {}, entries: [] })).toBe('start-adding-data');
  });

  it('treats an account with only cancelled entries as empty', () => {
    expect(helpPrompt({ tours: {}, entries: [entry('Cancelled'), entry('Cancelled'), entry('Cancelled')] })).toBe('start-adding-data');
  });

  it('shows nothing below three entries once the account has data', () => {
    expect(helpPrompt({ tours: {}, entries: entries(2) })).toBeNull();
  });

  it('does not count cancelled entries toward the reading offer', () => {
    expect(helpPrompt({ tours: {}, entries: [...entries(2), entry('Cancelled')] })).toBeNull();
  });

  it('offers "Reading the dashboard" at three entries', () => {
    expect(helpPrompt({ tours: {}, entries: entries(3) })).toBe('offer-reading');
  });

  it('offers reading, not the first tour, to an existing user who has data but no saved tours', () => {
    expect(helpPrompt({ tours: {}, entries: entries(5) })).toBe('offer-reading');
  });

  it('does not restart "Adding your data" once it is saved', () => {
    expect(helpPrompt({ tours: { 'adding-data': 'dismissed' }, entries: [] })).toBeNull();
    expect(helpPrompt({ tours: { 'adding-data': 'completed' }, entries: entries(2) })).toBeNull();
  });

  it('still offers reading after "Adding your data" is saved', () => {
    expect(helpPrompt({ tours: { 'adding-data': 'completed' }, entries: entries(3) })).toBe('offer-reading');
  });

  it('shows nothing once both tours are saved', () => {
    expect(helpPrompt({ tours: { 'adding-data': 'completed', 'reading-dashboard': 'dismissed' }, entries: entries(3) })).toBeNull();
  });
});
