import Link from "next/link";

export default function BlogOfferCard({ offer, compact = false }) {
  if (!offer?.href || !offer?.cta) return null;

  const { eyebrow, price, note, href, cta, tone = "plain", external = false } = offer;
  const isBrand = tone === "brand";

  const linkProps = external
    ? { href, target: "_blank", rel: "noopener noreferrer" }
    : { href };
  const LinkTag = external ? "a" : Link;

  return (
    <div
      className={`rounded-2xl border p-4 ${
        isBrand
          ? "border-primary-700 bg-primary-700 text-white"
          : "border-gray-200 bg-white"
      } ${compact ? "" : "space-y-2"}`}
    >
      {eyebrow && (
        <p
          className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${
            isBrand ? "text-white/70" : "text-gray-400"
          }`}
        >
          {eyebrow}
        </p>
      )}

      {price && (
        <p
          className={`text-xl font-bold leading-none ${
            isBrand ? "text-white" : "text-gray-900"
          }`}
        >
          {price}
        </p>
      )}

      {note && (
        <p
          className={`text-[13px] leading-5 ${
            isBrand ? "text-white/80" : "text-gray-600"
          }`}
        >
          {note}
        </p>
      )}

      <LinkTag
        {...linkProps}
        className={`mt-1 inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
          isBrand
            ? "bg-white text-primary-700 hover:bg-primary-50"
            : "border border-primary-600 text-primary-700 hover:bg-primary-50"
        }`}
      >
        {cta}
      </LinkTag>
    </div>
  );
}
