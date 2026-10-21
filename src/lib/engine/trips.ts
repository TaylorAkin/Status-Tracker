import { routeMiles, SEPARATORS, type Airports, type RouteLeg } from './routes';
import type { Entry } from './types';

/** One ticket of a trip: outbound or return, with its own route, date, and fare. */
export interface TicketInput {
  route: string;
  date: string;
  fare: number;
}

export interface TripLeg extends RouteLeg {
  date: string;
  /** Index of the ticket in the trip: 0 = outbound, 1 = return. */
  ticket: number;
  /** Order of the leg within its ticket. */
  leg: number;
  /** This leg's share of its ticket's fare. */
  fare: number;
}

const cents = (v: number) => Math.round(v * 100) / 100;

/** Splits a fare across legs in proportion to their miles, in cents, with the remainder on the last leg so the shares add up exactly. */
export function splitFare(miles: number[], fare: number): number[] {
  const total = miles.reduce((sum, m) => sum + m, 0);
  const shares = miles.map((m) => cents(total ? (fare * m) / total : fare / miles.length));
  if (shares.length) shares[shares.length - 1] = cents(fare - shares.slice(0, -1).reduce((sum, s) => sum + s, 0));
  return shares;
}

/** The same airports in reverse order, e.g. "DCA-ATL-LAX" → "LAX-ATL-DCA". */
export function reverseRoute(route: string): string {
  return route.toUpperCase().trim().split(SEPARATORS).filter(Boolean).reverse().join('-');
}

/** One leg per pair of airports on each ticket, with the ticket's fare split by distance. Throws on an invalid route. */
export function tripLegs(airports: Airports, tickets: TicketInput[]): TripLeg[] {
  return tickets.flatMap((t, ticket) => {
    const { legs } = routeMiles(airports, t.route);
    const fares = splitFare(
      legs.map((l) => l.miles),
      t.fare,
    );
    return legs.map((l, leg) => ({ ...l, date: t.date, ticket, leg, fare: fares[leg] }));
  });
}

/** A trip's legs in flight order, or a standalone entry on its own. */
export interface FlightGroup {
  tripId?: string;
  legs: Entry[];
}

/** Groups flight entries into trips by tripId, keeping the order of each group's first entry. */
export function groupTrips(entries: Entry[]): FlightGroup[] {
  const groups: FlightGroup[] = [];
  const byTrip = new Map<string, FlightGroup>();
  for (const e of entries) {
    if (!e.tripId) {
      groups.push({ legs: [e] });
      continue;
    }
    let g = byTrip.get(e.tripId);
    if (!g) {
      g = { tripId: e.tripId, legs: [] };
      byTrip.set(e.tripId, g);
      groups.push(g);
    }
    g.legs.push(e);
  }
  for (const g of byTrip.values())
    g.legs.sort((a, b) => (a.ticket ?? 0) - (b.ticket ?? 0) || (a.leg ?? 0) - (b.leg ?? 0) || a.date.localeCompare(b.date));
  return groups;
}
