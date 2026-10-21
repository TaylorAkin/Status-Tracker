'use client';

import { useEffect, useState } from 'react';
import { buttonClass } from '@/components/ui';
import { SignOutButton } from '@/components/sign-out-button';
import { RENTAL_METHOD, STAYS_METHOD } from '@/lib/tracker/methods';
import { HelpMenu } from './help/help-menu';
import { menuItemClass, PopoverMenu } from './popover-menu';
import { useTracker } from './tracker-context';

export const SECTIONS = [
  { id: 'status', label: 'Status' },
  { id: 'plan', label: 'Plan' },
  { id: 'sources', label: 'Sources' },
  { id: 'activity', label: 'Activity' },
] as const;

/** How far below the top of the window a section counts as the one being read: the sticky header's height plus a little. */
const SPY_OFFSET = 120;

/** The id of the last section whose top has scrolled above the offset line. */
function useCurrentSection() {
  const [current, setCurrent] = useState<string>(SECTIONS[0].id);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let id: string = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= SPY_OFFSET) id = s.id;
      }
      setCurrent(atBottom ? SECTIONS.at(-1)!.id : id);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  return current;
}

export function DashboardHeader({ userEmail }: { userEmail: string }) {
  const { data, setSettingsOpen } = useTracker();
  const current = useCurrentSection();

  return (
    // On phones only the section nav sticks (the wrapper becomes `contents`), so the title and buttons scroll away.
    <header className="z-30 mb-6 max-sm:contents sm:sticky sm:top-0 sm:-mx-7 sm:border-b sm:border-line sm:bg-background/90 sm:px-7 sm:backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
        <div className="flex min-w-0 items-baseline gap-3">
          <h1 className="text-lg font-semibold tracking-tight">Delta Status Tracker</h1>
          <span className="text-[11px] font-bold uppercase tracking-[2px] text-accent">{data.tracker.statusYear}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <HelpMenu />
          <button className={buttonClass.secondary} data-help="settings" onClick={() => setSettingsOpen(true)}>
            Settings
          </button>
          <AddMenu />
          <PopoverMenu
            button={<span aria-hidden>{userEmail.slice(0, 1).toUpperCase()}</span>}
            buttonClassName={`${buttonClass.secondary} w-10 px-0 font-semibold`}
            label="Account"
            heading={<span className="block truncate">{userEmail}</span>}
          >
            <a href="/dashboard/export" download className={menuItemClass}>
              Export backup
            </a>
            <SignOutButton className={menuItemClass} />
          </PopoverMenu>
        </div>
      </div>
      <nav
        aria-label="Dashboard sections"
        className="-mb-px flex gap-5 overflow-x-auto text-sm max-sm:sticky max-sm:top-0 max-sm:z-30 max-sm:-mx-4 max-sm:mb-6 max-sm:border-b max-sm:border-line max-sm:bg-background/95 max-sm:px-4 max-sm:pt-2.5 max-sm:backdrop-blur"
      >
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            aria-current={current === s.id ? 'location' : undefined}
            className={`whitespace-nowrap border-b-2 pb-2.5 ${current === s.id ? 'border-accent font-semibold text-foreground' : 'border-transparent text-muted hover:text-foreground'}`}
          >
            {s.label}
          </a>
        ))}
      </nav>
    </header>
  );
}

function AddMenu() {
  const { openEntry, setTripOpen, showSource } = useTracker();
  const bonus = (method: string, title: string, description: string) =>
    openEntry(undefined, { category: 'Qualifying bonuses', method, description, title: `Add ${title} bonus MQDs` });
  const items = [
    { label: 'Flight', run: () => setTripOpen(true) },
    { label: 'Card spend', run: () => showSource('cards') },
    { label: 'Delta Stays bonus', run: () => bonus(STAYS_METHOD, 'Delta Stays', 'Delta Stays bonus MQDs') },
    { label: 'Rental car bonus', run: () => bonus(RENTAL_METHOD, 'Rental cars', 'Rental car bonus MQDs') },
    { label: 'Other earning', run: () => openEntry() },
  ];
  return (
    <PopoverMenu
      button={
        <>
          + Add <span aria-hidden>▾</span>
        </>
      }
      buttonClassName={buttonClass.dark}
      help="add-earning"
      heading="Add an earning"
    >
      {items.map((item) => (
        <button key={item.label} type="button" className={menuItemClass} onClick={item.run}>
          {item.label}
        </button>
      ))}
    </PopoverMenu>
  );
}
