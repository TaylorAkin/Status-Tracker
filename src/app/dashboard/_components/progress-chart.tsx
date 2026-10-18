'use client';

import { chartScalePercent, chartSeries } from '@/lib/engine';
import { fmt, MONTH_SHORT } from '@/lib/format';
import { Panel, PanelHead } from '@/components/ui';
import { useTracker } from './tracker-context';

const ACTUAL = '#003366';
const FORECAST = '#b5122b';

function stepPath(values: number[], x: (i: number) => number, y: (v: number) => number) {
  let path = `M ${x(0)} ${y(values[0])}`;
  for (let i = 1; i < values.length; i++) path += ` H ${x(i)} V ${y(values[i])}`;
  return path;
}

export function ProgressChart() {
  const { data, activeEntries, unit } = useTracker();
  const target = data.tracker.target;
  const series = chartSeries(activeEntries, 'DL');
  const scale = chartScalePercent(series, target);
  const x = (i: number) => 48 + i * 46;
  const y = (v: number) => 385 - ((v / target) * 100 * 340) / scale;
  const last = series[12];

  return (
    <Panel className="flex flex-col">
      <PanelHead title={`${data.tracker.statusYear} projected totals`} sub="Cumulative progress as a percentage of goal" />
      <div className="flex flex-1 flex-col justify-center">
        <svg
          viewBox="0 0 640 430"
          role="img"
          aria-label="Cumulative month-end posted and forecast progress"
          className="h-auto w-full overflow-visible"
        >
          <defs>
            <clipPath id="chart-clip">
              <rect x="46" y="30" width="558" height="360" />
            </clipPath>
          </defs>
          {[0, scale / 2, scale].map((p) => (
            <g key={p}>
              <line x1="48" x2="600" y1={y((target * p) / 100)} y2={y((target * p) / 100)} stroke="#e4e9e7" />
              <text x="4" y={y((target * p) / 100) + 4} className="fill-muted text-[11px]">
                {Math.round(p)}%
              </text>
            </g>
          ))}
          <line x1="48" y1="385" x2="600" y2={y(target)} stroke="#abb8b3" strokeDasharray="2 5" />
          <g clipPath="url(#chart-clip)">
            <path
              d={stepPath(
                series.map((v) => v.actual),
                x,
                y,
              )}
              fill="none"
              stroke={ACTUAL}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d={stepPath(
                series.map((v) => v.forecast),
                x,
                y,
              )}
              fill="none"
              stroke={FORECAST}
              strokeWidth="2"
              strokeDasharray="6 5"
              strokeLinejoin="round"
            />
            {series.slice(1).map((v, i) => (
              <circle key={i} cx={x(i + 1)} cy={y(v.forecast)} r="3" fill="white" stroke={FORECAST} strokeWidth="1.5">
                <title>{`${MONTH_SHORT[i]} forecast: ${fmt(v.forecast)} ${unit}; posted: ${fmt(v.actual)} ${unit}`}</title>
              </circle>
            ))}
          </g>
          {MONTH_SHORT.map((m, i) => (
            <text key={m} x={x(i + 1)} y="410" textAnchor="middle" className="fill-muted text-[11px]">
              {m}
            </text>
          ))}
        </svg>
      </div>
      <p className="mt-2 text-xs text-muted">
        Month-end totals · Posted: <strong className="text-foreground">{fmt(last.actual)}</strong> · Total forecast:{' '}
        <strong className="text-foreground">{fmt(last.forecast)}</strong> {unit}
      </p>
      <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted">
        <span style={{ color: ACTUAL }}>━ Posted earnings</span>
        <span style={{ color: FORECAST }}>– – Total forecast</span>
        <span>··· Even monthly pace</span>
      </div>
    </Panel>
  );
}
