"use client";

import * as LucideIcons from "lucide-react";
import Container from "../../shared/layout/Container.js";
import SectionHead from "./VisaSectionHead.js";

function resolveIcon(name, fallback = "Circle") {
  if (!name) return LucideIcons[fallback] || LucideIcons.Circle;
  return LucideIcons[name] || LucideIcons[fallback] || LucideIcons.Circle;
}

export default function VisaProcess({ steps = [] }) {
  if (!steps.length) return null;
  return (
    <section className="py-12 md:py-16 bg-gray-50/80 border-y border-gray-100">
      <Container>
        <SectionHead eyebrow="How it works" title="Simple, Guided Process" />

        <div className="hidden lg:flex items-start">
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1;
            return (
              <div
                key={i}
                className="flex-1 relative flex flex-col items-center text-center px-3"
              >
                {!isLast && (
                  <div className="absolute top-[18px] left-[calc(50%+22px)] right-0 h-px bg-gray-200" />
                )}
                <div className="relative z-10 w-9 h-9 rounded-full bg-primary-700 text-white flex items-center justify-center text-[12px] font-outfit font-semibold mb-3 shadow-sm">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="font-outfit font-medium text-[14px] text-gray-900 mb-1 leading-snug">
                  {step.title}
                </h3>
                {step.description && (
                  <p className="font-outfit font-light text-[12px] text-gray-500 leading-5">
                    {step.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="lg:hidden space-y-4">
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1;
            return (
              <div key={i} className="flex items-start gap-4">
                <div className="relative shrink-0 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-primary-700 text-white flex items-center justify-center text-[12px] font-outfit font-semibold">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  {!isLast && (
                    <div
                      className="w-px flex-1 bg-gray-200 mt-1.5"
                      style={{ minHeight: "20px" }}
                    />
                  )}
                </div>
                <div className="pt-0.5 pb-4">
                  <h3 className="font-outfit font-medium text-[15px] text-gray-900 mb-1">
                    {step.title}
                  </h3>
                  {step.description && (
                    <p className="font-outfit font-light text-[13px] text-gray-500 leading-5">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
