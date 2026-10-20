import { Logo } from '@/components/logo';

export function SiteFooter() {
  return (
    <footer className="bg-white pb-10 pt-7 text-[13px] text-muted">
      <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-6">
        <Logo tone="dark" />
        <p className="mt-2.5 max-w-[520px]">
          Estimates only. Not affiliated with Delta Air Lines or American Express. Delta&apos;s posted MQDs are the source of truth.
        </p>
      </div>
    </footer>
  );
}
