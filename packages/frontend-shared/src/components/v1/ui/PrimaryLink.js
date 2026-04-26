'use client';

import Link from 'next/link';

export default function PrimaryLink({
  children,
  className = '',
  disabled = false,
  href,
  to,
  size = 'medium',
  ...props
}) {
  let newClassName =
    className +
    ' inline-block text-center text-white no-underline rounded-lg capitalize bg-accent-500 hover:bg-accent-600 border border-solid border-accent-500 cursor-pointer duration-300 disabled:bg-accent-500/50 disabled:opacity-60 disabled:cursor-auto disabled:hover:bg-accent-500';

  if (size === 'large') {
    newClassName +=
      ' text-[15px] md:text-[18px] font-medium font-outfit py-3 px-5';
  } else if (size === 'small') {
    newClassName +=
      ' text-[12px] md:text-[14px] font-light font-outfit py-2 px-4';
  } else {
    newClassName +=
      ' text-[14px] md:text-[16px] font-regular font-outfit py-2.5 px-5';
  }

  if (disabled) {
    return (
      <span className={newClassName} aria-disabled="true" {...props}>
        {children}
      </span>
    );
  }

  return (
    <Link className={newClassName} href={href || to || '#'} {...props}>
      {children}
    </Link>
  );
}
