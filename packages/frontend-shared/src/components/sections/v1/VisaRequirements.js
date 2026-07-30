"use client";

import { ChevronRight } from "lucide-react";
import Container from "../../shared/layout/Container.js";
import SectionHead from "./VisaSectionHead.js";

export default function VisaRequirements({ sections = [] }) {
  if (!sections.length) return null;
  return (
    <section className="py-12 md:py-16">
      <Container>
        <SectionHead
          title="Document Requirements"
          subtitle="Everything you need to prepare for a smooth application, organized by category."
        />
        <div className="max-w-3xl mx-auto space-y-2">
          {sections.map((section, si) => (
            <details
              key={si}
              className="group rounded-2xl border border-gray-100 bg-white shadow-[0_2px_8px_rgba(16,24,40,0.04)] overflow-hidden"
              open={si === 0}
            >
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none select-none hover:bg-gray-50/60 transition-colors gap-4">
                <span className="font-outfit font-medium text-[15px] text-gray-900 leading-snug">
                  {section.title}
                </span>
                <ChevronRight
                  size={16}
                  className="text-gray-600 shrink-0 transition-transform duration-200 group-open:rotate-90"
                />
              </summary>
              <div className="px-5 pb-5">
                {section.intro && (
                  <p className="font-outfit font-light text-[13px] text-gray-600 leading-6 mb-3 pt-2 border-t border-gray-50">
                    {section.intro}
                  </p>
                )}
                {section.items?.length > 0 && (
                  <ul className="space-y-2">
                    {section.items.map((item, ii) => (
                      <li key={ii} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0 mt-[7px]" />
                        <span className="font-outfit font-light text-[13px] text-gray-700 leading-6">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
