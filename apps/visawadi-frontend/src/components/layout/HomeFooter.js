import Image from "next/image";
import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import SocialLinks from "@travel-suite/frontend-shared/components/ui/v2/SocialLinks";
import { Shell } from "@/components/design-system/Shell";
import { FOOTER_COLUMNS, FOOTER_LEGAL } from "@/config/homeNav";
import { EMAIL, WHATSAPP_URL, ADDRESS, GMB_URL, SOCIALS } from "@/config/contact";

const linkClass =
  "flex min-h-11 w-full items-center text-[0.9375rem] text-ink-body transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 md:min-h-0 md:py-1.5";

export default function HomeFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-canvas">
      <Shell className="py-14 md:py-18">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-12">
          <div className="max-w-sm">
            <Link
              href="/"
              aria-label="VisaWadi home"
              className="inline-flex min-h-11 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              <Image
                src="/logo-dark.png"
                alt="VisaWadi"
                width={182}
                height={32}
                className="h-7 w-auto"
              />
            </Link>
            <p className="mt-5 text-meta leading-7 text-ink-body">
              Visa application support for UAE residents. We prepare the file, check
              every document against embassy requirements, and follow it to a decision.
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <a
                href={`mailto:${EMAIL}`}
                className="inline-flex min-h-11 items-center gap-2.5 text-[0.9375rem] text-ink transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
              >
                <Mail size={16} aria-hidden="true" className="text-ink-faint" />
                {EMAIL}
              </a>
              {WHATSAPP_URL && (
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2.5 text-[0.9375rem] text-ink transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                >
                  <MessageCircle size={16} aria-hidden="true" className="text-ink-faint" />
                  Message us on WhatsApp
                </a>
              )}
            </div>

            {ADDRESS && (
              <address className="mt-5 text-[0.9375rem] not-italic leading-7 text-ink-soft">
                {GMB_URL ? (
                  <a href={GMB_URL} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
                    {ADDRESS}
                  </a>
                ) : (
                  ADDRESS
                )}
              </address>
            )}

            <SocialLinks socials={SOCIALS} tone="light" className="mt-6" />
          </div>

          {FOOTER_COLUMNS.map(({ heading, links }) => (
            <div key={heading}>
              <h2 className="text-[0.75rem] font-semibold uppercase tracking-widest text-ink">
                {heading}
              </h2>
              <ul className="mt-4 flex flex-col">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className={linkClass}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.8125rem] text-ink-faint">
            © {year} VisaWadi. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center gap-x-6">
            {FOOTER_LEGAL.map(({ label, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="inline-flex min-h-11 items-center text-[0.8125rem] text-ink-faint transition-colors hover:text-ink md:min-h-0"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Shell>
    </footer>
  );
}
