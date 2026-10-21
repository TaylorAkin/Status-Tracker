import { FORECAST_HELP, STATE_HELP } from '@/lib/format';
import type { TourKey } from '@/lib/tracker/types';
import type { SourceTab } from '../tracker-context';

export interface Tip {
  title: string;
  body: string;
}

export interface TourStep {
  /** The `data-help` id of the element to highlight. */
  target: string;
  title: string;
  body: string;
  /** Opens the Add earning dialog before this step, when it isn't open already. */
  before?: 'openEntry';
  /** Selects this Sources tab before the step, so its target is on the page. */
  tab?: SourceTab;
}

export interface Tour {
  title: string;
  steps: TourStep[];
}

export const TIPS = {
  'summary.goal': {
    title: 'Your goal',
    body: 'The MQD target you are working toward this year, usually a Medallion tier threshold. Change it in Settings.',
  },
  'state.posted': { title: 'Posted', body: STATE_HELP.Posted },
  'state.pending': { title: 'Pending', body: STATE_HELP.Pending },
  'state.planned': { title: 'Planned', body: STATE_HELP.Planned },
  'state.potential': { title: 'Potential', body: STATE_HELP.Potential },
  'summary.forecast': { title: 'Forecast', body: FORECAST_HELP },
  'summary.pace': {
    title: 'Monthly pace',
    body: 'What’s left to post before your goal, spread evenly across the months left. Months count from the as-of date in Settings.',
  },
  'chart.lines': {
    title: 'Reading the chart',
    body: 'Month-end totals as a share of your goal. Solid line: posted. Dashed line: total forecast. Dotted line: an even pace from zero to your goal. Above the dotted line means you are ahead of pace.',
  },
  mix: {
    title: 'Earning mix',
    body: 'A what-if planner. It takes the gap your forecast leaves, splits it between flights and card spend, and shows the fares or spend that would close it. Nothing here is saved.',
  },
  'flights.states': {
    title: 'Flight states',
    body: 'Potential: considering, not booked yet. Switch Booked on to move a flight to Planned. Switch Credited on to move it to Posted once Delta credits it. Every state except Cancelled counts in the forecast. Use Edit to enter the exact MQDs Delta posts.',
  },
  headstarts: {
    title: 'MQD Headstarts',
    body: 'Some Delta SkyMiles American Express cards add MQDs each year just for holding the card. The expected date starts as a placeholder: set it, then switch Credited on when the Headstart appears in your SkyMiles account.',
  },
  'monthly-spend': {
    title: 'Monthly card spend',
    body: 'Enter eligible spend for each month and the tracker estimates MQDs at the card’s rate. Eligible spend leaves out returns and ineligible transactions. The second field takes the exact MQDs Delta posts; leave it blank to use the estimate. Edits count once you select Save changes.',
  },
  'travel-bonuses': {
    title: 'Stays and rental bonuses',
    body: 'Some Delta Stays bookings and rental car offers award bonus MQDs. Add them with the qualifying activity date, and switch Credited on when they post.',
  },
  'ledger.states': {
    title: 'Activity states',
    body: 'Potential: considering, not booked. Planned: booked or scheduled. Pending: done, waiting on Delta. Posted: in your SkyMiles account. Card excluded: from a card you’re considering but haven’t included. A ≈ next to the MQDs means the number is calculated, not entered from Delta.',
  },
  'entry.method': {
    title: 'Calculation method',
    body: 'How MQDs are worked out for this entry. For a Delta flight, MQDs equal the eligible fare in dollars. Pick Exact / manual MQDs if you already know the number.',
  },
  'entry.amount': {
    title: 'Amount',
    body: 'What the method calculates from. For a Delta fare, the eligible fare: base fare plus carrier-imposed surcharges, without government taxes and fees. For card spend, the eligible dollars spent. For exact and bonus methods, enter the MQDs themselves.',
  },
  'entry.override': {
    title: 'Posted / exact MQDs',
    body: 'Leave blank to use the calculation. Once Delta posts the entry, enter the MQDs it shows so your totals match your account.',
  },
  'settings.asof': {
    title: 'As-of date',
    body: 'The date your monthly pace counts from. It does not move on its own, so set it to today to see the pace from now, or to a later date to plan ahead.',
  },
  'settings.cards': {
    title: 'Your Delta cards',
    body: 'I have it: the card’s Headstart and spend planner count in your totals. Considering: the card shows on the dashboard but stays out of totals until you include it. Don’t have: removes the card and deletes its Headstart and monthly spend entries.',
  },
} satisfies Record<string, Tip>;

export type TipId = keyof typeof TIPS;

/** The header's Help button and the heading of its list of tours. */
export const HELP_MENU = { button: 'Help', heading: 'Guided tours' };

/** Finds the Help button, where focus goes when nothing else holds it after a tour or the banner. */
export const HELP_MENU_SELECTOR = '[data-help="help-menu"]';

