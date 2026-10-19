/**
 * Postgres connection string. Locally this is DATABASE_URL; the Vercel–Neon integration
 * provides it as STATUS_TRACKER_DATABASE_URL.
 */
export function databaseUrl(): string {
  const url = process.env.DATABASE_URL || process.env.STATUS_TRACKER_DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL (or STATUS_TRACKER_DATABASE_URL) is not set');
  return url;
}
