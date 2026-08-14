"use client";

import * as LucideIcons from "lucide-react";
import Container from "../../shared/layout/Container.js";
import SectionHead from "./VisaSectionHead.js";
import VisaGuideLink from "./VisaGuideLink.js";

function resolveIcon(name, fallback = "Circle") {
  if (!name) return LucideIcons[fallback] || LucideIcons.Circle;
  return LucideIcons[name] || LucideIcons[fallback] || LucideIcons.Circle;
}

function getPkgTier(pkg) {
  if (pkg.isHighlighted) return "express";
  const n = pkg.name?.toLowerCase() || "";
  if (
    n.includes("concierge") ||
    n.includes("premium") ||
    n.includes("elite") ||
    n.includes("vip")
  )
    return "concierge";
  return "standard";
}

function PackageCard({ pkg, onCtaClick }) {
  const {
    name,
    price,
    currency,
    timeline,
    description,
    features = [],
    exclusions = [],
    icon,
  } = pkg;
  const Icon = resolveIcon(icon, "Package");
  const X = resolveIcon("X");
  const Tick = resolveIcon("Check");
  const tier = getPkgTier(pkg);

  const cardCls = {
    standard: "border-gray-100 bg-white shadow-sm",
    express:
      "border-primary-300 bg-white shadow-[0_16px_48px_--theme(--color-primary-700/12%)]",
    concierge: "border-gray-100 bg-white shadow-sm",
  }[tier];

  const iconBg = {
    standard: "bg-primary-50",
    express: "bg-primary-50",
    concierge: "bg-primary-50",
  }[tier];

  const iconColor = {
    standard: "text-primary-700",
    express: "text-primary-700",
    concierge: "text-primary-700",
  }[tier];

  const nameCls = {
    standard: "text-gray-900",
    express: "text-gray-900",
    concierge: "text-gray-900",
  }[tier];

  const timelineCls = {
    standard: "text-gray-600",
    express: "text-gray-600",
    concierge: "text-gray-600",
  }[tier];

  const currencyCls = {
    standard: "text-gray-600",
    express: "text-gray-600",
    concierge: "text-gray-600",
  }[tier];

  const priceCls = {
    standard: "text-gray-900",
    express: "text-gray-900",
    concierge: "text-gray-900",
  }[tier];

  const perCls = {
    standard: "text-gray-600",
    express: "text-gray-600",
    concierge: "text-gray-600",
  }[tier];

  const descCls = {
    standard: "text-gray-600",
    express: "text-gray-600",
    concierge: "text-gray-600",
  }[tier];

  const tickCls = {
    standard: "text-primary-600",
    express: "text-primary-600",
    concierge: "text-primary-600",
  }[tier];

  const featureCls = {
    standard: "text-gray-700",
    express: "text-gray-700",
    concierge: "text-gray-700",
  }[tier];

  const exclusionXCls = "text-red-500";
  const exclusionTxtCls = featureCls;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 transition-transform duration-200 hover:-translate-y-0.5 ${cardCls}`}
    >
      {tier === "express" && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-block bg-primary-700 text-white text-[10px] font-bold font-outfit px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
            Most Popular
          </span>
        </div>
      )}
      {tier === "concierge" && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-block bg-white border border-gray-200 text-gray-700 text-[10px] font-bold font-outfit px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
            Most Comprehensive
          </span>
        </div>
      )}

      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}
      >
        <Icon size={18} className={iconColor} />
      </div>

      <h3
        className={`font-outfit font-medium text-[20px] mb-0.5 flex items-center gap-2 ${nameCls}`}
      >
        {name}
      </h3>
      {timeline && (
        <p className={`font-outfit font-normal text-[12px] mb-4 ${timelineCls}`}>
          {timeline}
        </p>
      )}

      <div className="mb-5">
        <p
          className={`font-outfit font-normal text-[12px] leading-none mb-0.5 ${currencyCls}`}
        >
          {currency}
        </p>
        <p
          className={`font-outfit font-bold text-[46px] leading-none tracking-[-0.02em] ${priceCls}`}
        >
          {Number(price).toLocaleString()}
        </p>
        <p className={`font-outfit font-normal text-[11px] mt-1 ${perCls}`}>
          per application
        </p>
      </div>

      {description && (
        <p
          className={`font-outfit font-normal text-[13px] leading-5 mb-4 ${descCls}`}
        >
          {description}
        </p>
      )}

      {tier === "express" && (
        <button
          type="button"
          onClick={onCtaClick}
          className="inline-flex items-center justify-center gap-2 font-outfit font-semibold text-[14px] py-2.5 px-5 rounded-full bg-primary-700 hover:bg-primary-800 text-white border border-primary-700 transition-colors duration-200 cursor-pointer"
        >
          Choose {name}
        </button>
      )}
      {tier === "concierge" && (
        <button
          type="button"
          onClick={onCtaClick}
          className="inline-flex items-center justify-center gap-2 font-outfit font-semibold text-[14px] py-2.5 px-5 rounded-full bg-transparent hover:bg-primary-50 text-primary-700 border border-primary-600 transition-colors duration-200 cursor-pointer"
        >
          Choose {name}
        </button>
      )}
      {tier === "standard" && (
        <button
          type="button"
          onClick={onCtaClick}
          className="inline-flex items-center justify-center gap-2 font-outfit font-semibold text-[14px] py-2.5 px-5 rounded-full bg-transparent hover:bg-primary-50 text-primary-700 border border-primary-600 transition-colors duration-200 cursor-pointer"
        >
          Choose {name}
        </button>
      )}

      {features.length > 0 && (
        <div className="mt-5 space-y-2">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-2">
              <Tick size={13} className={`shrink-0 mt-0.5 ${tickCls}`} />
              <span
                className={`font-outfit font-normal text-[13px] leading-5 ${featureCls}`}
              >
                {f}
              </span>
            </div>
          ))}
        </div>
      )}

      {exclusions.length > 0 && (
        <div className="mt-2 space-y-2">
          {exclusions.map((e, i) => (
            <div key={i} className="flex items-start gap-2">
              <X size={13} className={`shrink-0 mt-0.5 ${exclusionXCls}`} />
              <span
                className={`font-outfit font-normal text-[13px] leading-5 ${exclusionTxtCls}`}
              >
                {e}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function VisaPackages({
  packages = [],
  countryName = "",
  guide,
  onPackageSelect,
}) {
  if (!packages.length) return null;
  const prefix = countryName ? `${countryName} Visa` : "Visa";
  const subject = countryName ? `${countryName} visa` : "visa";
  return (
    <section id="packages" className="py-12 md:py-16">
      <Container>
        <SectionHead
          title={`${prefix} Packages`}
          subtitle="Clear, upfront package pricing with no hidden fees. Choose the option that fits your timeline and budget."
        />
        <div
          className={`grid gap-5 ${
            packages.length === 3
              ? "grid-cols-1 lg:grid-cols-3"
              : packages.length === 2
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1 max-w-sm"
          }`}
        >
          {packages.map((pkg, i) => (
            <PackageCard
              key={i}
              pkg={pkg}
              onCtaClick={() => onPackageSelect(pkg.name)}
            />
          ))}
        </div>

        <VisaGuideLink guide={guide} label={`Read our guide on choosing the right ${subject} package`} />
      </Container>
    </section>
  );
}
