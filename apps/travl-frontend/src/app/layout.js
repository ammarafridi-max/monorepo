import { Outfit } from 'next/font/google';
import './globals.css';
import Providers from './Providers';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  metadataBase: new URL('https://www.travl.ae'),
  title: 'Travl',
  description: 'Travl',
  icons: {
    icon: '/favicon.png',
  },
  openGraph: {
    title: 'Travl',
    description: 'Travl',
    url: 'https://www.travl.ae',
    siteName: 'Travl',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
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
