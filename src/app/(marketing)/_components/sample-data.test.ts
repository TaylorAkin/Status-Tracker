import { describe, expect, it } from 'vitest';
import { progressScale } from '@/lib/engine';
import { SAMPLE, sampleFlights } from './sample-data';

describe('front page sample data', () => {
  it('matches the spec: 2027, as of March 1, Gold goal', () => {
    expect(SAMPLE.goalName).toBe('Gold');
    const s = SAMPLE.summary;
    expect(s.totals).toEqual({ posted: 7840, pending: 720, planned: 2950, forecast: 11510 });
    expect(s.actualGap).toBe(2160);
    expect(s.forecastGap).toBe(0);
    expect(s.monthsLeft).toBe(10);
    expect(s.monthlyPace).toBe(216);
    expect(Math.round(s.postedPercent)).toBe(78);
  });

  it('draws the bar on the 0–28,000 tier scale', () => {
    expect(progressScale(SAMPLE.tiers, SAMPLE.target)).toBe(28000);
  });

  it('lists three flights oldest first with dashboard chip labels', () => {
    expect(sampleFlights().map((f) => [f.name, f.date, f.status])).toEqual([
      ['ATL → JFK', 'Jan 28', 'Credited'],
      ['ATL → LAX', 'Mar 14', 'Booked'],
      ['LAX → SEA → ATL', 'Apr 2', 'Potential'],
    ]);
  });
});
