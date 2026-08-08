"use client";

import { useActiveHeading } from "../../../hooks/blog/useActiveHeading.js";

/**
 * Vertical table of contents for the article rail.
 *
 * Desktop only — on narrow screens the rail collapses and BlogChipNav carries
 * the same headings as a horizontal strip.
 */
export default function BlogTocRail({ headings = [], heading = "On this page" }) {
  const activeId = useActiveHeading(headings);

  if (headings.length < 2) return null;

  return (
    <nav aria-label="On this page">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
        {heading}
      </p>
      <ul className="flex list-none flex-col gap-0.5 border-l border-gray-200">
        {headings.map(({ id, text }) => {
          const isActive = id === activeId;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={isActive ? "true" : undefined}
                className={`-ml-px block border-l-2 py-1.5 pl-3 text-[13px] leading-5 transition-colors ${
                  isActive
                    ? "border-primary-600 font-semibold text-primary-700"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800"
                }`}
              >
                {text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
