import { Commissioner } from 'next/font/google';
import './globals.css';
import Providers from './Providers';

const commissioner = Commissioner({
  variable: '--font-commissioner',
  subsets: ['latin'],
  display: 'swap',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  metadataBase: new URL('https://www.thedummyticket.ae'),
  title: 'The Dummy Ticket AE',
  description: 'The Dummy Ticket AE',
  icons: {
    icon: '/logo-dark.png',
  },
  openGraph: {
    title: 'The Dummy Ticket AE',
    description: 'The Dummy Ticket AE',
    url: 'https://www.thedummyticket.ae',
    siteName: 'The Dummy Ticket AE',
    images: ['/og-image.png'],
  },
};

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
