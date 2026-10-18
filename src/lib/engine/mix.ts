import { totals } from './totals';
import type { Entry, ProgramCode, Totals } from './types';

export interface EarningMixInput {
  entries: Entry[];
  program: ProgramCode;
  target: number;
  /** 0–100: share of the remaining gap covered by flights. */
  flightShare: number;
  /** Eligible dollars per unit of credit for additional card spend (e.g. 10 for 1 MQD / $10). */
  cardDivisor: number;
}

export interface EarningMix {
  target: number;
  base: Totals;
  gap: number;
  extraFlights: number;
  extraCards: number;
  /** Additional eligible card spend in dollars. */
  cardSpend: number;
  flights: number;
  cards: number;
  bonuses: number;
}

/** "Find your earning mix": split the gap beyond the forecast between flights and card spend. */
export function earningMix({ entries, program, target, flightShare, cardDivisor }: EarningMixInput): EarningMix {
  const base = totals(entries, program);
  const gap = Math.max(0, target - base.forecast);
  const extraFlights = (gap * flightShare) / 100;
  const extraCards = gap - extraFlights;
  return {
    target,
    base,
    gap,
    extraFlights,
    extraCards,
    cardSpend: extraCards * cardDivisor,
    flights: totals(entries, program, 'Flights').forecast + extraFlights,
    cards: totals(entries, program, 'Credit card spend').forecast + extraCards,
    bonuses: totals(entries, program, 'Qualifying bonuses').forecast,
  };
}
