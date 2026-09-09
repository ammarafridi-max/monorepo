export default function SectionTitle({
  children,
  subtitle,
  className = 'mb-10 lg:mb-12',
  type = 'primary',
  align = 'left',
}) {
  const isPrimary = type === 'primary';
  const isCentered = align === 'center';

  let h2ClassName = `
    ${isPrimary ? 'text-gray-900' : 'text-primary-700'} text-[26px] md:text-[31px] lg:text-[34px] font-semibold font-outfit leading-[1.15] tracking-[-0.02em]! mb-3 text-left ${isCentered ? 'md:text-center' : ''}
  `;

  let pClassName = `
    max-w-[760px] text-gray-600 text-[15px] md:text-[16px] lg:text-[16px] font-light font-outfit leading-7 text-left ${isCentered ? 'md:text-center md:mx-auto' : ''}
  `;

  return (
    <div className={`${className} relative`}>
      <div
        className={`w-10 h-[3px] rounded-full bg-primary-600 mb-4 ${isCentered ? 'md:mx-auto' : ''}`}
      />
      <h2 className={h2ClassName}>{children}</h2>
      {subtitle && <p className={pClassName}>{subtitle}</p>}
    </div>
  );
}
