import { Suspense } from 'react';
import { requireUser } from '@/lib/dal';
import { getDashboardData } from '@/lib/tracker/data';
import { Dashboard } from './_components/dashboard';
import { TrackerProvider } from './_components/tracker-context';

export const metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-9 sm:px-7">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}

async function DashboardContent() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);
  return (
    <TrackerProvider initial={data}>
      <Dashboard userEmail={user.email} />
    </TrackerProvider>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse" aria-label="Loading your tracker">
      <div className="mb-8 h-24 w-80 rounded-lg bg-line" />
      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        <div className="h-[640px] rounded-2xl bg-line" />
        <div className="h-[640px] rounded-2xl bg-line" />
      </div>
    </div>
  );
}
