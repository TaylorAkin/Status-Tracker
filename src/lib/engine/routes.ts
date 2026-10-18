import type { Entry } from './types';

/** IATA code → [lat, lon, name], as in public/data/airports.json. */
export type Airports = Record<string, [number, number, string]>;

const SEPARATORS = /[\s,;>→–—-]+/;

/** Airport codes from the explicit route, falling back to a route written in the description. */
export function flightRouteCodes(e: Pick<Entry, 'route' | 'description'>): string[] {
  const explicit = String(e.route || '')
    .toUpperCase()
    .trim()
    .split(SEPARATORS)
    .filter(Boolean);
  if (explicit.length >= 2 && explicit.every((c) => /^[A-Z]{3}$/.test(c))) return explicit;
  const match = String(e.description || '')
    .toUpperCase()
    .match(/\b[A-Z]{3}(?:\s*(?:→|–|—|-|>|\bTO\b)\s*[A-Z]{3})+\b/);
  return match ? match[0].split(/\s*(?:→|–|—|-|>|\bTO\b)\s*/) : [];
}

/** "DCA → SEA" when a route is known, otherwise the description. */
export function flightName(e: Pick<Entry, 'route' | 'description'>): string {
  const codes = flightRouteCodes(e);
  return codes.length >= 2 ? codes.join(' → ') : e.description;
}

export interface RouteLeg {
  from: string;
  to: string;
  miles: number;
}

const EARTH_RADIUS_MILES = 3958.7613;
const rad = (x: number) => (x * Math.PI) / 180;

/** Great-circle statute miles, rounded per leg, doubled for a round trip. Throws on invalid input. */
export function routeMiles(airports: Airports, route: string, roundtrip = false) {
  const codes = route.toUpperCase().trim().split(SEPARATORS).filter(Boolean);
  if (codes.length < 2 || codes.length > 20) throw new Error('Enter 2–20 airport codes, including each connection.');
  for (const code of codes) {
    if (!/^[A-Z]{3}$/.test(code) || !airports[code]) {
      throw new Error(`Unknown airport code: ${code}. Use a three-letter airport code, not a city code.`);
    }
  }
  const legs: RouteLeg[] = [];
  for (let i = 1; i < codes.length; i++) {
    if (codes[i] === codes[i - 1]) throw new Error('Consecutive airports must be different.');
    const a = airports[codes[i - 1]];
    const b = airports[codes[i]];
    const dlat = rad(b[0] - a[0]);
    const dlon = rad(b[1] - a[1]);
    const h = Math.sin(dlat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dlon / 2) ** 2;
    const miles = Math.round(EARTH_RADIUS_MILES * 2 * Math.asin(Math.sqrt(Math.max(0, Math.min(1, h)))));
    legs.push({ from: codes[i - 1], to: codes[i], miles });
  }
  return { codes, legs, miles: legs.reduce((sum, l) => sum + l.miles, 0) * (roundtrip ? 2 : 1) };
}

/** Equirectangular projection onto a 1000×500 map. */
export function mapPoint(lat: number, lon: number): [number, number] {
  return [((lon + 180) / 360) * 1000, ((90 - lat) / 180) * 500];
}

/** 65 projected points along the great circle between two [lat, lon] positions. */
export function flightArc(from: [number, number], to: [number, number]): [number, number][] {
  const r = Math.PI / 180;
  const vec = (p: [number, number]) => [Math.cos(p[0] * r) * Math.cos(p[1] * r), Math.cos(p[0] * r) * Math.sin(p[1] * r), Math.sin(p[0] * r)];
  const a = vec(from);
  const b = vec(to);
  const angle = Math.acos(
    Math.max(
      -1,
      Math.min(
        1,
        a.reduce((v, x, i) => v + x * b[i], 0),
      ),
    ),
  );
  const sin = Math.sin(angle);
  const points: [number, number][] = [];
  for (let i = 0; i <= 64; i++) {
    const t = i / 64;
    const v =
      Math.abs(sin) < 1e-8
        ? a.map((x, j) => x * (1 - t) + b[j] * t)
        : a.map((x, j) => (x * Math.sin((1 - t) * angle)) / sin + (b[j] * Math.sin(t * angle)) / sin);
    points.push(mapPoint(Math.atan2(v[2], Math.hypot(v[0], v[1])) / r, Math.atan2(v[1], v[0]) / r));
  }
  return points;
}
