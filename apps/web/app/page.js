import Hero from './Hero';
import Showcase from './Showcase';
import HowItWorks from './HowItWorks';
import WhatYouGet from './WhatYouGet';
import Pricing from './Pricing';
import Faq from './Faq';
import TrackEvent from './TrackEvent';
import { EVENTS } from '../lib/analytics';

// The landing page: marketing only. There is ONE purchase flow now, the routed
// funnel under /generator (select -> upload -> pay), and every CTA here starts it
// at /generator/select. No upload or checkout happens on this page.
export default function HomePage() {
  return (
    <>
      <TrackEvent event={EVENTS.LANDING_VIEW} />
      <main>
        <Hero />
        <Showcase />
        <HowItWorks />
        <WhatYouGet />
        <Pricing />
        <Faq />

        <section className="section start">
          <div className="container">
            <div className="start__inner center">
              <p className="eyebrow" style={{ justifyContent: 'center' }}>
                Ready when you are
              </p>
              <h2 className="h2">Your headshots, in about an hour.</h2>
              <p className="section__lede" style={{ margin: '14px auto 0' }}>
                Pick your looks, upload your photos, pay once. We handle the rest.
              </p>
              <p style={{ marginTop: 24 }}>
                <a className="btn btn--primary" href="/generator/select">
                  Get my headshots <span className="btn__price">$35</span>
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
