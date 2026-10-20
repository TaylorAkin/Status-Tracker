'use server';

import { and, eq, inArray } from 'drizzle-orm';
import { refresh } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { card, entry, tracker, trackerCard, userTour } from '@/lib/db/schema';
import { ENTRY_STATES } from '@/lib/engine';
import { requireUser } from '@/lib/dal';
import { getOrCreateTracker } from '@/lib/tracker/data';
import { HEADSTART_METHOD } from '@/lib/tracker/methods';
import { cardHoldingsInput, entryInput, monthlySpendInput, settingsInput, type EntryInput } from '@/lib/tracker/schemas';
import { TOUR_KEYS, TOUR_STATUSES, type TourKey, type TourStatus } from '@/lib/tracker/types';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** The signed-in user's tracker. Tracker data is scoped to this tracker id; per-user data like tour progress uses requireUser directly. */
async function currentTracker() {
  const user = await requireUser();
  return getOrCreateTracker(user.id);
}

function assertInYear(date: string, year: number) {
  if (!date.startsWith(`${year}-`) || Number.isNaN(Date.parse(date))) {
    throw new Error(`Use a qualifying activity date within ${year}.`);
  }
}

const ownEntry = (trackerId: string, id: string) => and(eq(entry.id, id), eq(entry.trackerId, trackerId));

export async function saveEntry(input: EntryInput): Promise<string> {
  const t = await currentTracker();
  const e = entryInput.parse(input);
  assertInYear(e.date, t.statusYear);
  const cardKey = e.method.startsWith('card:') ? e.method.slice(5) : e.cardKey;
  const values = {
    category: e.category,
    state: e.state,
    date: e.date,
    description: e.description,
    method: e.method,
    amount: e.amount,
    rate: e.rate,
    override: e.override,
    notes: e.notes,
    route: e.category === 'Flights' ? e.route || null : null,
    roundtrip: e.category === 'Flights' && e.roundtrip,
    cardKey: cardKey || null,
  };

  // The client may supply a fresh id for a new entry so it can render optimistically.
  if (e.id) {
    const [updated] = await db
      .update(entry)
      .set({ ...values, updatedAt: new Date() })
      .where(ownEntry(t.id, e.id))
      .returning({ id: entry.id });
    if (updated) {
      refresh();
      return updated.id;
    }
  }
  const [row] = await db
    .insert(entry)
    .values({ ...values, ...(e.id ? { id: e.id } : {}), trackerId: t.id })
    .returning({ id: entry.id });
  refresh();
  return row.id;
}

export async function deleteEntry(id: string) {
  const t = await currentTracker();
  await db.delete(entry).where(ownEntry(t.id, z.uuid().parse(id)));
  refresh();
}

export async function setEntryState(id: string, state: (typeof ENTRY_STATES)[number]) {
  const t = await currentTracker();
  const parsed = z.enum(ENTRY_STATES).parse(state);
  await db
    .update(entry)
    .set({ state: parsed, updatedAt: new Date() })
    .where(ownEntry(t.id, z.uuid().parse(id)));
  refresh();
}

export async function setEntryDate(id: string, date: string) {
  const t = await currentTracker();
  assertInYear(date, t.statusYear);
  await db
    .update(entry)
    .set({ date, updatedAt: new Date() })
    .where(ownEntry(t.id, z.uuid().parse(id)));
  refresh();
}

export async function updateSettings(input: z.input<typeof settingsInput>) {
  const t = await currentTracker();
  const s = settingsInput.parse(input);
  await db
    .update(tracker)
    .set({ ...s, updatedAt: new Date() })
    .where(eq(tracker.id, t.id));
  refresh();
}

