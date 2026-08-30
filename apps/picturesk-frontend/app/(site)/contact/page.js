import ContentPage from '../../../components/ContentPage';
import { CONTACT_EMAIL, RESPONSE_TIME } from '../../../data/legal';

export const metadata = {
  title: 'Contact. Picturesk.ai',
  description: 'Reach a human at Picturesk. Support email, response time, and what to include.',
  alternates: { canonical: '/contact' },
};

// Contact: no form, no backend risk. Just the support address, clearly, plus what
// to include so we can help fast. The email is a placeholder to swap for a real
// support inbox (see data/legal.js).
export default function ContactPage() {
  return (
    <ContentPage
      eyebrow="Support"
      title="Contact us"
      lede="Questions, refunds, or a deletion request? Email us and a human will reply."
    >
      <div className="contactcard">
        <p className="contactcard__label">Email</p>
        {/* TODO: swap for the real support address (see data/legal.js). */}
        <a className="contactcard__email" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
        <a className="btn btn--primary contactcard__btn" href={`mailto:${CONTACT_EMAIL}`}>
          Email support
        </a>
      </div>

      <div className="prose">
        <section className="prose__block">
          <h2 className="prose__h2">Response time</h2>
          <p>We aim to reply {RESPONSE_TIME}.</p>
        </section>

        <section className="prose__block">
          <h2 className="prose__h2">What to include</h2>
          <p>
            If your message is about an order, include your order id and the email you
            used to buy. Your order id is on your results page and in your confirmation
            email. It helps us find you fast.
          </p>
        </section>

        <section className="prose__block">
          <h2 className="prose__h2">Refunds and deletion</h2>
          <p>
            A failed run is refunded automatically, so you do not need to contact us for
            that. For anything else, including a request to delete your photos or account,
            email us from the address you used and we will take care of it.
          </p>
          <p className="prose__link">
            <a href="/refunds">Read the Refund Policy</a>
          </p>
        </section>
      </div>
    </ContentPage>
  );
}
