import Hero from '../../../sections/Hero';
import Showcase from '../../../sections/Showcase';
import HowItWorks from '../../../sections/HowItWorks';
import WhatYouGet from '../../../sections/WhatYouGet';
import UseCases from '../../../sections/UseCases';
import Pricing from '../../../sections/Pricing';
import Faq from '../../../sections/Faq';
import Container from '../../../components/Container';
import TrackEvent from '../../../components/TrackEvent';
import { EVENTS } from '../../../lib/analytics';
import { faq } from '../../../data/faq';
import {
  SITE_URL,
  buildMetadata,
  buildGraph,
  buildOrganization,
  buildWebsite,
  buildWebPage,
  buildProduct,
  buildFAQPage,
} from '../../../lib/schema';

// The AI Headshot Generator product page. This is the canonical home of the current
// product; the root (/) permanently redirects here, so the root can later become a
// multi-service hub without migrating this content a second time.
//
// Title <= 60 chars, description <= 160 chars (spaces included), both carrying the
// primary keyword "AI Headshot Generator" and no em dashes. See CLAUDE.md.
const TITLE = 'AI Headshot Generator | Studio Headshots from Selfies';
const DESCRIPTION =
  'Picturesk is an AI Headshot Generator that turns a few selfies into studio-quality professional headshots for LinkedIn. One price, delivered in about an hour.';
const CANONICAL = `${SITE_URL}/ai-headshot-generator`;

export const metadata = buildMetadata({
  title: TITLE,
  description: DESCRIPTION,
  canonical: CANONICAL,
  type: 'website',
});

export default function AiHeadshotGeneratorPage() {
  const schema = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage({ canonical: CANONICAL, title: TITLE, description: DESCRIPTION }),
    buildProduct({
      canonical: CANONICAL,
      name: 'AI Headshots',
      description:
        'Professional AI headshots trained on your own selfies, delivered by email in about an hour.',
      price: '9',
    }),
    buildFAQPage({
      canonical: CANONICAL,
      title: 'Picturesk FAQ',
      description: DESCRIPTION,
      faqs: faq.map((f) => ({ question: f.q, answer: f.a })),
    }),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <TrackEvent event={EVENTS.LANDING_VIEW} />
      <main>
        <Hero />
        <Showcase />
        <HowItWorks />
        <WhatYouGet />
        <UseCases />
        <Pricing />
        <Faq />

        <section className="section start">
          <Container>
            <div className="start__inner center">
              <p className="eyebrow" style={{ justifyContent: 'center' }}>
                Ready when you are
              </p>
              <h2 className="h2">Your headshots, in about an hour.</h2>
              <p className="section__lede" style={{ margin: '14px auto 0' }}>
                Pick your looks, upload your photos, pay once. We handle the rest.
              </p>
              <p style={{ marginTop: 24 }}>
                <a className="btn btn--primary" href="/ai-headshot-generator/select">
                  Get my headshots <span className="btn__price">from $9</span>
                </a>
              </p>
            </div>
          </Container>
        </section>
      </main>
    </>
  );
}
