"use client";

import { useEffect, useState } from "react";

/**
 * @param {{id: string}[]} headings in document order
 * @returns {string|null} id of the active heading
 */
export function useActiveHeading(headings = []) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? null);

  useEffect(() => {
    if (!headings.length) return undefined;
    if (typeof IntersectionObserver === "undefined") return undefined;

    const nodes = headings
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean);
    if (!nodes.length) return undefined;

    const onScreen = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) onScreen.add(entry.target.id);
          else onScreen.delete(entry.target.id);
        }
        const firstVisible = headings.find(({ id }) => onScreen.has(id));
        if (firstVisible) setActiveId(firstVisible.id);
      },
      { rootMargin: "-88px 0px -65% 0px", threshold: 0 },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [headings]);

  return activeId;
}

export default useActiveHeading;
