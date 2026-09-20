import LandingHero from '../../../sections/LandingHero';
import Comparison from '../../../sections/Comparison';
import Benefits from '../../../sections/Benefits';
import UseCases from '../../../sections/UseCases';
import Pricing from '../../../sections/Pricing';
import Faq from '../../../sections/Faq';
import Container from '../../../components/Container';
import SectionHeading from '../../../components/SectionHeading';
import { aiDatingPhotosVsPhotographer as page } from '../../../data/pages/ai-dating-photos-vs-photographer';
import { DATING_FUNNEL, ROOTS, landingMetadata, landingSchema } from '../../../lib/landingPage';

// Every section takes its content from data/pages/ai-dating-photos-vs-photographer.js. Breadcrumbs from
// /ai-dating-photos, the canonical home of the dating product.
export const metadata = landingMetadata(page);

const schema = landingSchema({ ...page, productName: 'AI Dating Photos', root: ROOTS.dating, price: '19' });

export default function Page() {
  const { hero, comparison, benefits, useCases, pricing, faq, cta } = page.sections;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main>
        <LandingHero {...hero} cta="Get my dating photos" href={DATING_FUNNEL} from={19} />
        <Comparison {...comparison} />
        <Benefits {...benefits} />
        <UseCases
          eyebrow={useCases.eyebrow}
          title={useCases.title}
          lede={useCases.lede}
          useCases={useCases.items}
          variant="grid"
        />
        <Pricing {...pricing} product="dating" href={DATING_FUNNEL} />
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
              <a className="btn btn--primary" href={DATING_FUNNEL}>
                {cta.button} <span className="btn__price">from $19</span>
              </a>
            </div>
          </Container>
        </section>
      </main>
    </>
  );
}
