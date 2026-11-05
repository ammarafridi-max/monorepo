import { Commissioner } from 'next/font/google';
import './globals.css';
import Providers from './Providers';
import { getBrand } from '@travel-suite/config';
import { buildRootMetadata } from '@travel-suite/frontend-shared/seo/metadata';

const commissioner = Commissioner({
  variable: '--font-commissioner',
  subsets: ['latin'],
  display: 'swap',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata = buildRootMetadata(getBrand('mdt'));

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${commissioner.variable} h-full antialiased`}>
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
