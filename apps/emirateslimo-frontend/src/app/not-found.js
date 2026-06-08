import Link from 'next/link';
import PrimarySection from '@/components/PrimarySection';
import Container from '@/components/Container';

export default function NotFound() {
  return (
    <PrimarySection className="relative overflow-hidden bg-primary-900 min-h-dvh flex items-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-accent-500/5 blur-3xl" />
      </div>
      <Container className="relative flex flex-col items-center text-center py-20">
        <p className="text-[120px] lg:text-[180px] font-light leading-none tracking-tight text-accent-500/20 select-none">
          404
        </p>
        <div className="flex items-center gap-4 -mt-4 mb-8">
          <span className="h-px w-10 bg-accent-500/40" />
          <p className="text-[10.5px] tracking-[0.28em] font-light uppercase text-accent-500">
            Page Not Found
          </p>
          <span className="h-px w-10 bg-accent-500/40" />
        </div>
        <h1 className="text-[26px] lg:text-[36px] font-light text-white leading-tight tracking-tight max-w-lg mb-4">
          The page you&apos;re looking for doesn&apos;t exist
        </h1>
        <p className="text-[15px] font-light text-white/45 leading-[1.85] max-w-sm mb-10">
          It may have been moved, renamed, or removed. Head back to the homepage
          to continue your journey.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white text-[13.5px] font-light tracking-wide py-3.5 px-7 rounded-lg transition-colors duration-300 group"
        >
          <span>Back to Home</span>
          <span className="transition-transform duration-300 group-hover:translate-x-0.5">
            →
          </span>
        </Link>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          {[
            { label: 'Airport Transfers', href: '/dubai-airport-transfer' },
            { label: 'Chauffeur Service', href: '/chauffeur-service' },
            { label: 'Our Fleet', href: '/fleet' },
            { label: 'Contact Us', href: '/contact-us' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[13px] font-light text-white/35 hover:text-accent-400 tracking-wide transition-colors duration-300"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </Container>
    </PrimarySection>
  );
}
