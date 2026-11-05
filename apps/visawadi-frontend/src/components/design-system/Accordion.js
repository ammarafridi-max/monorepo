"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";

export default function Accordion({ question, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const panelId = `${id}-panel`;
  const buttonId = `${id}-button`;

  return (
    <div className="border-b border-line-soft last:border-0">
      <h3>
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-start justify-between gap-6 rounded-field px-1 py-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 md:py-6"
        >
          <span
            className={`text-[1.0625rem] font-medium leading-snug transition-colors ${
              open ? "text-brand-700" : "text-ink"
            }`}
          >
            {question}
          </span>
          <span
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
              open
                ? "rotate-45 border-brand-600 bg-brand-600 text-white"
                : "border-line text-ink-soft"
            }`}
          >
            <Plus size={14} aria-hidden="true" />
          </span>
        </button>
      </h3>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div
          id={panelId}
          role="region"
          aria-labelledby={buttonId}
          className={`overflow-hidden ${open ? "visible" : "invisible"}`}
        >
          <div className="px-1 pb-6 pr-10 text-[0.9375rem] leading-7 text-ink-soft">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
