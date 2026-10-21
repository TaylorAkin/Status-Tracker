import { Suspense } from 'react';
import { requireUser } from '@/lib/dal';
import { getDashboardData } from '@/lib/tracker/data';
import { Dashboard } from './_components/dashboard';
import { SkyBackdrop } from './_components/sky-backdrop';
import { TourProvider } from './_components/help/tour';
import { TrackerProvider } from './_components/tracker-context';

export const metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <div className="relative isolate flex flex-1 flex-col">
      <SkyBackdrop />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
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
    <div aria-label="Loading your tracker">
      <div className="h-[104px] bg-sky-deep" />
      <div className="mx-auto w-full max-w-[1200px] animate-pulse px-4 pt-10 sm:px-7">
        <div className="h-[260px] rounded-[18px] bg-white/60" />
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <div className="h-[420px] rounded-[18px] bg-white/60" />
          <div className="h-[420px] rounded-[18px] bg-white/60" />
        </div>
      </div>
    </div>
  );
}
