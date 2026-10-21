import { z } from 'zod';
import { CATEGORIES, ENTRY_STATES } from '@/lib/engine';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a YYYY-MM-DD date');
const nonNegative = z.number().finite().min(0);

export const entryInput = z
  .object({
    id: z.uuid().optional(),
    category: z.enum(CATEGORIES),
    state: z.enum(ENTRY_STATES),
    date: isoDate,
    description: z.string().trim().min(1).max(200),
    method: z.string().min(1).max(60),
    amount: nonNegative,
    rate: nonNegative,
    override: nonNegative.nullable(),
    notes: z.string().trim().max(600).default(''),
    route: z.string().trim().toUpperCase().max(200).nullable().default(null),
    roundtrip: z.boolean().default(false),
    cardKey: z.string().max(20).nullable().default(null),
  })
  .refine((e) => e.state !== 'Potential' || e.category === 'Flights', {
    message: 'Only flights can be Potential',
    path: ['state'],
  });
export type EntryInput = z.input<typeof entryInput>;

/** Flight legs saved together as one trip; each leg is an ordinary entry. */
export const tripInput = z.object({
  tripId: z.uuid(),
  legs: z
    .array(z.object({ entry: entryInput, ticket: z.number().int().min(0).max(1), leg: z.number().int().min(0).max(19) }))
    .min(1)
    .max(40),
});
export type TripInput = z.input<typeof tripInput>;

export const settingsInput = z.object({
  target: z.number().int().min(1).max(1_000_000),
  asOf: isoDate,
});

export const monthlySpendInput = z.object({
  cardKey: z.string().min(1).max(20),
  months: z
    .array(
      z.object({
        month: z.number().int().min(1).max(12),
        amount: nonNegative,
        override: nonNegative.nullable(),
        posted: z.boolean(),
      }),
    )
    .min(1)
    .max(12),
});

export const cardHoldingsInput = z.array(z.object({ cardKey: z.string().min(1).max(20), holding: z.enum(['held', 'potential', 'none']) }));
