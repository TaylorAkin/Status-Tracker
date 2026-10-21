'use client';

import { useEffect, useState } from 'react';
import { Logo } from '@/components/logo';
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

/** Header buttons on the sky: outlined white, and solid white for the main action, as on the front page. */
const SKY_BUTTON =
  'inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium ring-1 ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';
const skyButton = {
  outline: `${SKY_BUTTON} bg-white/10 text-white ring-white/40 hover:bg-white/20`,
  solid: `${SKY_BUTTON} bg-white font-semibold text-navy ring-white hover:bg-white/90`,
};

export function DashboardHeader({ userEmail }: { userEmail: string }) {
  const { data, setSettingsOpen } = useTracker();
  const current = useCurrentSection();

  return (
    // On phones only the section nav sticks (both wrappers become `contents`), so the logo and buttons scroll away.
    <header className="z-30 text-white max-sm:contents sm:sticky sm:top-0 sm:bg-sky-deep sm:shadow-[0_1px_0_var(--sky-deep)]">
      <div className="mx-auto w-full max-w-[1200px] max-sm:contents sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pb-2 pt-4 max-sm:px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Logo tone="light" />
            <span aria-hidden className="h-5 w-px bg-white/30" />
            <h1 className="text-sm font-medium text-white/85">
              Delta Medallion <span className="font-semibold text-white">{data.tracker.statusYear}</span>
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <HelpMenu className={skyButton.outline} />
            <button className={skyButton.outline} data-help="settings" onClick={() => setSettingsOpen(true)}>
              Settings
            </button>
            <AddMenu />
            <PopoverMenu
              button={<span aria-hidden>{userEmail.slice(0, 1).toUpperCase()}</span>}
              buttonClassName={`${skyButton.outline} w-10 px-0 font-semibold`}
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
          className="flex gap-6 overflow-x-auto text-sm max-sm:sticky max-sm:top-0 max-sm:z-30 max-sm:bg-sky-deep max-sm:px-4 max-sm:pt-2.5"
        >
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              aria-current={current === s.id ? 'location' : undefined}
              className={`whitespace-nowrap border-b-2 pb-2.5 pt-1 focus-visible:outline-2 focus-visible:outline-white ${current === s.id ? 'border-white font-semibold text-white' : 'border-transparent text-white/75 hover:text-white'}`}
            >
              {s.label}
            </a>
          ))}
        </nav>
      </div>
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
      buttonClassName={skyButton.solid}
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
