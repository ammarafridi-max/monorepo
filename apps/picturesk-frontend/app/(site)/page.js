import HubHero from '../../sections/HubHero';
import HowItWorks from '../../sections/HowItWorks';
import Services from '../../sections/Services';
import Benefits from '../../sections/Benefits';
import Showcase from '../../sections/Showcase';
import Testimonials from '../../sections/Testimonials';
import Faq from '../../sections/Faq';
import Container from '../../components/Container';
import SectionHeading from '../../components/SectionHeading';
import GetStartedButton from '../../components/GetStartedButton';
import { hub } from '../../data/hub';
import { samples, datingSamples } from '../../data/samples';
import {
  SITE_URL,
  buildMetadata,
  buildGraph,
  buildOrganization,
  buildWebsite,
  buildWebPage,
  buildFAQPage,
} from '../../lib/schema';

// The hub. It owns the brand and the category ("AI photos from selfies") and sends
// visitors into one of the product funnels; each product page owns its own
// keyword and its own Product schema, so the hub carries an ItemList of the
// services instead of claiming a price for two different things.
const CANONICAL = `${SITE_URL}/`;

export const metadata = buildMetadata({
  title: hub.meta.title,
  description: hub.meta.description,
  canonical: CANONICAL,
  type: 'website',
});

export default function HomePage() {
  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({ canonical: CANONICAL, title: hub.meta.title, description: hub.meta.description }),
    {
      '@type': 'ItemList',
      '@id': `${CANONICAL}#services`,
      name: 'Picturesk services',
      itemListElement: hub.services.items.map((s, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: s.title,
        url: `${SITE_URL}${s.learn}`,
      })),
    },
    buildFAQPage({
      canonical: CANONICAL,
      title: hub.faq.title,
      description: hub.meta.description,
      faqs: hub.faq.faqs.map((f) => ({ question: f.q, answer: f.a })),
    }),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main>
        <HubHero {...hub.hero} />
        <HowItWorks
          lede="Both services run on the same three steps. You upload once, we train a model on your face, and the set you chose lands in your inbox."
        />
        <Services {...hub.services} />
        <Benefits />
        <Showcase
          title="Real selfies in, real sets out."
          lede="Every set below started as ordinary phone selfies. Same person, same face, two different briefs."
          samples={[...samples, ...datingSamples]}
        />
        <Testimonials />
        <Faq {...hub.faq} />

        <section className="section start">
          <Container>
            <div className="start__inner">
              <SectionHeading align="center" eyebrow={hub.cta.eyebrow} title={hub.cta.title} lede={hub.cta.lede} />
              <GetStartedButton />
            </div>
          </Container>
        </section>
      </main>
    </>
  );
}
