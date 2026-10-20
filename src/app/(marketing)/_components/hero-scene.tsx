'use client';

import Image from 'next/image';
import { useEffect, useRef, type CSSProperties } from 'react';
import plane from '../_assets/plane.webp';
import skyClouds from '@/assets/sky-clouds.webp';

// The gauge and plane were cut from the 1981 × 794 artwork; these are their positions in its pixels. The foreground box
// crops the artwork to just the gauge (with a little room for its round caps) so it can be sized on its own.
const GAUGE = { cx: 990, cy: 392, r: 208, stroke: 28 };
const PLANE = { left: 856, top: 275, width: 269 };
const BOX = { x: 762, y: 164, width: 456, height: 370 };
const ARC = `M${GAUGE.cx - GAUGE.r} ${GAUGE.cy} A${GAUGE.r} ${GAUGE.r} 0 0 1 ${GAUGE.cx + GAUGE.r} ${GAUGE.cy}`;
const pct = (v: number, of: number) => `${(v / of) * 100}%`;

/**
 * The hero artwork: clouds anchored to the bottom of the hero, and the gauge and plane in a stage that fills the space
 * between the copy and the buttons, so neither ever covers the text.
 * On scroll, --fly goes 0 → 1: the gauge fades out and the plane climbs away into the distance.
 */
export function HeroScene({ progress, className }: { progress: number; className: string }) {
  const front = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = front.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const hero = el.closest('section')!;
    let frame = 0;
    const update = () => {
      frame = 0;
      const fly = Math.min(1, Math.max(0, window.scrollY / (hero.offsetHeight * 0.6)));
      el.style.setProperty('--fly', fly.toFixed(3));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      {/* As in design 1a, the clouds are wider than the viewport and hang slightly below the hero. On tall, narrow screens
          they also grow with the hero's height so the cloud bank stays deep. */}
      <div className="pointer-events-none absolute bottom-[-7vw] left-1/2 z-0 w-[max(142vw,1100px)] -translate-x-1/2 sm:w-[max(142vw,calc(clamp(640px,100svh-5rem,920px)*2.2))]">
        <Image
          src={skyClouds}
          alt=""
          sizes="(min-width: 640px) max(142vw, 2024px), 1100px"
          loading="eager"
          fetchPriority="high"
          placeholder="blur"
          className="block h-auto w-full"
        />
      </div>

      <div className={`pointer-events-none relative z-20 flex min-h-0 flex-1 items-center justify-center [container-type:size] ${className}`}>
        {/* Fit the stage: never taller than it, never wider than the screen less a 48px margin each side
            (370/456 ≈ 0.81). On phones the hero can grow, which leaves the stage without a definite height for cqh,
            so the height there is a fixed cap instead. */}
        <div
          ref={front}
          className="relative aspect-[456/370] h-[min(calc(100cqh-32px),420px,calc((100cqw-96px)*0.81))] max-sm:h-[min(232px,calc((100cqw-96px)*0.81))]"
        >
          <svg
            viewBox={`${BOX.x} ${BOX.y} ${BOX.width} ${BOX.height}`}
            className="absolute inset-0 size-full"
            style={{ opacity: 'calc(1 - var(--fly, 0) * 2)' }}
            aria-hidden="true"
          >
            <path d={ARC} pathLength={100} fill="none" stroke="#d6d7db" strokeWidth={GAUGE.stroke} strokeLinecap="round" />
            <path
              d={ARC}
              pathLength={100}
              fill="none"
              strokeWidth={GAUGE.stroke}
              strokeLinecap="round"
              strokeDasharray={`${progress} 100`}
              className="stroke-navy motion-safe:animate-gauge-fill"
              style={{ '--gauge': progress } as CSSProperties}
            />
          </svg>
          <Image
            src={plane}
            alt=""
            sizes="25vw"
            loading="eager"
            className="absolute h-auto will-change-transform"
            style={{
              left: pct(PLANE.left - BOX.x, BOX.width),
              top: pct(PLANE.top - BOX.y, BOX.height),
              width: pct(PLANE.width, BOX.width),
              // Gone by --fly ≈ 0.6, before it can drift over the subhead.
              translate: '0 calc(var(--fly, 0) * -40vh)',
              scale: 'calc(1 - var(--fly, 0) * 0.9)',
              opacity: 'calc(1 - var(--fly, 0) * 1.6)',
            }}
          />
        </div>
      </div>
    </>
  );
}
