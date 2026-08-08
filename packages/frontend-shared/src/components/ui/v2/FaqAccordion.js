"use client";

import { useState } from "react";

/**
 * The site's single FAQ accordion.
 *
 * The answer is always rendered and collapsed with CSS rather than being
 * conditionally mounted, so it stays in the DOM for crawlers, in-page search
 * and assistive tech even while hidden.
 */
export default function FaqAccordion({ question, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`border-b border-gray-100 transition-colors last:border-0 ${
        open ? "bg-white" : "hover:bg-gray-50/60"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span
          className={`font-outfit text-[15px] font-medium leading-snug transition-colors duration-150 md:text-[16px] ${
            open ? "text-primary-700" : "text-gray-800"
          }`}
        >
          {question}
        </span>
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
            open
              ? "rotate-45 border-primary-700 bg-primary-700 text-white"
              : "border-gray-300 bg-white text-gray-600"
          }`}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
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
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-5 pb-5 font-outfit text-[14px] font-normal leading-6 text-gray-600 md:text-[15px]">
          {children}
        </div>
      </div>
    </div>
  );
}
