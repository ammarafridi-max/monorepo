import Link from 'next/link';
import { LP_BRAND } from '@/lib/lp';

// Overrides the root not-found for this segment: the root one is serialised
// into every /lp payload and names the word these pages exist to avoid.
export const metadata = { title: { absolute: `Page not found | ${LP_BRAND}` }, robots: { index: false, follow: false } };

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold text-gray-900">This page does not exist</h1>
      <p className="mt-3 text-gray-600">The link you followed may be out of date.</p>
      <Link href="/lp/schengen" className="mt-8 inline-block rounded-full bg-primary-700 px-6 py-3 text-sm font-semibold text-white">
        See our Schengen service
      </Link>
    </main>
  );
}
