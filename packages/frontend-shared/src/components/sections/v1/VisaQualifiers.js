"use client";

import { Check } from "lucide-react";
import Container from "../../shared/layout/Container.js";
import SectionHead from "./VisaSectionHead.js";

export default function VisaQualifiers({ items = [], countryName = "" }) {
  if (!items.length) return null;

  return (
    <section className="py-12 md:py-16 border-b border-gray-100">
      <Container>
        <SectionHead
          title={
            countryName
              ? `Is This ${countryName} Visa Service Right for You?`
              : "Is This Visa Service Right for You?"
          }
          subtitle="If any of these sound like your situation, you are in the right place. Our specialists handle applications like yours every week."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3.5 rounded-2xl border border-gray-100 bg-gray-50/70 p-5 md:p-6"
            >
              <span className="mt-0.5 w-6 h-6 shrink-0 rounded-full bg-primary-700 text-white flex items-center justify-center">
                <Check size={13} strokeWidth={3} />
              </span>
              <p className="font-outfit font-normal text-[15px] text-gray-700 leading-6">
                {item}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
