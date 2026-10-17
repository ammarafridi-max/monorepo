'use client';

import { useState } from 'react';
import { trackVisaLeadOpen } from '@travel-suite/frontend-shared/utils/analytics';
import VisaHero from '@travel-suite/frontend-shared/components/sections/v1/VisaHero';
import VisaQualifiers from '@travel-suite/frontend-shared/components/sections/v1/VisaQualifiers';
import VisaProcess from '@travel-suite/frontend-shared/components/sections/v1/VisaProcess';
import VisaRequirements from '@travel-suite/frontend-shared/components/sections/v1/VisaRequirements';
import VisaPricingBreakdown from '@travel-suite/frontend-shared/components/sections/v1/VisaPricingBreakdown';
import VisaTrust from '@travel-suite/frontend-shared/components/sections/v1/VisaTrust';
import VisaTestimonials from '@travel-suite/frontend-shared/components/sections/v1/VisaTestimonials';
import VisaFaqSection from '@travel-suite/frontend-shared/components/sections/v1/VisaFaqSection';
import VisaFinalCta from '@travel-suite/frontend-shared/components/sections/v1/VisaFinalCta';
import VisaInlineCta from '@travel-suite/frontend-shared/components/sections/v1/VisaInlineCta';
import LeadFormModal from '@travel-suite/frontend-shared/components/forms/v1/LeadFormModal';
import PackageSegments from './PackageSegments';
import StickyPriceBar from './StickyPriceBar';

export default function VisaDetailAppPage({
  visa,
  schema,
  breadcrumbJsonLd,
  whatsappUrl,
  trustAssurances = [],
  trustSubtitle = '',
  heroTrustItems = [],
  testimonialsSubtitle,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPackage, setModalPackage] = useState('undecided');
  const [modalSource, setModalSource] = useState('hero_cta');

  function openModal(pkg, src) {
    setModalPackage(pkg);
    setModalSource(src);
    setModalOpen(true);
    trackVisaLeadOpen({ visaSlug: visa?.slug, packageRequested: pkg, source: src });
  }

  if (!visa) return null;

  const guides = visa.sectionGuides || {};
  const cheapest = (visa.packages ?? []).reduce(
    (min, p) => (min == null || Number(p.price) < Number(min.price) ? p : min),
    null,
  );
  const ctaText = visa.heroCtaText || 'Get free consultation';
  const country = visa.countryName || '';

  return (
    <>
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}

      <VisaHero
        headline={visa.heroHeadline}
        subheadline={visa.heroSubheadline}
        ctaText={visa.heroCtaText}
        imageUrl={visa.heroImageUrl}
        imageAlt={visa.countryName ? `${visa.countryName} visa assistance` : ''}
        trustItems={heroTrustItems}
        onCtaClick={() => openModal('undecided', 'hero_cta')}
      />
      <StickyPriceBar
        fromPrice={cheapest?.price}
        currency={cheapest?.currency || 'AED'}
        ctaText={ctaText}
        hidden={modalOpen}
        onCtaClick={() => openModal('undecided', 'sticky_bar')}
      />
      <VisaQualifiers items={visa.qualifierItems} countryName={visa.countryName} />
      <PackageSegments
        packages={visa.packages}
        countryName={visa.countryName}
        guide={guides.packages}
        onPackageSelect={(name) => openModal(name, 'package_card')}
      />
      <VisaProcess steps={visa.processSteps} countryName={visa.countryName} guide={guides.process} />
      <VisaInlineCta
        text={`Not sure which package fits? A specialist will walk you through the ${country} process on a free call.`}
        ctaText={ctaText}
        onCtaClick={() => openModal('undecided', 'inline_cta')}
      />
      <VisaRequirements
        sections={visa.requirementSections}
        countryName={visa.countryName}
        guide={guides.requirements}
      />
      <VisaInlineCta
        text="Missing a document on this list? Tell us on the call and we will work out what can replace it."
        ctaText={ctaText}
        onCtaClick={() => openModal('undecided', 'inline_cta')}
      />
      <VisaPricingBreakdown
        rows={visa.pricingBreakdown}
        countryName={visa.countryName}
        guide={guides.pricing}
      />
      <VisaInlineCta
        text="These are the only fees you will pay. Get a quote for your group on a free call."
        ctaText={ctaText}
        onCtaClick={() => openModal('undecided', 'inline_cta')}
      />
      <VisaTrust items={visa.whyUs} assurances={trustAssurances} subtitle={trustSubtitle} />
      <VisaTestimonials testimonials={visa.testimonials ?? []} subtitle={testimonialsSubtitle} />
      <VisaFaqSection faqs={visa.faqs} countryName={visa.countryName} guide={guides.faqs} />
      <VisaFinalCta
        whatsappUrl={whatsappUrl}
        headline={visa.finalCtaHeadline}
        ctaText={visa.finalCtaText}
        onCtaClick={() => openModal('undecided', 'final_cta')}
      />

      <LeadFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        visa={{
          slug: visa.slug,
          countryName: visa.countryName,
          packages: visa.packages ?? [],
        }}
        defaultPackage={modalPackage}
        source={modalSource}
        whatsappUrl={whatsappUrl}
      />
    </>
  );
}
