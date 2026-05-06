"use client";

import { useState } from "react";
import LeadFormModal from "../../../components/forms/v1/LeadFormModal.js";
import VisaHero from "../../../components/sections/v1/VisaHero.js";
import VisaPackages from "../../../components/sections/v1/VisaPackages.js";
import VisaProcess from "../../../components/sections/v1/VisaProcess.js";
import VisaRequirements from "../../../components/sections/v1/VisaRequirements.js";
import VisaPricingBreakdown from "../../../components/sections/v1/VisaPricingBreakdown.js";
import VisaTrust from "../../../components/sections/v1/VisaTrust.js";
import VisaFaqs from "../../../components/sections/v1/VisaFaqs.js";
import VisaFinalCta from "../../../components/sections/v1/VisaFinalCta.js";

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
