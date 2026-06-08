import '@fontsource-variable/outfit';
import '@fontsource-variable/inter';
import '@fontsource-variable/dm-sans';
import '@fontsource/google-sans/400.css';
import '@fontsource/google-sans/500.css';
import '@fontsource/google-sans/600.css';
import '@fontsource/google-sans/700.css';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'react-toastify/dist/ReactToastify.css';
import './globals.css';

import SitewideSchema from '@/components/SitewideSchema';
import Providers from '@/components/Providers';

export const metadata = {
  metadataBase: new URL('https://www.emirateslimo.com'),
  title: {
    default: 'Emirates Limo | Premium Chauffeur & Airport Transfer Dubai',
    template: '%s | Emirates Limo',
  },
  description:
    'Premium chauffeur service and airport transfers in Dubai and across the UAE. Professional drivers, luxury vehicles, and always on time.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    siteName: 'Emirates Limo',
    locale: 'en_AE',
    type: 'website',
    images: [{ url: '/logo-light.webp', width: 1200, height: 630, alt: 'Emirates Limo' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/logo-light.webp'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SitewideSchema />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
