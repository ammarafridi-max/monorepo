import { permanentRedirect } from 'next/navigation';

// The AI headshot generator content now lives at its own URL,
// /ai-headshot-generator, so the root can become a multi-service hub as more services
// are added. Until that hub exists, the root permanently redirects (308) to the
// product page, so its keyword equity flows there and the content never has to be
// migrated a second time.
export default function RootRedirect() {
  permanentRedirect('/ai-headshot-generator');
}
