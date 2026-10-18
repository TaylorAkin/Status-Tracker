import type { Category } from '@/lib/engine';
import type { CardInfo } from './types';

export interface Method {
  key: string;
  label: string;
  rate: number;
  hint: string;
  /** Label for the amount input. */
  amountLabel: string;
  cardKey?: string;
}

export const HEADSTART_METHOD = 'headstart';
export const STAYS_METHOD = 'staysBonus';
export const RENTAL_METHOD = 'rentalBonus';

const EXACT = 'Qualifying credit';

/** Delta SkyMiles earning methods. Card spend methods come from the cards reference data. */
export function deltaMethods(category: Category, cards: CardInfo[]): Method[] {
  switch (category) {
    case 'Flights':
      return [
        {
          key: 'fare',
          label: 'Delta-marketed eligible paid fare',
          rate: 1,
          amountLabel: 'Eligible fare ($)',
          hint: '1 MQD per eligible dollar, excluding government taxes and fees. Basic Economy is not eligible.',
        },
        {
          key: 'manual',
          label: 'Exact / manual MQDs',
          rate: 1,
          amountLabel: EXACT,
          hint: 'Use exact MQDs for partner-marketed flights or awards; the cash fare rule does not apply universally.',
        },
      ];
    case 'Credit card spend':
      return [
        ...cards.map((c) => ({
          key: `card:${c.key}`,
          cardKey: c.key,
          label: c.name,
          rate: 1 / c.spendDivisor,
          amountLabel: 'Eligible spend ($)',
          hint: `1 MQD per $${c.spendDivisor} in eligible purchases.`,
        })),
        {
          key: 'custom',
          label: 'Other card · custom rate',
          rate: 1,
          amountLabel: 'Eligible spend ($)',
          hint: 'Only use if the card or offer explicitly awards MQDs. Ordinary Amex Platinum and Gold cards do not earn MQDs from spend.',
        },
      ];
    case 'Qualifying bonuses':
      return [
        {
          key: STAYS_METHOD,
          label: 'Delta Stays · bonus MQDs',
          rate: 1,
          amountLabel: EXACT,
          hint: 'Enter qualifying promotional MQDs from your Delta Stays offer. Keep projected until credited.',
        },
        {
          key: RENTAL_METHOD,
          label: 'Rental car · bonus MQDs',
          rate: 1,
          amountLabel: EXACT,
          hint: 'Enter qualifying promotional MQDs from your rental car offer. Keep projected until credited.',
        },
        {
          key: HEADSTART_METHOD,
          label: 'Card MQD Headstart',
          rate: 1,
          amountLabel: EXACT,
          hint: 'Annual MQD Headstart for an eligible Delta card. Keep projected until credited.',
        },
        {
          key: 'manual',
          label: 'Exact / manual MQD bonus',
          rate: 1,
          amountLabel: EXACT,
          hint: 'Enter only MQD credits; redeemable SkyMiles bonuses do not count.',
        },
      ];
  }
}
