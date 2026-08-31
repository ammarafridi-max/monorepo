"use client";

import * as LucideIcons from "lucide-react";
import Container from "../../shared/layout/Container.js";
import SectionHead from "./VisaSectionHead.js";

function resolveIcon(name, fallback = "Circle") {
  if (!name) return LucideIcons[fallback] || LucideIcons.Circle;
  return LucideIcons[name] || LucideIcons[fallback] || LucideIcons.Circle;
}


// `assurances` is supplied by the consuming app so this stays brand-neutral.
export default function VisaTrust({ items = [], assurances = [], title = "Why UAE Residents Trust Us", subtitle = "" }) {
  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <Container>
        <SectionHead
          title={title}
          subtitle={subtitle}
        />

        {items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {items.map((item, i) => {
              const Icon = resolveIcon(item.icon, "Star");
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-100 bg-white p-7 shadow-[0_2px_8px_rgba(16,24,40,0.04)]"
                >
                  <div className="w-11 h-11 flex items-center justify-center bg-primary-700 text-white rounded-xl mb-5">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-outfit font-medium text-[17px] text-gray-900 mb-2 leading-snug">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="font-outfit font-normal text-[14px] text-gray-600 leading-6">
                      {item.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {assurances.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {assurances.map(({ title: heading, caption, icon }) => {
              const Icon = resolveIcon(icon, "Check");
              return (
                <div
                  key={heading}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.04)]"
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-primary-50 text-primary-700 rounded-xl mb-4">
                    <Icon size={18} />
                  </div>
                  <p className="font-outfit font-medium text-[15px] text-gray-900 mb-1 leading-snug">
                    {heading}
                  </p>
                  <p className="font-outfit font-normal text-[13px] text-gray-600 leading-5">
                    {caption}
                  </p>
                </div>
              );
            })}
          </div>
        )}

      </Container>
    </section>
  );
}
