export function Shell({ as: Tag = "div", className = "", children }) {
  return (
    <Tag className={`mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 xl:px-10 ${className}`}>
      {children}
    </Tag>
  );
}

const TONES = {
  surface: "bg-surface",
  canvas: "bg-canvas",
  none: "",
};

export function Section({
  id,
  tone = "surface",
  className = "",
  shellClassName = "",
  bare = false,
  children,
}) {
  return (
    <section
      id={id}
      className={`py-16 md:py-22 lg:py-26 ${TONES[tone] ?? TONES.surface} ${className}`}
    >
      {bare ? children : <Shell className={shellClassName}>{children}</Shell>}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  as: Heading = "h2",
  className = "",
  children,
}) {
  const centred = align === "center";

  return (
    <div
      className={`${centred ? "mx-auto max-w-2xl text-center" : "max-w-2xl"} ${className}`}
    >
      {eyebrow && (
        <p
          className={`mb-4 inline-flex items-center rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-brand-700 ${
            centred ? "mx-auto" : ""
          }`}
        >
          {eyebrow}
        </p>
      )}
      <Heading className="text-title font-semibold text-ink">{title}</Heading>
      {description && (
        <p className="mt-4 text-lede text-ink-body">{description}</p>
      )}
      {children}
    </div>
  );
}
