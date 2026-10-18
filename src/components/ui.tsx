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

const STATE_STYLES: Record<EntryState, string> = {
  Posted: 'bg-[#e4f3ea] text-[#0a6e56]',
  Pending: 'bg-[#edf1f3] text-foreground',
  Planned: 'bg-[#edf1f3] text-foreground',
  Potential: 'bg-[#f4ebd8] text-[#796039]',
  Cancelled: 'bg-[#f1f1f1] text-muted line-through',
};

export function StatePill({ state, children }: { state: EntryState; children?: ReactNode }) {
  return (
    <span className={`inline-block shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATE_STYLES[state]}`}>
      {children ?? stateLabel(state)}
    </span>
  );
}

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
  primary: 'rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-accent disabled:opacity-45',
  dark: 'rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-white hover:bg-foreground/90 disabled:opacity-45',
  secondary: 'rounded-lg border border-line bg-surface px-4 py-2.5 text-sm hover:bg-[#edf3f0] disabled:opacity-45',
  link: 'text-xs text-accent underline hover:text-brand',
};

export const inputClass =
  'w-full min-w-0 rounded-md border border-[#cdd7d4] bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/40 disabled:bg-[#f6f7f6]';
export const labelClass = 'mb-1.5 block text-xs font-semibold';
