import Navbar from '@travel-suite/frontend-shared/components/v2/sections/Navbar';
import Footer from '@travel-suite/frontend-shared/components/v2/sections/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — TravelShield',
  description:
    'Learn how TravelShield collects, uses, and protects your personal data when you use our travel insurance comparison platform.',
};

const LAST_UPDATED = '1 April 2025';

const SECTIONS = [
  {
    id: 'introduction',
    title: '1. Introduction',
    content: [
      'TravelShield ("we", "our", "us") operates a travel insurance comparison and purchase platform. This Privacy Policy explains how we collect, use, share, and protect your personal information when you use our website or services.',
      'We are committed to handling your data responsibly and in accordance with applicable data protection laws. Please read this policy carefully before using our platform.',
      'By using our services, you confirm that you have read and understood this policy. If you do not agree with how we handle your data, please stop using our services.',
    ],
  },
  {
    id: 'data-we-collect',
    title: '2. Data We Collect',
    content: [
      'We collect information you provide directly to us, information generated through your use of the platform, and information from third parties.',
      'Information you provide: full name, date of birth, nationality, passport number, email address, phone number, home address, travel dates and destinations, number of travellers, and any health or medical disclosures required to generate an accurate quote.',
      'Information collected automatically: IP address, browser type and version, operating system, pages visited, time spent on pages, referring URLs, and device identifiers. We use cookies and similar technologies — see Section 9 for full details.',
      'Information from third parties: our partner Insurers may share data with us in limited circumstances, such as to confirm a policy has been issued or to assist with an administrative query.',
    ],
  },
  {
    id: 'how-we-use',
    title: '3. How We Use Your Data',
    content: [
      'We use your personal information for the following purposes:',
      '• Quote generation: to retrieve relevant travel insurance quotes from our partner Insurers based on your trip details.',
      '• Policy purchase: to transmit your application to the Insurer you select and facilitate the issuance of your policy.',
      '• Customer support: to respond to your queries, assist with policy documents, and help you navigate the claims process with your Insurer.',
      '• Account management: if you create an account, to manage your profile, saved quotes, and purchase history.',
      '• Legal compliance: to meet our obligations under applicable laws and regulations.',
      '• Fraud prevention: to detect and prevent fraudulent activity on our platform.',
      '• Service improvement: to analyse how the platform is used and improve our products and user experience.',
      '• Marketing: where you have given consent, to send you relevant offers and travel insurance updates. You can withdraw consent at any time.',
      'Our legal bases for processing are: contract performance (to provide the service you request), legal obligation, legitimate interests, and consent (for marketing only).',
    ],
  },
  {
    id: 'data-sharing',
    title: '4. Sharing Your Data',
    content: [
      'We do not sell your personal data. We share it only in the following circumstances:',
      '• Partner Insurers: when you request a quote, we transmit the necessary trip and personal details to the relevant Insurer(s) to generate accurate pricing. When you purchase a policy, we share your full application data with the selected Insurer to issue your policy.',
      '• Service providers: IT infrastructure providers, payment processors, and analytics platforms that support the operation of our platform. These providers act as data processors under contract and may only use your data for specified purposes.',
      '• Legal and regulatory bodies: where required by law, court order, or a lawful request from a regulatory authority.',
      '• Fraud prevention: to identify and prevent fraudulent use of our platform.',
      'All third parties are required to process your data securely and solely for the purposes for which it was shared.',
    ],
  },
  {
    id: 'international-transfers',
    title: '5. International Data Transfers',
    content: [
      'Some of our partner Insurers and service providers may be based in countries outside your own. Where personal data is transferred internationally, we ensure that appropriate safeguards are in place to protect your data.',
      'In the event of an overseas emergency, your data may be shared with local medical providers, assistance companies, or authorities in the country where you are travelling, as required to administer your Policy.',
    ],
  },
  {
    id: 'data-retention',
    title: '6. Data Retention',
    content: [
      'We retain your personal data for as long as necessary to fulfil the purposes for which it was collected, including any applicable legal or regulatory requirements.',
      'Quote and purchase records are retained for a minimum of 7 years to support potential disputes, regulatory audits, or customer queries.',
      'If you created an account, your account data is retained until you request its deletion, subject to any legal retention obligations.',
      'Marketing preferences are retained until you withdraw consent or request erasure.',
    ],
  },
  {
    id: 'your-rights',
    title: '7. Your Rights',
    content: [
      'You have the following rights in relation to your personal data:',
      '• Right of access: request a copy of the personal data we hold about you.',
      '• Right to rectification: request correction of inaccurate or incomplete data.',
      '• Right to erasure: request deletion of your data where there is no compelling reason for us to retain it.',
      '• Right to restriction: request that we limit how we process your data in certain circumstances.',
      '• Right to data portability: receive your data in a structured, commonly used, machine-readable format.',
      '• Right to object: object to processing based on our legitimate interests or for direct marketing.',
      'To exercise any of these rights, please contact us using the details in Section 12. We will respond within 30 days. If you believe we have not handled your data correctly, you also have the right to lodge a complaint with the relevant data protection authority in your country.',
    ],
  },
  {
    id: 'security',
    title: '8. Security',
    content: [
      'We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, alteration, disclosure, or destruction. These include SSL/TLS encryption for data in transit, encryption for data at rest, role-based access controls, and regular security reviews.',
      'Payment card data is processed exclusively by our PCI DSS-compliant payment processor. We do not store payment card details on our systems.',
      'Despite these measures, no transmission over the internet is entirely secure. You use our platform at your own risk, and we cannot guarantee absolute security.',
    ],
  },
  {
    id: 'cookies',
    title: '9. Cookies',
    content: [
      'Our platform uses cookies and similar technologies to support its operation, analyse usage, and (where you have consented) support marketing.',
      'We use: strictly necessary cookies (required for the platform to function correctly), performance cookies (to understand how the platform is used), functional cookies (to remember your preferences), and targeting cookies (for advertising, only with your explicit consent).',
      'You can manage cookie preferences through the cookie banner shown on your first visit, or by adjusting your browser settings. Disabling certain cookies may affect the functionality of the platform.',
    ],
  },
  {
    id: 'children',
    title: '10. Children\'s Privacy',
    content: [
      'Our platform is intended for use by adults aged 18 and over. We do not knowingly collect personal data from children under 18.',
      'If a child is included as a traveller on a policy purchased through our platform, the relevant personal data is provided by and consented to by the adult purchasing the policy.',
      'If you believe we have inadvertently collected data from a child without appropriate consent, please contact us immediately.',
    ],
  },
  {
    id: 'changes',
    title: '11. Changes to This Policy',
    content: [
      'We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. We will post the updated policy on this page with a revised "last updated" date.',
      'For material changes, we will notify you by email where we hold your address. Continued use of our services after the effective date of an updated policy constitutes acceptance of those changes.',
    ],
  },
  {
    id: 'contact',
    title: '12. Contact Us',
    content: [
      'If you have any questions about this Privacy Policy or how we handle your personal data, please contact us:',
      'Email: privacy@travelshield.com\nContact form: available on our Contact page',
      'We will respond to all data-related queries within 30 days.',
    ],
  },
];

