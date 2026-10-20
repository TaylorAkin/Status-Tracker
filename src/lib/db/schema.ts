import { boolean, date, doublePrecision, index, integer, pgTable, primaryKey, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { CATEGORIES, ENTRY_STATES } from '../engine/types';
import { TOUR_KEYS, TOUR_STATUSES } from '../tracker/types';
import { user } from './auth-schema';

export * from './auth-schema';

// ── Reference data: maintained per status year, not per user ──────────────

export const program = pgTable('program', {
  code: text('code').primaryKey(), // 'DL'
  name: text('name').notNull(), // 'Delta SkyMiles Medallion'
  unitLabel: text('unit_label').notNull(), // 'MQDs'
  active: boolean('active').notNull().default(false),
});

export const tier = pgTable(
  'tier',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    programCode: text('program_code')
      .notNull()
      .references(() => program.code),
    statusYear: integer('status_year').notNull(),
    name: text('name').notNull(),
    threshold: integer('threshold').notNull(),
  },
  (t) => [unique().on(t.programCode, t.statusYear, t.name)],
);

export const card = pgTable('card', {
  key: text('key').primaryKey(), // 'DL-RB'
  programCode: text('program_code')
    .notNull()
    .references(() => program.code),
  name: text('name').notNull(),
  /** Eligible dollars per unit of qualifying credit (10 = 1 MQD per $10). */
  spendDivisor: doublePrecision('spend_divisor').notNull(),
  /** Annual status headstart in program units; null when the card has none. */
  headstartAmount: integer('headstart_amount'),
  sortOrder: integer('sort_order').notNull().default(0),
});

// ── User data ──────────────────────────────────────────────────────────────

/** One tracker per user, program, and status year. */
export const tracker = pgTable(
  'tracker',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    programCode: text('program_code')
      .notNull()
      .references(() => program.code),
    statusYear: integer('status_year').notNull(),
    /** Goal in program units, e.g. 15000 MQDs for Platinum. */
    target: integer('target').notNull(),
    /** As-of date for the remaining monthly pace. */
    asOf: date('as_of').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.programCode, t.statusYear)],
);

/** Cards the user holds (or is considering) for a tracker. */
export const trackerCard = pgTable(
  'tracker_card',
  {
    trackerId: uuid('tracker_id')
      .notNull()
      .references(() => tracker.id, { onDelete: 'cascade' }),
    cardKey: text('card_key')
      .notNull()
      .references(() => card.key),
    /** A card the user might add; its earnings are excluded until included. */
    potential: boolean('potential').notNull().default(false),
    included: boolean('included').notNull().default(true),
  },
  (t) => [primaryKey({ columns: [t.trackerId, t.cardKey] })],
);

export const entry = pgTable(
  'entry',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    trackerId: uuid('tracker_id')
      .notNull()
      .references(() => tracker.id, { onDelete: 'cascade' }),
    category: text('category', { enum: CATEGORIES }).notNull(),
    state: text('state', { enum: ENTRY_STATES }).notNull(),
    date: date('date').notNull(),
    description: text('description').notNull(),
    method: text('method').notNull(),
    amount: doublePrecision('amount').notNull(),
    rate: doublePrecision('rate').notNull(),
    override: doublePrecision('override'),
    notes: text('notes').notNull().default(''),
    route: text('route'),
    roundtrip: boolean('roundtrip').notNull().default(false),
    cardKey: text('card_key').references(() => card.key),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('entry_tracker_date_idx').on(t.trackerId, t.date)],
);

/** Guided tours a user has finished or dismissed. Per user, not per tracker, so a new status year doesn't replay them. */
export const userTour = pgTable(
  'user_tour',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    tourKey: text('tour_key', { enum: TOUR_KEYS }).notNull(),
    status: text('status', { enum: TOUR_STATUSES }).notNull(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.tourKey] })],
);
