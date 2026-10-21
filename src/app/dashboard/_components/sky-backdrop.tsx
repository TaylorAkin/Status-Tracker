import Image from 'next/image';
import skyClouds from '@/assets/sky-clouds.webp';

/**
 * The front page's sky behind the top of the dashboard: --sky-deep under the header fading into --sky, the hero's cloud
 * bank, then a fade into the page background. The panels sit on top of it and the rest of the page continues below.
 */
export function SkyBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[980px] overflow-hidden bg-sky sm:h-[860px]" aria-hidden="true">
      <div className="h-56 sky-fade" />
      <div className="absolute bottom-0 left-1/2 w-[max(150vw,1100px)] -translate-x-1/2 sm:w-[max(118vw,1700px)]">
        <Image
          src={skyClouds}
          alt=""
          sizes="(min-width: 640px) max(118vw, 1700px), max(150vw, 1100px)"
          loading="eager"
          fetchPriority="high"
          placeholder="blur"
          className="block h-auto w-full mask-t-from-60%"
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent to-background" />
    </div>
  );
}
