import '@fontsource-variable/outfit';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'react-toastify/dist/ReactToastify.css';
import './globals.css';

import Providers from '@/components/Providers';
import { getBrand } from '@travel-suite/config';
import { buildRootMetadata } from '@travel-suite/frontend-shared/seo/metadata';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata = buildRootMetadata(getBrand('emirateslimo'), {
  icons: { icon: '/favicon.png', apple: '/favicon.png' },
  openGraph: {
    title: null,
    description: null,
    url: null,
    locale: 'en_AE',
    type: 'website',
    images: ['/hero-bg.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/hero-bg.webp'],
  },
});

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
