import type { TourKey } from '@/lib/tracker/types';

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
  'summary.posted': {
    title: 'Posted MQDs',
    body: 'MQDs Delta has already credited to your SkyMiles account. Only posted MQDs count toward status today. Mark entries credited when they appear in your account.',
  },
  'summary.forecast': {
    title: 'Total forecast',
    body: 'Posted MQDs plus everything still expected: Pending, Planned, and Potential entries. It is where you would finish the year if your plans happen.',
  },
  'summary.gap': {
    title: 'Actual and forecast gap',
    body: 'Actual gap: MQDs still needed beyond what has posted. Forecast gap: MQDs still needed beyond everything you have planned. A forecast gap of 0 means your plans cover the goal.',
  },
  'summary.pace': {
    title: 'Monthly pace',
    body: 'The actual gap spread evenly across the months left, counting from the as-of date in Settings. Roughly how much needs to post each month to stay on track.',
  },
  'summary.tiers': {
    title: 'Tier progress',
    body: 'Earned means your posted MQDs reach the tier. Projected means your total forecast reaches it. These reflect this year’s tracked earnings, not any status you hold now.',
  },
  'chart.lines': {
    title: 'Reading the chart',
    body: 'Month-end totals as a share of your goal. Solid line: posted. Dashed line: total forecast. Dotted line: an even pace from zero to your goal. Above the dotted line means you are ahead of pace.',
  },
  breakdown: {
    title: 'Where earnings come from',
    body: 'Your MQDs by source. Posted counts what Delta has credited. Forecast adds Pending, Planned, and Potential entries.',
  },
  mix: {
    title: 'Earning mix',
    body: 'A what-if planner. It takes the gap your forecast leaves, splits it between flights and card spend, and shows the fares or spend that would close it. Nothing here is saved.',
  },
  'flights.states': {
    title: 'Flight states',
    body: 'Potential: an idea, not booked yet. Switch Booked on to move a flight to Planned. Switch Credited on to move it to Posted once Delta credits it. Every state except Cancelled counts in the forecast.',
  },
  headstarts: {
    title: 'MQD Headstarts',
    body: 'Some Delta SkyMiles American Express cards add MQDs each year just for holding the card. Mark a Headstart credited when it appears in your SkyMiles account.',
  },
  'monthly-spend': {
    title: 'Monthly card spend',
    body: 'Enter eligible spend for each month and the tracker estimates MQDs at the card’s rate. The second field takes the exact MQDs Delta posts; leave it blank to use the estimate. Edits count once you select Save changes.',
  },
  'travel-bonuses': {
    title: 'Stays and rental bonuses',
    body: 'Some Delta Stays bookings and rental car offers award bonus MQDs. Add them here and mark them credited when they post.',
  },
  'ledger.states': {
    title: 'Activity states',
    body: 'Potential: not booked yet. Planned: booked or expected. Pending: done, waiting for Delta to post it. Posted: credited to your account. Card excluded: from a card you’re considering but haven’t included. A ≈ next to the MQDs means the number is calculated, not entered from Delta.',
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
        title: 'Card Headstarts',
        body: 'Each card’s Headstart shows here. Mark it credited when it posts to your SkyMiles account.',
      },
      {
        target: 'monthly-spend',
        title: 'Monthly card spend',
        body: 'Plan eligible spend for each month. The tracker estimates the MQDs, and you can enter the exact credit once Delta posts it.',
      },
      {
        target: 'add-earning',
        title: 'Flights and bonuses',
        body: 'Use + Add earning for flights, Delta Stays and rental bonuses, or anything else that earns MQDs. Here’s what’s inside.',
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
        body: 'Planned: booked, not flown. Pending: flown, waiting on Delta. Posted: credited. On each flight card, switch Credited on when the MQDs post, and switch Booked off for a trip you haven’t booked yet (Potential). Now add your first flight.',
      },
    ],
  },
  'reading-dashboard': {
    title: 'Reading the dashboard',
    steps: [
      {
        target: 'summary',
        title: 'Your status at a glance',
        body: 'The big number is your posted MQDs against your goal. Below it, a bar across every tier: solid for posted, lighter for your forecast.',
      },
      {
        target: 'summary.gap',
        title: 'Gaps and pace',
        body: 'Actual gap: still needed beyond what’s posted. Forecast gap: still needed beyond everything planned. The line underneath is the monthly pace to close the actual gap.',
      },
      {
        target: 'summary.bar',
        title: 'Tier markers',
        body: 'Each marker is a Medallion tier. A filled marker is earned from posted MQDs; an outlined red one is reached by your forecast. ★ marks your goal.',
      },
      {
        target: 'summary.tiers',
        title: 'Tier tiles',
        body: 'Every tier marked Earned, Projected, or Not reached, with your goal labeled.',
      },
      {
        target: 'chart',
        title: 'Projected totals',
        body: 'Month-end progress as a share of your goal. Solid: posted. Dashed: total forecast. Dotted: an even pace to the goal. Above the dotted line means you’re ahead.',
      },
      {
        target: 'breakdown',
        title: 'Where earnings come from',
        body: 'Posted and forecast MQDs by source, so you can see what’s carrying your year.',
      },
    ],
  },
  'planning-ahead': {
    title: 'Planning ahead',
    steps: [
      {
        target: 'mix',
        title: 'Find your earning mix',
        body: 'Move the slider to split your remaining gap between flights and card spend, and see the fares or spend you’d need. Nothing here is saved.',
      },
      {
        target: 'flights',
        title: 'Potential vs Posted',
        body: 'Potential flights count in your forecast but not in posted MQDs. To test a trip you’re considering, add it and switch Booked off on its flight card.',
      },
      {
        target: 'ledger',
        title: 'Earning activity',
        body: 'Every entry in one list. Filter by state to see what’s still waiting to post, and edit entries to match what Delta credits.',
      },
    ],
  },
};
