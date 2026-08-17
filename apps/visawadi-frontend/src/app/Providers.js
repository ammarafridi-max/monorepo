"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import { UserAuthContext } from "@travel-suite/frontend-shared/contexts/AuthContextBase";
import AppMegaLayout from "@travel-suite/frontend-shared/layouts/AppMegaLayout";
import { UserAuthProvider } from "@travel-suite/frontend-shared/contexts/UserAuthProvider";
import Footer from "@travel-suite/frontend-shared/components/sections/v2/Footer";
import StickyWhatsApp from "@travel-suite/frontend-shared/components/ui/v2/StickyWhatsApp";
import AnalyticsInit from "@travel-suite/frontend-shared/components/shared/AnalyticsInit";
import ClarityInit from "@travel-suite/frontend-shared/components/shared/ClarityInit";
import {
  EMAIL,
  WHATSAPP_NUMBER,
  ADDRESS,
  GMB_URL,
  SOCIALS,
} from "@/config/contact";

const BRAND = "VisaWadi";

const visawadiFooter = (
  <Footer
    brand={BRAND}
    // Light logo on the footer's gray-900 ground; dark logo on the white navbar.
    logoSrc="/logo-light.png"
    logoWidth={1000}
    logoHeight={179}
    logoAlt={BRAND}
    description="Visa application support for UAE residents. We prepare the file, check every document, and follow it to a decision."
    copyright={`© ${new Date().getFullYear()} ${BRAND}. All rights reserved.`}
    socials={SOCIALS}
    address={ADDRESS}
    addressHref={GMB_URL}
    columns={[
      {
        heading: "Visa Assistance",
        links: [
          { label: "All Destinations", href: "/visa" },
          { label: "Schengen Visa", href: "/visa/schengen" },
          { label: "United Kingdom", href: "/visa/united-kingdom" },
          { label: "United States", href: "/visa/usa" },
          { label: "Canada", href: "/visa/canada" },
        ],
      },
      {
        heading: "Schengen Countries",
        links: [
          { label: "France", href: "/visa/france-visa" },
          { label: "Germany", href: "/visa/germany-visa" },
          { label: "Italy", href: "/visa/italy-visa" },
          { label: "Spain", href: "/visa/spain-visa" },
        ],
      },
      {
        heading: "Company",
        links: [
          { label: "Blog", href: "/blog" },
          { label: "Contact Us", href: "/contact" },
          { label: "Privacy Policy", href: "/privacy-policy" },
          { label: "Terms & Conditions", href: "/terms-and-conditions" },
        ],
      },
    ]}
  />
);

const defaultPages = [
  {
    name: "Visa Assistance",
    links: ["/visa"],
    mega: {
      layout: "tabs",
      columns: [
        {
          heading: "For UAE Residents",
          items: [
            {
              Icon: Globe,
              label: "All Destinations",
              desc: "Browse every visa service we offer",
              href: "/visa",
            },
            {
              flag: "european_union",
              label: "Schengen Visa",
              desc: "Access 29 European countries with one visa",
              href: "/visa/schengen",
            },
            {
              flag: "fr",
              label: "France",
              desc: "Schengen visa handled through VFS Global France",
              href: "/visa/france-visa",
            },
            {
              flag: "de",
              label: "Germany",
              desc: "Schengen visa handled through VFS Global Germany",
              href: "/visa/germany-visa",
            },
            {
              flag: "it",
              label: "Italy",
              desc: "Schengen visa handled through VFS Global Italy",
              href: "/visa/italy-visa",
            },
            {
              flag: "es",
              label: "Spain",
              desc: "Schengen visa handled through BLS Spain",
              href: "/visa/spain-visa",
            },
            {
              flag: "gb",
              label: "United Kingdom",
              desc: "Tourism, business, and family visits to the UK",
              href: "/visa/united-kingdom",
            },
            {
              flag: "us",
              label: "United States",
              desc: "B1/B2 visitor visa with interview coaching",
              href: "/visa/usa",
            },
            {
              flag: "ca",
              label: "Canada",
              desc: "Temporary resident visa for tourism and family",
              href: "/visa/canada",
            },
          ],
        },
      ],
    },
  },
  { name: "Blog", links: ["/blog"] },
  { name: "Email Us", links: [`mailto:${EMAIL}`] },
];

const GUEST_AUTH = {
  user: null,
  isAuthenticated: false,
  isLoadingAuth: false,
  setUser: () => {},
  refreshUser: async () => {},
};

function GuestAuthProvider({ children }) {
  return (
    <UserAuthContext.Provider value={GUEST_AUTH}>
      {children}
    </UserAuthContext.Provider>
  );
}

export default function Providers({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  // Real customer auth only on the /apply visa-application routes; every other
  // public page keeps the guest provider.
  const isApplyRoute = pathname?.startsWith("/apply");
  const AuthProvider = isApplyRoute ? UserAuthProvider : GuestAuthProvider;

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 300 * 1000 } },
      }),
  );

  if (isAdminRoute) {
    return (
      <>
        <Toaster />
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </>
    );
  }

  return (
    <>
      <AnalyticsInit />
      <ClarityInit />
      <Toaster />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppMegaLayout
            pages={defaultPages}
            logoSrc="/logo-dark.png"
            logoWidth={1000}
            logoHeight={176}
            logoAlt={BRAND}
            footer={visawadiFooter}
            // We never quote a converted price, so the currency switcher has no
            // job here and the currencies fetch it triggers is dead weight.
            showCurrency={false}
            // Sign Up / Log In are hidden for now. Customers reach their
            // application through the emailed link, not a public account area.
            // Restore by pointing these at "/apply/signup" and "/apply/login".
            loginHref={null}
            signupHref={null}
          >
            <main>{children}</main>
          </AppMegaLayout>
          {WHATSAPP_NUMBER && (
            <StickyWhatsApp
              phoneNumber={WHATSAPP_NUMBER}
              hidePathPrefixes={["/apply"]}
            />
          )}
        </AuthProvider>
      </QueryClientProvider>
    </>
  );
}
