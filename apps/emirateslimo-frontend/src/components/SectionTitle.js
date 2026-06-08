export default function SectionTitle({
  textAlign = 'left',
  children,
  subtitle,
  className = 'mb-10 lg:mb-15',
  dark = false,
  type,
}) {
  const isCenter = textAlign === 'center';
  const headingColor = dark ? 'text-white' : 'text-primary-900';
  const subtitleColor = dark ? 'text-accent-400' : 'text-accent-600';
  const lineColor = dark ? 'bg-accent-400' : 'bg-accent-500';

  return (
    <div className={`${className} ${isCenter ? 'text-center' : 'text-left'}`}>
      {subtitle && (
        <div className={`flex items-center gap-3 mb-4 ${isCenter ? 'justify-center' : 'justify-start'}`}>
          <span className={`h-px w-6 ${lineColor} flex-shrink-0`} />
          <p className={`text-[10.5px] tracking-[0.25em] font-light uppercase ${subtitleColor} whitespace-nowrap`}>
            {subtitle}
          </p>
          <span className={`h-px w-6 ${lineColor} flex-shrink-0`} />
        </div>
      )}
      <h2
        className={`text-[27px] lg:text-[37px] font-light leading-[1.2] tracking-tight ${headingColor}`}
      >
        {children}
      </h2>
    </div>
  );
}
