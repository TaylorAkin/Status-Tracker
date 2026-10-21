import 'server-only';

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { headers } from 'next/headers';
import { db } from './db';
import * as schema from './db/schema';

// On Vercel, derive the auth origin from system env vars so production and preview
// deployments work without setting BETTER_AUTH_URL per environment.
const https = (host?: string) => (host ? `https://${host}` : undefined);
const { VERCEL_ENV, VERCEL_PROJECT_PRODUCTION_URL, VERCEL_BRANCH_URL, VERCEL_URL } = process.env;
const deploymentOrigin = VERCEL_ENV === 'production' ? https(VERCEL_PROJECT_PRODUCTION_URL) : https(VERCEL_BRANCH_URL) || https(VERCEL_URL);
const vercelOrigins = [VERCEL_PROJECT_PRODUCTION_URL, VERCEL_BRANCH_URL, VERCEL_URL].map(https).filter((o): o is string => !!o);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || deploymentOrigin,
  trustedOrigins: vercelOrigins,
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  // Must stay last so Server Actions can set auth cookies.
  plugins: [nextCookies()],
});

/** The signed-in session for the current request, or null. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}
