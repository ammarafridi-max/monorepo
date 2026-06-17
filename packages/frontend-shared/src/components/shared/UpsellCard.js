import Link from "next/link";

// Small cross-sell card: icon + title + blurb + optional price and a CTA that
// links internally (next/link) or externally (plain anchor in a new tab).
export default function UpsellCard({
  icon,
  title,
  description,
  price,
  priceCaption = "from",
  ctaLabel = "Book Now",
  href,
  external = false,
}) {
  const ctaClass =
    "text-xs font-bold px-3 py-1.5 bg-primary-700 hover:bg-primary-800 text-white rounded-lg transition-colors";

  const cta = external ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={ctaClass}
    >
      {ctaLabel}
    </a>
  ) : (
    <Link href={href} className={ctaClass}>
      {ctaLabel}
    </Link>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 flex items-center justify-center bg-primary-50 text-primary-700 rounded-full">
          {icon}
        </div>
        <p className="text-sm font-bold text-gray-700">{title}</p>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed mb-4">
        {description}
      </p>
      <div className="flex items-center justify-between">
        {price ? (
          <div>
            <p className="text-[10px] text-gray-400">{priceCaption}</p>
            <p className="text-sm font-bold text-gray-800">{price}</p>
          </div>
        ) : (
          <span />
        )}
        {cta}
      </div>
    </div>
  );
}
