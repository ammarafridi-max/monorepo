"use client";

import { useEffect, useState } from "react";
import { List } from "lucide-react";

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function TableOfContents({ headings }) {
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    const observers = [];

    headings.forEach(({ text }) => {
      const id = slugify(text);
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveId(id);
        },
        { rootMargin: "0px 0px -70% 0px", threshold: 0 }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [headings]);

  if (!headings.length) return null;

  return (
    <nav className="sticky top-8 flex flex-col gap-1">
      <div className="flex items-center gap-2 mb-3">
        <List size={14} className="text-gray-400" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Contents
        </span>
      </div>
      {headings.map(({ text }) => {
        const id = slugify(text);
        const isActive = activeId === id;
        return (
          <a
            key={id}
            href={`#${id}`}
            className={`text-sm py-1 pl-3 border-l-2 transition-all leading-snug ${
              isActive
                ? "border-primary-600 text-primary-700 font-medium"
                : "border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-400"
            }`}
          >
            {text}
          </a>
        );
      })}
    </nav>
  );
}
