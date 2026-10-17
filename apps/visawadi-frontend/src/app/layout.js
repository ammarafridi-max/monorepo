import { Commissioner, Geist_Mono, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./Providers";

const brandSans = Commissioner({
  variable: "--font-brand",
  subsets: ["latin"],
  display: "swap",
  fallback: [
    "ui-sans-serif",
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "sans-serif",
  ],
});

const dataMono = IBM_Plex_Mono({
  variable: "--font-data",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#254b8e",
};

export const metadata = {
  metadataBase: new URL("https://www.visawadi.com"),
  title: {
    default: "VisaWadi — Visa Assistance for UAE Residents",
    template: "%s | VisaWadi",
  },
  description:
    "Visa application support for UAE residents. We prepare your file, check every document against embassy requirements, and track the application to a decision.",
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.png", type: "image/png", sizes: "300x300" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "VisaWadi" },
  openGraph: {
    title: "VisaWadi — Visa Assistance for UAE Residents",
    description:
      "Visa application support for UAE residents. Schengen, UK, US and Canada.",
    url: "https://www.visawadi.com",
    siteName: "VisaWadi",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${brandSans.variable} ${dataMono.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
