'use client';

import type { ReactNode } from 'react';
import { DashboardHeader } from './dashboard-header';
import { EntryDialog } from './entry-dialog';
import { ReadingBanner } from './help/reading-banner';
import { EarningMix } from './insights';
import { Ledger } from './ledger';
import { NeedsAttention } from './needs-attention';
import { ProgressChart } from './progress-chart';
import { SettingsDialog } from './settings-dialog';
import { SourcesPanel } from './sources-panel';
import { StatusCard } from './status-card';
import { TripDialog } from './trip-dialog';
import { useTracker } from './tracker-context';

/** A page section the header's nav links to. */
function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-28">
      <h2 id={`${id}-heading`} className="mb-3 text-[11px] font-bold uppercase tracking-[2px] text-muted">
        {title}
      </h2>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

export function Dashboard({ userEmail }: { userEmail: string }) {
  const { data } = useTracker();
  const year = data.tracker.statusYear;

  return (
    <>
      <DashboardHeader userEmail={userEmail} />
      <ReadingBanner />

      <div className="flex flex-col gap-10">
        <Section id="status" title="Where you stand">
          <StatusCard />
          <NeedsAttention />
        </Section>

        <Section id="plan" title="Closing the gap">
          <div className="grid gap-5 lg:grid-cols-2">
            <ProgressChart />
            <EarningMix />
          </div>
        </Section>

        <Section id="sources" title="Where your MQDs come from">
          <SourcesPanel />
        </Section>

        <Section id="activity" title="Activity">
          <Ledger />
        </Section>
      </div>

      <footer className="mt-10 space-y-1.5 border-t border-line pt-5 text-xs leading-relaxed text-muted">
        <p>
          <strong className="text-foreground">Estimates only.</strong> MQDs here are calculated from what you enter. The MQDs Delta posts to your
          SkyMiles account are the source of truth, so enter them when you reconcile.
        </p>
        <p>
          <strong className="text-foreground">Rules can change.</strong> Tier thresholds are Delta&apos;s currently published Medallion qualification
          levels, used as a planning assumption for {year} earning. Update your goal in Settings if Delta announces changes.{' '}
          <a href="https://www.delta.com/us/en/skymiles/medallion-program/how-to-qualify" target="_blank" rel="noopener" className="underline">
            Delta&apos;s qualification rules
          </a>
          .
        </p>
        <p>
          <strong className="text-foreground">Not affiliated</strong> with Delta Air Lines or American Express. Redeemable SkyMiles do not count
          toward Medallion status. All trademarks belong to their owners.
        </p>
      </footer>

      <EntryDialog />
      <TripDialog />
      <SettingsDialog />
    </>
  );
}
