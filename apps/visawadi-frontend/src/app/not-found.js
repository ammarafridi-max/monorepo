import Link from 'next/link';
import { ShieldOff, ArrowLeft, Home } from 'lucide-react';

export const metadata = {
  title: '404 — Page Not Found | VisaWadi',
  description: 'The page you were looking for could not be found.',
};

export default function NotFound() {
  return (
    <div className="flex items-center justify-center px-6 py-24 bg-white text-gray-900">
      <div className="max-w-lg w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-50 border border-primary-100 mb-8">
          <ShieldOff size={36} className="text-primary-700" />
        </div>

        <p className="text-sm font-bold text-primary-600 uppercase tracking-widest mb-3">
          404 — Not Found
        </p>

        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          Page not found
        </h1>

        <p className="text-base text-gray-500 leading-relaxed mb-10">
          We couldn&apos;t find the page you were looking for. It may have been
          moved, renamed, or never existed. Double-check the URL or head back
          to safety.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors"
          >
            <Home size={15} />
            Back to Home
          </Link>
          <Link
            href="/uae"
            className="inline-flex items-center gap-2 border border-gray-200 hover:border-primary-300 text-gray-700 hover:text-primary-700 text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Browse Visas
            <ArrowLeft size={15} className="rotate-180" />
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-4 font-medium uppercase tracking-wide">
            Helpful pages
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {[
              { label: 'All Destinations', href: '/uae' },
              { label: 'Visa Check', href: '/visa-check' },
              { label: 'Blog', href: '/blog' },
              { label: 'About Us', href: '/about' },
              { label: 'Contact', href: '/contact' },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-primary-700 hover:underline font-medium"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
