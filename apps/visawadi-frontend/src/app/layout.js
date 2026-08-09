import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Providers from './Providers';

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
  display: 'swap',
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
  metadataBase: new URL('https://www.visawadi.ae'),
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
    url: 'https://www.visawadi.ae',
    siteName: 'VisaWadi',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} h-full antialiased`}>
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
