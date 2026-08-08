"use client";

import { useActiveHeading } from "../../../hooks/blog/useActiveHeading.js";

/**
 * Horizontal table of contents, built from the article's <h2> headings.
 *
 * Carries the contents on screens too narrow for the rail; BlogTocRail takes
 * over from `lg` up, both driven by the same active-heading hook.
 */
export default function BlogChipNav({ headings = [], className = "" }) {
  const activeId = useActiveHeading(headings);

  if (headings.length < 2) return null;

  return (
    <nav
      aria-label="Sections in this article"
      className={`-mx-4 overflow-x-auto px-4 lg:hidden ${className}`}
    >
      <ul className="flex list-none gap-2 whitespace-nowrap pb-1">
        {headings.map(({ id, text }) => {
          const isActive = id === activeId;
          return (
            <li key={id} className="shrink-0">
              <a
                href={`#${id}`}
                aria-current={isActive ? "true" : undefined}
                className={`inline-flex rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
                  isActive
                    ? "border-primary-600 bg-primary-50 font-semibold text-primary-700"
                    : "border-gray-200 bg-gray-50/60 font-medium text-gray-600 hover:border-primary-200 hover:text-primary-700"
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
