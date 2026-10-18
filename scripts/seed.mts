// Seeds reference data (programs, tiers, cards). Safe to re-run.
import { config } from 'dotenv';

config({ path: '.env.local' });
const { db } = await import('../src/lib/db/index');
const { card, program, tier } = await import('../src/lib/db/schema');

const STATUS_YEAR = 2027;

await db
  .insert(program)
  .values({ code: 'DL', name: 'Delta SkyMiles Medallion', unitLabel: 'MQDs', active: true })
  .onConflictDoUpdate({ target: program.code, set: { name: 'Delta SkyMiles Medallion', unitLabel: 'MQDs', active: true } });

// Delta's published thresholds, carried forward as a planning assumption for 2027 earning.
const tiers = [
  { name: 'Silver', threshold: 5000 },
  { name: 'Gold', threshold: 10000 },
  { name: 'Platinum', threshold: 15000 },
  { name: 'Diamond', threshold: 28000 },
];
for (const t of tiers) {
  await db
    .insert(tier)
    .values({ programCode: 'DL', statusYear: STATUS_YEAR, ...t })
    .onConflictDoUpdate({ target: [tier.programCode, tier.statusYear, tier.name], set: { threshold: t.threshold } });
}

const cards = [
  { key: 'DL-RB', name: 'Delta SkyMiles® Reserve Business American Express Card', spendDivisor: 10, headstartAmount: 2500 },
  { key: 'DL-R', name: 'Delta SkyMiles® Reserve American Express Card', spendDivisor: 10, headstartAmount: 2500 },
  { key: 'DL-PB', name: 'Delta SkyMiles® Platinum Business American Express Card', spendDivisor: 20, headstartAmount: 2500 },
  { key: 'DL-P', name: 'Delta SkyMiles® Platinum American Express Card', spendDivisor: 20, headstartAmount: 2500 },
];
for (const [i, c] of cards.entries()) {
  const values = { ...c, programCode: 'DL', sortOrder: i };
  await db.insert(card).values(values).onConflictDoUpdate({ target: card.key, set: values });
}

console.log(`Seeded DL: ${tiers.length} tiers for ${STATUS_YEAR}, ${cards.length} cards.`);
