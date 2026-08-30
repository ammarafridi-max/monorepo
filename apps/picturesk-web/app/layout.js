import { SITE_URL } from '../lib/seo';

// Deliberately thin: it owns <html>/<body> and the fonts, nothing else. The
// customer stylesheet and chrome live in (site)/layout.js so they never load on
// /admin, whose shared dashboard UI is Tailwind and would otherwise inherit
// globals.css element rules (an unlayered `a { color }` beats every Tailwind
// utility and made the active nav item green-on-green).
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
        {/* Fonts loaded at runtime so the build never depends on the network.
            Fraunces = serif display, Inter = grotesque body (see BRAND.md). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
