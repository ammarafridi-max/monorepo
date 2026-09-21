import LinkedInAnalyzer from '../../../../components/tools/LinkedInAnalyzer';
import Faq from '../../../../sections/Faq';
import Container from '../../../../components/Container';
import SectionHeading from '../../../../components/SectionHeading';
import { linkedinPhotoAnalyzer as page } from '../../../../data/pages/linkedin-photo-analyzer';
import { landingMetadata, ROOTS } from '../../../../lib/landingPage';
import {
  SITE_URL,
  buildGraph,
  buildOrganization,
  buildWebsite,
  buildWebPage,
  buildBreadcrumbList,
  buildFAQPage,
} from '../../../../lib/schema';

export const metadata = landingMetadata(page);

const CANONICAL = `${SITE_URL}${page.meta.canonical}`;
const { '@context': _c, ...breadcrumb } = buildBreadcrumbList({
  paths: [{ label: 'Home', path: '/' }, ROOTS.headshots, { label: page.meta.breadcrumb, path: page.meta.canonical }],
});
const schema = buildGraph([
  buildOrganization(),
  buildWebsite(),
  buildWebPage({ canonical: CANONICAL, title: page.meta.title, description: page.meta.description }),
  {
    '@type': 'WebApplication',
    '@id': `${CANONICAL}#app`,
    name: 'LinkedIn Photo Analyzer',
    url: CANONICAL,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: page.meta.description,
  },
  breadcrumb,
  buildFAQPage({
    canonical: CANONICAL,
    title: page.faq.title,
    description: page.meta.description,
    faqs: page.faq.faqs.map((f) => ({ question: f.q, answer: f.a })),
  }),
]);

export default function LinkedInPhotoAnalyzerPage() {
  const { hero, checks, faq } = page;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main>
        <section className="hero hero--landing hero--tool">
          <Container>
            <div className="hero__copy hero__copy--center">
              <p className="eyebrow">{hero.eyebrow}</p>
              <h1 className="display hero__title">{hero.title}</h1>
              <p className="lede">{hero.lede}</p>
            </div>
            <LinkedInAnalyzer />
          </Container>
        </section>

        <section className="section">
          <Container>
            <SectionHeading eyebrow={checks.eyebrow} title={checks.title} lede={checks.lede} />
            <ul className="benefits__grid">
              {checks.items.map((c) => (
                <li className="benefit" key={c.title}>
                  <h3 className="benefit__title">{c.title}</h3>
                  <p className="benefit__body">{c.body}</p>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        <Faq {...faq} />

        <section className="section start">
          <Container>
            <div className="start__inner">
              <SectionHeading
                align="center"
                eyebrow="When the photo is the problem"
                title="Studio headshots from your selfies."
                lede="Upload five to fifteen selfies, pick your backgrounds and outfits, pay once. Delivered in about an hour."
              />
              <a className="btn btn--primary" href="/ai-headshot-generator/about">
                Get my headshots <span className="btn__price">from $9</span>
              </a>
            </div>
          </Container>
        </section>
      </main>
    </>
  );
}
