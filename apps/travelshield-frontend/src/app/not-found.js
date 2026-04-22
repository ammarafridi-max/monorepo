import Link from 'next/link';
import { ShieldOff, ArrowLeft, Home } from 'lucide-react';
import Navbar from '@travel-suite/frontend-shared/components/v2/sections/Navbar';
import Footer from '@travel-suite/frontend-shared/components/v2/sections/Footer';

export const metadata = {
  title: '404 — Page Not Found | TravelShield',
  description: 'The page you were looking for could not be found.',
};

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="max-w-lg w-full text-center">

          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-50 border border-primary-100 mb-8">
            <ShieldOff size={36} className="text-primary-700" />
          </div>

          {/* Status */}
          <p className="text-sm font-bold text-primary-600 uppercase tracking-widest mb-3">
            404 — Not Found
          </p>

          {/* Headline */}
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            Page not found
          </h1>

          {/* Description */}
          <p className="text-base text-gray-500 leading-relaxed mb-10">
            We couldn&apos;t find the page you were looking for. It may have been
            moved, renamed, or never existed. Double-check the URL or head back
            to safety.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors"
            >
              <Home size={15} />
              Back to Home
            </Link>
            <Link
              href="/insurance-booking/quote"
              className="inline-flex items-center gap-2 border border-gray-200 hover:border-primary-300 text-gray-700 hover:text-primary-700 text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Get a Quote
              <ArrowLeft size={15} className="rotate-180" />
            </Link>
          </div>

          {/* Helpful links */}
          <div className="mt-12 pt-8 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-4 font-medium uppercase tracking-wide">
              Helpful pages
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {[
                { label: 'Home', href: '/' },
                { label: 'Get a Quote', href: '/quote' },
                { label: 'About Us', href: '/about' },
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms & Conditions', href: '/terms' },
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
      </main>

      <Footer />
    </div>
  );
}
