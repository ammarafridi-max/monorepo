"use client";

import * as LucideIcons from "lucide-react";
import Container from "../../shared/layout/Container.js";
import SectionHead from "./VisaSectionHead.js";

function resolveIcon(name, fallback = "Circle") {
  if (!name) return LucideIcons[fallback] || LucideIcons.Circle;
  return LucideIcons[name] || LucideIcons[fallback] || LucideIcons.Circle;
}


const STOP = new Set(["every", "their", "there", "these", "those", "which", "where", "about", "after", "before", "within", "during", "always", "never", "other", "between"]);
const words = (...parts) =>
  new Set(
    parts.join(" ").toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/)
      .filter((w) => w.length >= 5 && !STOP.has(w)),
  );

// A CMS "why us" card that says the same thing as a brand assurance is dropped
// so the section reads as four distinct reasons rather than eight overlapping ones.
function mergeCards(items, assurances) {
  const assuranceWords = assurances.map((a) => words(a.title, a.caption));
  const unique = items.filter((item) => {
    const w = words(item.title, item.description);
    return !assuranceWords.some((aw) => [...w].filter((x) => aw.has(x)).length >= 2);
  });
  return [
    ...unique.map((i) => ({ title: i.title, caption: i.description, icon: i.icon })),
    ...assurances,
  ].slice(0, 4);
}

// `assurances` is supplied by the consuming app so this stays brand-neutral.
export default function VisaTrust({ items = [], assurances = [], title = "Why UAE Residents Trust Us", subtitle = "" }) {
  const cards = assurances.length ? mergeCards(items, assurances) : items.map((i) => ({ title: i.title, caption: i.description, icon: i.icon }));
  if (!cards.length) return null;

  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <Container>
        <SectionHead
          title={title}
          subtitle={subtitle}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(({ title: heading, caption, icon }) => {
            const Icon = resolveIcon(icon, "Check");
            return (
              <div
                key={heading}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_8px_rgba(16,24,40,0.04)]"
              >
                <div className="w-10 h-10 flex items-center justify-center bg-primary-50 text-primary-700 rounded-xl mb-4">
                  <Icon size={18} />
                </div>
                <p className="font-outfit font-medium text-[15px] text-gray-900 mb-1 leading-snug">
                  {heading}
                </p>
                {caption && (
                  <p className="font-outfit font-normal text-[13px] text-gray-600 leading-5">
                    {caption}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
