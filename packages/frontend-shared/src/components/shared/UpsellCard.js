import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function UpsellCard({
  icon,
  title,
  description,
  price,
  priceCaption = "from",
  ctaLabel = "Book now",
  brand,
  href,
  external = false,
  badge,
}) {
  const ctaClass =
    "inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-primary-700 hover:bg-primary-800 text-white rounded-lg transition-colors";

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
    <div className="bg-white border border-primary-200 rounded-2xl shadow-sm p-5 flex flex-col">
      <div className="flex items-start gap-2 mb-2">
        <span className="w-7 h-7 flex items-center justify-center text-primary-700 shrink-0 overflow-hidden [&>img]:w-6 [&>img]:h-6 [&>svg]:w-5 [&>svg]:h-5 mt-0.5">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">{title}</p>
          {brand && <p className="text-xs text-gray-500 mt-0.5">{brand}</p>}
        </div>
        {badge && (
          <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-primary-700 bg-primary-50 rounded-full px-2 py-0.5">
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 leading-relaxed mb-4">{description}</p>
      <div className="mt-auto flex items-center justify-between gap-3">
        {price ? (
          <p className="text-sm text-gray-600">
            {priceCaption} <span className="font-semibold text-gray-900">{price}</span>
          </p>
        ) : (
          <span />
        )}
        {cta}
      </div>
    </div>
  );
}
