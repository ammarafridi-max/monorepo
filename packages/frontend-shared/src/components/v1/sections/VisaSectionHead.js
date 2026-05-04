export default function SectionHead({ eyebrow, title, className = "mb-8" }) {
  return (
    <div className={className}>
      {eyebrow && (
        <p className="text-[11px] font-outfit font-semibold uppercase tracking-[0.15em] text-primary-600 mb-2">
          {eyebrow}
        </p>
      )}
      <h2 className="font-outfit font-medium text-[26px] md:text-[31px] text-gray-900 leading-[1.2] tracking-[-0.01em]">
        {title}
      </h2>
    </div>
  );
}
