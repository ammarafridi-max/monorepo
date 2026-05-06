"use client";

import { useState } from "react";
import Container from "../../shared/layout/Container.js";

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`border-b border-gray-100 last:border-0 transition-colors ${open ? "bg-white" : "hover:bg-gray-50/60"}`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer"
        aria-expanded={open}
      >
        <span
          className={`font-outfit font-medium text-[14px] leading-snug transition-colors duration-150 ${open ? "text-primary-700" : "text-gray-800"}`}
        >
          {question}
        </span>
        <span
          className={`shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-200 ${
            open
              ? "bg-primary-700 border-primary-700 text-white rotate-45"
              : "border-gray-300 bg-white text-gray-400"
          }`}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 1v8M1 5h8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <p className="font-outfit font-light text-[13px] text-gray-600 leading-6 px-5 pb-5">
          {answer}
        </p>
      </div>
    </div>
  );
}

export default function VisaFaqs({ faqs = [], countryName }) {
  if (!faqs.length) return null;

  return (
    <section
      id="faq"
      className="py-12 md:py-16 bg-[#faf8f5] border-y border-[#ede9e3]"
    >
      <Container>
        <div className="mb-10">
          <p className="text-[11px] font-outfit font-semibold uppercase tracking-[0.15em] text-primary-600 mb-2">
            {countryName} visa FAQ
          </p>
          <h2 className="font-outfit font-medium text-[26px] md:text-[31px] text-gray-900 leading-[1.2] tracking-[-0.01em] mb-3">
            Frequently Asked Questions
          </h2>
          <p className="font-outfit font-light text-[15px] text-gray-500 leading-relaxed max-w-2xl">
            Common questions about {countryName} visas. If you don&apos;t see
            your question, get in touch — our specialists respond within
            minutes.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200/80 bg-white shadow-[0_1px_4px_rgba(16,24,40,0.04)] overflow-hidden">
          {faqs.map((faq, i) => (
            <FaqItem key={i} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </Container>
    </section>
  );
}
