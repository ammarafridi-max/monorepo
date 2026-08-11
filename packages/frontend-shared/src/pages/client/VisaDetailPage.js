"use client";

import { useState } from "react";
import LeadFormModal from "../../components/forms/v1/LeadFormModal.js";
import VisaHero from "../../components/sections/v1/VisaHero.js";
import VisaQualifiers from "../../components/sections/v1/VisaQualifiers.js";
import VisaPackages from "../../components/sections/v1/VisaPackages.js";
import VisaProcess from "../../components/sections/v1/VisaProcess.js";
import VisaRequirements from "../../components/sections/v1/VisaRequirements.js";
import VisaPricingBreakdown from "../../components/sections/v1/VisaPricingBreakdown.js";
import VisaTrust from "../../components/sections/v1/VisaTrust.js";
import VisaTestimonials from "../../components/sections/v1/VisaTestimonials.js";
import VisaFaqSection from "../../components/sections/v1/VisaFaqSection.js";
import VisaFinalCta from "../../components/sections/v1/VisaFinalCta.js";

export default function VisaDetailPage({ visa, schema, breadcrumbJsonLd, whatsappUrl }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPackage, setModalPackage] = useState("undecided");
  const [modalSource, setModalSource] = useState("hero_cta");

  function openModal(pkg, src) {
    setModalPackage(pkg);
    setModalSource(src);
    setModalOpen(true);
  }

  if (!visa) return null;

  const guides = visa.sectionGuides || {};

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
        imageAlt={visa.countryName ? `${visa.countryName} visa assistance` : ""}
        onCtaClick={() => openModal("undecided", "hero_cta")}
      />
      <VisaQualifiers
        items={visa.qualifierItems}
        countryName={visa.countryName}
      />
      <VisaPackages
        packages={visa.packages}
        countryName={visa.countryName}
        guide={guides.packages}
        onPackageSelect={(name) => openModal(name, "package_card")}
      />
      <VisaProcess
        steps={visa.processSteps}
        countryName={visa.countryName}
        guide={guides.process}
      />
      <VisaRequirements
        sections={visa.requirementSections}
        countryName={visa.countryName}
        guide={guides.requirements}
      />
      <VisaPricingBreakdown
        rows={visa.pricingBreakdown}
        countryName={visa.countryName}
        guide={guides.pricing}
      />
      <VisaTrust items={visa.whyUs} />
      <VisaTestimonials testimonials={visa.testimonials ?? []} />
      <VisaFaqSection
        faqs={visa.faqs}
        countryName={visa.countryName}
        guide={guides.faqs}
      />
      <VisaFinalCta
        whatsappUrl={whatsappUrl}
        headline={visa.finalCtaHeadline}
        ctaText={visa.finalCtaText}
        onCtaClick={() => openModal("undecided", "final_cta")}
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
      />
    </>
  );
}
