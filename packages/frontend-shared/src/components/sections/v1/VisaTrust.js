"use client";

import * as LucideIcons from "lucide-react";
import Container from "../../shared/layout/Container.js";
import SectionHead from "./VisaSectionHead.js";

function resolveIcon(name, fallback = "Circle") {
  if (!name) return LucideIcons[fallback] || LucideIcons.Circle;
  return LucideIcons[name] || LucideIcons[fallback] || LucideIcons.Circle;
}

const TRUST_STATS = [
  { value: "500+", label: "Visas Processed", caption: "Across 30+ countries" },
  {
    value: "98%",
    label: "Approval Rate",
    caption: "For complete applications",
  },
  {
    value: "3 min",
    label: "Avg. Response Time",
    caption: "During business hours",
  },
  { value: "2024", label: "UAE Licensed", caption: "DAFZ-registered office" },
];

export default function VisaTrust({ items = [] }) {
  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <Container>
        <SectionHead
          title="Why UAE Residents Trust Travl"
          subtitle="A licensed Dubai team with a track record UAE residents rely on for their visa applications."
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {TRUST_STATS.map(({ value, label, caption }) => (
            <div
              key={label}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.04)]"
            >
              <p className="font-outfit font-medium text-[36px] md:text-[42px] text-gray-900 leading-none mb-1.5 tracking-[-0.02em]">
                {value}
              </p>
              <p className="font-outfit font-medium text-[13px] text-gray-800 mb-0.5">
                {label}
              </p>
              <p className="font-outfit font-normal text-[12px] text-gray-600 leading-4">
                {caption}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
