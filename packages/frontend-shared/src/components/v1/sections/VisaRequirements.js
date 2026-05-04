"use client";

import * as LucideIcons from "lucide-react";
import { ChevronRight, ArrowRight } from "lucide-react";
import Container from "../layout/Container.js";
import SectionHead from "./VisaSectionHead.js";

function resolveIcon(name, fallback = "Circle") {
  if (!name) return LucideIcons[fallback] || LucideIcons.Circle;
  return LucideIcons[name] || LucideIcons[fallback] || LucideIcons.Circle;
}

export default function VisaRequirements({ sections = [] }) {
  if (!sections.length) return null;
  return (
    <section className="py-12 md:py-16">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 lg:gap-12 items-start">

          <div>
            <SectionHead eyebrow="What you need" title="Document Requirements" />
            <div className="space-y-2">
              {sections.map((section, si) => (
                <details
                  key={si}
                  className="group rounded-xl border border-gray-100 bg-white shadow-[0_2px_8px_rgba(16,24,40,0.04)] overflow-hidden"
                  open={si === 0}
                >
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none select-none hover:bg-gray-50/60 transition-colors gap-4">
                    <span className="font-outfit font-medium text-[15px] text-gray-900 leading-snug">
                      {section.title}
                    </span>
                    <ChevronRight
                      size={16}
                      className="text-gray-400 shrink-0 transition-transform duration-200 group-open:rotate-90"
                    />
                  </summary>
                  <div className="px-5 pb-5">
                    {section.intro && (
                      <p className="font-outfit font-light text-[13px] text-gray-500 leading-6 mb-3 pt-2 border-t border-gray-50">
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
          </div>

          <div className="lg:sticky lg:top-8">
            <div className="rounded-xl border border-gray-200 bg-[#faf9f6] p-5">
              <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center mb-4">
                {(() => {
                  const I = resolveIcon("HelpCircle");
                  return <I size={17} className="text-primary-600" />;
                })()}
              </div>
              <h3 className="font-outfit font-medium text-[15px] text-gray-900 mb-2">
                Not sure what to prepare?
              </h3>
              <p className="font-outfit font-light text-[13px] text-gray-500 leading-5 mb-4">
                Our specialists will guide you through every document
                step-by-step at no extra cost.
              </p>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="inline-flex items-center gap-1.5 text-[13px] font-outfit font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                Talk to a specialist <ArrowRight size={13} />
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
