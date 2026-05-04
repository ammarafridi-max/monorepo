"use client";

import { useState } from "react";
import LeadFormModal from "../../components/v1/forms/LeadFormModal.js";
import VisaHero from "../../components/v1/sections/VisaHero.js";
import VisaPackages from "../../components/v1/sections/VisaPackages.js";
import VisaProcess from "../../components/v1/sections/VisaProcess.js";
import VisaRequirements from "../../components/v1/sections/VisaRequirements.js";
import VisaPricingBreakdown from "../../components/v1/sections/VisaPricingBreakdown.js";
import VisaTrust from "../../components/v1/sections/VisaTrust.js";
import VisaFaqs from "../../components/v1/sections/VisaFaqs.js";
import VisaFinalCta from "../../components/v1/sections/VisaFinalCta.js";

export default function VisaDetailPage({ visa, schema, breadcrumbJsonLd }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPackage, setModalPackage] = useState("undecided");
  const [modalSource, setModalSource] = useState("hero_cta");

  function openModal(pkg, src) {
    setModalPackage(pkg);
    setModalSource(src);
    setModalOpen(true);
  }

  if (!visa) return null;

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
        countryName={visa.countryName}
        headline={visa.heroHeadline}
        subheadline={visa.heroSubheadline}
        ctaText={visa.heroCtaText}
        qualifierItems={visa.qualifierItems}
        onCtaClick={() => openModal("undecided", "hero_cta")}
      />
      <VisaPackages
        packages={visa.packages}
        onPackageSelect={(name) => openModal(name, "package_card")}
      />
      <VisaProcess steps={visa.processSteps} />
      <VisaRequirements sections={visa.requirementSections} />
      <VisaPricingBreakdown rows={visa.pricingBreakdown} />
      <VisaTrust items={visa.whyUs} testimonials={visa.testimonials ?? []} />
      <VisaFaqs faqs={visa.faqs} countryName={visa.countryName} />
      <VisaFinalCta
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
