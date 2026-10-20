import { flightName, goalSummary, type Category, type Entry, type EntryState, type Tier } from '@/lib/engine';
import { MONTH_SHORT } from '@/lib/format';

/** The moment the front page preview shows. Not anyone's real data. */
const YEAR = 2027;
const AS_OF = '2027-03-01';
const TARGET = 10000;
const TIERS: Tier[] = [
  { name: 'Silver', threshold: 5000 },
  { name: 'Gold', threshold: 10000 },
  { name: 'Platinum', threshold: 15000 },
  { name: 'Diamond', threshold: 28000 },
];

const entry = (
  id: string,
  category: Category,
  state: EntryState,
  date: string,
  description: string,
  amount: number,
  rate = 1,
  route?: string,
): Entry => ({
  id,
  program: 'DL',
  category,
  state,
  date,
  description,
  method: '',
  amount,
  rate,
  override: null,
  notes: '',
  route,
});

const ENTRIES: Entry[] = [
  entry('hs-reserve', 'Qualifying bonuses', 'Posted', '2027-01-01', 'Reserve MQD Headstart', 2500),
  entry('hs-platinum', 'Qualifying bonuses', 'Posted', '2027-01-01', 'Platinum MQD Headstart', 2500),
  entry('jfk', 'Flights', 'Posted', '2027-01-28', 'New York', 640, 1, 'ATL-JFK'),
  entry('reserve-jan', 'Credit card spend', 'Posted', '2027-01-31', 'Reserve · January', 12000, 0.1),
  entry('reserve-feb', 'Credit card spend', 'Posted', '2027-02-28', 'Reserve · February', 10000, 0.1),
  entry('platinum-feb', 'Credit card spend', 'Pending', '2027-02-28', 'Platinum · February', 14400, 0.05),
  entry('lax', 'Flights', 'Planned', '2027-03-14', 'Los Angeles', 1150, 1, 'ATL-LAX'),
  entry('sea', 'Flights', 'Potential', '2027-04-02', 'Seattle', 800, 1, 'LAX-SEA-ATL'),
  entry('reserve-rest', 'Credit card spend', 'Planned', '2027-12-31', 'Reserve · rest of year', 10000, 0.1),
];

export const SAMPLE = {
  year: YEAR,
  target: TARGET,
  tiers: TIERS,
  goalName: TIERS.find((t) => t.threshold === TARGET)!.name,
  summary: goalSummary(ENTRIES, 'DL', TARGET, AS_OF, YEAR),
};

/** Same words as the dashboard's flight toggles: Credited = posted, Booked = projected, Potential = not booked yet. */
function flightStatus(state: EntryState) {
  if (state === 'Posted') return 'Credited';
  if (state === 'Potential') return 'Potential';
  return 'Booked';
}

export function sampleFlights() {
  return ENTRIES.filter((e) => e.category === 'Flights')
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => {
      const [, month, day] = e.date.split('-').map(Number);
      return { id: e.id, name: flightName(e), date: `${MONTH_SHORT[month - 1]} ${day}`, status: flightStatus(e.state) };
    });
}
