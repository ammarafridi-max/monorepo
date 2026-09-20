import LandingHero from '../../../sections/LandingHero';
import HowItWorks from '../../../sections/HowItWorks';
import Pricing from '../../../sections/Pricing';
import Benefits from '../../../sections/Benefits';
import UseCases from '../../../sections/UseCases';
import Testimonials from '../../../sections/Testimonials';
import Faq from '../../../sections/Faq';
import Container from '../../../components/Container';
import SectionHeading from '../../../components/SectionHeading';
import TrackEvent from '../../../components/TrackEvent';
import { EVENTS } from '../../../lib/analytics';
import { aiDatingPhotos as page } from '../../../data/pages/ai-dating-photos';
import { DATING_FUNNEL, ROOTS, landingMetadata, landingSchema } from '../../../lib/landingPage';

// The AI Dating Photos product page: the canonical home of the second product, and
// the root the dating landing pages breadcrumb from. Same section order as the
// headshot page (hero, process, pricing, why us, who it is for, what people say,
// FAQ, CTA). There is no Showcase yet: it needs a real delivered dating set, and
// the section must not ship with headshot output standing in for it.
export const metadata = landingMetadata(page);

const schema = landingSchema({
  ...page,
  productName: 'AI Dating Photos',
  root: ROOTS.dating,
  price: '19',
});

export default function AiDatingPhotosPage() {
  const { hero, process, pricing, benefits, useCases, testimonials, faq, cta } = page.sections;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <TrackEvent event={EVENTS.LANDING_VIEW} props={{ product: 'dating' }} />
      <main>
        <LandingHero {...hero} cta="Get my dating photos" href={DATING_FUNNEL} from={19} />
        <HowItWorks {...process} />
        <Pricing {...pricing} product="dating" href={DATING_FUNNEL} />
        <Benefits {...benefits} />
        <UseCases
          eyebrow={useCases.eyebrow}
          title={useCases.title}
          lede={useCases.lede}
          useCases={useCases.items}
          variant="grid"
        />
        <Testimonials
          title="What people say about their set."
          lede="The test is not whether the photos look good. It is whether the person who turns up looks like the photos."
          testimonials={testimonials}
        />
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
