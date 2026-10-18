import { getSession } from '@/lib/auth';
import { getDashboardData } from '@/lib/tracker/data';

/** Downloads the signed-in user's tracker as JSON. */
export async function GET() {
  const session = await getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });
  const data = await getDashboardData(session.user.id);
  const body = {
    format: 'statustrack-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    program: data.program.code,
    statusYear: data.tracker.statusYear,
    target: data.tracker.target,
    asOf: data.tracker.asOf,
    cards: data.trackerCards,
    entries: data.entries,
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="statustrack-${data.tracker.statusYear}-backup.json"`,
    },
  });
}
