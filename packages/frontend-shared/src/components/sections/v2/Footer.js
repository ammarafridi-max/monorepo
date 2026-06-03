import Link from "next/link";
import Image from "next/image";
import Container from "../../shared/layout/Container.js";

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
  brand = "TravelShield",
  logoEmoji = "🛡️",
  logoSrc = null,
  logoAlt = "",
  description = "Protecting travellers worldwide since 2018. Licensed and regulated in 40+ countries.",
  copyright,
  columns = DEFAULT_COLUMNS,
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
                width={110}
                height={32}
                className="h-7 w-auto object-contain"
              />
            ) : (
              <>
                {logoEmoji && <span>{logoEmoji}</span>} {brand}
              </>
            )}
          </Link>
          <p className="text-sm leading-relaxed">{description}</p>
        </div>
        {columns.map(({ heading, links }) => (
          <div key={heading}>
            <h4 className="font-semibold text-white mb-4">{heading}</h4>
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
