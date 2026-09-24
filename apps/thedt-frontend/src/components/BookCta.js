import Link from 'next/link';
import { CURRENCY, PRICING_OPTIONS } from '@/config';

const lowest = Math.min(...PRICING_OPTIONS.map((o) => o.price));

export default function BookCta({
  text = 'Pick your flight, add the passenger names, pay. The reservation is in your inbox within 10 to 15 minutes, whatever time it is where you are.',
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center gap-4 text-center ${className}`}>
      <p className="max-w-xl text-[15px] font-light leading-7 text-gray-600">{text}</p>
      <Link
        href="#form"
        className="inline-flex items-center justify-center rounded-lg border border-accent-500 bg-accent-500 px-6 py-3 font-outfit text-sm md:text-base text-white transition-colors hover:bg-accent-600"
      >
        Book now from {CURRENCY} {lowest}
      </Link>
    </div>
  );
}
