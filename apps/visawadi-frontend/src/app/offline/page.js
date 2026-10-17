import Link from 'next/link';

export const metadata = {
  title: 'Offline',
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="mx-auto max-w-md px-5 py-20 text-center">
      <h1 className="text-2xl font-bold text-gray-900">You are offline</h1>
      <p className="mt-3 leading-relaxed text-gray-600">
        Pages you have already opened are still available. Anything with a fee or a deadline on it
        needs a connection, because we will not show you a figure we cannot confirm is current.
      </p>
      <Link
        href="/visa-check"
        className="mt-8 inline-block rounded-full bg-primary-700 px-6 py-3 text-sm font-semibold text-white"
      >
        Open the visa check
      </Link>
    </main>
  );
}