const TOC = SECTIONS.map(({ id, title }) => ({ id, title }));

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 font-sans">
      <Navbar />
      <main className="flex-1">

        <div className="bg-gradient-to-br from-primary-700 via-primary-600 to-accent-500 text-white">
          <div className="max-w-4xl mx-auto px-6 py-16 md:py-20">
            <p className="text-xs font-semibold text-primary-200 uppercase tracking-widest mb-3">Legal</p>
            <h1 className="text-3xl md:text-4xl font-extrabold">Privacy Policy</h1>
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
              <p className="text-xs font-bold text-primary-700 mb-1">Questions?</p>
              <p className="text-xs text-gray-500 mb-3">
                Contact us about how we handle your data.
              </p>
              <Link
                href="mailto:privacy@travelshield.com"
                className="text-xs font-semibold text-primary-700 hover:underline"
              >
                privacy@travelshield.com
              </Link>
            </div>
          </aside>

          <article className="min-w-0">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-10 flex gap-3">
              <span className="text-amber-500 text-lg shrink-0">ⓘ</span>
              <p className="text-sm text-amber-800 leading-relaxed">
                TravelShield is a travel insurance comparison platform, not an insurer. This
                policy describes how we handle your data as an intermediary. When you purchase
                a policy, the Insurer will also process your data in accordance with their own
                privacy policy.
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
              <Link href="/terms" className="text-primary-700 hover:underline font-medium">
                Terms &amp; Conditions
              </Link>
              <Link href="/contact" className="text-primary-700 hover:underline font-medium">
                Contact Us
              </Link>
            </div>
          </article>

        </div>
      </main>
      <Footer />
    </div>
  );
}
