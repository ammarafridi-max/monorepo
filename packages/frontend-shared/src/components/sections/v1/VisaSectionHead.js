export default function SectionHead({
  title,
  subtitle,
  className = "text-center max-w-2xl mx-auto mb-12",
}) {
  return (
    <div className={className}>
      <h2 className="font-outfit font-bold text-3xl md:text-4xl text-gray-900 leading-[1.15] tracking-[-0.01em]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 font-outfit font-light text-[15px] md:text-[16px] text-gray-600 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
