'use client';

import { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import SectionHead from '@travel-suite/frontend-shared/components/sections/v1/VisaSectionHead';
import VisaGuideLink from '@travel-suite/frontend-shared/components/sections/v1/VisaGuideLink';

export default function PackageSegments({ packages = [], countryName = '', guide, onPackageSelect }) {
  const [active, setActive] = useState(0);
  if (!packages.length) return null;

  const subject = countryName ? `${countryName} visa` : 'visa';
  const Check = LucideIcons.Check;
  const X = LucideIcons.X;

  return (
    <section id="packages" className="py-12 md:py-16">
      <Container>
        <SectionHead
          title={`${countryName ? `${countryName} Visa` : 'Visa'} Packages`}
          subtitle="Clear, upfront package pricing with no hidden fees. Choose the option that fits your timeline and budget."
        />

        <div className="lg:hidden">
          <div
            role="tablist"
            aria-label="Packages"
            className="grid gap-1 rounded-2xl border border-gray-200 bg-gray-50 p-1"
            style={{ gridTemplateColumns: `repeat(${packages.length}, minmax(0, 1fr))` }}
          >
            {packages.map((pkg, i) => (
              <button
                key={pkg.name ?? i}
                id={`pkg-tab-${i}`}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-controls={`pkg-panel-${i}`}
                onClick={() => setActive(i)}
                className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2.5 text-[13px] font-bold leading-tight transition-colors ${
                  i === active ? 'bg-primary-700 text-white' : 'text-gray-600'
                }`}
              >
                {pkg.name}
                <span
                  className={`font-mono text-[11px] font-medium ${
                    i === active ? 'text-primary-100' : 'text-gray-400'
                  }`}
                >
                  {Number(pkg.price).toLocaleString()}
                </span>
              </button>
            ))}
          </div>

          {packages.map((pkg, i) => (
            <div
              key={pkg.name ?? i}
              id={`pkg-panel-${i}`}
              role="tabpanel"
              aria-labelledby={`pkg-tab-${i}`}
              hidden={i !== active}
              className="mt-5"
            >
              <p className="font-mono text-[12.5px] text-gray-500">
                {pkg.timeline} · per application
              </p>
              <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{pkg.description}</p>
              <p className="mt-4 font-mono text-2xl font-semibold tracking-tight text-gray-900">
                {pkg.currency || 'AED'} {Number(pkg.price).toLocaleString()}
              </p>
              <ul className="mt-4 space-y-2.5">
                {(pkg.features ?? []).map((f, k) => (
                  <li key={k} className="flex items-start gap-2.5 text-[14.5px] leading-relaxed text-gray-600">
                    <Check size={17} className="mt-0.5 shrink-0 text-green-700" />
                    {f}
                  </li>
                ))}
                {(pkg.exclusions ?? []).map((f, k) => (
                  <li key={`x${k}`} className="flex items-start gap-2.5 text-[14.5px] leading-relaxed text-gray-400">
                    <X size={17} className="mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => onPackageSelect?.(pkg.name)}
                className="mt-5 min-h-12 w-full rounded-xl bg-accent-500 px-4 font-semibold text-white hover:bg-accent-600"
              >
                Choose {pkg.name}
              </button>
            </div>
          ))}
        </div>

        <div
          className="hidden gap-5 lg:grid"
          style={{ gridTemplateColumns: `repeat(${Math.min(packages.length, 3)}, minmax(0, 1fr))` }}
        >
          {packages.map((pkg, i) => (
            <div
              key={pkg.name ?? i}
              className={`flex flex-col rounded-2xl border bg-white p-6 ${
                pkg.isHighlighted ? 'border-primary-300 shadow-lg' : 'border-gray-100 shadow-sm'
              }`}
            >
              <p className="text-lg font-bold text-gray-900">{pkg.name}</p>
              <p className="font-mono text-[12.5px] text-gray-500">{pkg.timeline}</p>
              <p className="mt-3 font-mono text-3xl font-semibold tracking-tight text-gray-900">
                {pkg.currency || 'AED'} {Number(pkg.price).toLocaleString()}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">{pkg.description}</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {(pkg.features ?? []).map((f, k) => (
                  <li key={k} className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-600">
                    <Check size={16} className="mt-0.5 shrink-0 text-green-700" />
                    {f}
                  </li>
                ))}
                {(pkg.exclusions ?? []).map((f, k) => (
                  <li key={`x${k}`} className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-400">
                    <X size={16} className="mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => onPackageSelect?.(pkg.name)}
                className="mt-6 min-h-12 w-full rounded-xl bg-accent-500 px-4 font-semibold text-white hover:bg-accent-600"
              >
                Choose {pkg.name}
              </button>
            </div>
          ))}
        </div>

        <VisaGuideLink guide={guide} label={`Read our guide on choosing the right ${subject} package`} />
      </Container>
    </section>
  );
}