/** The tour card's buttons. */
export const TOUR_LABELS = { skip: 'Skip tour', back: 'Back', next: 'Next', done: 'Done' };

/** The banner that offers "Reading the dashboard" once there's data to explain. */
export const READING_BANNER = {
  title: 'Your dashboard has data now.',
  body: 'Take a quick tour of how to read it.',
  dismiss: 'No thanks',
  accept: 'Show me',
};

export const TOURS: Record<TourKey, Tour> = {
  'adding-data': {
    title: 'Adding your data',
    steps: [
      {
        target: 'settings',
        title: 'Start with your cards',
        body: 'Open Settings to pick your goal tier and the Delta cards you have or are considering. Cards you have add their Headstart to your forecast automatically.',
      },
      {
        target: 'headstarts',
        tab: 'cards',
        title: 'Card Headstarts',
        body: 'Each card’s Headstart shows on the Cards tab. Switch Credited on when it posts to your SkyMiles account.',
      },
      {
        target: 'monthly-spend',
        tab: 'cards',
        title: 'Monthly card spend',
        body: 'Plan eligible spend for each month. The tracker estimates the MQDs, and you can enter the exact credit once Delta posts it.',
      },
      {
        target: 'add-earning',
        title: 'Add anything else',
        body: 'Use + Add for flights, card spend, Delta Stays and rental bonuses, or anything else that earns MQDs. Here’s what’s inside an earning.',
      },
      {
        target: 'entry.category',
        before: 'openEntry',
        title: 'Category',
        body: 'What kind of earning this is. We’ve started you on Flights.',
      },
      {
        target: 'entry.method',
        title: 'Calculation method',
        body: 'For a Delta flight, MQDs equal the eligible fare. If you already know the MQDs, pick Exact / manual instead.',
      },
      {
        target: 'entry.route',
        title: 'Route',
        body: 'Optional. Airport codes like DCA-ATL name the flight and put it on your map. Tick Round trip for a return on the same route.',
      },
      {
        target: 'entry.amount',
        title: 'Eligible fare',
        body: 'The base fare plus carrier-imposed surcharges, in dollars. Government taxes and fees don’t earn MQDs, so leave them out.',
      },
      {
        target: 'entry.state',
        title: 'Earning state',
        body: 'Planned: booked, not flown. Pending: flown, waiting on Delta. Posted: credited. A trip you’re only considering is Potential: pick it in Add flight, or switch Booked off on its flight card. Switch Credited on when the MQDs post. Now add your first flight.',
      },
    ],
  },
  'reading-dashboard': {
    title: 'Reading the dashboard',
    steps: [
      {
        target: 'summary',
        title: 'Your status at a glance',
        body: 'Where your year lands with what’s booked, how far that is from your goal, and what your Potential trips would add.',
      },
      {
        target: 'summary.bar',
        title: 'One bar, four states',
        body: 'Dark is Posted, then Pending, Planned, and hatched Potential. The marks are Medallion tiers; red is your goal. A ✓ means posted MQDs already reach that tier.',
      },
      {
        target: 'summary.states',
        title: 'What the states mean',
        body: 'Posted: in your SkyMiles account, and the only MQDs that count today. Pending: done, waiting on Delta. Planned: booked or scheduled. Potential: trips you’re considering. Forecast adds all four. Select any of these words on the page to see its meaning again.',
      },
      {
        target: 'summary.gap',
        title: 'What’s left',
        body: 'How short your forecast is of your goal, and the pace that needs to post each month to get there.',
      },
      {
        target: 'attention',
        title: 'Needs attention',
        body: 'Past flights, Headstarts, and card months that haven’t posted yet. Mark them posted here as Delta credits them.',
      },
      {
        target: 'chart',
        title: 'Progress over the year',
        body: 'Month-end progress as a share of your goal. Solid: posted. Dashed: forecast. Dotted: an even pace to the goal. Above the dotted line means you’re ahead.',
      },
      {
        target: 'sources',
        title: 'Where your MQDs come from',
        body: 'Flights, cards, and bonuses each have a tab, labeled with their forecast MQDs. Open one to see and update its entries.',
      },
    ],
  },
  'planning-ahead': {
    title: 'Planning ahead',
    steps: [
      {
        target: 'mix',
        title: 'Close the gap',
        body: 'Move the slider to split your remaining gap between flights and card spend, and see the fares or spend you’d need. Nothing here is saved.',
      },
      {
        target: 'flights',
        tab: 'flights',
        title: 'Potential vs Posted',
        body: 'Potential flights count in your forecast but not in posted MQDs. To test a trip you’re considering, add it and switch Booked off on its flight card.',
      },
      {
        target: 'ledger',
        title: 'All earnings',
        body: 'Every entry in one list. Filter by state to see what’s still waiting to post, and edit entries to match what Delta credits.',
      },
    ],
  },
};
