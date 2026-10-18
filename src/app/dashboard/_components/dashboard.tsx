'use client';

import { buttonClass } from '@/components/ui';
import { SignOutButton } from '@/components/sign-out-button';
import { EntryDialog } from './entry-dialog';
import { FlightMap } from './flight-map';
import { FlightsSection } from './flights-section';
import { HeadstartsSection } from './headstarts-section';
import { Breakdown, EarningMix } from './insights';
import { Ledger } from './ledger';
import { MonthlySpendSection } from './monthly-spend-section';
import { ProgressChart } from './progress-chart';
import { SettingsDialog } from './settings-dialog';
import { SummaryCard } from './summary-card';
import { TravelBonusesSection } from './travel-bonuses-section';
import { useTracker } from './tracker-context';

export function Dashboard({ userEmail }: { userEmail: string }) {
  const { data, openEntry, setSettingsOpen } = useTracker();
  const year = data.tracker.statusYear;

  return (
    <>
      <header className="mb-8 flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[2px] text-accent">{year} Status Year</p>
          <h1 className="my-2 text-3xl font-semibold tracking-[-1.5px] sm:text-4xl">Delta Status Tracker</h1>
          <p className="text-muted">Delta SkyMiles Medallion Status · {userEmail}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={buttonClass.secondary} onClick={() => setSettingsOpen(true)}>
            Settings
          </button>
          <button className={buttonClass.dark} onClick={() => openEntry()}>
            + Add earning
          </button>
          <SignOutButton />
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        <SummaryCard />
        <div className="flex flex-col gap-5">
          <ProgressChart />
          <Breakdown />
        </div>
      </div>

      <p className="my-5 rounded-lg border border-line px-4 py-3 text-xs leading-relaxed text-muted">
        Earning window: January 1–December 31, {year}, toward the following Medallion year. Posted = actual; potential + projected + pending =
        additional forecast. Enter Delta-posted MQDs when reconciling.
      </p>

      <div className="flex flex-col gap-5">
        <FlightsSection />
        <FlightMap />
        <HeadstartsSection />
        <MonthlySpendSection />
        <TravelBonusesSection />
        <EarningMix />
        <Ledger />
      </div>

      <footer className="mt-6 text-xs leading-relaxed text-muted">
        <strong>Rule notes.</strong> Delta Platinum Medallion&apos;s published threshold is 15,000 MQDs; StatusTrack carries Delta&apos;s published
        thresholds forward as a planning assumption for {year} earning. Update your target if Delta announces a change. Redeemable miles alone do not
        qualify. Forecasts are estimates.{' '}
        <a href="https://www.delta.com/us/en/skymiles/medallion-program/how-to-qualify" target="_blank" rel="noopener" className="underline">
          Delta qualification rules
        </a>
        .<br />
        StatusTrack is not affiliated with, endorsed by, or sponsored by Delta Air Lines or American Express. All trademarks belong to their owners.
      </footer>

      <EntryDialog />
      <SettingsDialog />
    </>
  );
}
