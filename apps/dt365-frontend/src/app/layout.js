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
  metadataBase: new URL('https://www.dummyticket365.com'),
  title: 'Dummy Ticket 365',
  description: 'Dummy Ticket 365',
  icons: {
    icon: '/favicon.png',
  },
  openGraph: {
    title: 'Dummy Ticket 365',
    description: 'Dummy Ticket 365',
    url: 'https://www.dummyticket365.com',
    siteName: 'Dummy Ticket 365',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${commissioner.variable} h-full antialiased`}>
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
