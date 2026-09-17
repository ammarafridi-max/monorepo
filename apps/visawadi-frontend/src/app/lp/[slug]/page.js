import { cache } from 'react';
import { notFound } from 'next/navigation';
import { nullOn404 } from '@travel-suite/frontend-shared/services/apiClient';
import { getPublicVisaForResidenceApi } from '@travel-suite/frontend-shared/services/apiVisa';
import VisaDetailPage from '@travel-suite/frontend-shared/pages/client/VisaDetailPage';
import { SITE_URL } from '@/lib/schema';
import { DEFAULT_COUNTRY } from '@/config/countries';
import { WHATSAPP_URL } from '@/config/contact';
import { TRUST_ASSURANCES, TRUST_SUBTITLE, HERO_TRUST_ITEMS } from '@/config/trust';
import { LP_BRAND, LP_TERM, scrubDeep, scrubText } from '@/lib/lp';

export const revalidate = 300;

// Ad landing pages: the /uae/visa/<slug> page with every occurrence of the
// word "visa" replaced, brand included. Not indexed, no schema, no site chrome,
// and no guide links out: an ad click should stay on this page.
const load = cache(async (slug) => {
  const res = await getPublicVisaForResidenceApi(slug, DEFAULT_COUNTRY.code).catch(nullOn404);
  const visa = res?.data ?? res ?? null;
  if (!visa) return null;
  return scrubDeep({ ...visa, sectionGuides: {} });
});

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const visa = await load(slug);
  if (!visa) return { title: 'Not Found', robots: { index: false, follow: false } };
  const title = visa.metaTitle || `${visa.countryName} ${LP_TERM} for UAE residents`;
  const description = visa.metaDescription || visa.heroSubheadline || '';
  return {
    title: { absolute: `${title} | ${LP_BRAND}` },
    description,
    alternates: { canonical: `${SITE_URL}/lp/${slug}` },
    robots: { index: false, follow: false },
    // siteName is inherited from the root layout otherwise, and that carries the brand.
    openGraph: { siteName: LP_BRAND, title, description, images: [visa.heroImageUrl || `${SITE_URL}/og-image.png`] },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const visa = await load(slug);
  if (!visa) notFound();

  return (
    <VisaDetailPage
      visa={visa}
      term={LP_TERM}
      whatsappUrl={WHATSAPP_URL || undefined}
      trustAssurances={scrubDeep(TRUST_ASSURANCES)}
      trustSubtitle={scrubText(TRUST_SUBTITLE)}
      heroTrustItems={scrubDeep(HERO_TRUST_ITEMS)}
      testimonialsSubtitle="Reviews left on Trustpilot by UAE residents who applied with us, quoted as written."
    />
  );
}
