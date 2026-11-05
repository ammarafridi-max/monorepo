import { DEFAULT_COUNTRY } from "@/config/countries";

const DIRECTORY = `/${DEFAULT_COUNTRY.slug}`;

export const NAV_LINKS = [
  { label: "Destinations", href: DIRECTORY },
  { label: "Visa check", href: "/visa-check" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Support", href: "/contact" },
];

export const PRIMARY_ACTION = { label: "Apply for a visa", href: DIRECTORY };

export const SECONDARY_ACTION = {
  label: "Track application",
  href: "/apply/login",
  nofollow: true,
};

export const FOOTER_COLUMNS = [
  {
    heading: "Visa assistance",
    links: [
      { label: "All destinations", href: DIRECTORY },
      { label: "Schengen visa", href: `${DIRECTORY}/visa/schengen` },
      { label: "United Kingdom", href: `${DIRECTORY}/visa/united-kingdom` },
      { label: "United States", href: `${DIRECTORY}/visa/usa` },
      { label: "Canada", href: `${DIRECTORY}/visa/canada` },
      { label: "Saudi Arabia", href: `${DIRECTORY}/visa/saudi-arabia` },
    ],
  },
  {
    heading: "Schengen countries",
    links: [
      { label: "France", href: `${DIRECTORY}/visa/france-visa` },
      { label: "Germany", href: `${DIRECTORY}/visa/germany-visa` },
      { label: "Greece", href: `${DIRECTORY}/visa/greece-visa` },
      { label: "Italy", href: `${DIRECTORY}/visa/italy-visa` },
      { label: "Spain", href: `${DIRECTORY}/visa/spain-visa` },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "Visa check", href: "/visa-check" },
      { label: "Blog", href: "/blog" },
      { label: "FAQs", href: "/faq" },
      { label: "Contact us", href: "/contact" },
    ],
  },
];

export const FOOTER_LEGAL = [
  { label: "Privacy policy", href: "/privacy-policy" },
  { label: "Terms and conditions", href: "/terms-and-conditions" },
];
