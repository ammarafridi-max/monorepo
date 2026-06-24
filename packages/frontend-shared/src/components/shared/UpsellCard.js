import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Cross-sell card surfaced on payment-success pages. Tuned for prominence:
// gradient background, primary-tinted border, large icon badge, big CTA.
// Optional `badge` prop renders a small tag in the top-right corner
// (e.g. "Recommended", "Most popular") — omit for none.
export default function UpsellCard({
  icon,
  title,
  description,
  price,
  priceCaption = "from",
  ctaLabel = "Book Now",
  href,
  external = false,
  badge,
}) {
  const ctaClass =
    "inline-flex items-center gap-1 text-xs font-bold px-3 py-2 bg-primary-700 hover:bg-primary-800 text-white rounded-lg transition-colors shadow-sm";

  const ctaContent = (
    <>
      {ctaLabel}
      <ArrowRight size={12} />
    </>
  );

  const cta = external ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={ctaClass}
    >
      {ctaContent}
    </a>
  ) : (
    <Link href={href} className={ctaClass}>
      {ctaContent}
    </Link>
  );

  return (
    <div className="relative bg-gradient-to-br from-primary-50 via-white to-primary-50 border-2 border-primary-200 rounded-2xl overflow-hidden shadow-md p-6">
      {badge && (
        <span className="absolute top-3 right-3 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-accent-100 text-accent-700 border border-accent-200">
          {badge}
        </span>
      )}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 flex items-center justify-center bg-primary-700 text-white rounded-lg shadow-sm shrink-0">
          {icon}
        </div>
        <p className="text-base font-extrabold text-gray-900 leading-tight">{title}</p>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed mb-5">
        {description}
      </p>
      <div className="flex items-center justify-between gap-3">
        {price ? (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{priceCaption}</p>
            <p className="text-base font-extrabold text-gray-900">{price}</p>
          </div>
        ) : (
          <span />
        )}
        {cta}
      </div>
    </div>
  );
}
