"use client";

import * as LucideIcons from "lucide-react";
import Container from "../../shared/layout/Container.js";
import SectionHead from "./VisaSectionHead.js";
import VisaGuideLink from "./VisaGuideLink.js";

function resolveIcon(name, fallback = "Circle") {
  if (!name) return LucideIcons[fallback] || LucideIcons.Circle;
  return LucideIcons[name] || LucideIcons[fallback] || LucideIcons.Circle;
}

export default function VisaProcess({ steps = [], countryName = "", guide }) {
  if (!steps.length) return null;
  const prefix = countryName ? `${countryName} Visa` : "Visa";
  const subject = countryName ? `${countryName} visa` : "visa";
  return (
    <section className="py-12 md:py-16 bg-gray-50/80 border-y border-gray-100">
      <Container>
        <SectionHead
          title={`${prefix} Process`}
          subtitle="From your first consultation to a decision, we handle every step with you so nothing gets missed."
        />

        {/* One list, responsive. Rendering desktop and mobile variants
            separately put every step in the DOM twice. */}
        <div className="grid gap-x-8 gap-y-4 lg:grid-cols-3 lg:gap-y-12 lg:max-w-4xl lg:mx-auto">
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1;
            return (
              <div
                key={i}
                className="flex items-start gap-4 lg:flex-col lg:items-center lg:gap-0 lg:text-center lg:px-3"
              >
                <div className="relative shrink-0 flex flex-col items-center self-stretch lg:self-auto">
                  <div className="w-8 h-8 lg:w-14 lg:h-14 rounded-full bg-primary-700 text-white flex items-center justify-center text-[12px] lg:text-lg font-outfit font-semibold lg:font-bold lg:mb-4 lg:shadow-md">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  {!isLast && (
                    <div className="w-px flex-1 bg-gray-200 mt-1.5 min-h-5 lg:hidden" />
                  )}
                </div>
                <div className="pt-0.5 pb-4 lg:p-0">
                  <h3 className="font-outfit font-medium text-[15px] text-gray-900 mb-1 leading-snug">
                    {step.title}
                  </h3>
                  {step.description && (
                    <p className="font-outfit font-normal text-[13px] text-gray-600 leading-5">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <VisaGuideLink guide={guide} label={`Read our guide on the complete ${subject} process`} />
      </Container>
    </section>
  );
}
