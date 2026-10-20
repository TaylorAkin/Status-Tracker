import Image from 'next/image';
import Link from 'next/link';
import cloudBand from '../_assets/cloud-band.webp';

export function ClosingCta() {
  return (
    <section aria-labelledby="closing-heading" className="mt-28 bg-sky-deep text-center text-white">
      <div className="px-4 pt-[72px]">
        <h2 id="closing-heading" className="mx-auto max-w-[700px] text-[clamp(28px,3.6vw,40px)] font-semibold leading-[1.1] tracking-[-1.2px]">
          Plan your next Medallion year with confidence.
        </h2>
        <p className="mt-3 text-[17px]">Free to use. No airline login required.</p>
        <Link
          href="/sign-up"
          className="mt-[30px] inline-block rounded-xl bg-navy px-[22px] py-3.5 font-semibold shadow-[0_6px_20px_rgba(10,30,70,.3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Get started for free
        </Link>
      </div>
      <div className="mt-6 h-48 bg-sky sky-fade" />
      <div className="bg-sky">
        <Image
          src={cloudBand}
          alt=""
          sizes="100vw"
          placeholder="blur"
          className="block h-[220px] w-full object-cover object-bottom mask-t-from-90%"
        />
      </div>
    </section>
  );
}
