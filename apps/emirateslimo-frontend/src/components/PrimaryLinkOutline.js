import Link from 'next/link';

export default function PrimaryLinkOutline({ children, className = '', size = 'medium', ...props }) {
  let newClassName = className;

  if (size === 'large') {
    newClassName =
      newClassName +
      `text-center text-accent-500 text-[15px] lg:text-[18px] no-underline font-medium font-outfit py-3 px-5 rounded-full capitalize border-2 border-solid border-accent-500 bg-transparent hover:bg-accent-600 hover:text-white hover:border-accent-600 cursor-pointer duration-300 shadow disabled:bg-accent-600 disabled:text-white disabled:opacity-50 disabled:cursor-auto`;
  } else if (size === 'small') {
    newClassName =
      newClassName +
      `text-center text-accent-500 text-[12px] lg:text-[13px] no-underline font-medium font-outfit py-2 px-4 rounded-full capitalize border-2 border-solid border-accent-500 bg-transparent hover:bg-accent-600 hover:text-white hover:border-accent-600 cursor-pointer duration-300 shadow disabled:bg-accent-600 disabled:text-white disabled:opacity-50 disabled:cursor-auto`;
  } else {
    newClassName =
      newClassName +
      `text-center text-accent-500 text-[14px] lg:text-[16px] no-underline font-medium font-outfit py-2.5 px-5 rounded-full capitalize border-2 border-solid border-accent-500 bg-transparent hover:bg-accent-600 hover:text-white hover:border-accent-600 cursor-pointer duration-300 shadow disabled:bg-accent-600 disabled:text-white disabled:opacity-50 disabled:cursor-auto`;
  }

  return (
    <Link className={newClassName} {...props}>
      {children}
    </Link>
  );
}
