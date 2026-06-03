"use client";

import {
  Plane,
  Globe,
  BadgeCheck,
  CalendarCheck,
  Headphones,
} from "lucide-react";
import Container from "@travel-suite/frontend-shared/components/shared/layout/Container";
import BookingForm from "@/components/BookingForm";

const TRUST_STRIP = [
  { icon: Globe, label: "Available in 40+ cities" },
  { icon: BadgeCheck, label: "Fixed upfront pricing" },
  { icon: CalendarCheck, label: "Free cancellation" },
  { icon: Headphones, label: "24/7 support" },
];

export default function HeroSection({
  eyebrow = "Airport transfers, sorted",
  title = "Your ride is waiting",
  titleEm = "before you land",
  subtitle = "Pre-booked airport transfers in over 40 cities worldwide. Fixed prices, professional drivers, no surge, no surprises.",
}) {
  return (
    <section className="grain relative bg-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(110% 70% at 20% 50%, #fbe6cf 0%, rgba(251,230,207,0) 60%), radial-gradient(80% 60% at 90% 10%, rgba(47,91,230,0.08) 0%, rgba(47,91,230,0) 60%), radial-gradient(70% 50% at 5% 80%, rgba(47,91,230,0.06) 0%, rgba(47,91,230,0) 55%)",
        }}
      />

      <svg
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 -z-10 hidden h-full w-1/2 opacity-20 lg:block"
        viewBox="0 0 600 500"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M-40 480 C 150 100, 420 80, 620 200"
          stroke="#2f5be6"
          strokeWidth="2"
          strokeDasharray="2 10"
          strokeLinecap="round"
        />
      </svg>

      <Container className="relative py-15 md:py-15 lg:py-15">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="reveal">
            <h1 className="mt-6 text-[clamp(2.25rem,4.5vw,3.5rem)] font-semibold text-ink leading-tight">
              {title}{" "}
              <em className="font-normal italic text-clay-600">{titleEm}</em>
            </h1>

            <p className="mt-5 max-w-lg text-lead font-light text-ink-soft leading-relaxed">
              {subtitle}
            </p>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
              {TRUST_STRIP.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 text-sm font-medium text-ink-soft"
                >
                  <Icon size={16} className="shrink-0 text-clay-500" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal" style={{ animationDelay: "0.1s" }}>
            <BookingForm />
          </div>
        </div>
      </Container>
    </section>
  );
}
