'use client';

import { useEffect, useState } from 'react';
import type { Airports } from '@/lib/engine';

let cache: Promise<Airports> | null = null;

/** Lazily loads airport coordinates (~500KB) once per page; null while loading or on failure. */
export function useAirports(): { airports: Airports | null; error: boolean } {
  const [state, setState] = useState<{ airports: Airports | null; error: boolean }>({ airports: null, error: false });
  useEffect(() => {
    cache ??= fetch('/data/airports.json').then((r) => {
      if (!r.ok) throw new Error('Airport lookup failed');
      return r.json();
    });
    let live = true;
    cache.then(
      (airports) => live && setState({ airports, error: false }),
      () => {
        cache = null;
        if (live) setState({ airports: null, error: true });
      },
    );
    return () => {
      live = false;
    };
  }, []);
  return state;
}
