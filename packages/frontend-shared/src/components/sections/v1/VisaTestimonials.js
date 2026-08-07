"use client";

import { Star } from "lucide-react";
import Container from "../../shared/layout/Container.js";
import SectionHead from "./VisaSectionHead.js";

const AVATAR_COLORS = [
  "bg-blue-50 text-blue-700",
  "bg-emerald-50 text-emerald-700",
  "bg-orange-50 text-orange-700",
  "bg-purple-50 text-purple-700",
  "bg-rose-50 text-rose-700",
  "bg-teal-50 text-teal-700",
];

function StarRow({ count = 5 }) {
  const clamped = Math.min(5, Math.max(1, Math.round(count)));
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: clamped }).map((_, i) => (
        <Star key={i} size={13} fill="currentColor" className="text-yellow-400" />
      ))}
    </div>
  );
}

export default function VisaTestimonials({ testimonials = [] }) {
  const featured = (testimonials || []).filter((t) => t.isFeatured).slice(0, 3);
  if (!featured.length) return null;

  return (
    <section className="py-12 md:py-16">
      <Container>
        <SectionHead
          title="What Our Clients Say"
          subtitle="Real feedback from UAE residents who applied for their visas with Travl."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featured.map((t, i) => {
            const avatarBg = AVATAR_COLORS[i % AVATAR_COLORS.length];
            const meta = [t.nationality, t.visaType].filter(Boolean).join(" · ");
            const fallbackInitials =
              t.initials || t.name?.slice(0, 2).toUpperCase() || "?";
            return (
              <div
                key={i}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_8px_rgba(16,24,40,0.04)] flex flex-col"
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
                <p className="font-outfit font-normal text-[14px] text-gray-600 leading-6 flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <p className="font-outfit font-medium text-[13px] text-gray-800 leading-tight">
                    {t.name}
                  </p>
                  {meta && (
                    <p className="font-outfit font-normal text-[11px] text-gray-600 mt-0.5 leading-tight">
                      {meta}
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
