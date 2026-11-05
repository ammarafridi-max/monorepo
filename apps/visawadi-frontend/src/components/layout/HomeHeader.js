"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Button from "@/components/design-system/Button";
import { Shell } from "@/components/design-system/Shell";
import { NAV_LINKS, PRIMARY_ACTION, SECONDARY_ACTION } from "@/config/homeNav";

function NavLink({ href, label, onClick }) {
  const external = href.startsWith("#");
  const className =
    "inline-flex min-h-11 items-center rounded-full px-4 text-[0.9375rem] font-medium text-ink-body transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2";

  if (external) {
    return (
      <a href={href} onClick={onClick} className={className}>
        {label}
      </a>
    );
  }
  return (
    <Link href={href} onClick={onClick} className={className}>
      {label}
    </Link>
  );
}

export default function HomeHeader() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    function onKeyDown(e) {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const logo = (
    <Link
      href="/"
      aria-label="VisaWadi home"
      className="inline-flex min-h-11 shrink-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
    >
      <Image
        src="/logo-dark.png"
        alt="VisaWadi"
        width={182}
        height={32}
        priority
        className="h-7 w-auto md:h-8"
      />
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-line-soft bg-surface/90 backdrop-blur-md">
      <Shell className="flex h-16 items-center justify-between gap-6 md:h-20">
        {logo}

        <nav aria-label="Primary" className="hidden flex-1 justify-center lg:flex">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <NavLink {...link} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden lg:block">
            <Button
              href={SECONDARY_ACTION.href}
              variant="quiet"
              rel={SECONDARY_ACTION.nofollow ? "nofollow" : undefined}
            >
              {SECONDARY_ACTION.label}
            </Button>
          </span>
          <span className="hidden sm:block">
            <Button href={PRIMARY_ACTION.href}>{PRIMARY_ACTION.label}</Button>
          </span>
        </div>

        <button
          type="button"
          ref={toggleRef}
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 lg:hidden"
        >
          <Menu size={19} aria-hidden="true" />
        </button>
      </Shell>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-x-0 top-0 max-h-dvh overflow-y-auto rounded-b-panel bg-surface pb-8 shadow-sheet focus:outline-none"
          >
            <Shell className="flex h-16 items-center justify-between">
              {logo}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  toggleRef.current?.focus();
                }}
                aria-label="Close menu"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
              >
                <X size={19} aria-hidden="true" />
              </button>
            </Shell>

            <Shell>
              <nav aria-label="Mobile">
                <ul className="flex flex-col border-t border-line-soft pt-2">
                  {NAV_LINKS.map((link) => (
                    <li key={link.label} className="border-b border-line-soft">
                      <NavLink {...link} onClick={() => setOpen(false)} />
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="mt-6 flex flex-col gap-3">
                <Button
                  href={PRIMARY_ACTION.href}
                  size="lg"
                  className="w-full"
                  onClick={() => setOpen(false)}
                >
                  {PRIMARY_ACTION.label}
                </Button>
                <Button
                  href={SECONDARY_ACTION.href}
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  rel={SECONDARY_ACTION.nofollow ? "nofollow" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {SECONDARY_ACTION.label}
                </Button>
              </div>
            </Shell>
          </div>
        </div>
      )}
    </header>
  );
}
