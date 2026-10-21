'use client';

import type { ComponentProps, ReactNode } from 'react';
import type { EntryState } from '@/lib/engine';
import { stateLabel } from '@/lib/format';

export function Panel({ className = '', ...props }: ComponentProps<'section'>) {
  return <section className={`rounded-2xl border border-line bg-surface p-5 shadow-[0_4px_20px_#172c3305] sm:p-6 ${className}`} {...props} />;
}

export function PanelHead({ title, sub, children }: { title: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {sub && <p className="mt-1 text-xs leading-relaxed text-muted">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Hint({ className = '', ...props }: ComponentProps<'p'>) {
  return <p className={`mt-2 text-xs leading-relaxed text-muted ${className}`} {...props} />;
}

/** One color per state, shared by the status bar, its legend, and every state pill. */
export const STATE_COLORS: Record<Exclude<EntryState, 'Cancelled'>, string> = {
  Posted: '#003366',
  Pending: '#3f6f9e',
  Planned: '#93b4d4',
  Potential: '#c9d8e6',
};

/** Potential is drawn hatched: counted in the forecast, but not booked. */
export const POTENTIAL_FILL = `repeating-linear-gradient(135deg, ${STATE_COLORS.Potential} 0 3px, transparent 3px 6px)`;

export function StateSwatch({ state, className = '' }: { state: Exclude<EntryState, 'Cancelled'>; className?: string }) {
  return (
    <i
      aria-hidden
      className={`inline-block size-2.5 shrink-0 rounded-[3px] ${state === 'Potential' ? 'border border-[#93a9bf]' : ''} ${className}`}
      style={{ background: state === 'Potential' ? POTENTIAL_FILL : STATE_COLORS[state] }}
    />
  );
}

export function StatePill({ state, children }: { state: EntryState; children?: ReactNode }) {
  const cancelled = state === 'Cancelled';
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-0.5 text-[11px] font-medium ${cancelled ? 'text-muted line-through' : ''}`}
    >
      {!cancelled && <StateSwatch state={state} className="size-2 rounded-full" />}
      {children ?? stateLabel(state)}
    </span>
  );
}

/** The bordered inner card used inside panels for one card, bonus type, or Headstart. */
export function InnerCard({ muted, className = '', ...props }: ComponentProps<'div'> & { muted?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-line border-t-[3px] border-t-[#e6c4cb] p-5 ${muted ? 'bg-[#f6f7f6]' : 'bg-[linear-gradient(135deg,#fff_12%,#f4f3f2_62%,#edf1f7)]'} ${className}`}
      {...props}
    />
  );
}

export function EmptyState({ className = '', ...props }: ComponentProps<'div'>) {
  return <div className={`rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted ${className}`} {...props} />;
}

/** A small label above a number. */
export function Stat({ label, value, className = '' }: { label: ReactNode; value: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <small className="flex items-center gap-1.5 text-xs text-muted">{label}</small>
      <strong className="mt-0.5 block text-[22px] font-semibold tabular-nums text-brand">{value}</strong>
    </div>
  );
}

/** A row of tabs. The caller renders the panel for `value` with `id={tabPanelId(idBase, value)}`. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  idBase,
  label,
}: {
  tabs: { value: T; label: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  idBase: string;
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="inline-flex max-w-full overflow-x-auto rounded-lg border border-line bg-[#f6f7f6] p-0.5"
      onKeyDown={(e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        const i = tabs.findIndex((t) => t.value === value);
        const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length].value;
        onChange(next);
        e.currentTarget.querySelector<HTMLElement>(`#${CSS.escape(`${idBase}-tab-${next}`)}`)?.focus();
      }}
    >
      {tabs.map((t) => {
        const selected = t.value === value;
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            id={`${idBase}-tab-${t.value}`}
            aria-selected={selected}
            aria-controls={tabPanelId(idBase, t.value)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.value)}
            className={`whitespace-nowrap rounded-md px-3.5 py-2 text-sm ${selected ? 'bg-surface font-semibold shadow-sm' : 'text-muted hover:text-foreground'}`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export const tabPanelId = (idBase: string, value: string) => `${idBase}-panel-${value}`;

export function Switch({
  checked,
  onChange,
  label,
  disabled,
  size = 'md',
  hideLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  hideLabel?: boolean;
}) {
  const track = size === 'sm' ? 'h-[19px] w-8' : 'h-6 w-[42px]';
  const knob = size === 'sm' ? 'size-[13px] peer-checked:translate-x-[13px]' : 'size-[18px] peer-checked:translate-x-[18px]';
  return (
    <label
      className={`inline-flex items-center gap-2 ${size === 'sm' ? 'text-[11px]' : 'text-sm'} ${disabled ? 'cursor-default opacity-50' : 'cursor-pointer'}`}
    >
      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          role="switch"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={hideLabel ? label : undefined}
        />
        <span
          className={`${track} rounded-full bg-[#dce4e1] transition peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand`}
        />
        <span className={`absolute left-[3px] top-[3px] ${knob} rounded-full bg-white shadow transition`} />
      </span>
      {!hideLabel && <span>{label}</span>}
    </label>
  );
}

export const buttonClass = {
  primary: 'inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-accent disabled:opacity-45',
  dark: 'inline-flex h-10 items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-white hover:bg-foreground/90 disabled:opacity-45',
  secondary:
    'inline-flex h-10 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm hover:bg-[#edf3f0] disabled:opacity-45',
  link: 'text-xs text-accent underline hover:text-brand',
};

// Every text input, date input, and select shares one height (40px, matching buttons).
export const inputClass =
  'block h-10 w-full min-w-0 rounded-md border border-[#cdd7d4] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-brand/40 disabled:bg-[#f6f7f6]';
export const selectClass = `${inputClass} select-chevron`;
/** Toolbar select that sizes to its content instead of filling the row. */
export const inlineSelectClass = selectClass.replace('w-full', 'w-auto');
export const labelClass = 'mb-1.5 block text-xs font-semibold';
