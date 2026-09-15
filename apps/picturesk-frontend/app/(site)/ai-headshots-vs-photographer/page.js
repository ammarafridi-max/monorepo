import LandingHero from '../../../sections/LandingHero';
import Comparison from '../../../sections/Comparison';
import Benefits from '../../../sections/Benefits';
import UseCases from '../../../sections/UseCases';
import Showcase from '../../../sections/Showcase';
import Pricing from '../../../sections/Pricing';
import Faq from '../../../sections/Faq';
import Container from '../../../components/Container';
import SectionHeading from '../../../components/SectionHeading';
import { aiHeadshotsVsPhotographer as page } from '../../../data/pages/ai-headshots-vs-photographer';
import { FUNNEL, landingMetadata, landingSchema } from '../../../lib/landingPage';

// The "vs" money page. Content lives in data/pages/ai-headshots-vs-photographer.js;
// the table is what makes the page citable, and the section on where a
// photographer still wins is what makes it credible.
export const metadata = landingMetadata(page);

const schema = landingSchema({ ...page, productName: 'AI Headshots' });

export default function AiHeadshotsVsPhotographerPage() {
  const { hero, comparison, benefits, useCases, pricing, faq, cta } = page.sections;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main>
        <LandingHero {...hero} cta="Get my headshots" href={FUNNEL} />
        <Comparison {...comparison} />
        <Benefits {...benefits} />
        <UseCases
          eyebrow={useCases.eyebrow}
          title={useCases.title}
          lede={useCases.lede}
          useCases={useCases.items}
          variant="grid"
        />
        <Showcase />
        <Pricing {...pricing} />
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
