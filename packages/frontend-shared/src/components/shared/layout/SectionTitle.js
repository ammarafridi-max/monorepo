export default function SectionTitle({
  textAlign = 'left',
  children,
  subtitle,
  className = 'mb-10 lg:mb-12',
  type = 'primary',
}) {
  void textAlign;
  const isPrimary = type === 'primary';

  let h2ClassName = `
    ${isPrimary ? 'text-gray-900' : 'text-primary-700'} text-[26px] md:text-[31px] lg:text-[34px] font-medium font-outfit leading-[1.2] tracking-[-0.01em] capitalize mb-2.5 text-left
  `;

  let pClassName = `
    max-w-[760px] text-gray-600 text-[15px] md:text-[16px] lg:text-[16px] font-light font-outfit leading-7 text-left
  `;

  return (
    <div className={`${className} relative`}>
      <h2 className={h2ClassName}>{children}</h2>
      {subtitle && <p className={pClassName}>{subtitle}</p>}
    </div>
  );
}
