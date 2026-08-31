import { Commissioner, Geist_Mono } from 'next/font/google';
import './globals.css';
import Providers from './Providers';

// Commissioner is the brand face. It ships a variable weight axis (100-900), so
// one request covers every weight the UI uses instead of pinning a list.
// It has no italic style, so <em> renders as a synthesised oblique.
const brandSans = Commissioner({
  variable: '--font-brand',
  subsets: ['latin'],
  display: 'swap',
  // Next has no metric overrides for this face, so it cannot auto-generate a
  // size-matched fallback. Naming the stack explicitly at least keeps the
  // pre-swap render on a humanist sans rather than Times.
  fallback: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  metadataBase: new URL('https://www.visawadi.com'),
  title: {
    default: 'VisaWadi — Visa Assistance for UAE Residents',
    template: '%s | VisaWadi',
  },
  description:
    'Visa application support for UAE residents. We prepare your file, check every document against embassy requirements, and track the application to a decision.',
  robots: { index: true, follow: true },
  icons: {
    icon: '/favicon.png',
  },
  openGraph: {
    title: 'VisaWadi — Visa Assistance for UAE Residents',
    description:
      'Visa application support for UAE residents. Schengen, UK, US and Canada.',
    url: 'https://www.visawadi.com',
    siteName: 'VisaWadi',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${brandSans.variable} ${geistMono.variable} h-full antialiased`}>
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
