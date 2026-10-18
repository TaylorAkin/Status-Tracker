import { credit } from './totals';
import type { Entry, ProgramCode } from './types';

export interface ChartPoint {
  actual: number;
  forecast: number;
}

/**
 * Cumulative month-end totals: index 0 is the year start (0, 0), then one point per month.
 * Forecast includes posted credit.
 */
export function chartSeries(entries: Entry[], program: ProgramCode): ChartPoint[] {
  const months = Array.from({ length: 12 }, () => ({ actual: 0, projected: 0 }));
  for (const e of entries) {
    if (e.program !== program || e.state === 'Cancelled') continue;
    const month = Number(e.date.slice(5, 7)) - 1;
    if (month < 0 || month > 11) continue;
    const value = credit(e);
    if (!Number.isFinite(value)) continue;
    if (e.state === 'Posted') months[month].actual += value;
    else months[month].projected += value;
  }
  let actual = 0;
  let forecast = 0;
  return [
    { actual: 0, forecast: 0 },
    ...months.map((m) => {
      actual += m.actual;
      forecast += m.actual + m.projected;
      return { actual, forecast };
    }),
  ];
}

/** Y-axis ceiling as a percent of goal: at least 100, rounded up to the next 25. */
export function chartScalePercent(series: ChartPoint[], target: number): number {
  const peak = Math.max(target, ...series.map((v) => Math.max(v.actual, v.forecast)));
  return Math.max(100, Math.ceil(((peak / target) * 100) / 25) * 25);
}
