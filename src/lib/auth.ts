import 'server-only';

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { headers } from 'next/headers';
import { db } from './db';
import * as schema from './db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  // Must stay last so Server Actions can set auth cookies.
  plugins: [nextCookies()],
});

/** The signed-in session for the current request, or null. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}
