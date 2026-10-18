import type { Tier } from './types';

export type TierMarkState = 'earned' | 'projected' | 'none';

export interface TierProgress {
  /** Highest tier reached by posted credit. */
  actual: Tier | undefined;
  /** Highest tier reached by the full forecast. */
  forecast: Tier | undefined;
  /** Lowest tier not yet reached by posted credit. */
  next: Tier | undefined;
}

/** `tiers` must be sorted by ascending threshold. */
export function tierProgress(tiers: Tier[], posted: number, forecast: number): TierProgress {
  const reached = (v: number) => [...tiers].reverse().find((t) => v >= t.threshold);
  return { actual: reached(posted), forecast: reached(forecast), next: tiers.find((t) => posted < t.threshold) };
}

export function tierMarkState(tier: Tier, posted: number, forecast: number): TierMarkState {
  if (posted >= tier.threshold) return 'earned';
  if (forecast >= tier.threshold) return 'projected';
  return 'none';
}

/** The progress bar spans the goal or the top tier, whichever is larger. */
export function progressScale(tiers: Tier[], target: number): number {
  return Math.max(target, tiers[tiers.length - 1]?.threshold ?? target);
}
