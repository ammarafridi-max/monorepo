import Navbar from '@travel-suite/frontend-shared/components/v2/sections/Navbar';
import Footer from '@travel-suite/frontend-shared/components/v2/sections/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'Terms & Conditions — TravelShield',
  description:
    'Read the Terms and Conditions governing your use of the TravelShield travel insurance comparison and purchase platform.',
};

const LAST_UPDATED = '1 April 2025';

const SECTIONS = [
  {
    id: 'definitions',
    title: '1. Definitions',
    content: [
      '"TravelShield", "we", "our", "us" means TravelShield, the operator of this travel insurance comparison and intermediary platform.',
      '"Platform" means the TravelShield website and any associated digital services through which you can compare and purchase travel insurance.',
      '"Insurer" means the licensed insurance company that underwrites and issues the travel insurance policy you purchase through the Platform. The identity of the Insurer will be clearly shown before you complete any purchase.',
      '"Policy" means the insurance contract issued directly to you by the Insurer, comprising the policy schedule, certificate of insurance, and the Insurer\'s own policy wording.',
      '"You" or "User" means any person who accesses or uses the Platform, whether to obtain a quote, purchase a policy, or for any other purpose.',
      '"Quote" means an indicative price and coverage summary for a travel insurance policy, generated based on the trip details you provide.',
    ],
  },
  {
    id: 'our-role',
    title: '2. Our Role as Intermediary',
    content: [
      'TravelShield operates as an insurance intermediary — also referred to as a broker or agent. We are not an insurance company and we do not underwrite or issue insurance policies.',
      'Our role is to help you compare travel insurance products from a panel of partner Insurers and to facilitate the purchase of a policy directly between you and your chosen Insurer. When you purchase through our Platform, the resulting contract of insurance is between you and the Insurer — not between you and TravelShield.',
      'We earn a commission from Insurers when a policy is purchased through our Platform. This commission is paid by the Insurer and does not increase the premium you pay. The price displayed on our Platform is the same as the price the Insurer would charge you directly. We are required to disclose this commercial arrangement and do so transparently.',
      'Nothing on this Platform constitutes a guarantee of coverage. All coverage is subject to the terms and conditions of the individual Policy issued by the Insurer.',
    ],
  },
  {
    id: 'using-the-platform',
    title: '3. Using the Platform',
    content: [
      'You may use the Platform to obtain travel insurance quotes and to purchase policies from our partner Insurers. Use of the Platform for any unlawful purpose, or in a manner that disrupts or damages the service, is strictly prohibited.',
      'To use the Platform you must be at least 18 years of age. By using the Platform you confirm that you meet this requirement.',
      'Quotes generated on the Platform are indicative and based on the information you provide. A binding policy is only formed when the Insurer accepts your application and issues a policy schedule and certificate of insurance.',
      'All content on this Platform — including text, graphics, logos, and software — is the property of TravelShield or its licensors and is protected by applicable intellectual property laws. You may not reproduce or redistribute any content without our prior written consent.',
    ],
  },
  {
    id: 'your-responsibilities',
    title: '4. Your Responsibilities',
    content: [
      'You are responsible for ensuring that all information you provide when obtaining a quote or purchasing a policy is accurate, complete, and not misleading. This includes your personal details, trip dates, destinations, and any declarations about your health or travel history.',
      'Material misrepresentation or non-disclosure of relevant facts may invalidate your Policy and lead to claims being declined by the Insurer. We are not responsible for any consequences arising from information you provide that is inaccurate or incomplete.',
      'You are responsible for reading the Policy documents issued by the Insurer carefully before travel. It is your responsibility to ensure the Policy you select is appropriate for your needs.',
      'You should retain copies of your policy schedule and certificate of insurance in an accessible location during your trip. In the event of a claim, you will need these documents.',
    ],
  },
  {
    id: 'purchase-process',
    title: '5. The Purchase Process',
    content: [
      'When you select a policy and proceed to purchase through the Platform, you will be presented with a summary of the key coverage terms and the total premium before payment is taken.',
      'Payment is due in full at the time of purchase. We accept major debit and credit cards and selected digital payment methods. All transactions are processed securely.',
      'Upon successful payment, your application is transmitted to the Insurer for processing. The Insurer will issue your policy schedule and certificate of insurance directly to your email address, typically within a few minutes. TravelShield does not issue or hold your policy documents.',
      'If you do not receive your policy documents within 30 minutes of a successful payment, please contact us at the details on our Contact page.',
    ],
  },
  {
    id: 'cooling-off',
    title: '6. Cooling-Off Period and Cancellation',
    content: [
      'Many Insurers offer a cooling-off period — typically 14 days from the date of purchase — during which you may cancel your Policy for a full refund, provided you have not yet travelled and no claim has been made. The exact cooling-off terms are set by the Insurer and will be stated in your Policy documents.',
      'After the cooling-off period, cancellations and refunds are subject to the Insurer\'s own cancellation policy, which is set out in your Policy documents. TravelShield does not control or manage refund decisions after policy issuance.',
      'To request a cancellation, you should contact the Insurer directly using the contact details provided in your Policy documents. You may also contact us and we will assist you in reaching the Insurer.',
    ],
  },
  {
    id: 'claims',
    title: '7. Making a Claim',
    content: [
      'All insurance claims are handled directly by the Insurer that issued your Policy. TravelShield is not party to the claims process and does not adjudicate, accept, or pay claims.',
      'In the event of an emergency or incident requiring a claim, you should contact the Insurer\'s emergency assistance line, which is printed on your policy certificate and policy documents. Keep these documents accessible during your trip.',
      'For non-emergency claims, follow the claims process set out in your Policy documents. Generally this will involve notifying the Insurer promptly, submitting supporting documentation, and allowing the Insurer a reasonable period to assess your claim.',
      'If you have difficulty contacting your Insurer or navigating the claims process, please reach out to us and we will do our best to help direct you to the right contact.',
    ],
  },
  {
    id: 'remuneration',
    title: '8. Our Remuneration',
    content: [
      'TravelShield receives commission from Insurers on policies purchased through the Platform. The amount of commission varies by Insurer and product but is included within the premium set by the Insurer. It does not represent an additional charge to you.',
      'We may also receive other forms of remuneration from Insurers, such as volume-based payments or marketing fees. These arrangements do not affect the objectivity of the quotes we display.',
      'You have the right to request further information about the remuneration we receive in connection with any specific policy. Please contact us if you wish to exercise this right.',
    ],
  },
  {
    id: 'liability',
    title: '9. Limitation of Liability',
    content: [
      'TravelShield\'s liability is limited to our role as intermediary — facilitating the comparison and purchase of insurance products from partner Insurers. We are not liable for any acts, omissions, or decisions made by the Insurer in connection with your Policy, including claims decisions.',
      'We are not liable for any indirect, consequential, or economic loss arising from your use of the Platform, including loss resulting from your reliance on quotes, coverage summaries, or other information displayed on the Platform. All coverage descriptions are summaries only — the full terms of your Policy are those issued by the Insurer.',
      'Our total liability to you in connection with these Terms shall not exceed the commission we received in connection with the Policy to which your claim relates.',
      'Nothing in these Terms excludes or limits our liability for death or personal injury caused by our negligence, for fraud or fraudulent misrepresentation, or for any other liability that cannot be excluded under applicable law.',
    ],
  },
  {
    id: 'complaints',
    title: '10. Complaints',
    content: [
      'If you are unhappy with any aspect of our service — including the way we have presented information, facilitated your purchase, or responded to your queries — please contact us:',
      'By email: complaints@travelshield.com\nBy phone: Contact details available on our Contact page',
      'We will acknowledge your complaint promptly and aim to provide a substantive response within 14 business days.',
      'If your complaint relates to the Insurer\'s handling of your Policy or a claim, you should raise that complaint directly with the Insurer in the first instance. The Insurer\'s complaints process will be set out in your Policy documents.',
    ],
  },
  {
    id: 'governing-law',
    title: '11. Governing Law',
    content: [
      'These Terms and Conditions and any dispute arising in connection with them shall be governed by and construed in accordance with applicable law.',
      'Nothing in these Terms affects any statutory rights you may have as a consumer under the laws of the country in which you reside.',
    ],
  },
  {
    id: 'changes',
    title: '12. Changes to These Terms',
    content: [
      'We may update these Terms & Conditions from time to time. The revised version will be posted on this page with an updated "last updated" date.',
      'Continued use of the Platform after revised Terms take effect constitutes your acceptance of those Terms. We recommend reviewing this page periodically.',
    ],
  },
];

