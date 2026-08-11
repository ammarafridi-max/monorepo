import Link from "next/link";
import { ArrowRight, Check, Clock } from "lucide-react";

// What every package includes, shown on the card so the grid reads as a
// consistent offer rather than a list of countries.
const DEFAULT_FEATURES = [
  "Full document review and file preparation",
  "VFS or embassy appointment booking",
  "Cover letter and financial summary written for you",
];

/**
 * Visa destination card. Used on the /visa listing and on the homepage.
 *
 * `fallbackTagline` covers pages written before the admin excerpt field
 * existed; the excerpt wins whenever an editor has set one.
 */
export default function VisaCard({ visa, fallbackTagline = "", features = DEFAULT_FEATURES, href }) {
  if (!visa?.slug) return null;

  const tagline = visa.excerpt || fallbackTagline || visa.heroSubheadline || "";

  const cheapest = (visa.packages ?? []).reduce(
    (min, p) =>
      min == null || (Number(p.price) || 0) < (Number(min.price) || 0) ? p : min,
    null,
  );
  const fromPrice = cheapest ? Number(cheapest.price) || 0 : null;
  const timeline = cheapest?.timeline ?? null;

  return (
    <Link
      // Country-segmented sites pass an explicit href; the default keeps the
      // pre-segmentation path working for anything still on /visa/*.
      href={href || `/visa/${visa.slug}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-[0_4px_20px_rgba(16,24,40,0.06)] hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(16,24,40,0.12)] transition-all duration-300"
    >
      <div className="relative aspect-16/7 bg-linear-to-br from-primary-50 to-primary-100/50 overflow-hidden">
        {visa.heroImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={visa.heroImageUrl}
            alt={`${visa.countryName} visa`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </div>

      <div className="flex flex-col flex-1 py-5 px-5">
        <h3 className="font-semibold text-[17px] leading-snug text-gray-900 mb-1.5">
          {visa.countryName} Visa
        </h3>
        <p className="text-[13px] text-gray-500 leading-5">{tagline}</p>

        <ul className="mt-4 flex flex-col gap-2 flex-1">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2 text-[12.5px] text-gray-600 leading-snug"
            >
              <Check size={14} className="text-primary-600 shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {timeline && (
          <p className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-500">
            <Clock size={13} className="text-primary-500 shrink-0" />
            Approx. {timeline}
          </p>
        )}

        <div className="flex items-center justify-between mt-3 pt-4 border-t border-gray-100">
          {fromPrice != null && (
            <span className="text-[13px] font-semibold text-primary-700">
              From AED {fromPrice.toLocaleString()}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary-700 group-hover:text-primary-800 transition-colors ml-auto">
            Learn more <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  );
}
