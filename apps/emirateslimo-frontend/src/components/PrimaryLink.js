import Link from 'next/link';

export default function PrimaryLink({
  children,
  className = '',
  disabled = false,
  to,
  href,
  size = 'medium',
  ...props
}) {
  const dest = href || to;
  const base =
    'inline-flex items-center justify-center gap-2 text-center no-underline rounded-lg capitalize transition-all duration-300 font-outfit tracking-wide';

  const state = disabled
    ? 'bg-accent-400/50 text-white cursor-not-allowed'
    : 'bg-accent-500 hover:bg-accent-600 text-white cursor-pointer shadow-sm hover:shadow-md';

  let sizeClass = '';
  if (size === 'large') sizeClass = 'text-[15px] lg:text-[17px] font-light py-3.5 px-7';
  else if (size === 'small') sizeClass = 'text-[12px] lg:text-[13px] font-light py-2 px-4';
  else sizeClass = 'text-[13.5px] lg:text-[15px] font-light py-2.5 px-5';

  const finalClass = `${base} ${state} ${sizeClass} ${className}`;

  if (disabled) {
    return (
      <span className={finalClass} aria-disabled="true" {...props}>
        {children}
      </span>
    );
  }

  return (
    <Link className={finalClass} href={dest} {...props}>
      {children}
    </Link>
  );
}
