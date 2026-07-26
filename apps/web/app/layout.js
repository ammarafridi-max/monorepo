import './globals.css';
import { getSession } from '../lib/session';
import SiteChrome from '../components/SiteChrome';
import Analytics from '../components/Analytics';
import { SITE_URL } from '../lib/seo';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Picturesk.ai. Headshots that don\'t look AI.',
  description:
    'Upload a few selfies. We train a model on your face and give you studio-quality headshots. One price.',
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }) {
  const session = await getSession();

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
      <body>
        <Analytics />
        <SiteChrome authed={Boolean(session)} email={session?.email}>
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
