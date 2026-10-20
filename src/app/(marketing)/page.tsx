import { ClosingCta } from './_components/closing-cta';
import { Features } from './_components/features';
import { Hero } from './_components/hero';
import { HowItWorks } from './_components/how-it-works';
import { ProductPreview } from './_components/product-preview';
import { SiteFooter } from './_components/site-footer';
import { SiteHeader } from './_components/site-header';

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <ProductPreview />
        <Features />
        <HowItWorks />
        <ClosingCta />
      </main>
      <SiteFooter />
    </>
  );
}
