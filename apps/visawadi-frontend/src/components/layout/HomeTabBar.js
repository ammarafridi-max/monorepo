"use client";

import Link from "next/link";
import { FileText, Home, Menu, Search } from "lucide-react";
import { DEFAULT_COUNTRY } from "@/config/countries";

const TABS = [
  { href: "/", label: "Home", icon: Home, current: true },
  { href: "/visa-check", label: "Check", icon: Search },
  { href: `/${DEFAULT_COUNTRY.slug}`, label: "Apply", icon: FileText },
  { href: "/blog", label: "Guides", icon: Menu },
];

export default function HomeTabBar() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line-soft bg-surface/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="grid grid-cols-4">
        {TABS.map(({ href, label, icon: Icon, current }) => (
          <li key={label}>
            <Link
              href={href}
              aria-current={current ? "page" : undefined}
              className={`flex min-h-[58px] flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600 ${
                current ? "text-brand-600" : "text-ink-faint hover:text-ink"
              }`}
            >
              <Icon size={22} strokeWidth={current ? 2.2 : 1.8} aria-hidden="true" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
