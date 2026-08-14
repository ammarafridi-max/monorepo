import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import Container from "../../shared/layout/Container.js";
import SocialLinks from "../../ui/v2/SocialLinks.js";

const DEFAULT_COLUMNS = [
  {
    heading: "Products",
    links: [
      { label: "Single Trip", href: "#" },
      { label: "Annual Multi-Trip", href: "#" },
      { label: "Family Plans", href: "#" },
      { label: "Business Travel", href: "#" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
      { label: "Blog", href: "#" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Help Centre", href: "#" },
      { label: "Make a Claim", href: "#" },
      { label: "Contact Us", href: "#" },
      { label: "Privacy Policy", href: "#" },
    ],
  },
];

/**
 * Site footer. All branding is parameterized so each app supplies its own.
 * Defaults preserve the original look for any caller that doesn't pass props.
 */
export default function Footer({
  brand = "",
  logoEmoji = "🛡️",
  logoSrc = null,
  logoWidth = 110,
  logoHeight = 32,
  logoAlt = "",
  description = "Protecting travellers worldwide since 2018. Licensed and regulated in 40+ countries.",
  copyright,
  columns = DEFAULT_COLUMNS,
  socials = [],
  address = null,
  addressHref = null,
} = {}) {
  const year = new Date().getFullYear();
  const copyrightText =
    copyright ?? `© ${year} ${brand}. All rights reserved.`;

  return (
    <footer className="bg-gray-900 text-gray-400 text-sm">
      <Container className="py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg text-white mb-3"
          >
            {logoSrc ? (
              <Image
                src={logoSrc}
                alt={logoAlt || brand}
                width={logoWidth}
                height={logoHeight}
                className="h-7 w-auto object-contain"
              />
            ) : (
              <>
                {logoEmoji && <span>{logoEmoji}</span>} {brand}
              </>
            )}
          </Link>
          <p className="text-sm leading-relaxed">{description}</p>

          {address &&
            (addressHref ? (
              <a
                href={addressHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-start gap-2 text-sm leading-relaxed hover:text-white transition-colors"
              >
                <MapPin size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{address}</span>
              </a>
            ) : (
              <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed">
                <MapPin size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{address}</span>
              </p>
            ))}

          <SocialLinks socials={socials} tone="dark" className="mt-5" />

        </div>
        {columns.map(({ heading, links }) => (
          <div key={heading}>
            <p className="font-semibold text-white mb-4">{heading}</p>
            <ul className="space-y-2">
              {links.map((link) => {
                // Accept either string (legacy) or { label, href } objects.
                const label = typeof link === "string" ? link : link.label;
                const href = typeof link === "string" ? "#" : link.href;
                return (
                  <li key={label}>
                    <Link
                      href={href}
                      className="hover:text-white transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </Container>
      <div className="border-t border-gray-800 py-6 text-center text-xs text-gray-600">
        {copyrightText}
      </div>
    </footer>
  );
}
