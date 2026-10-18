'use client';

import { useState } from 'react';
import { credit, flightArc, flightName, flightRouteCodes, mapPoint } from '@/lib/engine';
import { fmt, stateLabel } from '@/lib/format';
import { buttonClass, Panel, PanelHead, Switch } from '@/components/ui';
import { useAirports } from './use-airports';
import { useTracker } from './tracker-context';

const ROUTE_COLOR = '#b5122b';

/** SVG path for projected points, breaking where a route wraps across the antimeridian. */
function routePath(points: [number, number][], offset: number) {
  const adjusted = points.map((pt, i): [number, number] => {
    if (!offset || i === 0 || i === points.length - 1) return pt;
    const a = points[i - 1];
    const b = points[i + 1];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const d = offset * Math.sin((Math.PI * i) / (points.length - 1));
    return [pt[0] - ((b[1] - a[1]) / len) * d, pt[1] + ((b[0] - a[0]) / len) * d];
  });
  return adjusted
    .map((pt, i) => (i === 0 || Math.abs(pt[0] - adjusted[i - 1][0]) > 500 ? 'M' : 'L') + pt.map((v) => v.toFixed(2)).join(','))
    .join('');
}

export function FlightMap() {
  const { data, unit } = useTracker();
  const { airports, error } = useAirports();
  const [worldView, setWorldView] = useState(false);
  const [showIata, setShowIata] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const active = data.entries.filter((e) => e.category === 'Flights' && e.state !== 'Cancelled');
  const rows = airports
    ? active.map((e) => ({ ...e, codes: flightRouteCodes(e) })).filter((e) => e.codes.length >= 2 && e.codes.every((c) => airports[c]))
    : [];
  const legs = rows.flatMap((e) =>
    e.codes.slice(1).map((to, i) => {
      const from = e.codes[i];
      const a = airports![from];
      const b = airports![to];
      return { entry: e, from, to, points: flightArc([a[0], a[1]], [b[0], b[1]]) };
    }),
  );

  let box = [0, 0, 1000, 500];
  const all = legs.flatMap((l) => l.points);
  if (!worldView && all.length) {
    const xs = all.map((p) => p[0]);
    const ys = all.map((p) => p[1]);
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const w = Math.min(1000, Math.max(440, maxX - minX + 100, (maxY - minY + 90) * 2.3));
    const h = w / 2.3;
    box = [Math.max(0, Math.min(1000 - w, (minX + maxX - w) / 2)), Math.max(0, Math.min(500 - h, (minY + maxY - h) / 2)), w, h];
  }
  const scale = box[2] / 1000;
  const codes = [...new Set(rows.flatMap((e) => e.codes))];
  const sel = rows.find((e) => e.id === selected);
  const posted = rows.filter((e) => e.state === 'Posted').length;
  const missing = active.length - rows.length;

  return (
    <Panel>
      <PanelHead
        title={`${data.tracker.statusYear} Flight Map`}
        sub="Potential and projected routes become solid when their MQDs credit to your account."
      >
        <Switch label="IATA labels" checked={showIata} onChange={setShowIata} />
        <button className={buttonClass.secondary} onClick={() => setWorldView(false)}>
          Fit routes
        </button>
        <button className={buttonClass.secondary} onClick={() => setWorldView(true)}>
          World view
        </button>
      </PanelHead>
      <div className="mb-4 flex flex-wrap gap-5 text-[11px] text-muted">
        <span className="inline-flex items-center gap-2">
          <i className="w-6 border-t-2 border-dashed border-[#62757c]" />
          Potential / projected / pending
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="w-6 border-t-2 border-[#62757c]" />
          Credited
        </span>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-[#dbe6e8] bg-[#f0f6f7]">
        <svg
          viewBox={box.join(' ')}
          role="img"
          aria-label={`Map of ${rows.length} flights; dashed forecast routes and solid credited routes`}
          className="block aspect-[2.3] h-auto max-h-[480px] min-h-[240px] w-full"
        >
          <rect width="1000" height="500" fill="#f0f6f7" />
          <image href="/data/world-land.svg" x="0" y="0" width="1000" height="500" />
          {legs
            .slice()
            .sort((a, b) => Number(a.entry.state === 'Posted') - Number(b.entry.state === 'Posted'))
            .map((l, i) => {
              const corridor = legs.filter((o) => [o.from, o.to].sort().join() === [l.from, l.to].sort().join());
              const offset = (corridor.indexOf(l) - (corridor.length - 1) / 2) * 8 * scale * (l.from < l.to ? 1 : -1);
              const d = routePath(l.points, offset);
              const isSel = l.entry.id === selected;
              const label = `${l.from} to ${l.to} · ${l.entry.description} · ${l.entry.date} · ${l.entry.state === 'Posted' ? 'Credited' : stateLabel(l.entry.state)}`;
              return (
                <g key={`${l.entry.id}-${i}`}>
                  <path
                    d={d}
                    fill="none"
                    stroke={ROUTE_COLOR}
                    strokeWidth={isSel ? 3 : 2}
                    strokeDasharray={l.entry.state === 'Posted' ? undefined : `${6 * scale} ${5 * scale}`}
                    strokeLinecap="round"
                    opacity={isSel ? 1 : 0.8}
                    vectorEffect="non-scaling-stroke"
                  />
                  <path
                    d={d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="16"
                    vectorEffect="non-scaling-stroke"
                    className="cursor-pointer focus:outline-none"
                    tabIndex={0}
                    role="button"
                    aria-label={label}
                    onClick={() => setSelected(l.entry.id)}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault();
                        setSelected(l.entry.id);
                      }
                    }}
                  >
                    <title>{label}</title>
                  </path>
                </g>
              );
            })}
          {codes.map((code) => {
            const [x, y] = mapPoint(airports![code][0], airports![code][1]);
            const left = x > box[0] + box[2] - 45 * scale;
            return (
              <g key={code}>
                <circle cx={x} cy={y} r={3.6 * scale} fill="#fff" stroke="#27464e" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
                {showIata && (
                  <text
                    x={x + (left ? -8 : 8) * scale}
                    y={y - 7 * scale}
                    textAnchor={left ? 'end' : 'start'}
                    fontSize={12 * scale}
                    fontWeight="700"
                    fill="#27464e"
                    stroke="#f3f8f8"
                    strokeWidth={3 * scale}
                    paintOrder="stroke"
                    strokeLinejoin="round"
                  >
                    {code}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {!rows.length && (
          <div className="absolute inset-x-[8%] top-[40%] rounded-lg bg-white/90 p-4 text-center text-sm text-muted sm:inset-x-[15%]">
            {error
              ? 'Airport coordinates could not load. Reload to retry.'
              : airports
                ? 'No mappable flights yet. Add a flight with an airport route like DCA-ATL.'
                : 'Loading airport coordinates…'}
          </div>
        )}
      </div>

      <div className="mt-3.5 min-h-11 text-xs leading-relaxed text-muted" aria-live="polite">
        {sel ? (
          <>
            <strong className="block text-foreground">{flightName(sel)}</strong>
            {sel.description} · {sel.date} · {sel.state === 'Posted' ? 'Credited' : stateLabel(sel.state)} · {fmt(credit(sel))} {unit}
          </>
        ) : (
          'Select a route to see its flight details.'
        )}
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-3 text-[10px] text-muted">
        <span>
          {rows.length} mapped flights · {posted} credited · {rows.length - posted} awaiting credit
          {missing ? ` · ${missing} need valid airport routes` : ''}
        </span>
        <span>
          Map:{' '}
          <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener" className="underline">
            Natural Earth
          </a>{' '}
          · Airports:{' '}
          <a href="https://ourairports.com/data/" target="_blank" rel="noopener" className="underline">
            OurAirports
          </a>
        </span>
      </div>
    </Panel>
  );
}
