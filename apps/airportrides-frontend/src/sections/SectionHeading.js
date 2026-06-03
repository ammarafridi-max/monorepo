export default function SectionHeading({ eyebrow, title, subtitle, className = '' }) {
  return (
    <div className={`mx-auto max-w-2xl text-center ${className}`}>
      {eyebrow && (
        <span className="text-eyebrow font-semibold uppercase text-clay-600">{eyebrow}</span>
      )}
      <h2 className="mt-3 text-h2 font-semibold text-ink">{title}</h2>
      {subtitle && (
        <p className="mt-3 text-lead font-light text-ink-soft">{subtitle}</p>
      )}
    </div>
  );
}
