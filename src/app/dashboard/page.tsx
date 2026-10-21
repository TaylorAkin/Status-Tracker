import { Suspense } from 'react';
import { requireUser } from '@/lib/dal';
import { getDashboardData } from '@/lib/tracker/data';
import { Dashboard } from './_components/dashboard';
import { TourProvider } from './_components/help/tour';
import { TrackerProvider } from './_components/tracker-context';

export const metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 pb-9 sm:px-7">
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
      <TourProvider>
        <Dashboard userEmail={user.email} />
      </TourProvider>
    </TrackerProvider>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse pt-4" aria-label="Loading your tracker">
      <div className="mb-8 h-20 rounded-lg bg-line" />
      <div className="h-[260px] rounded-2xl bg-line" />
      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <div className="h-[420px] rounded-2xl bg-line" />
        <div className="h-[420px] rounded-2xl bg-line" />
      </div>
    </div>
  );
}
