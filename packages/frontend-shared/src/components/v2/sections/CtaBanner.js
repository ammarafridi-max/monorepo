import Link from 'next/link';

export default function CtaBanner({
  title = 'Ready for your next adventure?',
  description = 'Get insured in minutes. Policies start from just $1.50/day.',
  buttonText = 'Get a Free Quote',
  buttonLink = '/insurance-booking/quote',
  secondaryButtonText = 'Compare Plans',
  secondaryButtonLink = '/plans',
}) {
  return (
    <section className="bg-primary-700 text-white py-20">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">
          {title}
        </h2>
        <p className="mt-4 text-primary-200 text-lg">{description}</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/insurance-booking/quote"
            className="bg-white text-primary-700 hover:bg-primary-50 font-bold px-8 py-4 rounded-full text-sm transition-colors"
          >
            {buttonText}
          </Link>
          <Link
            href="/plans"
            className="border border-white/40 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-full text-sm transition-colors"
          >
            {secondaryButtonText}
          </Link>
        </div>
      </div>
    </section>
  );
}
