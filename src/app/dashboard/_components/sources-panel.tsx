'use client';

import { credit } from '@/lib/engine';
import { fmt } from '@/lib/format';
import { HEADSTART_METHOD } from '@/lib/tracker/methods';
import { tabPanelId, Tabs } from '@/components/ui';
import { FlightsSection } from './flights-section';
import { HeadstartsSection } from './headstarts-section';
import { MonthlySpendSection } from './monthly-spend-section';
import { TravelBonusesSection } from './travel-bonuses-section';
import { useTracker, type SourceTab } from './tracker-context';

const ID = 'sources';

/** Flights, cards (Headstarts and monthly spend), and other bonuses, one tab at a time. */
export function SourcesPanel() {
  const { activeEntries, sourceTab, setSourceTab } = useTracker();
  const forecast = (test: (e: (typeof activeEntries)[number]) => boolean) =>
    activeEntries.filter((e) => e.state !== 'Cancelled' && test(e)).reduce((sum, e) => sum + credit(e), 0);
  const totals: Record<SourceTab, number> = {
    flights: forecast((e) => e.category === 'Flights'),
    cards: forecast((e) => e.category === 'Credit card spend' || e.method === HEADSTART_METHOD),
    bonuses: forecast((e) => e.category === 'Qualifying bonuses' && e.method !== HEADSTART_METHOD),
  };
  const label = (name: string, tab: SourceTab) => (
    <>
      {name} <span className="ml-1 font-normal tabular-nums text-muted">{fmt(totals[tab])}</span>
    </>
  );

  return (
    <div data-help="sources">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          idBase={ID}
          label="Where your MQDs come from"
          value={sourceTab}
          onChange={setSourceTab}
          tabs={[
            { value: 'flights', label: label('Flights', 'flights') },
            { value: 'cards', label: label('Cards', 'cards') },
            { value: 'bonuses', label: label('Bonuses', 'bonuses') },
          ]}
        />
        <p className="text-xs text-muted">Forecast MQDs by source</p>
      </div>
      <div role="tabpanel" id={tabPanelId(ID, sourceTab)} aria-labelledby={`${ID}-tab-${sourceTab}`} className="flex flex-col gap-5">
        {sourceTab === 'flights' && <FlightsSection />}
        {sourceTab === 'cards' && (
          <>
            <HeadstartsSection />
            <MonthlySpendSection />
          </>
        )}
        {sourceTab === 'bonuses' && <TravelBonusesSection />}
      </div>
    </div>
  );
}
