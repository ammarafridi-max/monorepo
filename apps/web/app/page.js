import { getSession } from '../lib/session';
import UploadForm from './UploadForm';
import Hero from './Hero';
import Showcase from './Showcase';
import HowItWorks from './HowItWorks';
import WhatYouGet from './WhatYouGet';
import Pricing from './Pricing';
import Faq from './Faq';
import TrackEvent from './TrackEvent';
import { EVENTS } from '../lib/analytics';

// The landing page. A server component so a logged-in user's order can be linked
// and their email prefilled; anonymous visitors get the exact same flow as before.
// Every section is presentational; the ONLY interactive piece is UploadForm, whose
// behavior is unchanged. All CTAs scroll to that one uploader (#start).
export default async function HomePage() {
  const session = await getSession();

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

        <section id="start" className="section start">
          <div className="container">
            <div className="start__inner">
              <p className="eyebrow">Start your order</p>
              <h2 className="h2">Upload your selfies.</h2>
              <p className="section__lede">
                Five to fifteen clear photos of one person. We check them as you add
                them, so you never pay for photos that will not work.
              </p>
              <UploadForm authed={!!session} initialEmail={session?.email ?? ''} />
              <p className="formnote start__agree">
                By continuing you agree to our <a href="/terms">Terms</a> and{' '}
                <a href="/privacy">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
