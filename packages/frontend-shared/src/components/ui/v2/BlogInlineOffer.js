import Link from "next/link";

/**
 * The single mid-article call to action, placed at a fixed position rather than
 * every N paragraphs. Two rail cards plus this one unit is the ceiling before a
 * guide starts reading like a landing page.
 */
export default function BlogInlineOffer({ offer }) {
  if (!offer?.href || !offer?.cta) return null;

  const { headline, note, href, cta, external = false } = offer;
  const linkProps = external
    ? { href, target: "_blank", rel: "noopener noreferrer" }
    : { href };
  const LinkTag = external ? "a" : Link;

  return (
    <div className="my-10 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-outfit text-[16px] font-semibold text-gray-900">
          {headline}
        </p>
        {note && (
          <p className="mt-1 font-outfit text-[14px] leading-6 text-gray-600">
            {note}
          </p>
        )}
      </div>
      <LinkTag
        {...linkProps}
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary-700 px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-primary-800"
      >
        {cta}
      </LinkTag>
    </div>
  );
}
