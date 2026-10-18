import type { Entry } from '../types';

/**
 * The friend's 2027 tracker data, reconstructed from screenshots of the original app.
 * The original displayed: Delta posted 11,224 / 15,000 (75%), gap 3,776, 315/month;
 * Alaska posted 25,873 / 135,000 (19%), planned 48,618, forecast 74,491 (55%).
 */
let n = 0;
const entry = (e: Omit<Entry, 'id' | 'notes' | 'override'> & { override?: number | null }): Entry => ({
  id: `e${++n}`,
  notes: '',
  override: null,
  ...e,
});

const flight = (program: Entry['program'], date: string, route: string, amount: number, state: Entry['state'], description: string) =>
  entry({ program, category: 'Flights', date, route, amount, rate: 1, state, description, method: program === 'AS' ? 'distance' : 'fare' });

const headstart = (method: string, description: string) =>
  entry({
    program: 'DL',
    category: 'Qualifying bonuses',
    date: '2027-02-01',
    state: 'Posted',
    method,
    description,
    amount: 2500,
    rate: 1,
    override: 2500,
  });

const spend = (program: Entry['program'], cardKey: string, method: string, month: string, amount: number, divisor: number, state: Entry['state']) =>
  entry({
    program,
    category: 'Credit card spend',
    date: `2027-${month}`,
    cardKey,
    method,
    amount,
    rate: 1 / divisor,
    state,
    description: `${cardKey} ${month} spend`,
  });

export const KGM_ENTRIES: Entry[] = [
  // Delta
  flight('DL', '2027-01-12', 'DCA-ATL', 211, 'Posted', 'RK Sales Kickoff Outbound'),
  flight('DL', '2027-01-14', 'ATL-DCA', 176, 'Posted', 'RK Sales Kickoff Return'),
  headstart('headstartRB', 'Delta SkyMiles® Reserve Business American Express Card'),
  headstart('headstartR', 'Delta SkyMiles® Reserve American Express Card'),
  headstart('headstartPB', 'Delta SkyMiles® Platinum Business American Express Card'),
  headstart('headstartP', 'Delta SkyMiles® Platinum American Express Card'),
  entry({
    program: 'DL',
    category: 'Qualifying bonuses',
    date: '2027-01-26',
    state: 'Posted',
    method: 'staysBonus',
    amount: 299,
    rate: 1,
    description: 'Delta Stays bonus MQDs',
  }),
  entry({
    program: 'DL',
    category: 'Qualifying bonuses',
    date: '2027-02-02',
    state: 'Posted',
    method: 'rentalBonus',
    amount: 187,
    rate: 1,
    description: 'Rental car bonus MQDs',
  }),
  spend('DL', 'DL-RB', 'reserveBusiness', '01-31', 1272.12, 10, 'Posted'),
  spend('DL', 'DL-R', 'reserve', '01-31', 2087.4, 10, 'Posted'),
  spend('DL', 'DL-PB', 'platinumBusiness', '01-31', 299.99, 20, 'Posted'),

  // Alaska
  flight('AS', '2027-01-03', 'STL-SEA', 1705, 'Posted', 'CROSS Conference Return Trip'),
  flight('AS', '2027-01-03', 'SEA-DCA', 2323, 'Posted', 'CROSS Conference Return Trip'),
  flight('AS', '2027-01-19', 'DCA-LAX', 2306, 'Posted', 'RK London Office Trip'),
  flight('AS', '2027-01-19', 'LAX-LHR', 5443, 'Posted', 'RK London Office Trip'),
  flight('AS', '2027-01-23', 'LHR-IAD', 3667, 'Planned', 'RK London Office Trip'),
  flight('AS', '2027-01-31', 'DCA-SAN-SJD', 3074, 'Planned', 'RK Sales Club'),
  flight('AS', '2027-02-05', 'SJD-SAN-DCA', 3074, 'Planned', 'RK Sales Club'),
  flight('AS', '2027-04-16', 'PHX-SAN-LAS', 563, 'Planned', 'John Mayer Sphere Concert'),
  flight('AS', '2027-04-18', 'LAS-SAN-PHX', 563, 'Potential', 'John Mayer Sphere Concert'),
  flight('AS', '2027-05-11', 'SEA-HNL', 2677, 'Planned', 'Potential Hawaii Trip'),
  ...[1, 2].map((i) =>
    entry({
      program: 'AS',
      category: 'Qualifying bonuses',
      date: '2027-01-01',
      state: 'Planned',
      method: 'rollover',
      amount: 10000,
      rate: 1,
      override: 10000,
      description: `2026 95K milestone rollover · selection ${i}`,
    }),
  ),
  entry({
    program: 'AS',
    category: 'Qualifying bonuses',
    date: '2027-08-20',
    state: 'Posted',
    method: 'summitBonus',
    amount: 10000,
    rate: 1,
    override: 10000,
    description: 'Atmos™ Rewards Summit Visa Infinite® Card',
  }),
  spend('AS', 'AS-S', 'summit', '01-31', 5822.9, 2, 'Posted'),
  spend('AS', 'AS-S', 'summit', '02-28', 2088.21, 2, 'Posted'),
  ...['03-31', '04-30', '05-31', '06-30', '07-31', '08-31', '09-30', '10-31', '11-30', '12-31'].map((m) =>
    spend('AS', 'AS-S', 'summit', m, 3000, 2, 'Planned'),
  ),
  spend('AS', 'AS-A', 'ascent', '01-31', 421.89, 3, 'Posted'),
];
