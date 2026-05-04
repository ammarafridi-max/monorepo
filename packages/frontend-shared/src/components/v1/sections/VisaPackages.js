"use client";

import * as LucideIcons from "lucide-react";
import { Crown } from "lucide-react";
import Container from "../layout/Container.js";
import SectionHead from "./VisaSectionHead.js";

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
      "border-primary-400 bg-primary-700 shadow-[0_16px_48px_rgba(15,52,96,0.28)]",
    concierge:
      "border-amber-100 bg-white shadow-[0_16px_48px_rgba(180,130,0,0.07)]",
  }[tier];

  const iconBg = {
    standard: "bg-primary-50",
    express: "bg-white/15",
    concierge: "bg-amber-50",
  }[tier];

  const iconColor = {
    standard: "text-primary-700",
    express: "text-white",
    concierge: "text-amber-600",
  }[tier];

  const nameCls = {
    standard: "text-gray-900",
    express: "text-white",
    concierge: "text-gray-900",
  }[tier];

  const timelineCls = {
    standard: "text-gray-400",
    express: "text-white/60",
    concierge: "text-gray-400",
  }[tier];

  const currencyCls = {
    standard: "text-gray-400",
    express: "text-white/50",
    concierge: "text-amber-500/70",
  }[tier];

  const priceCls = {
    standard: "text-gray-900",
    express: "text-white",
    concierge: "text-gray-900",
  }[tier];

  const perCls = {
    standard: "text-gray-400",
    express: "text-white/40",
    concierge: "text-gray-400",
  }[tier];

  const descCls = {
    standard: "text-gray-500",
    express: "text-white/75",
    concierge: "text-gray-500",
  }[tier];

  const tickCls = {
    standard: "text-green-500",
    express: "text-accent-300",
    concierge: "text-amber-500",
  }[tier];

  const featureCls = {
    standard: "text-gray-700",
    express: "text-white/85",
    concierge: "text-gray-700",
  }[tier];

  const exclusionXCls = {
    standard: "text-gray-300",
    express: "text-white/35",
    concierge: "text-gray-300",
  }[tier];
  const exclusionTxtCls = {
    standard: "text-gray-400",
    express: "text-white/45",
    concierge: "text-gray-400",
  }[tier];

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 transition-transform duration-200 hover:-translate-y-0.5 ${cardCls}`}
    >
      {tier === "express" && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-block bg-accent-500 text-white text-[10px] font-bold font-outfit px-3 py-1 rounded-full uppercase tracking-wider">
            Most Popular
          </span>
        </div>
      )}
      {tier === "concierge" && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold font-outfit px-3 py-1 rounded-full uppercase tracking-wider">
            <Crown size={9} />
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
        {tier === "concierge" && (
          <Crown size={15} className="text-amber-400 shrink-0" />
        )}
      </h3>
      {timeline && (
        <p className={`font-outfit font-light text-[12px] mb-4 ${timelineCls}`}>
          {timeline}
        </p>
      )}

      <div className="mb-5">
        <p
          className={`font-outfit font-light text-[12px] leading-none mb-0.5 ${currencyCls}`}
        >
          {currency}
        </p>
        <p
          className={`font-outfit font-bold text-[46px] leading-none tracking-[-0.02em] ${priceCls}`}
        >
          {Number(price).toLocaleString()}
        </p>
        <p className={`font-outfit font-light text-[11px] mt-1 ${perCls}`}>
          per application
        </p>
      </div>

      {description && (
        <p
          className={`font-outfit font-light text-[13px] leading-5 mb-4 ${descCls}`}
        >
          {description}
        </p>
      )}

      {tier === "express" && (
        <button
          type="button"
          onClick={onCtaClick}
          className="inline-flex items-center justify-center gap-2 font-outfit font-medium text-[14px] py-2.5 px-5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white border border-accent-500 transition-colors duration-200 cursor-pointer"
        >
          Choose {name}
        </button>
      )}
      {tier === "concierge" && (
        <button
          type="button"
          onClick={onCtaClick}
          className="inline-flex items-center justify-center gap-2 font-outfit font-medium text-[14px] py-2.5 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white border border-amber-600 transition-colors duration-200 cursor-pointer"
        >
          Choose {name}
        </button>
      )}
      {tier === "standard" && (
        <button
          type="button"
          onClick={onCtaClick}
          className="inline-flex items-center justify-center gap-2 font-outfit font-medium text-[14px] py-2.5 px-5 rounded-xl bg-transparent hover:bg-gray-50 text-gray-700 border border-gray-300 transition-colors duration-200 cursor-pointer"
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
                className={`font-outfit font-light text-[13px] leading-5 ${featureCls}`}
              >
                {f}
              </span>
            </div>
          ))}
        </div>
      )}

      {exclusions.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {exclusions.map((e, i) => (
            <div key={i} className="flex items-start gap-2">
              <X size={11} className={`shrink-0 mt-1 ${exclusionXCls}`} />
              <span
                className={`font-outfit font-light text-[12px] leading-5 ${exclusionTxtCls}`}
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

export default function VisaPackages({ packages = [], onPackageSelect }) {
  if (!packages.length) return null;
  return (
    <section id="packages" className="py-12 md:py-16">
      <Container>
        <SectionHead eyebrow="Pricing" title="Simple, Transparent Pricing" />
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
      </Container>
    </section>
  );
}
