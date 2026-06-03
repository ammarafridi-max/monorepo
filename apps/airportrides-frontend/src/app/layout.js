import { Plus_Jakarta_Sans, Hanken_Grotesk } from 'next/font/google';
import './globals.css';
import Providers from './Providers';
import { SITE_URL } from '@/config';

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const hanken = Hanken_Grotesk({
  variable: '--font-hanken',
  subsets: ['latin'],
  display: 'swap',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'AirportRides',
  description: 'Airport transfers worldwide',
  icons: {
    icon: '/favicon.png',
  },
  openGraph: {
    title: 'AirportRides',
    description: 'Airport transfers worldwide',
    url: SITE_URL,
    siteName: 'AirportRides',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${hanken.variable} h-full antialiased`}
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
