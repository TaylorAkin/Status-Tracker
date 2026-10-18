import { getSessionCookie } from 'better-auth/cookies';
import { NextResponse, type NextRequest } from 'next/server';

// Optimistic redirect only: checks that a session cookie exists, not that it's valid.
// Pages still verify the session through the data access layer (src/lib/dal.ts).
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) return NextResponse.redirect(new URL('/sign-in', request.url));
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*'] };
