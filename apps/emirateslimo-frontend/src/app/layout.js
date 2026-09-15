import '@fontsource-variable/outfit';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'react-toastify/dist/ReactToastify.css';
import './globals.css';

import Providers from '@/components/Providers';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  metadataBase: new URL('https://www.emirateslimo.com'),
  title: 'Emirates Limo | Premium Chauffeur & Airport Transfer Dubai',
  description:
    'Premium chauffeur service and airport transfers in Dubai and across the UAE. Professional drivers, luxury vehicles, and always on time.',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    siteName: 'Emirates Limo',
    locale: 'en_AE',
    type: 'website',
    images: ['/hero-bg.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/hero-bg.webp'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
