import { SITE_URL } from '../lib/seo';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Picturesk.ai. Headshots that don\'t look AI.',
  description:
    'Upload a few selfies. We train a model on your face and give you studio-quality headshots. One price.',
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Commissioner:wght@400..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
