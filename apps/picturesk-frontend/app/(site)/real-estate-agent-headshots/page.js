import LandingHero from '../../../sections/LandingHero';
import HowItWorks from '../../../sections/HowItWorks';
import Benefits from '../../../sections/Benefits';
import UseCases from '../../../sections/UseCases';
import Showcase from '../../../sections/Showcase';
import Pricing from '../../../sections/Pricing';
import Faq from '../../../sections/Faq';
import Container from '../../../components/Container';
import SectionHeading from '../../../components/SectionHeading';
import { realEstateAgentHeadshots as page } from '../../../data/pages/real-estate-agent-headshots';
import { FUNNEL, landingMetadata, landingSchema } from '../../../lib/landingPage';

// Every section on this page takes its content from data/pages/real-estate-agent-headshots.js.
// Nothing here is hardcoded copy, so the page can be rewritten without touching JSX,
// and the same section components serve the home page and every landing page.
export const metadata = landingMetadata(page);

const schema = landingSchema({ ...page, productName: 'AI Real Estate Agent Headshots' });

export default function RealEstateAgentHeadshotsPage() {
  const { hero, process, benefits, useCases, pricing, faq, cta } = page.sections;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main>
        <LandingHero {...hero} cta="Get my agent headshots" href={FUNNEL} />
        <HowItWorks {...process} />
        <Benefits {...benefits} />
        <Showcase />
        <UseCases
          eyebrow={useCases.eyebrow}
          title={useCases.title}
          lede={useCases.lede}
          useCases={useCases.items}
          variant="grid"
        />
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