const TOC = SECTIONS.map(({ id, title }) => ({ id, title }));

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 font-sans">
      <Navbar />
      <main className="flex-1">

        <div className="bg-gradient-to-br from-primary-700 via-primary-600 to-accent-500 text-white">
          <div className="max-w-4xl mx-auto px-6 py-16 md:py-20">
            <p className="text-xs font-semibold text-primary-200 uppercase tracking-widest mb-3">Legal</p>
            <h1 className="text-3xl md:text-4xl font-extrabold">Terms &amp; Conditions</h1>
            <p className="mt-3 text-primary-200 text-sm">Last updated: {LAST_UPDATED}</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-12 items-start">

          <aside className="hidden lg:block sticky top-8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Contents</p>
            <nav className="flex flex-col gap-1">
              {TOC.map(({ id, title }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="text-sm text-gray-500 hover:text-primary-700 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors leading-snug"
                >
                  {title}
                </a>
              ))}
            </nav>
            <div className="mt-8 bg-primary-50 rounded-2xl p-4 border border-primary-100">
              <p className="text-xs font-bold text-primary-700 mb-1">Need help?</p>
              <p className="text-xs text-gray-500 mb-3">
                Our team is happy to explain any part of these terms.
              </p>
              <Link href="/contact" className="text-xs font-semibold text-primary-700 hover:underline">
                Contact us →
              </Link>
            </div>
          </aside>

          <article className="min-w-0">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-10 flex gap-3">
              <span className="text-amber-500 text-lg shrink-0">ⓘ</span>
              <p className="text-sm text-amber-800 leading-relaxed">
                TravelShield is an insurance intermediary, not an insurer. These Terms govern
                your use of our comparison and purchase platform. The insurance contract itself
                is between you and the Insurer named on your policy documents.
              </p>
            </div>

            <div className="flex flex-col gap-12">
              {SECTIONS.map(({ id, title, content }) => (
                <section key={id} id={id} className="scroll-mt-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                    {title}
                  </h2>
                  <div className="flex flex-col gap-3">
                    {content.map((para, i) => (
                      <p key={i} className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                        {para}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-14 pt-8 border-t border-gray-100 flex flex-wrap gap-4 text-sm text-gray-500">
              <span>Related:</span>
              <Link href="/privacy" className="text-primary-700 hover:underline font-medium">
                Privacy Policy
              </Link>
              <Link href="/contact" className="text-primary-700 hover:underline font-medium">
                Contact Us
              </Link>
              <Link href="/insurance-booking/quote" className="text-primary-700 hover:underline font-medium">
                Get a Quote
              </Link>
            </div>
          </article>

        </div>
      </main>
      <Footer />
    </div>
  );
}
