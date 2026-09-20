import LandingHero from '../../../sections/LandingHero';
import Pricing from '../../../sections/Pricing';
import Benefits from '../../../sections/Benefits';
import Faq from '../../../sections/Faq';
import Container from '../../../components/Container';
import SectionHeading from '../../../components/SectionHeading';
import { pricingPage as page } from '../../../data/pages/pricing';
import { FUNNEL, DATING_FUNNEL, landingMetadata, landingSchema } from '../../../lib/landingPage';

// The pricing page. Content comes from data/pages/pricing.js, but the PLAN FACTS
// come from the shared pricing catalogue via the Pricing section, so the page can
// never quote a price or a count the funnel does not actually sell.
export const metadata = landingMetadata(page);

const schema = landingSchema({ ...page, productName: 'AI Headshots' });

export default function PricingPage() {
  const { hero, pricing, benefits, faq, cta } = page.sections;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main>
        <LandingHero {...hero} cta="Get my headshots" href={FUNNEL} />
        <Pricing {...pricing} />
        <Pricing
          eyebrow="Dating photos"
          title="Dating photos. Three packs, one time."
          lede="Same engine, a different brief: candid photos in real places for Hinge, Tinder and Bumble. From $19, no subscription."
          cta="Get my dating photos"
          product="dating"
          href={DATING_FUNNEL}
        />
        <Benefits {...benefits} />
        <Faq {...faq} />

        <section className="section start">
          <Container>
            <div className="start__inner">
              <SectionHeading
                align="center"
                eyebrow={cta.eyebrow}
                title={cta.title}
                lede={cta.lede}
              />
              <a className="btn btn--primary" href={FUNNEL}>
                {cta.button} <span className="btn__price">from $9</span>
              </a>
            </div>
          </Container>
        </section>
      </main>
    </>
  );
}
