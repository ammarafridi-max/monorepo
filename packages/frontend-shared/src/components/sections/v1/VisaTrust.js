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

const AVATAR_COLORS = [
  "bg-blue-50 text-blue-700",
  "bg-emerald-50 text-emerald-700",
  "bg-orange-50 text-orange-700",
  "bg-purple-50 text-purple-700",
  "bg-rose-50 text-rose-700",
  "bg-teal-50 text-teal-700",
];

function StarRow({ count = 5 }) {
  const Star = resolveIcon("Star");
  const clamped = Math.min(5, Math.max(1, Math.round(count)));
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: clamped }).map((_, i) => (
        <Star key={i} size={13} fill="currentColor" className="text-yellow-400" />
      ))}
    </div>
  );
}

export default function VisaTrust({ items = [], testimonials = [] }) {
  return (
    <section className="py-12 md:py-16 bg-[#faf9f7]">
      <Container>
        <SectionHead
          eyebrow="Why clients choose us"
          title="Why UAE Residents Trust Travl"
          className="mb-10"
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {TRUST_STATS.map(({ value, label, caption }) => (
            <div
              key={label}
              className="rounded-xl border border-gray-100 bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.04)]"
            >
              <p className="font-outfit font-medium text-[36px] md:text-[42px] text-gray-900 leading-none mb-1.5 tracking-[-0.02em]">
                {value}
              </p>
              <p className="font-outfit font-medium text-[13px] text-gray-800 mb-0.5">
                {label}
              </p>
              <p className="font-outfit font-light text-[12px] text-gray-400 leading-4">
                {caption}
              </p>
            </div>
          ))}
        </div>

        {(() => {
          const featured = (testimonials || [])
            .filter((t) => t.isFeatured)
            .slice(0, 3);
          if (!featured.length) return null;
          return (
            <div className="mb-12">
              <h3 className="font-outfit font-medium text-[18px] md:text-[20px] text-gray-900 mb-6 tracking-[-0.01em]">
                What our clients say
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {featured.map((t, i) => {
                  const avatarBg = AVATAR_COLORS[i % AVATAR_COLORS.length];
                  const meta = [t.nationality, t.visaType]
                    .filter(Boolean)
                    .join(" · ");
                  const fallbackInitials =
                    t.initials || t.name?.slice(0, 2).toUpperCase() || "?";
                  return (
                    <div
                      key={i}
                      className="rounded-xl border border-gray-100 bg-white p-6 shadow-[0_2px_8px_rgba(16,24,40,0.04)] flex flex-col"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        {t.imageUrl ? (
                          <img
                            src={t.imageUrl}
                            alt={t.name}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-outfit font-semibold shrink-0 ${avatarBg}`}
                          >
                            {fallbackInitials}
                          </div>
                        )}
                        <StarRow count={t.rating ?? 5} />
                      </div>
                      <p className="font-outfit font-light text-[14px] text-gray-600 leading-6 flex-1">
                        &ldquo;{t.quote}&rdquo;
                      </p>
                      <div className="mt-4 pt-4 border-t border-gray-50">
                        <p className="font-outfit font-medium text-[13px] text-gray-800 leading-tight">
                          {t.name}
                        </p>
                        {meta && (
                          <p className="font-outfit font-light text-[11px] text-gray-400 mt-0.5 leading-tight">
                            {meta}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item, i) => {
              const Icon = resolveIcon(item.icon, "Star");
              return (
                <div
                  key={i}
                  className="rounded-xl border border-gray-100 bg-white p-7 shadow-[0_2px_8px_rgba(16,24,40,0.04)]"
                >
                  <div className="w-11 h-11 flex items-center justify-center bg-primary-700 text-white rounded-xl mb-5">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-outfit font-medium text-[17px] text-gray-900 mb-2 leading-snug">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="font-outfit font-light text-[14px] text-gray-500 leading-6">
                      {item.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </section>
  );
}
