import 'server-only';
import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { card, entry, program, tier, tracker, trackerCard } from '@/lib/db/schema';
import type { Entry } from '@/lib/engine';
import type { DashboardData } from './types';

export const PROGRAM_CODE = 'DL';
export const STATUS_YEAR = 2027;
const DEFAULT_TARGET = 15000; // Platinum Medallion

type TrackerRow = typeof tracker.$inferSelect;

/** The user's Delta tracker for the current status year, created on first use. */
export async function getOrCreateTracker(userId: string): Promise<TrackerRow> {
  const where = and(eq(tracker.userId, userId), eq(tracker.programCode, PROGRAM_CODE), eq(tracker.statusYear, STATUS_YEAR));
  const [existing] = await db.select().from(tracker).where(where).limit(1);
  if (existing) return existing;
  // Atomic create-or-return, so concurrent first loads can't race each other.
  const [row] = await db
    .insert(tracker)
    .values({
      userId,
      programCode: PROGRAM_CODE,
      statusYear: STATUS_YEAR,
      target: DEFAULT_TARGET,
      asOf: new Date().toISOString().slice(0, 10),
    })
    .onConflictDoUpdate({ target: [tracker.userId, tracker.programCode, tracker.statusYear], set: { updatedAt: sql`${tracker.updatedAt}` } })
    .returning();
  if (!row) throw new Error('Could not load your tracker.');
  return row;
}

export function toEngineEntry(row: typeof entry.$inferSelect): Entry {
  return {
    id: row.id,
    program: PROGRAM_CODE,
    category: row.category,
    state: row.state,
    date: row.date,
    description: row.description,
    method: row.method,
    amount: row.amount,
    rate: row.rate,
    override: row.override,
    notes: row.notes,
    route: row.route ?? undefined,
    roundtrip: row.roundtrip,
    cardKey: row.cardKey ?? undefined,
  };
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const t = await getOrCreateTracker(userId);
  const [[p], tiers, cards, trackerCards, entries] = await Promise.all([
    db.select().from(program).where(eq(program.code, PROGRAM_CODE)),
    db
      .select({ name: tier.name, threshold: tier.threshold })
      .from(tier)
      .where(and(eq(tier.programCode, PROGRAM_CODE), eq(tier.statusYear, t.statusYear)))
      .orderBy(asc(tier.threshold)),
    db
      .select({ key: card.key, name: card.name, spendDivisor: card.spendDivisor, headstartAmount: card.headstartAmount })
      .from(card)
      .where(eq(card.programCode, PROGRAM_CODE))
      .orderBy(asc(card.sortOrder)),
    db
      .select({ cardKey: trackerCard.cardKey, potential: trackerCard.potential, included: trackerCard.included })
      .from(trackerCard)
      .where(eq(trackerCard.trackerId, t.id)),
    db.select().from(entry).where(eq(entry.trackerId, t.id)).orderBy(asc(entry.date), asc(entry.createdAt)),
  ]);

  return {
    tracker: { id: t.id, statusYear: t.statusYear, target: t.target, asOf: t.asOf },
    program: { code: PROGRAM_CODE, name: p.name, unitLabel: p.unitLabel },
    tiers,
    cards,
    trackerCards,
    entries: entries.map(toEngineEntry),
  };
}