/** Upserts one card's monthly spend. A month with $0 spend, no exact credit, and not posted is cleared. */
export async function saveMonthlySpend(input: z.input<typeof monthlySpendInput>) {
  const t = await currentTracker();
  const { cardKey, months } = monthlySpendInput.parse(input);
  const [c] = await db.select().from(card).where(eq(card.key, cardKey));
  if (!c) throw new Error('Unknown card.');

  const existing = await db
    .select({ id: entry.id, date: entry.date })
    .from(entry)
    .where(and(eq(entry.trackerId, t.id), eq(entry.cardKey, cardKey), eq(entry.category, 'Credit card spend')));

  for (const m of months) {
    const prefix = `${t.statusYear}-${String(m.month).padStart(2, '0')}`;
    const lastDay = new Date(Date.UTC(t.statusYear, m.month, 0)).getUTCDate();
    const current = existing.find((e) => e.date.startsWith(prefix));
    if (m.amount === 0 && m.override === null && !m.posted) {
      if (current) await db.delete(entry).where(ownEntry(t.id, current.id));
      continue;
    }
    const values = {
      category: 'Credit card spend' as const,
      state: m.posted ? ('Posted' as const) : ('Planned' as const),
      date: `${prefix}-${String(lastDay).padStart(2, '0')}`,
      description: `${c.name} · ${MONTHS[m.month - 1]} spend`,
      method: `card:${c.key}`,
      amount: m.amount,
      rate: 1 / c.spendDivisor,
      override: m.override,
      cardKey: c.key,
    };
    if (current)
      await db
        .update(entry)
        .set({ ...values, updatedAt: new Date() })
        .where(ownEntry(t.id, current.id));
    else await db.insert(entry).values({ ...values, trackerId: t.id, notes: `Monthly eligible spend at 1 MQD per $${c.spendDivisor}.` });
  }
  refresh();
}

/**
 * Sets which cards the user holds or is considering. Adding a card with a Headstart creates a
 * projected Headstart entry; removing a card deletes its Headstart and spend entries.
 */
export async function setCardHoldings(input: z.input<typeof cardHoldingsInput>) {
  const t = await currentTracker();
  const holdings = cardHoldingsInput.parse(input);
  const cards = await db
    .select()
    .from(card)
    .where(
      inArray(
        card.key,
        holdings.map((h) => h.cardKey),
      ),
    );
  const current = await db.select().from(trackerCard).where(eq(trackerCard.trackerId, t.id));

  for (const h of holdings) {
    const c = cards.find((x) => x.key === h.cardKey);
    if (!c) continue;
    const prev = current.find((x) => x.cardKey === h.cardKey);
    if (h.holding === 'none') {
      if (!prev) continue;
      await db.delete(entry).where(and(eq(entry.trackerId, t.id), eq(entry.cardKey, c.key)));
      await db.delete(trackerCard).where(and(eq(trackerCard.trackerId, t.id), eq(trackerCard.cardKey, c.key)));
      continue;
    }
    const potential = h.holding === 'potential';
    // A held card always counts; a potential card starts excluded until the user includes it.
    const included = potential ? (prev?.potential ? prev.included : false) : true;
    await db
      .insert(trackerCard)
      .values({ trackerId: t.id, cardKey: c.key, potential, included })
      .onConflictDoUpdate({ target: [trackerCard.trackerId, trackerCard.cardKey], set: { potential, included } });

    if (c.headstartAmount && !prev) {
      const [hasHeadstart] = await db
        .select({ id: entry.id })
        .from(entry)
        .where(and(eq(entry.trackerId, t.id), eq(entry.cardKey, c.key), eq(entry.method, HEADSTART_METHOD)));
      if (!hasHeadstart) {
        await db.insert(entry).values({
          trackerId: t.id,
          category: 'Qualifying bonuses',
          state: 'Planned',
          date: `${t.statusYear}-02-01`,
          description: `${c.name} · MQD Headstart`,
          method: HEADSTART_METHOD,
          amount: c.headstartAmount,
          rate: 1,
          override: c.headstartAmount,
          cardKey: c.key,
          notes: 'Annual MQD Headstart. Expected date is a placeholder; update it when it posts.',
        });
      }
    }
  }
  refresh();
}

/** Includes or excludes a potential card's Headstart and spend from every total. */
export async function setCardIncluded(cardKey: string, included: boolean) {
  const t = await currentTracker();
  await db
    .update(trackerCard)
    .set({ included: z.boolean().parse(included) })
    .where(and(eq(trackerCard.trackerId, t.id), eq(trackerCard.cardKey, z.string().parse(cardKey))));
  refresh();
}

/** Saves that the user finished or dismissed a guided tour. Replaying a tour overwrites the row. */
export async function markTour(key: TourKey, status: TourStatus) {
  const user = await requireUser();
  const values = { userId: user.id, tourKey: z.enum(TOUR_KEYS).parse(key), status: z.enum(TOUR_STATUSES).parse(status) };
  await db
    .insert(userTour)
    .values(values)
    .onConflictDoUpdate({ target: [userTour.userId, userTour.tourKey], set: { status: values.status, updatedAt: new Date() } });
  refresh();
}
